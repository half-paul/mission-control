import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { issues, projects, members, labels, issueLabels } from "@/lib/db/schema";
import { updateIssueSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { handleError, errorResponse } from "@/lib/errors";
import { requireAuth, requireWrite, requireIssueAccess } from "@/lib/auth";
import { sanitizeText, sanitizeMarkdown } from "@/lib/sanitize";
import { eq, and, isNull, inArray, sql } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

// GET /api/v1/issues/[id]
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const [row] = await db
      .select({
        id: issues.id,
        key: issues.key,
        title: issues.title,
        description: issues.description,
        status: issues.status,
        priority: issues.priority,
        dueDate: issues.dueDate,
        createdAt: issues.createdAt,
        updatedAt: issues.updatedAt,
        projectId: issues.projectId,
        projectName: projects.name,
        projectKey: projects.key,
        assigneeId: issues.assigneeId,
        assigneeName: members.name,
        assigneeAvatar: members.avatarUrl,
      })
      .from(issues)
      .innerJoin(projects, eq(issues.projectId, projects.id))
      .leftJoin(members, eq(issues.assigneeId, members.id))
      .where(and(eq(issues.id, id), isNull(issues.deletedAt)));

    if (!row) return errorResponse(404, "Issue not found");

    const issueLabelRows = await db
      .select({ id: labels.id, name: labels.name, color: labels.color })
      .from(issueLabels)
      .innerJoin(labels, eq(issueLabels.labelId, labels.id))
      .where(eq(issueLabels.issueId, id));

    return NextResponse.json({
      id: row.id,
      key: row.key,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      dueDate: row.dueDate,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      project: { id: row.projectId, name: row.projectName, key: row.projectKey },
      assignee: row.assigneeId
        ? { id: row.assigneeId, name: row.assigneeName, avatar: row.assigneeAvatar }
        : null,
      labels: issueLabelRows,
    });
  } catch (err) {
    return handleError(err);
  }
}

// PATCH /api/v1/issues/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const writeCheck = requireWrite(authResult);
    if (writeCheck) return writeCheck;

    const { id } = await params;

    // IDOR check: only assignee, creator, project owner, or admin can modify
    const accessCheck = await requireIssueAccess(authResult, id);
    if (accessCheck) return accessCheck;

    const body = await req.json();
    const data = updateIssueSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = sanitizeText(data.title);
    if (data.description !== undefined) updateData.description = sanitizeMarkdown(data.description);
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;

    const [updated] = await db
      .update(issues)
      .set(updateData)
      .where(eq(issues.id, id))
      .returning();

    if (data.labels !== undefined) {
      await db.delete(issueLabels).where(eq(issueLabels.issueId, id));
      if (data.labels.length > 0) {
        const labelRows = await db
          .select({ id: labels.id })
          .from(labels)
          .where(and(inArray(labels.name, data.labels), isNull(labels.deletedAt)));
        if (labelRows.length > 0) {
          await db.insert(issueLabels).values(
            labelRows.map((l) => ({ issueId: id, labelId: l.id }))
          );
        }
      }
    }

    await logActivity("issue_updated", "issue", id, authResult.id, {
      issue_key: updated.key,
      changes: Object.keys(updateData),
    });

    return NextResponse.json(updated);
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/v1/issues/[id] — Soft delete
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const writeCheck = requireWrite(authResult);
    if (writeCheck) return writeCheck;

    const { id } = await params;

    // IDOR check: only assignee, creator, project owner, or admin can delete
    const accessCheck = await requireIssueAccess(authResult, id);
    if (accessCheck) return accessCheck;

    const [existing] = await db
      .select({ id: issues.id, key: issues.key })
      .from(issues)
      .where(and(eq(issues.id, id), isNull(issues.deletedAt)));
    if (!existing) return errorResponse(404, "Issue not found");

    await db
      .update(issues)
      .set({ deletedAt: sql`now()` })
      .where(eq(issues.id, id));

    await logActivity("issue_deleted", "issue", id, authResult.id, {
      issue_key: existing.key,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
