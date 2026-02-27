import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { issues, projects, members, labels, issueLabels } from "@/lib/db/schema";
import { createIssueSchema, issueQuerySchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { handleError, errorResponse } from "@/lib/errors";
import { requireAuth, requireWrite } from "@/lib/auth";
import { sanitizeText, sanitizeMarkdown } from "@/lib/sanitize";
import { eq, and, isNull, inArray, sql, desc, asc, lte, gte, or, ilike } from "drizzle-orm";

// GET /api/v1/issues — List with filtering, pagination, sorting
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const params = Object.fromEntries(req.nextUrl.searchParams);
    const query = issueQuerySchema.parse(params);
    const { page, limit } = query;
    const offset = (page - 1) * limit;

    const conditions = [isNull(issues.deletedAt)];

    if (query.status) {
      const statuses = query.status.split(",");
      conditions.push(inArray(issues.status, statuses));
    }
    if (query.priority) {
      const priorities = query.priority.split(",");
      conditions.push(inArray(issues.priority, priorities));
    }
    if (query.assignee) {
      conditions.push(eq(issues.assigneeId, query.assignee));
    }
    if (query.project) {
      conditions.push(eq(issues.projectId, query.project));
    }
    if (query.due_before) {
      conditions.push(lte(issues.dueDate, query.due_before));
    }
    if (query.due_after) {
      conditions.push(gte(issues.dueDate, query.due_after));
    }
    if (query.q) {
      conditions.push(
        or(ilike(issues.title, `%${query.q}%`), ilike(issues.description, `%${query.q}%`))!
      );
    }

    // #7: Sort field whitelist — validated by Zod regex, safe to use
    let orderBy = desc(issues.createdAt);
    if (query.sort) {
      const [field, dir] = query.sort.split(":");
      const direction = dir === "asc" ? asc : desc;
      const sortMap: Record<string, any> = {
        created_at: issues.createdAt,
        updated_at: issues.updatedAt,
        title: issues.title,
        priority: issues.priority,
        status: issues.status,
        due_date: issues.dueDate,
      };
      if (sortMap[field]) orderBy = direction(sortMap[field]);
    }

    const rows = await db
      .select({
        id: issues.id,
        key: issues.key,
        title: issues.title,
        description: issues.description,
        status: issues.status,
        priority: issues.priority,
        dueDate: issues.dueDate,
        createdAt: issues.createdAt,
        updatedAt: issues.updatedAt,
        projectId: issues.projectId,
        projectName: projects.name,
        projectKey: projects.key,
        assigneeId: issues.assigneeId,
        assigneeName: members.name,
        assigneeAvatar: members.avatarUrl,
      })
      .from(issues)
      .innerJoin(projects, eq(issues.projectId, projects.id))
      .leftJoin(members, eq(issues.assigneeId, members.id))
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(issues)
      .where(and(...conditions));

    const data = rows.map((r) => ({
      id: r.id,
      key: r.key,
      title: r.title,
      description: r.description,
      status: r.status,
      priority: r.priority,
      dueDate: r.dueDate,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      project: { id: r.projectId, name: r.projectName, key: r.projectKey },
      assignee: r.assigneeId
        ? { id: r.assigneeId, name: r.assigneeName, avatar: r.assigneeAvatar }
        : null,
    }));

    return NextResponse.json({
      data,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    });
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/v1/issues — Create with atomic key generation
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const writeCheck = requireWrite(authResult);
    if (writeCheck) return writeCheck;

    const body = await req.json();
    const data = createIssueSchema.parse(body);

    // #4: Sanitize inputs
    const sanitizedTitle = sanitizeText(data.title);
    const sanitizedDesc = sanitizeMarkdown(data.description);

    // Atomic key generation
    const [project] = await db
      .update(projects)
      .set({ nextIssueNumber: sql`${projects.nextIssueNumber} + 1` })
      .where(eq(projects.id, data.projectId))
      .returning({ key: projects.key, issueNumber: sql<number>`${projects.nextIssueNumber} - 1` });

    if (!project) {
      return errorResponse(404, "Project not found");
    }

    const issueKey = `${project.key}-${project.issueNumber}`;

    const [issue] = await db
      .insert(issues)
      .values({
        key: issueKey,
        title: sanitizedTitle,
        description: sanitizedDesc,
        status: data.status,
        priority: data.priority,
        projectId: data.projectId,
        assigneeId: data.assigneeId,
        dueDate: data.dueDate,
        createdBy: authResult.id,
      })
      .returning();

    // Attach labels
    if (data.labels.length > 0) {
      const labelRows = await db
        .select({ id: labels.id })
        .from(labels)
        .where(and(inArray(labels.name, data.labels), isNull(labels.deletedAt)));

      if (labelRows.length > 0) {
        await db.insert(issueLabels).values(
          labelRows.map((l) => ({ issueId: issue.id, labelId: l.id }))
        );
      }
    }

    await logActivity("issue_created", "issue", issue.id, authResult.id, {
      issue_key: issueKey,
      title: sanitizedTitle,
      project_id: data.projectId,
    });

    return NextResponse.json(issue, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
