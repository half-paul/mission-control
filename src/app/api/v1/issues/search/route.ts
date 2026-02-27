import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { issues, projects, members } from "@/lib/db/schema";
import { searchQuerySchema } from "@/lib/validation";
import { handleError } from "@/lib/errors";
import { eq, and, isNull, sql, desc } from "drizzle-orm";

// GET /api/v1/issues/search?q=...
export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const { q, limit } = searchQuerySchema.parse(params);

    const searchVector = sql`to_tsvector('english', COALESCE(${issues.title}, '') || ' ' || COALESCE(${issues.description}, ''))`;
    const searchQuery = sql`plainto_tsquery('english', ${q})`;
    const rank = sql<number>`ts_rank(${searchVector}, ${searchQuery})`;

    const rows = await db
      .select({
        id: issues.id,
        key: issues.key,
        title: issues.title,
        description: issues.description,
        status: issues.status,
        priority: issues.priority,
        rank,
        projectName: projects.name,
        projectKey: projects.key,
        assigneeName: members.name,
      })
      .from(issues)
      .innerJoin(projects, eq(issues.projectId, projects.id))
      .leftJoin(members, eq(issues.assigneeId, members.id))
      .where(and(isNull(issues.deletedAt), sql`${searchVector} @@ ${searchQuery}`))
      .orderBy(desc(rank))
      .limit(limit);

    return NextResponse.json({ data: rows });
  } catch (err) {
    return handleError(err);
  }
}
