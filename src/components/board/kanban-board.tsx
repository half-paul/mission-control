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
    
    // Resolve new status from either a Column drop zone or another Issue card
    let newStatus: IssueStatus | undefined;
    const overData = over.data.current;
    
    if (overData?.type === "Column") {
      newStatus = overData.status;
    } else if (overData?.type === "Issue") {
      newStatus = overData.status;
    } else {
      // Fallback for direct drops on column containers if data is missing
      const possibleStatus = over.id as string;
      if (columns.some(c => c.status === possibleStatus)) {
        newStatus = possibleStatus as IssueStatus;
      }
    }

    const activeData = active.data.current;
    const currentStatus = activeData?.status as IssueStatus;

    if (newStatus && newStatus !== currentStatus) {
      updateStatusMutation.mutate(
        { id: issueId, status: newStatus },
        {
          onError: () => {
            console.error("Failed to update issue status");
          },
        }
      );
    }

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
