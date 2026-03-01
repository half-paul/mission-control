import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activityLog, members } from "@/lib/db/schema";
import { handleError, errorResponse, validateUuid } from "@/lib/errors";
import { requireAuth } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const querySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// GET /api/v1/issues/[id]/activity
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const uuidCheck = validateUuid(id);
    if (uuidCheck) return uuidCheck;
    const queryParams = Object.fromEntries(req.nextUrl.searchParams);
    const { limit, offset } = querySchema.parse(queryParams);

    const rows = await db
      .select({
        id: activityLog.id,
        eventType: activityLog.eventType,
        entityType: activityLog.entityType,
        entityId: activityLog.entityId,
        actorId: activityLog.actorId,
        actorName: members.name,
        actorAvatar: members.avatarUrl,
        metadata: activityLog.metadata,
        createdAt: activityLog.createdAt,
      })
      .from(activityLog)
      .leftJoin(members, eq(activityLog.actorId, members.id))
      .where(
        and(
          eq(activityLog.entityType, "issue"),
          eq(activityLog.entityId, id)
        )
      )
      .orderBy(desc(activityLog.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ data: rows });
  } catch (err) {
    return handleError(err);
  }
}
