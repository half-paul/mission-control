import { StatusFormat } from "./types";

export function detectFormat(content: string): StatusFormat {
  if (/^## Current Sprint: \d+/m.test(content)) return "sprint-based";
  if (/^## Recent Development \(/m.test(content)) return "session-based";
  return "unknown";
}
