import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, issues, members, activityLog } from "@/lib/db/schema";
import { handleError } from "@/lib/errors";
import { requireAuth } from "@/lib/auth";
import { eq, and, isNull, sql, desc, lt, not } from "drizzle-orm";

// GET /api/v1/dashboard
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

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

    // My issues summary
    const [myIssues] = await db
      .select({
        total: sql<number>`count(*)::int`,
        inProgress: sql<number>`count(*) filter (where ${issues.status} = 'in_progress')::int`,
        overdue: sql<number>`count(*) filter (where ${issues.dueDate} < CURRENT_DATE and ${issues.status} != 'done')::int`,
      })
      .from(issues)
      .where(and(eq(issues.assigneeId, authResult.id), isNull(issues.deletedAt)));

    return NextResponse.json({
      activeProjects: activeProjects.map((p) => ({
        ...p,
        progress: p.total > 0 ? Math.round((p.done / p.total) * 1000) / 10 : 0,
      })),
      overdueIssues,
      criticalIssues,
      recentActivity: recentActivity.map((activity) => {
        const metadata = activity.metadata as any;
        return {
          type: activity.eventType,
          actor: activity.actorName || "Unknown",
          timestamp: activity.createdAt,
          issue: metadata?.issue_key,
          from: metadata?.from_status,
          to: metadata?.to_status,
        };
      }),
      myIssues,
    });
  } catch (err) {
    return handleError(err);
  }
}
