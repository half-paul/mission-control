import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { savedFilters } from "@/lib/db/schema";
import { updateFilterSchema } from "@/lib/validation";
import { handleError, errorResponse } from "@/lib/errors";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/v1/filters/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data = updateFilterSchema.parse(body);

    const [existing] = await db
      .select({ id: savedFilters.id })
      .from(savedFilters)
      .where(eq(savedFilters.id, id));
    if (!existing) return errorResponse(404, "Filter not found");

    const [updated] = await db
      .update(savedFilters)
      .set(data)
      .where(eq(savedFilters.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/v1/filters/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const [existing] = await db
      .select({ id: savedFilters.id })
      .from(savedFilters)
      .where(eq(savedFilters.id, id));
    if (!existing) return errorResponse(404, "Filter not found");

    await db.delete(savedFilters).where(eq(savedFilters.id, id));

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
