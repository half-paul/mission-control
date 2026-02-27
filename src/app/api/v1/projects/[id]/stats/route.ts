import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { issues } from "@/lib/db/schema";
import { handleError } from "@/lib/errors";
import { requireAuth } from "@/lib/auth";
import { eq, and, isNull, sql } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

// GET /api/v1/projects/[id]/stats
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        backlog: sql<number>`count(*) filter (where ${issues.status} = 'backlog')::int`,
        todo: sql<number>`count(*) filter (where ${issues.status} = 'todo')::int`,
        in_progress: sql<number>`count(*) filter (where ${issues.status} = 'in_progress')::int`,
        in_review: sql<number>`count(*) filter (where ${issues.status} = 'in_review')::int`,
        done: sql<number>`count(*) filter (where ${issues.status} = 'done')::int`,
      })
      .from(issues)
      .where(and(eq(issues.projectId, id), isNull(issues.deletedAt)));

    return NextResponse.json({
      ...stats,
      progress: stats.total > 0 ? Math.round((stats.done / stats.total) * 1000) / 10 : 0,
    });
  } catch (err) {
    return handleError(err);
  }
}
