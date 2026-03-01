import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  primaryKey,
  index,
  uniqueIndex,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Members ───────────────────────────────────────────────
export const members = pgTable("members", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  avatarUrl: text("avatar_url"),
  role: varchar("role", { length: 50 }).default("member"),
  agentId: varchar("agent_id", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// ─── Projects ──────────────────────────────────────────────
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 10 }).unique().notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("planned"),
  ownerId: uuid("owner_id").notNull().references(() => members.id),
  startDate: date("start_date"),
  targetDate: date("target_date"),
  nextIssueNumber: integer("next_issue_number").default(1),
  sourcePath: text("source_path"),
  sourceFormat: varchar("source_format", { length: 50 }),
  lastImportAt: timestamp("last_import_at", { withTimezone: true }),
  lastExportAt: timestamp("last_export_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid("created_by").references(() => members.id),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// ─── Issues ────────────────────────────────────────────────
export const issues = pgTable("issues", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 50 }).unique().notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("backlog"),
  priority: varchar("priority", { length: 50 }).default("medium"),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  assigneeId: uuid("assignee_id").references(() => members.id, { onDelete: "set null" }),
  dueDate: date("due_date"),
  externalSourceId: varchar("external_source_id", { length: 255 }).unique(),
  importMetadata: jsonb("import_metadata"),
  commentCount: integer("comment_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid("created_by").references(() => members.id),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// ─── Issue Comments ────────────────────────────────────────
export const issueComments = pgTable("issue_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  issueId: uuid("issue_id").notNull().references(() => issues.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").notNull().references(() => members.id, { onDelete: "set null" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  editedAt: timestamp("edited_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// ─── Labels ────────────────────────────────────────────────
export const labels = pgTable("labels", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).unique().notNull(),
  color: varchar("color", { length: 7 }).default("#6B7280"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid("created_by").references(() => members.id),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// ─── Issue Labels (Junction) ───────────────────────────────
export const issueLabels = pgTable(
  "issue_labels",
  {
    issueId: uuid("issue_id").notNull().references(() => issues.id, { onDelete: "cascade" }),
    labelId: uuid("label_id").notNull().references(() => labels.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.issueId, table.labelId] })]
);

// ─── Saved Filters ─────────────────────────────────────────
export const savedFilters = pgTable("saved_filters", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  memberId: uuid("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  filters: jsonb("filters").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Import Runs ───────────────────────────────────────────
export const importRuns = pgTable("import_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  status: varchar("status", { length: 50 }).default("running").notNull(),
  sourcePath: text("source_path").notNull(),
  sourceFormat: varchar("source_format", { length: 50 }).notNull(),
  issuesCreated: integer("issues_created").default(0),
  issuesUpdated: integer("issues_updated").default(0),
  issuesSkipped: integer("issues_skipped").default(0),
  errorMessage: text("error_message"),
  createdBy: uuid("created_by").references(() => members.id),
});

// ─── Activity Log ──────────────────────────────────────────
export const activityLog = pgTable("activity_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: uuid("entity_id").notNull(),
  actorId: uuid("actor_id").references(() => members.id, { onDelete: "set null" }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Relations ─────────────────────────────────────────────
export const membersRelations = relations(members, ({ many }) => ({
  ownedProjects: many(projects, { relationName: "projectOwner" }),
  assignedIssues: many(issues, { relationName: "issueAssignee" }),
  savedFilters: many(savedFilters),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(members, { fields: [projects.ownerId], references: [members.id], relationName: "projectOwner" }),
  issues: many(issues),
  importRuns: many(importRuns),
}));

export const issuesRelations = relations(issues, ({ one, many }) => ({
  project: one(projects, { fields: [issues.projectId], references: [projects.id] }),
  assignee: one(members, { fields: [issues.assigneeId], references: [members.id], relationName: "issueAssignee" }),
  issueLabels: many(issueLabels),
  comments: many(issueComments),
}));

export const issueCommentsRelations = relations(issueComments, ({ one }) => ({
  issue: one(issues, { fields: [issueComments.issueId], references: [issues.id] }),
  author: one(members, { fields: [issueComments.authorId], references: [members.id] }),
}));

export const labelsRelations = relations(labels, ({ many }) => ({
  issueLabels: many(issueLabels),
}));

export const issueLabelsRelations = relations(issueLabels, ({ one }) => ({
  issue: one(issues, { fields: [issueLabels.issueId], references: [issues.id] }),
  label: one(labels, { fields: [issueLabels.labelId], references: [labels.id] }),
}));
