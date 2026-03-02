"use client";

import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useIssueActivity } from "@/hooks/use-issues";

interface IssueActivityProps {
  issueId: string;
}

export function IssueActivity({ issueId }: IssueActivityProps) {
  const { data: activities, isLoading, error } = useIssueActivity(issueId);

  if (isLoading) {
    return (
      <div className="py-4 text-center">
        <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-zinc-800 border-t-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 text-center text-sm text-red-500">
        Failed to load activity
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <p className="text-sm text-zinc-500">No activity yet</p>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-medium text-zinc-400">
            {activity.actorName?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1">
            <p className="text-sm text-zinc-300">
              {getActivityMessage(activity)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {formatDistanceToNow(new Date(activity.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function getActivityMessage(activity: any) {
  const { eventType, actorName, metadata } = activity;
  const actor = <span className="font-medium text-zinc-50">{actorName || "Unknown"}</span>;

  switch (eventType) {
    case "issue_created":
      return (
        <>
          {actor} created this issue
        </>
      );
    case "issue_updated":
      const changes = metadata?.changes;
      if (Array.isArray(changes) && changes.length > 0) {
        return (
          <>
            {actor} updated {changes.join(", ")}
          </>
        );
      }
      return (
        <>
          {actor} updated the issue
        </>
      );
    case "issue_status_changed":
      return (
        <>
          {actor} changed status from{" "}
          <Badge variant="secondary" className="mx-1 capitalize">
            {(metadata?.oldStatus || "none").replace("_", " ")}
          </Badge>
          to{" "}
          <Badge variant="secondary" className="mx-1 capitalize">
            {(metadata?.newStatus || "none").replace("_", " ")}
          </Badge>
        </>
      );
    case "comment_created":
      return (
        <>
          {actor} added a comment
        </>
      );
    default:
      return (
        <>
          {actor} performed {eventType.replace(/_/g, " ")}
        </>
      );
  }
}
