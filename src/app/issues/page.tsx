"use client";

import { useIssues } from "@/hooks/use-issues";
import { IssueTable } from "@/components/issues/issue-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function IssuesPage() {
  const { data: issues, isLoading, error } = useIssues();

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
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Issue
        </Button>
      </div>

      <IssueTable issues={issues || []} />
    </div>
  );
}
