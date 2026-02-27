import Link from "next/link";
import { DashboardData } from "@/types";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectListProps {
  projects: DashboardData["activeProjects"];
}

export function ProjectList({ projects }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-50">
          Active Projects
        </h2>
        <p className="text-sm text-zinc-400">No active projects</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-50">Active Projects</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/projects">
            View all
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="space-y-4">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="block rounded-lg border border-zinc-800 bg-zinc-950 p-4 transition-colors hover:border-zinc-700"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-medium text-zinc-50">{project.name}</h3>
              <span className="text-sm text-zinc-400">
                {Math.round(project.progress)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
