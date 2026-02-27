import { NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { discoverProjects, detectFormat } from "@/lib/import";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq, isNull, and } from "drizzle-orm";
import { handleError } from "@/lib/errors";

// GET /api/v1/import/discover
export async function GET() {
  try {
    const sources = await discoverProjects();
    const result = [];

    for (const source of sources) {
      let format = "unknown";
      let lastModified = null;

      if (source.statusMd) {
        try {
          const content = await readFile(source.statusMd, "utf-8");
          format = detectFormat(content);
          const stats = await stat(source.statusMd);
          lastModified = stats.mtime.toISOString();
        } catch { /* skip */ }
      }

      // Check if project already exists in DB
      const [existing] = await db
        .select({ id: projects.id, name: projects.name })
        .from(projects)
        .where(and(eq(projects.sourcePath, source.path), isNull(projects.deletedAt)));

      result.push({
        name: source.name,
        path: source.path,
        format,
        hasStatusMd: !!source.statusMd,
        hasAgentMapping: !!source.agentMapping,
        hasReadme: !!source.readme,
        lastModified,
        existingProject: existing || null,
      });
    }

    return NextResponse.json({ sources: result });
  } catch (err) {
    return handleError(err);
  }
}
