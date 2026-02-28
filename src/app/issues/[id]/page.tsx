"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Issue } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogBody } from "@/components/ui/dialog";
import { IssueForm, IssueFormData } from "@/components/issues/issue-form";
import { useUpdateIssueMutation } from "@/hooks/use-issues";
import { PriorityIcon } from "@/components/issues/priority-icon";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { ArrowLeft, Edit } from "lucide-react";

async function fetchIssue(id: string): Promise<Issue> {
  return apiClient.get<Issue>(`/api/v1/issues/${id}`);
}

export default function IssueDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { data: issue, isLoading, error } = useQuery({
    queryKey: ["issue", id],
    queryFn: () => fetchIssue(id),
  });

  const updateIssueMutation = useUpdateIssueMutation();

  const handleUpdate = async (data: IssueFormData) => {
    await updateIssueMutation.mutateAsync({ id, data });
    setShowEditDialog(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-zinc-800 border-t-blue-500" />
          <p className="text-sm text-zinc-400">Loading issue...</p>
        </div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-lg border border-red-800 bg-red-950/50 p-6 text-center">
          <p className="mb-2 text-lg font-semibold text-red-400">
            Failed to load issue
          </p>
          <p className="text-sm text-red-500">
            {(error as Error)?.message || "Issue not found"}
          </p>
          <Link
            href="/issues"
            className="mt-4 inline-block rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          >
            Back to Issues
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Link
              href="/issues"
              className="mt-1 text-zinc-400 hover:text-zinc-50"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="mb-2 flex items-center gap-3">
                <span className="font-mono text-sm text-zinc-500">
                  {issue.key}
                </span>
                <Badge
                  variant="secondary"
                  className={
                    issue.status === "done"
                      ? "bg-green-500/10 text-green-500"
                      : issue.status === "in_progress"
                      ? "bg-blue-500/10 text-blue-500"
                      : "bg-zinc-700 text-zinc-300"
                  }
                >
                  {issue.status.replace("_", " ")}
                </Badge>
                <div className="flex items-center gap-1">
                  <PriorityIcon priority={issue.priority} />
                  <span className="text-sm capitalize text-zinc-400">
                    {issue.priority}
                  </span>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-zinc-50">{issue.title}</h1>
            </div>
          </div>
          <Button onClick={() => setShowEditDialog(true)} variant="secondary">
            <Edit className="mr-2 h-4 w-4" />
            Edit Issue
          </Button>
        </div>

      {/* Metadata */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Project
          </div>
          <Link
            href={`/projects/${issue.project.id}`}
            className="font-medium text-blue-400 hover:text-blue-300"
          >
            {issue.project.name}
          </Link>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Assignee
          </div>
          {issue.assignee ? (
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-50">
                {issue.assignee.name?.[0]?.toUpperCase() || "?"}
              </div>
              <span className="font-medium text-zinc-50">
                {issue.assignee.name}
              </span>
            </div>
          ) : (
            <span className="text-zinc-500">Unassigned</span>
          )}
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Created
          </div>
          <div className="font-medium text-zinc-50">
            {formatDistanceToNow(new Date(issue.createdAt), {
              addSuffix: true,
            })}
          </div>
          {issue.updatedAt !== issue.createdAt && (
            <div className="text-xs text-zinc-500">
              Updated{" "}
              {formatDistanceToNow(new Date(issue.updatedAt), {
                addSuffix: true,
              })}
            </div>
          )}
        </div>
      </div>

      {/* Labels */}
      {issue.labels && issue.labels.length > 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Labels
          </div>
          <div className="flex flex-wrap gap-2">
            {issue.labels.map((label) => (
              <Badge
                key={label.id}
                variant="secondary"
                style={{
                  backgroundColor: `${label.color}20`,
                  color: label.color,
                }}
              >
                {label.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="mb-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
          Description
        </div>
        {issue.description ? (
          <div className="prose prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-zinc-300">
              {issue.description}
            </p>
          </div>
        ) : (
          <p className="text-zinc-500">No description provided</p>
        )}
      </div>

      {/* Due Date */}
      {issue.dueDate && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Due Date
          </div>
          <div className="font-medium text-zinc-50">
            {new Date(issue.dueDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      )}

      {/* Activity/Comments (placeholder for future implementation) */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="mb-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
          Activity
        </div>
        <p className="text-sm text-zinc-500">No activity yet</p>
      </div>
    </div>

    <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
      <DialogHeader onClose={() => setShowEditDialog(false)}>
        <DialogTitle>Edit Issue</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <IssueForm
          issue={issue}
          onSubmit={handleUpdate}
          onCancel={() => setShowEditDialog(false)}
        />
      </DialogBody>
    </Dialog>
  </>
  );
}
