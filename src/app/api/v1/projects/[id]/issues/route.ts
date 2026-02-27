import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { issues, members } from "@/lib/db/schema";
import { handleError } from "@/lib/errors";
import { requireAuth } from "@/lib/auth";
import { eq, and, isNull, desc } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

// GET /api/v1/projects/[id]/issues
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const rows = await db
      .select({
        id: issues.id,
        key: issues.key,
        title: issues.title,
        status: issues.status,
        priority: issues.priority,
        dueDate: issues.dueDate,
        assigneeName: members.name,
        assigneeAvatar: members.avatarUrl,
        createdAt: issues.createdAt,
      })
      .from(issues)
      .leftJoin(members, eq(issues.assigneeId, members.id))
      .where(and(eq(issues.projectId, id), isNull(issues.deletedAt)))
      .orderBy(desc(issues.createdAt));

    return NextResponse.json({ data: rows });
  } catch (err) {
    return handleError(err);
  }
}
