import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { issueComments } from "@/lib/db/schema";
import { updateCommentSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { handleError, errorResponse, validateUuid } from "@/lib/errors";
import { requireAuth } from "@/lib/auth";
import { sanitizeMarkdown } from "@/lib/sanitize";
import { eq, and, isNull, sql } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/v1/comments/[id] — Author only
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const uuidCheck = validateUuid(id);
    if (uuidCheck) return uuidCheck;

    // Author check
    const [existing] = await db
      .select({ id: issueComments.id, authorId: issueComments.authorId, issueId: issueComments.issueId })
      .from(issueComments)
      .where(and(eq(issueComments.id, id), isNull(issueComments.deletedAt)));

    if (!existing) return errorResponse(404, "Comment not found");
    if (existing.authorId !== authResult.id) {
      return errorResponse(403, "You can only edit your own comments");
    }

    const body = await req.json();
    const data = updateCommentSchema.parse(body);
    const sanitizedBody = sanitizeMarkdown(data.body) || data.body;

    const [updated] = await db
      .update(issueComments)
      .set({ body: sanitizedBody, editedAt: new Date() })
      .where(eq(issueComments.id, id))
      .returning();

    await logActivity("comment_updated", "issue_comment", id, authResult.id, {
      issue_id: existing.issueId,
    });

    return NextResponse.json({
      id: updated.id,
      body: updated.body,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      editedAt: updated.editedAt,
      author: { id: authResult.id, name: authResult.name },
    });
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/v1/comments/[id] — Author only, soft delete
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const uuidCheck = validateUuid(id);
    if (uuidCheck) return uuidCheck;

    const [existing] = await db
      .select({ id: issueComments.id, authorId: issueComments.authorId, issueId: issueComments.issueId })
      .from(issueComments)
      .where(and(eq(issueComments.id, id), isNull(issueComments.deletedAt)));

    if (!existing) return errorResponse(404, "Comment not found");
    if (existing.authorId !== authResult.id) {
      return errorResponse(403, "You can only delete your own comments");
    }

    await db
      .update(issueComments)
      .set({ deletedAt: sql`now()` })
      .where(eq(issueComments.id, id));

    // comment_count auto-decremented by trigger

    await logActivity("comment_deleted", "issue_comment", id, authResult.id, {
      issue_id: existing.issueId,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
