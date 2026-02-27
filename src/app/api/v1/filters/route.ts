import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { savedFilters } from "@/lib/db/schema";
import { createFilterSchema } from "@/lib/validation";
import { handleError } from "@/lib/errors";
import { requireAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";

// GET /api/v1/filters — Returns only the authenticated user's filters
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    // Users can only see their own filters
    const rows = await db
      .select()
      .from(savedFilters)
      .where(eq(savedFilters.memberId, authResult.id))
      .orderBy(savedFilters.name);

    return NextResponse.json({ data: rows });
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/v1/filters — Creates filter owned by authenticated user
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    // Override memberId with authenticated user (prevent creating filters for others)
    const data = createFilterSchema.parse({ ...body, memberId: authResult.id });

    const [filter] = await db
      .insert(savedFilters)
      .values({ ...data, memberId: authResult.id })
      .returning();

    return NextResponse.json(filter, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
