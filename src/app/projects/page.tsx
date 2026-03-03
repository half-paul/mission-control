"use client";

import { useProjects } from "@/hooks/use-projects";
import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban } from "lucide-react";
import { useUIStore } from "@/hooks/use-ui-store";

export default function ProjectsPage() {
  const { data: projects, isLoading, error } = useProjects();
  const { openNewProjectModal } = useUIStore();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-zinc-800 border-t-blue-500" />
          <p className="text-sm text-zinc-400">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-lg border border-red-800 bg-red-950/50 p-6 text-center">
          <p className="mb-2 text-lg font-semibold text-red-400">
            Failed to load projects
          </p>
          <p className="text-sm text-red-500">
            {(error as Error)?.message || 'An unknown error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-50">Projects</h1>
          <p className="mt-2 text-zinc-400">
            Manage and track your development projects
          </p>
        </div>
        <Button onClick={openNewProjectModal}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects?.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {projects?.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 py-20 text-center">
          <div className="mb-4 rounded-full bg-zinc-900 p-4 ring-1 ring-zinc-800">
            <FolderKanban className="h-8 w-8 text-zinc-600" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-300">No projects yet</h3>
          <p className="mt-1 text-sm text-zinc-500 max-w-xs mx-auto">
            Get started by creating your first project to track issues and progress.
          </p>
          <Button onClick={openNewProjectModal} variant="outline" className="mt-6">
            <Plus className="mr-2 h-4 w-4" />
            Create Project
          </Button>
        </div>
      )}
    </div>
  );
}
