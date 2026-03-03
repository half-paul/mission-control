import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { issueSubscriptions, issues } from "@/lib/db/schema";
import { handleError, errorResponse, validateUuid } from "@/lib/errors";
import { requireAuth } from "@/lib/auth";
import { eq, and, isNull } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

// GET /api/v1/issues/[id]/subscriptions — Check if current user is subscribed
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const uuidCheck = validateUuid(id);
    if (uuidCheck) return uuidCheck;

    const [subscription] = await db
      .select()
      .from(issueSubscriptions)
      .where(
        and(
          eq(issueSubscriptions.issueId, id),
          eq(issueSubscriptions.memberId, authResult.id)
        )
      );

    return NextResponse.json({ subscribed: !!subscription });
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/v1/issues/[id]/subscriptions — Subscribe
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const uuidCheck = validateUuid(id);
    if (uuidCheck) return uuidCheck;

    // Verify issue exists
    const [issue] = await db
      .select({ id: issues.id })
      .from(issues)
      .where(and(eq(issues.id, id), isNull(issues.deletedAt)));
    if (!issue) return errorResponse(404, "Issue not found");

    await db
      .insert(issueSubscriptions)
      .values({
        issueId: id,
        memberId: authResult.id,
      })
      .onConflictDoNothing();

    return NextResponse.json({ subscribed: true });
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/v1/issues/[id]/subscriptions — Unsubscribe
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const uuidCheck = validateUuid(id);
    if (uuidCheck) return uuidCheck;

    await db
      .delete(issueSubscriptions)
      .where(
        and(
          eq(issueSubscriptions.issueId, id),
          eq(issueSubscriptions.memberId, authResult.id)
        )
      );

    return NextResponse.json({ subscribed: false });
  } catch (err) {
    return handleError(err);
  }
}
