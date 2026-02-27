"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { Issue, IssueStatus } from "@/types";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { useUpdateIssueStatusMutation } from "@/hooks/use-issues";

interface KanbanBoardProps {
  issues: Issue[];
}

const columns: Array<{ status: IssueStatus; title: string }> = [
  { status: "backlog", title: "Backlog" },
  { status: "todo", title: "To Do" },
  { status: "in_progress", title: "In Progress" },
  { status: "in_review", title: "In Review" },
  { status: "done", title: "Done" },
];

export function KanbanBoard({ issues }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const updateStatusMutation = useUpdateIssueStatusMutation();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts (prevents accidental drags)
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const issueId = active.id as string;
    const newStatus = over.id as IssueStatus;

    // Optimistic update handled by TanStack Query mutation
    updateStatusMutation.mutate(
      { id: issueId, status: newStatus },
      {
        onError: () => {
          // TanStack Query will automatically rollback on error
          console.error("Failed to update issue status");
        },
      }
    );

    setActiveId(null);
  };

  const activeIssue = activeId ? issues.find((i) => i.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnIssues = issues.filter((i) => i.status === column.status);
          return (
            <KanbanColumn
              key={column.status}
              status={column.status}
              title={column.title}
              issues={columnIssues}
              count={columnIssues.length}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeIssue ? <KanbanCard issue={activeIssue} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
