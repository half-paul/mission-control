import Link from "next/link";
import { Project } from "@/types";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const progress = project.progress || 0;
  
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-all hover:border-zinc-700 hover:bg-zinc-900 shadow-sm hover:shadow-md"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold tracking-wider text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded uppercase">
              {project.key}
            </span>
          </div>
          <h3 className="truncate text-lg font-bold text-zinc-50 group-hover:text-blue-400 transition-colors">
            {project.name}
          </h3>
          {project.description && (
            <p className="mt-2 text-sm text-zinc-400 line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          )}
        </div>
        <Badge
          variant="secondary"
          className={cn(
            "shrink-0 capitalize font-semibold text-[10px] px-2 py-0",
            project.status === "active"
              ? "bg-green-500/10 text-green-500 border-green-500/20"
              : "bg-zinc-800 text-zinc-400 border-zinc-700"
          )}
        >
          {project.status}
        </Badge>
      </div>

      <div className="mt-auto pt-6">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold">
          <span className="text-zinc-500 uppercase tracking-tight">Progress</span>
          <span className="text-zinc-50 font-mono">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full bg-blue-600 transition-all duration-500 group-hover:bg-blue-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-zinc-800 pt-4 text-xs">
        <div className="flex items-center gap-2">
          {project.ownerName ? (
            <div className="flex items-center gap-1.5 text-zinc-400">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-50 ring-1 ring-zinc-700">
                {project.ownerName[0]?.toUpperCase()}
              </div>
              <span className="font-medium truncate max-w-[80px]">{project.ownerName}</span>
            </div>
          ) : (
            <span className="text-zinc-600 italic">No lead</span>
          )}
        </div>
        
        <div className="flex items-center gap-3 text-zinc-500 font-medium">
          <span className="flex items-center gap-1">
            <span className="text-zinc-300 font-bold">{project.totalIssues || 0}</span>
            <span>issues</span>
          </span>
          <span className="text-zinc-700">•</span>
          <span className="flex items-center gap-1 text-[10px] text-zinc-400">
            Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
          </span>
        </div>
      </div>
    </Link>
  );
}
