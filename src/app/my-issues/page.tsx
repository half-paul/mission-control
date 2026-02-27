"use client";

import { useIssues } from "@/hooks/use-issues";
import { IssueTable } from "@/components/issues/issue-table";

export default function MyIssuesPage() {
  // TODO: Filter by current user's assignee ID
  // For now, show all issues (need auth context to get current user)
  const { data: issues, isLoading, error } = useIssues();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-zinc-800 border-t-blue-500" />
          <p className="text-sm text-zinc-400">Loading your issues...</p>
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
      <div>
        <h1 className="text-3xl font-bold text-zinc-50">My Issues</h1>
        <p className="mt-2 text-zinc-400">Issues assigned to you</p>
      </div>

      <IssueTable issues={issues || []} />
    </div>
  );
}
