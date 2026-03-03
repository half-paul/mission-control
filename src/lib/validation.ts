import { z } from "zod";

// ─── Date validation helper ────────────────────────────────
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/, "Must be a valid ISO-8601 date")
  .refine((val) => !isNaN(Date.parse(val)), "Must be a parseable date");

// ─── Enums ─────────────────────────────────────────────────
export const IssueStatus = z.enum(["backlog", "todo", "in_progress", "in_review", "done"]);
export type IssueStatus = z.infer<typeof IssueStatus>;

export const IssuePriority = z.enum(["low", "medium", "high", "critical"]);
export type IssuePriority = z.infer<typeof IssuePriority>;

export const ProjectStatus = z.enum(["planned", "active", "on_hold", "completed"]);
export type ProjectStatus = z.infer<typeof ProjectStatus>;

export const MemberRole = z.enum(["admin", "member", "viewer"]);
export type MemberRole = z.infer<typeof MemberRole>;

// ─── Status Workflow ───────────────────────────────────────
export const STATUS_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  backlog: ["todo"],
  todo: ["in_progress", "backlog"],
  in_progress: ["in_review", "todo"],
  in_review: ["done", "in_progress"],
  done: ["in_progress"],
};

export function canTransition(from: IssueStatus, to: IssueStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

// ─── Issue Schemas ─────────────────────────────────────────
export const createIssueSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: IssueStatus.optional().default("backlog"),
  priority: IssuePriority.optional().default("medium"),
  projectId: z.string().uuid().optional().nullable(),
  assigneeId: z.string().uuid().optional().nullable(),
  labels: z.array(z.string()).optional().default([]),
  dueDate: isoDate.optional().nullable(),
});

export const updateIssueSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  status: IssueStatus.optional(),
  priority: IssuePriority.optional(),
  projectId: z.string().uuid().optional().nullable(),
  assigneeId: z.string().uuid().optional().nullable(),
  labels: z.array(z.string()).optional(),
  dueDate: isoDate.optional().nullable(),
});

export const transitionStatusSchema = z.object({
  status: IssueStatus,
});

// ─── Project Schemas ───────────────────────────────────────
export const createProjectSchema = z.object({
  key: z.string().min(1).max(10).toUpperCase(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  status: ProjectStatus.optional().default("planned"),
  ownerId: z.string().uuid(),
  startDate: isoDate.optional().nullable(),
  targetDate: isoDate.optional().nullable(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  status: ProjectStatus.optional(),
  ownerId: z.string().uuid().optional(),
  startDate: isoDate.optional().nullable(),
  targetDate: isoDate.optional().nullable(),
});

// ─── Member Schemas ────────────────────────────────────────
// #5: Strong password validation
const strongPassword = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain a special character");

export const createMemberSchema = z.object({
  email: z.string().email().max(255),
  password: strongPassword,
  name: z.string().min(1).max(100),
  avatarUrl: z.string().url().optional().nullable(),
  role: MemberRole.optional().default("member"),
  agentId: z.string().max(50).optional().nullable(),
});

export const updateMemberSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  role: MemberRole.optional(),
  agentId: z.string().max(50).optional().nullable(),
});

// ─── Label Schemas ─────────────────────────────────────────
export const createLabelSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default("#6B7280"),
  description: z.string().optional(),
});

export const updateLabelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  description: z.string().optional().nullable(),
});

// ─── Filter Schemas ────────────────────────────────────────
export const createFilterSchema = z.object({
  name: z.string().min(1).max(100),
  memberId: z.string().uuid(),
  filters: z.object({
    status: z.array(IssueStatus).optional(),
    priority: z.array(IssuePriority).optional(),
    project: z.string().uuid().optional(),
    assignee: z.string().uuid().optional(),
    label: z.array(z.string()).optional(),
    due_before: isoDate.optional(),
    due_after: isoDate.optional(),
  }),
  isDefault: z.boolean().optional().default(false),
});

export const updateFilterSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  filters: z
    .object({
      status: z.array(IssueStatus).optional(),
      priority: z.array(IssuePriority).optional(),
      project: z.string().uuid().optional(),
      assignee: z.string().uuid().optional(),
      label: z.array(z.string()).optional(),
      due_before: isoDate.optional(),
      due_after: isoDate.optional(),
    })
    .optional(),
  isDefault: z.boolean().optional(),
});

// ─── Comment Schemas ───────────────────────────────────────
export const createCommentSchema = z.object({
  body: z.string().min(1, "Comment body is required").max(10000, "Comment must be less than 10,000 characters").transform((val) => val.trim()),
});

export const updateCommentSchema = z.object({
  body: z.string().min(1, "Comment body is required").max(10000, "Comment must be less than 10,000 characters").transform((val) => val.trim()),
});

// ─── Query Param Schemas ───────────────────────────────────
export const issueQuerySchema = z.object({
  status: z.string().optional(), // comma-separated
  priority: z.string().optional(),
  assignee: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(), // alias for assignee
  project: z.string().uuid().optional(),
  label: z.string().optional(), // comma-separated
  q: z.string().optional(),
  sort: z
    .string()
    .regex(
      /^(created_at|updated_at|title|priority|status|due_date):(asc|desc)$/,
      "Sort must be field:direction where field is one of: created_at, updated_at, title, priority, status, due_date"
    )
    .optional(), // field:direction
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  due_before: isoDate.optional(),
  due_after: isoDate.optional(),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});
