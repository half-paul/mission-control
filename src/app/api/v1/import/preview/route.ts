import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { detectFormat, parseSprintBased, parseSessionBased, DEFAULT_AGENT_MAP } from "@/lib/import";
import { handleError, errorResponse } from "@/lib/errors";
import { z } from "zod";
import { basename } from "path";

const previewSchema = z.object({
  sourcePath: z.string(),
  options: z
    .object({
      importCompleted: z.boolean().optional().default(true),
      defaultPriority: z.string().optional().default("medium"),
    })
    .optional()
    .default({ importCompleted: true, defaultPriority: "medium" }),
});

// POST /api/v1/import/preview
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sourcePath, options } = previewSchema.parse(body);

    // Find STATUS.md
    let statusContent: string;
    try {
      statusContent = await readFile(`${sourcePath}/docs/STATUS.md`, "utf-8");
    } catch {
      try {
        statusContent = await readFile(`${sourcePath}/STATUS.md`, "utf-8");
      } catch {
        return errorResponse(404, "STATUS.md not found in project directory");
      }
    }

    const format = detectFormat(statusContent);
    const projectName = basename(sourcePath);

    if (format === "sprint-based") {
      const parsed = parseSprintBased(statusContent, projectName);
      const byStatus: Record<string, number> = { done: 0, todo: 0 };
      const byAssignee: Record<string, number> = {};

      for (const task of parsed.tasks) {
        byStatus[task.status] = (byStatus[task.status] || 0) + 1;
        const agentName = DEFAULT_AGENT_MAP[task.agentTag]?.name || task.agentTag;
        byAssignee[agentName] = (byAssignee[agentName] || 0) + 1;
      }

      return NextResponse.json({
        format,
        projectName,
        preview: {
          totalIssues: parsed.tasks.length,
          byStatus,
          byAssignee,
          sprint: parsed.currentSprint,
          sampleIssues: parsed.tasks.slice(0, 10),
        },
      });
    } else if (format === "session-based") {
      const parsed = parseSessionBased(statusContent, projectName);
      const allFeatures = parsed.sessions.flatMap((s) => s.features);
      const byStatus: Record<string, number> = { done: 0, in_progress: 0 };

      for (const f of allFeatures) {
        byStatus[f.status] = (byStatus[f.status] || 0) + 1;
      }

      return NextResponse.json({
        format,
        projectName,
        preview: {
          totalIssues: allFeatures.length,
          byStatus,
          sessions: parsed.sessions.length,
          sampleIssues: allFeatures.slice(0, 10),
        },
      });
    } else {
      return errorResponse(400, "Unknown STATUS.md format");
    }
  } catch (err) {
    return handleError(err);
  }
}
