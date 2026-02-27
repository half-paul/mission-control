import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, members, issues } from "@/lib/db/schema";
import { updateProjectSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { handleError, errorResponse } from "@/lib/errors";
import { requireAuth, requireWrite } from "@/lib/auth";
import { sanitizeText, sanitizeMarkdown } from "@/lib/sanitize";
import { eq, and, isNull, sql } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

// GET /api/v1/projects/[id]
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const [row] = await db
      .select({
        id: projects.id,
        key: projects.key,
        name: projects.name,
        description: projects.description,
        status: projects.status,
        startDate: projects.startDate,
        targetDate: projects.targetDate,
        ownerId: projects.ownerId,
        ownerName: members.name,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        sourcePath: projects.sourcePath,
        sourceFormat: projects.sourceFormat,
        lastImportAt: projects.lastImportAt,
        total: sql<number>`count(${issues.id}) filter (where ${issues.deletedAt} is null)::int`,
        backlog: sql<number>`count(${issues.id}) filter (where ${issues.status} = 'backlog' and ${issues.deletedAt} is null)::int`,
        todo: sql<number>`count(${issues.id}) filter (where ${issues.status} = 'todo' and ${issues.deletedAt} is null)::int`,
        in_progress: sql<number>`count(${issues.id}) filter (where ${issues.status} = 'in_progress' and ${issues.deletedAt} is null)::int`,
        in_review: sql<number>`count(${issues.id}) filter (where ${issues.status} = 'in_review' and ${issues.deletedAt} is null)::int`,
        done: sql<number>`count(${issues.id}) filter (where ${issues.status} = 'done' and ${issues.deletedAt} is null)::int`,
      })
      .from(projects)
      .leftJoin(members, eq(projects.ownerId, members.id))
      .leftJoin(issues, eq(issues.projectId, projects.id))
      .where(and(eq(projects.id, id), isNull(projects.deletedAt)))
      .groupBy(projects.id, members.name);

    if (!row) return errorResponse(404, "Project not found");

    return NextResponse.json({
      ...row,
      owner: { id: row.ownerId, name: row.ownerName },
      progress: row.total > 0 ? Math.round((row.done / row.total) * 1000) / 10 : 0,
      stats: {
        total: row.total,
        backlog: row.backlog,
        todo: row.todo,
        in_progress: row.in_progress,
        in_review: row.in_review,
        done: row.done,
      },
    });
  } catch (err) {
    return handleError(err);
  }
}

// PATCH /api/v1/projects/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const writeCheck = requireWrite(authResult);
    if (writeCheck) return writeCheck;

    const { id } = await params;
    const body = await req.json();
    const data = updateProjectSchema.parse(body);

    const [existing] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, id), isNull(projects.deletedAt)));
    if (!existing) return errorResponse(404, "Project not found");

    const updateData: Record<string, unknown> = { ...data };
    if (data.name) updateData.name = sanitizeText(data.name);
    if (data.description !== undefined) updateData.description = sanitizeMarkdown(data.description);

    const [updated] = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, id))
      .returning();

    await logActivity("project_updated", "project", id, authResult.id, {
      project_key: updated.key,
      changes: Object.keys(data),
    });

    return NextResponse.json(updated);
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/v1/projects/[id] — Soft delete (archive)
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const writeCheck = requireWrite(authResult);
    if (writeCheck) return writeCheck;

    const { id } = await params;
    const [existing] = await db
      .select({ id: projects.id, key: projects.key })
      .from(projects)
      .where(and(eq(projects.id, id), isNull(projects.deletedAt)));
    if (!existing) return errorResponse(404, "Project not found");

    await db
      .update(projects)
      .set({ deletedAt: sql`now()` })
      .where(eq(projects.id, id));

    await logActivity("project_deleted", "project", id, authResult.id, {
      project_key: existing.key,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
