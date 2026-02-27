import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { basename } from "path";
import { db } from "@/lib/db";
import { projects, issues, labels, issueLabels, importRuns, members } from "@/lib/db/schema";
import { detectFormat, parseSprintBased, parseSessionBased, DEFAULT_AGENT_MAP } from "@/lib/import";
import { logActivity } from "@/lib/activity";
import { handleError, errorResponse } from "@/lib/errors";
import { requireAuth, requireWrite, requireProjectAccess } from "@/lib/auth";
import { validateProjectPath } from "@/lib/path-security";
import { sanitizeText, sanitizeMarkdown } from "@/lib/sanitize";
import { eq, and, isNull, sql } from "drizzle-orm";
import { z } from "zod";

const importSchema = z.object({
  sourcePath: z.string(),
  projectId: z.string().uuid().optional(),
  options: z
    .object({
      importCompleted: z.boolean().optional().default(true),
      defaultPriority: z.string().optional().default("medium"),
    })
    .optional()
    .default({ importCompleted: true, defaultPriority: "medium" }),
});

// POST /api/v1/import/run
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const writeCheck = requireWrite(authResult);
    if (writeCheck) return writeCheck;

    const body = await req.json();
    const { sourcePath, projectId, options } = importSchema.parse(body);

    // #2: Path traversal protection
    const validatedPath = validateProjectPath(sourcePath);
    if (!validatedPath) {
      return errorResponse(400, "Invalid project path: path traversal detected");
    }

    // Read STATUS.md
    let statusContent: string;
    try {
      statusContent = await readFile(`${validatedPath}/docs/STATUS.md`, "utf-8");
    } catch {
      try {
        statusContent = await readFile(`${validatedPath}/STATUS.md`, "utf-8");
      } catch {
        return errorResponse(404, "STATUS.md not found");
      }
    }

    const format = detectFormat(statusContent);
    const projectName = basename(validatedPath);

    if (format === "unknown") {
      return errorResponse(400, "Unknown STATUS.md format");
    }

    // If importing to existing project, verify ownership
    let targetProjectId = projectId;
    if (targetProjectId) {
      const accessCheck = await requireProjectAccess(authResult, targetProjectId);
      if (accessCheck) return accessCheck;
    }

    // Ensure project exists
    if (!targetProjectId) {
      const [existing] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.sourcePath, validatedPath), isNull(projects.deletedAt)));

      if (existing) {
        targetProjectId = existing.id;
      } else {
        const key = projectName
          .split("-")
          .map((w) => w[0]?.toUpperCase())
          .join("")
          .slice(0, 10);

        const [newProject] = await db
          .insert(projects)
          .values({
            key,
            name: sanitizeText(
              projectName.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
            ),
            sourcePath: validatedPath,
            sourceFormat: format,
            status: "active",
            ownerId: authResult.id,
            createdBy: authResult.id,
          })
          .returning();

        targetProjectId = newProject.id;
      }
    }

    // Create import run
    const [importRun] = await db
      .insert(importRuns)
      .values({
        projectId: targetProjectId,
        sourcePath: validatedPath,
        sourceFormat: format,
        createdBy: authResult.id,
      })
      .returning();

    let created = 0;
    let updated = 0;
    let skipped = 0;

    try {
      if (format === "sprint-based") {
        const parsed = parseSprintBased(statusContent, projectName);

        for (const task of parsed.tasks) {
          if (!options.importCompleted && task.status === "done") {
            skipped++;
            continue;
          }

          const externalSourceId = `${projectName}:${task.externalId}`;
          const issueStatus = task.status === "done" ? "done" : "todo";

          const [existing] = await db
            .select({ id: issues.id })
            .from(issues)
            .where(eq(issues.externalSourceId, externalSourceId));

          if (existing) {
            await db
              .update(issues)
              .set({ status: issueStatus, title: sanitizeText(task.title) })
              .where(eq(issues.id, existing.id));
            updated++;
          } else {
            const [proj] = await db
              .update(projects)
              .set({ nextIssueNumber: sql`${projects.nextIssueNumber} + 1` })
              .where(eq(projects.id, targetProjectId!))
              .returning({ key: projects.key, num: sql<number>`${projects.nextIssueNumber} - 1` });

            const issueKey = `${proj.key}-${proj.num}`;

            const agentInfo = DEFAULT_AGENT_MAP[task.agentTag];
            let assigneeId: string | null = null;
            if (agentInfo) {
              const [member] = await db
                .select({ id: members.id })
                .from(members)
                .where(and(eq(members.agentId, agentInfo.agentId), isNull(members.deletedAt)));
              if (member) assigneeId = member.id;
            }

            const sprintLabel = `sprint-${task.sprintNumber}`;
            await db
              .insert(labels)
              .values({ name: sprintLabel, color: "#6366F1" })
              .onConflictDoNothing();

            // #4: Sanitize imported content
            const [newIssue] = await db
              .insert(issues)
              .values({
                key: issueKey,
                title: sanitizeText(task.title),
                status: issueStatus,
                priority: options.defaultPriority,
                projectId: targetProjectId!,
                assigneeId,
                externalSourceId,
                importMetadata: {
                  sprintNumber: task.sprintNumber,
                  agentTag: task.agentTag,
                },
                createdBy: authResult.id,
              })
              .returning();

            const [labelRow] = await db
              .select({ id: labels.id })
              .from(labels)
              .where(eq(labels.name, sprintLabel));
            if (labelRow) {
              await db
                .insert(issueLabels)
                .values({ issueId: newIssue.id, labelId: labelRow.id })
                .onConflictDoNothing();
            }

            created++;
          }
        }
      } else if (format === "session-based") {
        const parsed = parseSessionBased(statusContent, projectName);

        for (const session of parsed.sessions) {
          for (const feature of session.features) {
            if (!options.importCompleted && feature.status === "done") {
              skipped++;
              continue;
            }

            const externalSourceId = `${projectName}:${feature.externalId}`;
            const issueStatus = feature.status === "done" ? "done" : "in_progress";

            const [existing] = await db
              .select({ id: issues.id })
              .from(issues)
              .where(eq(issues.externalSourceId, externalSourceId));

            if (existing) {
              await db
                .update(issues)
                .set({
                  status: issueStatus,
                  title: sanitizeText(feature.title),
                  description: sanitizeMarkdown(feature.description),
                })
                .where(eq(issues.id, existing.id));
              updated++;
            } else {
              const [proj] = await db
                .update(projects)
                .set({ nextIssueNumber: sql`${projects.nextIssueNumber} + 1` })
                .where(eq(projects.id, targetProjectId!))
                .returning({ key: projects.key, num: sql<number>`${projects.nextIssueNumber} - 1` });

              const issueKey = `${proj.key}-${proj.num}`;

              const sessionLabel = `session-${session.sessionNumber}`;
              await db
                .insert(labels)
                .values({ name: sessionLabel, color: "#8B5CF6" })
                .onConflictDoNothing();

              const [newIssue] = await db
                .insert(issues)
                .values({
                  key: issueKey,
                  title: sanitizeText(feature.title),
                  description: sanitizeMarkdown(feature.description),
                  status: issueStatus,
                  priority: options.defaultPriority,
                  projectId: targetProjectId!,
                  externalSourceId,
                  importMetadata: {
                    sessionNumber: session.sessionNumber,
                    sessionTitle: session.title,
                  },
                  createdBy: authResult.id,
                })
                .returning();

              const [labelRow] = await db
                .select({ id: labels.id })
                .from(labels)
                .where(eq(labels.name, sessionLabel));
              if (labelRow) {
                await db
                  .insert(issueLabels)
                  .values({ issueId: newIssue.id, labelId: labelRow.id })
                  .onConflictDoNothing();
              }

              created++;
            }
          }
        }
      }

      await db
        .update(importRuns)
        .set({
          status: "completed",
          completedAt: sql`now()`,
          issuesCreated: created,
          issuesUpdated: updated,
          issuesSkipped: skipped,
        })
        .where(eq(importRuns.id, importRun.id));

      await db
        .update(projects)
        .set({ lastImportAt: sql`now()`, sourceFormat: format })
        .where(eq(projects.id, targetProjectId!));

      await logActivity("import_completed", "project", targetProjectId!, authResult.id, {
        importRunId: importRun.id,
        format,
        created,
        updated,
        skipped,
      });

      return NextResponse.json({
        importRunId: importRun.id,
        status: "completed",
        issuesCreated: created,
        issuesUpdated: updated,
        issuesSkipped: skipped,
      });
    } catch (err) {
      await db
        .update(importRuns)
        .set({
          status: "failed",
          completedAt: sql`now()`,
          errorMessage: err instanceof Error ? err.message : "Unknown error",
          issuesCreated: created,
          issuesUpdated: updated,
          issuesSkipped: skipped,
        })
        .where(eq(importRuns.id, importRun.id));

      throw err;
    }
  } catch (err) {
    return handleError(err);
  }
}
