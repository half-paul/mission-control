"use client";

import { useProjects } from "@/hooks/use-projects";
import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ProjectsPage() {
  const { data: projects, isLoading, error } = useProjects();

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
        <div className="text-center">
          <p className="text-sm text-red-500">
            Failed to load projects: {(error as Error).message}
          </p>
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
        <Button>
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
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <p className="text-zinc-400">No projects yet</p>
        </div>
      )}
    </div>
  );
}
