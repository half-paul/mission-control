"use client";

import { useState } from "react";
import { useIssues } from "@/hooks/use-issues";
import { IssueTable } from "@/components/issues/issue-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useUIStore } from "@/hooks/use-ui-store";
import { IssueFilterBar } from "@/components/issues/issue-filter-bar";
import { IssueFilter } from "@/types";

export default function IssuesPage() {
  const [filters, setFilters] = useState<IssueFilter>({});

  const { data: issues, isLoading, error } = useIssues(filters);

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

      <IssueFilterBar filters={filters} onFiltersChange={setFilters} />

      <IssueTable issues={issues || []} />
    </div>
  );
}
