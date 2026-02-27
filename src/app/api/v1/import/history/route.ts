import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { importRuns, projects, members } from "@/lib/db/schema";
import { handleError } from "@/lib/errors";
import { eq, desc } from "drizzle-orm";

// GET /api/v1/import/history
export async function GET() {
  try {
    const rows = await db
      .select({
        id: importRuns.id,
        projectName: projects.name,
        projectKey: projects.key,
        startedAt: importRuns.startedAt,
        completedAt: importRuns.completedAt,
        status: importRuns.status,
        sourceFormat: importRuns.sourceFormat,
        issuesCreated: importRuns.issuesCreated,
        issuesUpdated: importRuns.issuesUpdated,
        issuesSkipped: importRuns.issuesSkipped,
        errorMessage: importRuns.errorMessage,
      })
      .from(importRuns)
      .innerJoin(projects, eq(importRuns.projectId, projects.id))
      .orderBy(desc(importRuns.startedAt))
      .limit(50);

    return NextResponse.json({ data: rows });
  } catch (err) {
    return handleError(err);
  }
}
