import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { issues } from "@/lib/db/schema";
import { transitionStatusSchema, canTransition, STATUS_TRANSITIONS, IssueStatus } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { handleError, errorResponse, validateUuid } from "@/lib/errors";
import { requireAuth, requireWrite, requireIssueAccess } from "@/lib/auth";
import { eq, and, isNull } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/v1/issues/[id]/status
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const writeCheck = requireWrite(authResult);
    if (writeCheck) return writeCheck;

    const { id } = await params;
    const uuidCheck = validateUuid(id);
    if (uuidCheck) return uuidCheck;

    // IDOR check
    const accessCheck = await requireIssueAccess(authResult, id);
    if (accessCheck) return accessCheck;

    const body = await req.json();
    const { status: newStatus } = transitionStatusSchema.parse(body);

    const [existing] = await db
      .select({ id: issues.id, key: issues.key, status: issues.status, projectId: issues.projectId })
      .from(issues)
      .where(and(eq(issues.id, id), isNull(issues.deletedAt)));

    if (!existing) return errorResponse(404, "Issue not found");

    const currentStatus = existing.status as IssueStatus;
    if (!canTransition(currentStatus, newStatus)) {
      return errorResponse(400, `Cannot transition from "${currentStatus}" to "${newStatus}"`, {
        current: currentStatus,
        requested: newStatus,
        allowed: STATUS_TRANSITIONS[currentStatus],
      });
    }

    const [updated] = await db
      .update(issues)
      .set({ status: newStatus })
      .where(eq(issues.id, id))
      .returning();

    await logActivity("issue_status_changed", "issue", id, authResult.id, {
      issue_key: existing.key,
      from: currentStatus,
      to: newStatus,
      project_id: existing.projectId,
    });

    return NextResponse.json(updated);
  } catch (err) {
    return handleError(err);
  }
}
