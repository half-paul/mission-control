"use client";

import { useState, useEffect } from "react";
import { Project, CreateProject, UpdateProject } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";

interface ProjectFormProps {
  project?: Project;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

interface Member {
  id: string;
  name: string;
}

export function ProjectForm({ project, onSubmit, onCancel }: ProjectFormProps) {
  const { data: currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: project?.name || "",
    key: project?.key || "",
    description: project?.description || "",
    status: project?.status || "planned",
    ownerId: project?.ownerId || "",
    startDate: project?.startDate || null,
    targetDate: project?.targetDate || null,
  });

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch members
  useEffect(() => {
    apiClient.get<{ data: Member[] }>("/api/v1/members")
      .then((res) => {
        setMembers(res.data);
        // Set default owner to current user if creating new project
        if (!project && currentUser && !formData.ownerId) {
          setFormData((prev) => ({ ...prev, ownerId: currentUser.id }));
        }
      })
      .catch((err) => {
        console.error("Failed to load members:", err);
      });
  }, [project, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError((err as Error).message || "Failed to save project");
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

      <div className="grid gap-4 md:grid-cols-4">
        {/* Key */}
        <div className="md:col-span-1">
          <Label htmlFor="key">
            Key <span className="text-red-500">*</span>
          </Label>
          <Input
            id="key"
            value={formData.key}
            onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase() })}
            placeholder="PRJ"
            required
            maxLength={10}
            disabled={!!project}
          />
        </div>

        {/* Name */}
        <div className="md:col-span-3">
          <Label htmlFor="name">
            Project Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="The big project"
            required
            maxLength={200}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="What is this project about?"
          rows={3}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Status */}
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
          >
            <option value="planned">Planned</option>
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
          </Select>
        </div>

        {/* Owner */}
        <div>
          <Label htmlFor="owner">Lead / Owner</Label>
          <Select
            id="owner"
            value={formData.ownerId}
            onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
            required
          >
            <option value="">Select owner...</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Start Date */}
        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate || ""}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value || null })}
          />
        </div>

        {/* Target Date */}
        <div>
          <Label htmlFor="targetDate">Target Date</Label>
          <Input
            id="targetDate"
            type="date"
            value={formData.targetDate || ""}
            onChange={(e) => setFormData({ ...formData, targetDate: e.target.value || null })}
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
          {loading ? "Saving..." : project ? "Update Project" : "Create Project"}
        </Button>
      </div>
    </form>
  );
}
