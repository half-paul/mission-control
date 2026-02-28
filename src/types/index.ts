// Re-export validation schemas as types
import { z } from "zod";
import {
  createIssueSchema,
  updateIssueSchema,
  createProjectSchema,
  updateProjectSchema,
  createMemberSchema,
  updateMemberSchema,
  createLabelSchema,
  updateLabelSchema,
  createFilterSchema,
  updateFilterSchema,
} from "@/lib/validation";

// Issue types
export type CreateIssue = z.infer<typeof createIssueSchema>;
export type UpdateIssue = z.infer<typeof updateIssueSchema>;

export type IssueStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "in_review"
  | "done";

export type IssuePriority = "low" | "medium" | "high" | "critical";

export interface Issue {
  id: string;
  key: string;
  title: string;
  description: string | null;
  status: IssueStatus;
  priority: IssuePriority;
  project: {
    id: string;
    name: string;
    key: string;
  };
  assignee: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
  labels: Array<{
    id: string;
    name: string;
    color: string;
  }> | null;
  createdAt: string;
  updatedAt: string;
  dueDate: string | null;
  createdBy?: {
    id: string;
    name: string;
  };
}

// Project types
export type CreateProject = z.infer<typeof createProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;

export interface Project {
  id: string;
  key: string;
  name: string;
  description: string | null;
  status: "active" | "archived";
  ownerId: string;
  ownerName: string | null;
  startDate: string | null;
  targetDate: string | null;
  progress: number;
  totalIssues: number;
  doneIssues: number;
  stats?: {
    total: number;
    backlog: number;
    todo: number;
    in_progress: number;
    in_review: number;
    done: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Member types
export type CreateMember = z.infer<typeof createMemberSchema>;
export type UpdateMember = z.infer<typeof updateMemberSchema>;

export interface Member {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
}

// Label types
export type CreateLabel = z.infer<typeof createLabelSchema>;
export type UpdateLabel = z.infer<typeof updateLabelSchema>;

export interface Label {
  id: string;
  name: string;
  color: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

// Filter types
export type CreateFilter = z.infer<typeof createFilterSchema>;
export type UpdateFilter = z.infer<typeof updateFilterSchema>;

export interface SavedFilter {
  id: string;
  name: string;
  filters: {
    status?: IssueStatus[];
    priority?: IssuePriority[];
    assignee?: string;
    project?: string;
    label?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

// Dashboard types
export interface DashboardData {
  activeProjects: Array<{
    id: string;
    name: string;
    progress: number;
    status: string;
  }>;
  overdueIssues: Array<{
    id: string;
    key: string;
    title: string;
    dueDate: string;
    assignee: string | null;
  }>;
  criticalIssues: Array<{
    id: string;
    key: string;
    title: string;
    status: string;
    project: string;
  }>;
  recentActivity: Array<{
    type: string;
    issue?: string;
    actor: string;
    timestamp: string;
    from?: string;
    to?: string;
  }>;
  myIssues: {
    total: number;
    inProgress: number;
    overdue: number;
  };
}

// Import types
export interface ProjectSource {
  name: string;
  path: string;
  format: "sprint-based" | "session-based" | "unknown";
  hasStatusMd: boolean;
  hasAgentMapping: boolean;
  hasReadme: boolean;
  lastModified: string;
  existingProject: {
    id: string;
    name: string;
  } | null;
}

export interface ImportPreview {
  format: string;
  projectName: string;
  preview: {
    totalIssues: number;
    newIssues: number;
    updatedIssues: number;
    skippedIssues: number;
    byStatus: Record<string, number>;
    byAssignee: Record<string, number>;
    labels: string[];
    sampleIssues: Array<{
      title: string;
      status: string;
      assignee: string | null;
      labels: string[];
      externalSourceId: string;
    }>;
  };
}

// SSE event types
export interface SSEEvent {
  type:
    | "issue_created"
    | "issue_updated"
    | "issue_status_changed"
    | "issue_deleted"
    | "project_updated"
    | "member_updated";
  data: any;
}
