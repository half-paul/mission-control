import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { members } from "@/lib/db/schema";
import { updateMemberSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { handleError, errorResponse, validateUuid } from "@/lib/errors";
import { requireAuth, requireAdmin, requireWrite } from "@/lib/auth";
import { sanitizeText } from "@/lib/sanitize";
import { eq, and, isNull, sql } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/v1/members/[id] — Members can update own profile, admins can update anyone
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const uuidCheck = validateUuid(id);
    if (uuidCheck) return uuidCheck;

    // Members can only update themselves; admins can update anyone
    if (authResult.role !== "admin" && authResult.id !== id) {
      return errorResponse(403, "You can only update your own profile");
    }

    const body = await req.json();
    const data = updateMemberSchema.parse(body);

    // Non-admins cannot change their own role
    if (authResult.role !== "admin" && data.role !== undefined) {
      return errorResponse(403, "Only admins can change roles");
    }

    const [existing] = await db
      .select({ id: members.id })
      .from(members)
      .where(and(eq(members.id, id), isNull(members.deletedAt)));
    if (!existing) return errorResponse(404, "Member not found");

    const updateData: Record<string, unknown> = { ...data };
    if (data.name) updateData.name = sanitizeText(data.name);

    const [updated] = await db
      .update(members)
      .set(updateData)
      .where(eq(members.id, id))
      .returning({
        id: members.id,
        email: members.email,
        name: members.name,
        role: members.role,
        agentId: members.agentId,
      });

    await logActivity("member_updated", "member", id, authResult.id, { changes: Object.keys(data) });

    return NextResponse.json(updated);
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/v1/members/[id] — Admin only
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const authResult = await requireAdmin(req);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const uuidCheck = validateUuid(id);
    if (uuidCheck) return uuidCheck;

    // Prevent self-deletion
    if (authResult.id === id) {
      return errorResponse(400, "Cannot delete your own account");
    }

    const [existing] = await db
      .select({ id: members.id, name: members.name })
      .from(members)
      .where(and(eq(members.id, id), isNull(members.deletedAt)));
    if (!existing) return errorResponse(404, "Member not found");

    await db
      .update(members)
      .set({ deletedAt: sql`now()` })
      .where(eq(members.id, id));

    await logActivity("member_deleted", "member", id, authResult.id, { name: existing.name });

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
