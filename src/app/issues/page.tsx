"use client";

import { useState } from "react";
import { useIssues } from "@/hooks/use-issues";
import { IssueTable } from "@/components/issues/issue-table";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Plus, Filter } from "lucide-react";
import { useUIStore } from "@/hooks/use-ui-store";

export default function IssuesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  
  const { data: issues, isLoading, error } = useIssues({
    status: statusFilter !== "all" ? [statusFilter] : undefined,
    priority: priorityFilter !== "all" ? [priorityFilter] : undefined,
  });

  const { openNewIssueModal } = useUIStore();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-zinc-800 border-t-blue-500" />
          <p className="text-sm text-zinc-400">Loading issues...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-500">
            Failed to load issues: {(error as Error).message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-50">All Issues</h1>
          <p className="mt-2 text-zinc-400">
            Manage and track all issues across projects
          </p>
        </div>
        <Button onClick={openNewIssueModal} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          New Issue
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-400">Filters:</span>
        </div>
        
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-xs text-zinc-500">Status</label>
          <Select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 py-0 text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="backlog">Backlog</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="in_review">In Review</option>
            <option value="done">Done</option>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="priority-filter" className="text-xs text-zinc-500">Priority</label>
          <Select
            id="priority-filter"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-8 py-0 text-xs"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </Select>
        </div>

        {(statusFilter !== "all" || priorityFilter !== "all") && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setStatusFilter("all");
              priorityFilter !== "all" && setPriorityFilter("all");
            }}
            className="h-8 text-xs text-zinc-500 hover:text-zinc-300"
          >
            Clear Filters
          </Button>
        )}
      </div>

      <IssueTable issues={issues || []} />
    </div>
  );
}
