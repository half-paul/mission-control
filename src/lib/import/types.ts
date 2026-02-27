export type StatusFormat = "sprint-based" | "session-based" | "unknown";

export interface ProjectSource {
  name: string;
  path: string;
  statusMd: string | null;
  agentMapping: string | null;
  readme: string | null;
}

export interface SprintImport {
  projectName: string;
  currentSprint: {
    number: number;
    name: string;
    startDate: string | null;
  };
  tasks: Array<{
    externalId: string;
    title: string;
    status: "done" | "todo";
    agentTag: string;
    sprintNumber: number;
  }>;
  progress: Array<{
    agentTag: string;
    completed: number;
    total: number;
    percentage: number;
    status: string;
    notes: string;
  }>;
}

export interface SessionImport {
  projectName: string;
  lastUpdated: string | null;
  sessions: Array<{
    externalId: string;
    date: string;
    sessionNumber: number;
    title: string;
    features: Array<{
      externalId: string;
      title: string;
      status: "done" | "in_progress";
      description: string;
    }>;
  }>;
}

export interface AgentMap {
  [tag: string]: {
    name: string;
    emoji: string;
    role: string;
    agentId: string;
  };
}

export const DEFAULT_AGENT_MAP: AgentMap = {
  SA: { name: "David", emoji: "🏗️", role: "System Architect", agentId: "david" },
  DBE: { name: "Dana", emoji: "🗄️", role: "Database Engineer", agentId: "dana" },
  "DEV-BE": { name: "Logan", emoji: "👨‍💻", role: "Backend Developer", agentId: "logan" },
  "DEV-FE": { name: "Alex", emoji: "⚛️", role: "Frontend Developer", agentId: "alex" },
  CR: { name: "Rex", emoji: "🔍", role: "Code Reviewer", agentId: "rex" },
  QA: { name: "Tom", emoji: "⚙️", role: "QA Engineer", agentId: "tom" },
  PM: { name: "Bruce", emoji: "🦞", role: "PM/Product Owner", agentId: "bruce" },
};
