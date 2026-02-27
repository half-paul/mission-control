import { resolve, relative } from "path";
import { config } from "./config";

const PROJECTS_PATH = config.projectsPath;

/**
 * Validates that a given path is within the allowed projects directory.
 * Prevents path traversal attacks (e.g., ../../etc/passwd).
 *
 * @returns The resolved absolute path if valid, or null if traversal detected.
 */
export function validateProjectPath(inputPath: string): string | null {
  // Resolve to absolute path (handles .., ., symlinks)
  const resolved = resolve(inputPath);
  const allowedBase = resolve(PROJECTS_PATH);

  // Ensure the resolved path starts with the allowed base
  const rel = relative(allowedBase, resolved);

  // If relative path starts with '..' or is absolute, it's outside the base
  if (rel.startsWith("..") || resolve(rel) === rel) {
    return null;
  }

  return resolved;
}

/**
 * Validates that a file path is a STATUS.md or known safe file within a project.
 */
export function isAllowedImportFile(filePath: string): boolean {
  const resolved = resolve(filePath);
  const allowedBase = resolve(PROJECTS_PATH);

  const rel = relative(allowedBase, resolved);
  if (rel.startsWith("..") || resolve(rel) === rel) {
    return false;
  }

  // Only allow specific file names
  const allowedFiles = ["STATUS.md", "AGENT_MAPPING.md", "README.md"];
  const fileName = resolved.split("/").pop() || "";
  return allowedFiles.includes(fileName);
}
