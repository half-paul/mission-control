import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { members } from "@/lib/db/schema";
import { updateMemberSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { handleError, errorResponse } from "@/lib/errors";
import { eq, and, isNull, sql } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/v1/members/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data = updateMemberSchema.parse(body);

    const [existing] = await db
      .select({ id: members.id })
      .from(members)
      .where(and(eq(members.id, id), isNull(members.deletedAt)));
    if (!existing) return errorResponse(404, "Member not found");

    const [updated] = await db
      .update(members)
      .set(data)
      .where(eq(members.id, id))
      .returning({
        id: members.id,
        email: members.email,
        name: members.name,
        role: members.role,
        agentId: members.agentId,
      });

    await logActivity("member_updated", "member", id, null, { changes: Object.keys(data) });

    return NextResponse.json(updated);
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/v1/members/[id] — Soft delete
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const [existing] = await db
      .select({ id: members.id, name: members.name })
      .from(members)
      .where(and(eq(members.id, id), isNull(members.deletedAt)));
    if (!existing) return errorResponse(404, "Member not found");

    await db
      .update(members)
      .set({ deletedAt: sql`now()` })
      .where(eq(members.id, id));

    await logActivity("member_deleted", "member", id, null, { name: existing.name });

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
