import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, members, issues } from "@/lib/db/schema";
import { createProjectSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { handleError } from "@/lib/errors";
import { eq, and, isNull, sql } from "drizzle-orm";

// GET /api/v1/projects
export async function GET() {
  try {
    const rows = await db
      .select({
        id: projects.id,
        key: projects.key,
        name: projects.name,
        description: projects.description,
        status: projects.status,
        startDate: projects.startDate,
        targetDate: projects.targetDate,
        ownerName: members.name,
        ownerId: projects.ownerId,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        totalIssues: sql<number>`count(${issues.id}) filter (where ${issues.deletedAt} is null)::int`,
        doneIssues: sql<number>`count(${issues.id}) filter (where ${issues.status} = 'done' and ${issues.deletedAt} is null)::int`,
      })
      .from(projects)
      .leftJoin(members, eq(projects.ownerId, members.id))
      .leftJoin(issues, eq(issues.projectId, projects.id))
      .where(isNull(projects.deletedAt))
      .groupBy(projects.id, members.name)
      .orderBy(projects.name);

    const data = rows.map((r) => ({
      ...r,
      progress: r.totalIssues > 0 ? Math.round((r.doneIssues / r.totalIssues) * 1000) / 10 : 0,
    }));

    return NextResponse.json({ data });
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/v1/projects
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createProjectSchema.parse(body);

    const [project] = await db
      .insert(projects)
      .values({
        key: data.key,
        name: data.name,
        description: data.description,
        status: data.status,
        ownerId: data.ownerId,
        startDate: data.startDate,
        targetDate: data.targetDate,
        createdBy: data.ownerId,
      })
      .returning();

    await logActivity("project_created", "project", project.id, data.ownerId, {
      project_key: data.key,
      name: data.name,
    });

    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
