import { SessionImport } from "./types";

const SESSION_HEADER = /^## Recent Development \((\d{4}-\d{2}-\d{2}),\s*Session (\d+)\)\s*—\s*(.+)$/;
const FEATURE_HEADER = /^### (.+?)(?:\s+(✅|🔄))?\s*$/;
const LAST_UPDATED = /^\*\*Last Updated:\*\*\s*(.+)$/;

type ParserState = "init" | "session" | "feature";

export function parseSessionBased(content: string, projectName: string): SessionImport {
  const lines = content.split("\n");
  let state: ParserState = "init";

  const result: SessionImport = {
    projectName,
    lastUpdated: null,
    sessions: [],
  };

  let currentSession: SessionImport["sessions"][0] | null = null;
  let currentFeature: SessionImport["sessions"][0]["features"][0] | null = null;
  let featureIndex = 0;
  let descLines: string[] = [];

  function flushFeature() {
    if (currentFeature && currentSession) {
      currentFeature.description = descLines.join("\n").trim();
      currentSession.features.push(currentFeature);
      currentFeature = null;
      descLines = [];
    }
  }

  function flushSession() {
    flushFeature();
    if (currentSession) {
      result.sessions.push(currentSession);
      currentSession = null;
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();

    // Last updated
    const updatedMatch = trimmed.match(LAST_UPDATED);
    if (updatedMatch) {
      result.lastUpdated = updatedMatch[1];
      continue;
    }

    // Session header
    const sessionMatch = trimmed.match(SESSION_HEADER);
    if (sessionMatch) {
      flushSession();
      featureIndex = 0;
      const sessionNumber = parseInt(sessionMatch[2], 10);
      currentSession = {
        externalId: `session-${sessionNumber}`,
        date: sessionMatch[1],
        sessionNumber,
        title: sessionMatch[3],
        features: [],
      };
      state = "session";
      continue;
    }

    // Feature header (only inside a session)
    if (state === "session" || state === "feature") {
      const featureMatch = trimmed.match(FEATURE_HEADER);
      if (featureMatch && currentSession) {
        flushFeature();
        featureIndex++;
        const emoji = featureMatch[2] || "";
        const status = emoji === "✅" ? "done" : "in_progress";
        currentFeature = {
          externalId: `session-${currentSession.sessionNumber}-feature-${featureIndex}`,
          title: featureMatch[1].trim(),
          status,
          description: "",
        };
        state = "feature";
        continue;
      }
    }

    // If we hit a new ## section that's not a session, flush
    if (trimmed.startsWith("## ") && !trimmed.match(SESSION_HEADER)) {
      flushSession();
      state = "init";
      continue;
    }

    // Accumulate description lines for current feature
    if (state === "feature" && currentFeature) {
      descLines.push(line);
    }
  }

  // Flush remaining
  flushSession();

  return result;
}
