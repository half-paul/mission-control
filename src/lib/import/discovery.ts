import { readdir, access, stat } from "fs/promises";
import { join } from "path";
import { ProjectSource } from "./types";

const PROJECTS_PATH = process.env.PROJECTS_PATH || "/data/projects";

export async function discoverProjects(): Promise<ProjectSource[]> {
  const sources: ProjectSource[] = [];

  try {
    const entries = await readdir(PROJECTS_PATH, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const projectPath = join(PROJECTS_PATH, entry.name);
      const source: ProjectSource = {
        name: entry.name,
        path: projectPath,
        statusMd: null,
        agentMapping: null,
        readme: null,
      };

      // Check for STATUS.md in docs/ or root
      const docsStatus = join(projectPath, "docs", "STATUS.md");
      const rootStatus = join(projectPath, "STATUS.md");

      if (await fileExists(docsStatus)) {
        source.statusMd = docsStatus;
      } else if (await fileExists(rootStatus)) {
        source.statusMd = rootStatus;
      }

      // Check for AGENT_MAPPING.md
      const agentMapping = join(projectPath, "docs", "AGENT_MAPPING.md");
      if (await fileExists(agentMapping)) {
        source.agentMapping = agentMapping;
      }

      // Check for README
      const docsReadme = join(projectPath, "docs", "README.md");
      const rootReadme = join(projectPath, "README.md");
      if (await fileExists(docsReadme)) {
        source.readme = docsReadme;
      } else if (await fileExists(rootReadme)) {
        source.readme = rootReadme;
      }

      sources.push(source);
    }
  } catch {
    // Directory doesn't exist or isn't accessible
  }

  return sources;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
