import { SprintImport } from "./types";

const SPRINT_HEADER = /^## Current Sprint: (\d+) — (.+)$/;
const STARTED_DATE = /^\*\*Started:\*\* (.+)$/;
const ROLE_HEADER = /^### (.+)$/;
const TASK_DONE = /^- \[x\] (.+)$/;
const TASK_TODO = /^- \[ \] (.+)$/;
const PROGRESS_ROW = /^\| (\w+(?:-\w+)?) \| (\d+)\/(\d+) \((\d+)%\) \| (.+?) \| (.+?) \|$/;

type ParserState = "init" | "sprint_header" | "role_tasks" | "progress_table";

export function parseSprintBased(content: string, projectName: string): SprintImport {
  const lines = content.split("\n");
  let state: ParserState = "init";
  let currentRole = "";
  let taskIndex = 0;

  const result: SprintImport = {
    projectName,
    currentSprint: { number: 0, name: "", startDate: null },
    tasks: [],
    progress: [],
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Sprint header
    const sprintMatch = trimmed.match(SPRINT_HEADER);
    if (sprintMatch) {
      result.currentSprint.number = parseInt(sprintMatch[1], 10);
      result.currentSprint.name = sprintMatch[2];
      state = "sprint_header";
      continue;
    }

    // Start date
    const dateMatch = trimmed.match(STARTED_DATE);
    if (dateMatch && state === "sprint_header") {
      result.currentSprint.startDate = dateMatch[1];
      continue;
    }

    // Role header
    const roleMatch = trimmed.match(ROLE_HEADER);
    if (roleMatch) {
      // Map role names to agent tags
      currentRole = mapRoleToTag(roleMatch[1]);
      taskIndex = 0;
      state = "role_tasks";
      continue;
    }

    // Tasks
    if (state === "role_tasks") {
      const doneMatch = trimmed.match(TASK_DONE);
      if (doneMatch) {
        taskIndex++;
        result.tasks.push({
          externalId: `sprint-${result.currentSprint.number}-${currentRole.toLowerCase()}-${taskIndex}`,
          title: doneMatch[1].replace(/\s*\(.*?\)\s*$/, "").trim(),
          status: "done",
          agentTag: currentRole,
          sprintNumber: result.currentSprint.number,
        });
        continue;
      }

      const todoMatch = trimmed.match(TASK_TODO);
      if (todoMatch) {
        taskIndex++;
        result.tasks.push({
          externalId: `sprint-${result.currentSprint.number}-${currentRole.toLowerCase()}-${taskIndex}`,
          title: todoMatch[1].replace(/\s*\(.*?\)\s*$/, "").trim(),
          status: "todo",
          agentTag: currentRole,
          sprintNumber: result.currentSprint.number,
        });
        continue;
      }
    }

    // Progress table
    const progressMatch = trimmed.match(PROGRESS_ROW);
    if (progressMatch) {
      state = "progress_table";
      result.progress.push({
        agentTag: progressMatch[1],
        completed: parseInt(progressMatch[2], 10),
        total: parseInt(progressMatch[3], 10),
        percentage: parseInt(progressMatch[4], 10),
        status: progressMatch[5].replace(/[✅🔄⏳❌]\s*/, "").trim(),
        notes: progressMatch[6].trim(),
      });
    }
  }

  return result;
}

function mapRoleToTag(role: string): string {
  const lower = role.toLowerCase();
  if (lower.includes("architect")) return "SA";
  if (lower.includes("database")) return "DBE";
  if (lower.includes("backend")) return "DEV-BE";
  if (lower.includes("frontend")) return "DEV-FE";
  if (lower.includes("review")) return "CR";
  if (lower.includes("qa") || lower.includes("test")) return "QA";
  if (lower.includes("product") || lower.includes("pm")) return "PM";
  return role.toUpperCase().slice(0, 5);
}
