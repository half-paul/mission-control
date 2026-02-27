import Link from "next/link";
import { Project } from "@/types";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-lg border border-zinc-800 bg-zinc-900 p-6 transition-colors hover:border-zinc-700"
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-zinc-500">
              {project.key}
            </span>
            <h3 className="text-lg font-semibold text-zinc-50">
              {project.name}
            </h3>
          </div>
          {project.description && (
            <p className="text-sm text-zinc-400 line-clamp-2">
              {project.description}
            </p>
          )}
        </div>
        <Badge
          variant="secondary"
          className={
            project.status === "active"
              ? "bg-green-500/10 text-green-500"
              : "bg-zinc-700 text-zinc-300"
          }
        >
          {project.status}
        </Badge>
      </div>

      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-zinc-400">Progress</span>
          <span className="font-medium text-zinc-50">
            {Math.round(project.progress)}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-zinc-400">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-50">
            {project.owner.name[0]}
          </div>
          <span>{project.owner.name}</span>
        </div>
        <span>
          Updated{" "}
          {formatDistanceToNow(new Date(project.updatedAt), {
            addSuffix: true,
          })}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
        <span>{project.stats.total} issues</span>
        <span>•</span>
        <span>{project.stats.done} completed</span>
        <span>•</span>
        <span>{project.stats.in_progress} in progress</span>
      </div>
    </Link>
  );
}
