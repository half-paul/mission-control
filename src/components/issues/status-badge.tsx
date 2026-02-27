import { Badge } from "@/components/ui/badge";
import { IssueStatus } from "@/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: IssueStatus;
  className?: string;
}

const statusConfig = {
  backlog: { label: "Backlog", color: "bg-zinc-700 text-zinc-300" },
  todo: { label: "To Do", color: "bg-blue-600 text-blue-100" },
  in_progress: { label: "In Progress", color: "bg-amber-600 text-amber-100" },
  in_review: { label: "In Review", color: "bg-purple-600 text-purple-100" },
  done: { label: "Done", color: "bg-green-600 text-green-100" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      className={cn(config.color, className)}
      aria-label={`Status: ${config.label}`}
    >
      {config.label}
    </Badge>
  );
}
