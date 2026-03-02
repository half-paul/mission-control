"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProject, useProjectStats, useDeleteProjectMutation } from "@/hooks/use-projects";
import { useIssues } from "@/hooks/use-issues";
import { IssueTable } from "@/components/issues/issue-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ArrowLeft, Edit, Trash2, Calendar, User, MoreHorizontal, LayoutGrid, ListTodo, Settings } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<"issues" | "settings">("issues");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: project, isLoading: projectLoading, error: projectError } = useProject(id);
  const { data: stats, isLoading: statsLoading } = useProjectStats(id);
  const { data: issues, isLoading: issuesLoading } = useIssues({ project: id });
  
  const deleteProjectMutation = useDeleteProjectMutation();

  const handleDelete = async () => {
    await deleteProjectMutation.mutateAsync(id);
    router.push("/projects");
  };

  if (projectLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-zinc-800 border-t-blue-500" />
          <p className="text-sm text-zinc-400">Loading project...</p>
        </div>
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-lg border border-red-800 bg-red-950/50 p-6 text-center">
          <p className="mb-2 text-lg font-semibold text-red-400">Failed to load project</p>
          <p className="text-sm text-red-500">{(projectError as Error)?.message || "Project not found"}</p>
          <Link href="/projects" className="mt-4 inline-block rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Link href="/projects" className="mt-1 text-zinc-400 hover:text-zinc-50">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className="font-mono text-sm text-zinc-500">{project.key}</span>
              <Badge 
                variant="secondary" 
                className={cn(
                  project.status === "active" ? "bg-green-500/10 text-green-500" : "bg-zinc-700 text-zinc-300"
                )}
              >
                {project.status}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold text-zinc-50">{project.name}</h1>
            {project.description && (
              <p className="mt-2 max-w-2xl text-zinc-400">{project.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit Project
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-400">Progress</span>
            <span className="text-sm font-bold text-zinc-50">{stats?.progress || 0}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div 
              className="h-full bg-blue-500 transition-all duration-500" 
              style={{ width: `${stats?.progress || 0}%` }}
            />
          </div>
          <div className="mt-3 text-xs text-zinc-500">
            {stats?.done || 0} of {stats?.total || 0} issues completed
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="text-sm font-medium text-zinc-400">In Progress</div>
          <div className="mt-2 text-2xl font-bold text-zinc-50">{stats?.in_progress || 0}</div>
          <div className="mt-1 text-xs text-zinc-500">Active tasks</div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="text-sm font-medium text-zinc-400">Team</div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-50 uppercase">
              {project.ownerName?.[0] || "U"}
            </div>
            <span className="text-sm font-medium text-zinc-50">{project.ownerName || "No Owner"}</span>
          </div>
          <div className="mt-1 text-xs text-zinc-500">Project Lead</div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="text-sm font-medium text-zinc-400">Timeline</div>
          <div className="mt-2 flex items-center gap-2 text-sm font-medium text-zinc-50">
            <Calendar className="h-4 w-4 text-zinc-500" />
            {project.targetDate ? new Date(project.targetDate).toLocaleDateString() : "No target date"}
          </div>
          <div className="mt-1 text-xs text-zinc-500">Target completion</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-800">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab("issues")}
            className={cn(
              "flex items-center gap-2 border-b-2 py-4 text-sm font-medium transition-colors",
              activeTab === "issues" 
                ? "border-blue-500 text-blue-500" 
                : "border-transparent text-zinc-400 hover:text-zinc-50"
            )}
          >
            <ListTodo className="h-4 w-4" />
            Issues
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 py-0 text-[10px]">
              {stats?.total || 0}
            </Badge>
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={cn(
              "flex items-center gap-2 border-b-2 py-4 text-sm font-medium transition-colors",
              activeTab === "settings" 
                ? "border-blue-500 text-blue-500" 
                : "border-transparent text-zinc-400 hover:text-zinc-50"
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "issues" ? (
          <div className="space-y-4">
            {issuesLoading ? (
              <div className="py-12 text-center text-sm text-zinc-500">Loading issues...</div>
            ) : issues && issues.length > 0 ? (
              <IssueTable issues={issues} />
            ) : (
              <div className="rounded-lg border border-dashed border-zinc-800 py-12 text-center">
                <ListTodo className="mx-auto mb-4 h-8 w-8 text-zinc-600" />
                <h3 className="text-sm font-medium text-zinc-300">No issues found</h3>
                <p className="mt-1 text-xs text-zinc-500">This project doesn't have any issues yet.</p>
                <div className="mt-4">
                  <Button size="sm">Create First Issue</Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
            <h3 className="mb-4 text-lg font-medium text-zinc-50">Project Settings</h3>
            <p className="text-sm text-zinc-400">Settings and configuration for this project will be available here.</p>
            {/* Add more settings components here */}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Project"
        description={`Are you sure you want to delete project ${project.key}: "${project.name}"? This will not delete the issues, but they will no longer be associated with this project. This action cannot be undone.`}
        confirmText="Delete Project"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleteProjectMutation.isPending}
      />
    </div>
  );
}
