import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { labels } from "@/lib/db/schema";
import { createLabelSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { handleError } from "@/lib/errors";
import { isNull } from "drizzle-orm";

// GET /api/v1/labels
export async function GET() {
  try {
    const rows = await db
      .select({
        id: labels.id,
        name: labels.name,
        color: labels.color,
        description: labels.description,
        createdAt: labels.createdAt,
      })
      .from(labels)
      .where(isNull(labels.deletedAt))
      .orderBy(labels.name);

    return NextResponse.json({ data: rows });
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/v1/labels
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createLabelSchema.parse(body);

    const [label] = await db
      .insert(labels)
      .values(data)
      .returning();

    await logActivity("label_created", "label", label.id, null, {
      name: data.name,
      color: data.color,
    });

    return NextResponse.json(label, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
