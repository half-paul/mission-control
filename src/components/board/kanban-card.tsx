import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Issue } from "@/types";
import { PriorityIcon } from "@/components/issues/priority-icon";
import { GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface KanbanCardProps {
  issue: Issue;
}

export function KanbanCard({ issue }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: issue.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="group rounded-lg border border-zinc-800 bg-zinc-900 p-3 transition-colors hover:border-zinc-700"
      data-testid="kanban-card"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            {...listeners}
            className="cursor-grab touch-none text-zinc-600 hover:text-zinc-400 active:cursor-grabbing"
            aria-label="Drag to move card"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <span className="font-mono text-xs text-zinc-500">{issue.key}</span>
        </div>
        <PriorityIcon priority={issue.priority} />
      </div>

      <h3 className="mb-2 text-sm font-medium text-zinc-50">{issue.title}</h3>

      {issue.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {issue.labels.map((label) => (
            <Badge
              key={label.id}
              variant="secondary"
              className="text-xs"
              style={{
                backgroundColor: `${label.color}20`,
                color: label.color,
              }}
            >
              {label.name}
            </Badge>
          ))}
        </div>
      )}

      {issue.assignee && (
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-50">
            {issue.assignee.name[0]}
          </div>
          <span className="text-xs text-zinc-400">{issue.assignee.name}</span>
        </div>
      )}
    </div>
  );
}
