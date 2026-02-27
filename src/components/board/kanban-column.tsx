import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Issue, IssueStatus } from "@/types";
import { KanbanCard } from "./kanban-card";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  status: IssueStatus;
  title: string;
  issues: Issue[];
  count: number;
}

export function KanbanColumn({ status, title, issues, count }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div className="flex min-w-[280px] flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-50">
          {title}
          <span className="ml-2 text-zinc-500">({count})</span>
        </h2>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2 rounded-lg border-2 border-dashed p-2 transition-colors",
          isOver
            ? "border-blue-500 bg-blue-500/10"
            : "border-transparent bg-zinc-950"
        )}
      >
        <SortableContext items={issues.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {issues.map((issue) => (
            <KanbanCard key={issue.id} issue={issue} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
