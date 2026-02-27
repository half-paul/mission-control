import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, issues, members, activityLog } from "@/lib/db/schema";
import { handleError } from "@/lib/errors";
import { eq, and, isNull, sql, desc, lt, not } from "drizzle-orm";

// GET /api/v1/dashboard
export async function GET() {
  try {
    // Active projects with progress
    const activeProjects = await db
      .select({
        id: projects.id,
        key: projects.key,
        name: projects.name,
        status: projects.status,
        total: sql<number>`count(${issues.id}) filter (where ${issues.deletedAt} is null)::int`,
        done: sql<number>`count(${issues.id}) filter (where ${issues.status} = 'done' and ${issues.deletedAt} is null)::int`,
      })
      .from(projects)
      .leftJoin(issues, eq(issues.projectId, projects.id))
      .where(and(isNull(projects.deletedAt), eq(projects.status, "active")))
      .groupBy(projects.id)
      .orderBy(projects.name);

    // Overdue issues
    const overdueIssues = await db
      .select({
        id: issues.id,
        key: issues.key,
        title: issues.title,
        dueDate: issues.dueDate,
        status: issues.status,
        assigneeName: members.name,
        projectName: projects.name,
      })
      .from(issues)
      .innerJoin(projects, eq(issues.projectId, projects.id))
      .leftJoin(members, eq(issues.assigneeId, members.id))
      .where(
        and(
          isNull(issues.deletedAt),
          lt(issues.dueDate, sql`CURRENT_DATE`),
          not(eq(issues.status, "done"))
        )
      )
      .orderBy(issues.dueDate)
      .limit(10);

    // Critical issues
    const criticalIssues = await db
      .select({
        id: issues.id,
        key: issues.key,
        title: issues.title,
        status: issues.status,
        projectName: projects.name,
      })
      .from(issues)
      .innerJoin(projects, eq(issues.projectId, projects.id))
      .where(
        and(
          isNull(issues.deletedAt),
          eq(issues.priority, "critical"),
          not(eq(issues.status, "done"))
        )
      )
      .orderBy(desc(issues.createdAt))
      .limit(10);

    // Recent activity
    const recentActivity = await db
      .select({
        id: activityLog.id,
        eventType: activityLog.eventType,
        metadata: activityLog.metadata,
        createdAt: activityLog.createdAt,
        actorName: members.name,
      })
      .from(activityLog)
      .leftJoin(members, eq(activityLog.actorId, members.id))
      .orderBy(desc(activityLog.createdAt))
      .limit(20);

    return NextResponse.json({
      activeProjects: activeProjects.map((p) => ({
        ...p,
        progress: p.total > 0 ? Math.round((p.done / p.total) * 1000) / 10 : 0,
      })),
      overdueIssues,
      criticalIssues,
      recentActivity,
    });
  } catch (err) {
    return handleError(err);
  }
}
