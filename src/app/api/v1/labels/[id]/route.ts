import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { labels } from "@/lib/db/schema";
import { updateLabelSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { handleError, errorResponse, validateUuid } from "@/lib/errors";
import { requireAuth, requireWrite } from "@/lib/auth";
import { sanitizeText } from "@/lib/sanitize";
import { eq, and, isNull, sql } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/v1/labels/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const writeCheck = requireWrite(authResult);
    if (writeCheck) return writeCheck;

    const { id } = await params;
    const uuidCheck = validateUuid(id);
    if (uuidCheck) return uuidCheck;
    const body = await req.json();
    const data = updateLabelSchema.parse(body);

    const [existing] = await db
      .select({ id: labels.id })
      .from(labels)
      .where(and(eq(labels.id, id), isNull(labels.deletedAt)));
    if (!existing) return errorResponse(404, "Label not found");

    const updateData: Record<string, unknown> = { ...data };
    if (data.name) updateData.name = sanitizeText(data.name);

    const [updated] = await db
      .update(labels)
      .set(updateData)
      .where(eq(labels.id, id))
      .returning();

    await logActivity("label_updated", "label", id, authResult.id, { changes: Object.keys(data) });

    return NextResponse.json(updated);
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/v1/labels/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const writeCheck = requireWrite(authResult);
    if (writeCheck) return writeCheck;

    const { id } = await params;
    const uuidCheck = validateUuid(id);
    if (uuidCheck) return uuidCheck;
    const [existing] = await db
      .select({ id: labels.id, name: labels.name })
      .from(labels)
      .where(and(eq(labels.id, id), isNull(labels.deletedAt)));
    if (!existing) return errorResponse(404, "Label not found");

    await db
      .update(labels)
      .set({ deletedAt: sql`now()` })
      .where(eq(labels.id, id));

    await logActivity("label_deleted", "label", id, authResult.id, { name: existing.name });

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
