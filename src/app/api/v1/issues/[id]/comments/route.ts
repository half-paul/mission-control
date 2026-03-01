import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { issueComments, issues, members } from "@/lib/db/schema";
import { createCommentSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { handleError, errorResponse, validateUuid } from "@/lib/errors";
import { requireAuth } from "@/lib/auth";
import { sanitizeMarkdown } from "@/lib/sanitize";
import { eq, and, isNull, asc } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

// GET /api/v1/issues/[id]/comments
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const uuidCheck = validateUuid(id);
    if (uuidCheck) return uuidCheck;

    const rows = await db
      .select({
        id: issueComments.id,
        body: issueComments.body,
        createdAt: issueComments.createdAt,
        updatedAt: issueComments.updatedAt,
        editedAt: issueComments.editedAt,
        authorId: issueComments.authorId,
        authorName: members.name,
        authorAvatar: members.avatarUrl,
      })
      .from(issueComments)
      .innerJoin(members, eq(issueComments.authorId, members.id))
      .where(and(eq(issueComments.issueId, id), isNull(issueComments.deletedAt)))
      .orderBy(asc(issueComments.createdAt));

    const data = rows.map((r) => ({
      id: r.id,
      body: r.body,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      editedAt: r.editedAt,
      author: { id: r.authorId, name: r.authorName, avatar: r.authorAvatar },
    }));

    return NextResponse.json({ data });
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/v1/issues/[id]/comments
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { id: issueId } = await params;
    const uuidCheck = validateUuid(issueId);
    if (uuidCheck) return uuidCheck;

    // Verify issue exists
    const [issue] = await db
      .select({ id: issues.id, key: issues.key })
      .from(issues)
      .where(and(eq(issues.id, issueId), isNull(issues.deletedAt)));
    if (!issue) return errorResponse(404, "Issue not found");

    const body = await req.json();
    const data = createCommentSchema.parse(body);

    const sanitizedBody = sanitizeMarkdown(data.body) || data.body;

    const [comment] = await db
      .insert(issueComments)
      .values({
        issueId,
        authorId: authResult.id,
        body: sanitizedBody,
      })
      .returning();

    // comment_count is auto-incremented by trigger

    await logActivity("comment_created", "issue_comment", comment.id, authResult.id, {
      issue_id: issueId,
      issue_key: issue.key,
      body_preview: sanitizedBody.substring(0, 100),
    });

    return NextResponse.json(
      {
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        editedAt: comment.editedAt,
        author: { id: authResult.id, name: authResult.name },
      },
      { status: 201 }
    );
  } catch (err) {
    return handleError(err);
  }
}
