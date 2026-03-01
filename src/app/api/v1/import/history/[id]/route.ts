import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { importRuns, projects } from "@/lib/db/schema";
import { handleError, errorResponse, validateUuid } from "@/lib/errors";
import { requireAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

// GET /api/v1/import/history/[id]
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const uuidCheck = validateUuid(id);
    if (uuidCheck) return uuidCheck;
    const [row] = await db
      .select({
        id: importRuns.id,
        projectName: projects.name,
        startedAt: importRuns.startedAt,
        completedAt: importRuns.completedAt,
        status: importRuns.status,
        sourcePath: importRuns.sourcePath,
        sourceFormat: importRuns.sourceFormat,
        issuesCreated: importRuns.issuesCreated,
        issuesUpdated: importRuns.issuesUpdated,
        issuesSkipped: importRuns.issuesSkipped,
        errorMessage: importRuns.errorMessage,
      })
      .from(importRuns)
      .innerJoin(projects, eq(importRuns.projectId, projects.id))
      .where(eq(importRuns.id, id));

    if (!row) return errorResponse(404, "Import run not found");

    return NextResponse.json(row);
  } catch (err) {
    return handleError(err);
  }
}
