import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { savedFilters } from "@/lib/db/schema";
import { createFilterSchema } from "@/lib/validation";
import { handleError } from "@/lib/errors";
import { eq } from "drizzle-orm";

// GET /api/v1/filters?memberId=...
export async function GET(req: NextRequest) {
  try {
    const memberId = req.nextUrl.searchParams.get("memberId");
    const conditions = memberId ? eq(savedFilters.memberId, memberId) : undefined;

    const rows = await db
      .select()
      .from(savedFilters)
      .where(conditions)
      .orderBy(savedFilters.name);

    return NextResponse.json({ data: rows });
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/v1/filters
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createFilterSchema.parse(body);

    const [filter] = await db
      .insert(savedFilters)
      .values(data)
      .returning();

    return NextResponse.json(filter, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
