"use client";

import { useState, useEffect } from "react";
import { Issue, IssueStatus, IssuePriority } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";

interface IssueFormProps {
  issue?: Issue;
  onSubmit: (data: IssueFormData) => Promise<void>;
  onCancel: () => void;
}

export interface IssueFormData {
  title: string;
  description?: string;
  status: IssueStatus;
  priority: IssuePriority;
  projectId?: string | null;
  assigneeId?: string | null;
  labels: string[];
  dueDate?: string | null;
}

interface Project {
  id: string;
  name: string;
  key: string;
}

interface Member {
  id: string;
  name: string;
}

export function IssueForm({ issue, onSubmit, onCancel }: IssueFormProps) {
  const [formData, setFormData] = useState<IssueFormData>({
    title: issue?.title || "",
    description: issue?.description || "",
    status: issue?.status || "backlog",
    priority: issue?.priority || "medium",
    projectId: issue?.project?.id || "",
    assigneeId: issue?.assignee?.id || null,
    labels: [],
    dueDate: issue?.dueDate || null,
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch projects and members
  useEffect(() => {
    Promise.all([
      apiClient.get<{ data: Project[] }>("/api/v1/projects"),
      apiClient.get<{ data: Member[] }>("/api/v1/members"),
    ])
      .then(([projectsRes, membersRes]) => {
        setProjects(projectsRes.data);
        setMembers(membersRes.data);
      })
      .catch((err) => {
        console.error("Failed to load form data:", err);
      });
  }, [issue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError((err as Error).message || "Failed to save issue");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md border border-red-800 bg-red-950/50 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <Label htmlFor="title">
          Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Brief description of the issue"
          required
          maxLength={200}
        />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <MarkdownEditor
          value={formData.description || ""}
          onChange={(value) => setFormData({ ...formData, description: value })}
          placeholder="Detailed description of the issue..."
        />
      </div>

      {/* Project */}
      <div>
        <Label htmlFor="project">
          Project
        </Label>
        <Select
          id="project"
          value={formData.projectId || ""}
          onChange={(e) => setFormData({ ...formData, projectId: e.target.value || null })}
          disabled={!!issue} // Can't change project after creation
        >
          <option value="">No project (Uncategorized)</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name} ({project.key})
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Status */}
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as IssueStatus })}
          >
            <option value="backlog">Backlog</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="in_review">In Review</option>
            <option value="done">Done</option>
          </Select>
        </div>

        {/* Priority */}
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select
            id="priority"
            value={formData.priority}
            onChange={(e) =>
              setFormData({ ...formData, priority: e.target.value as IssuePriority })
            }
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Assignee */}
        <div>
          <Label htmlFor="assignee">Assignee</Label>
          <Select
            id="assignee"
            value={formData.assigneeId || ""}
            onChange={(e) =>
              setFormData({ ...formData, assigneeId: e.target.value || null })
            }
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </Select>
        </div>

        {/* Due Date */}
        <div>
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate || ""}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value || null })}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Button
          type="button"
          onClick={onCancel}
          variant="secondary"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : issue ? "Update Issue" : "Create Issue"}
        </Button>
      </div>
    </form>
  );
}
