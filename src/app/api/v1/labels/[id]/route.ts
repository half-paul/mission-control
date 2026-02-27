import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { labels } from "@/lib/db/schema";
import { updateLabelSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { handleError, errorResponse } from "@/lib/errors";
import { eq, and, isNull, sql } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/v1/labels/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data = updateLabelSchema.parse(body);

    const [existing] = await db
      .select({ id: labels.id })
      .from(labels)
      .where(and(eq(labels.id, id), isNull(labels.deletedAt)));
    if (!existing) return errorResponse(404, "Label not found");

    const [updated] = await db
      .update(labels)
      .set(data)
      .where(eq(labels.id, id))
      .returning();

    await logActivity("label_updated", "label", id, null, { changes: Object.keys(data) });

    return NextResponse.json(updated);
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/v1/labels/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const [existing] = await db
      .select({ id: labels.id, name: labels.name })
      .from(labels)
      .where(and(eq(labels.id, id), isNull(labels.deletedAt)));
    if (!existing) return errorResponse(404, "Label not found");

    await db
      .update(labels)
      .set({ deletedAt: sql`now()` })
      .where(eq(labels.id, id));

    await logActivity("label_deleted", "label", id, null, { name: existing.name });

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
