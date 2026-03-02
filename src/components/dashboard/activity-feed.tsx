"use client";

import { formatDistanceToNow } from "date-fns";
import { DashboardData } from "@/types";
import { Badge } from "@/components/ui/badge";

interface ActivityFeedProps {
  activities: DashboardData["recentActivity"];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-50">
          Recent Activity
        </h2>
        <p className="text-sm text-zinc-400">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
      <h2 className="mb-4 text-lg font-semibold text-zinc-50">
        Recent Activity
      </h2>
      <div className="space-y-4">
        {activities.map((activity, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className="mt-0.5 h-2 w-2 rounded-full bg-blue-500" />
            <div className="flex-1">
              <p className="text-sm text-zinc-50">
                {getActivityMessage(activity)}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {formatDistanceToNow(new Date(activity.timestamp), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getActivityMessage(activity: DashboardData["recentActivity"][0]) {
  const actor = <span className="font-semibold text-zinc-200">{activity.actor}</span>;
  const issueKey = activity.issue && (
    <span className="font-medium text-blue-400">[{activity.issue}]</span>
  );
  const title = activity.title && (
    <span className="font-medium italic text-zinc-300">"{activity.title}"</span>
  );
  const name = activity.name && (
    <span className="font-medium text-zinc-200">{activity.name}</span>
  );

  switch (activity.type) {
    case "issue_created":
      return (
        <>
          {actor} created issue {issueKey} {title}
        </>
      );
    case "issue_status_changed":
      return (
        <>
          {actor} moved {issueKey} from{" "}
          <Badge variant="secondary" className="mx-1 capitalize">
            {activity.from?.replace("_", " ")}
          </Badge>
          to{" "}
          <Badge variant="secondary" className="mx-1 capitalize bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/20">
            {activity.to?.replace("_", " ")}
          </Badge>
        </>
      );
    case "issue_updated":
      return (
        <>
          {actor} updated issue {issueKey}
        </>
      );
    case "issue_deleted":
      return (
        <>
          {actor} deleted issue {issueKey}
        </>
      );
    case "comment_created":
      return (
        <>
          {actor} commented on {issueKey}
        </>
      );
    case "comment_updated":
      return (
        <>
          {actor} updated a comment on {issueKey}
        </>
      );
    case "comment_deleted":
      return (
        <>
          {actor} deleted a comment on {issueKey}
        </>
      );
    case "project_created":
      return (
        <>
          {actor} created project {name}
        </>
      );
    case "project_updated":
      return (
        <>
          {actor} updated project {name}
        </>
      );
    case "project_deleted":
      return (
        <>
          {actor} deleted project {name}
        </>
      );
    case "label_created":
      return (
        <>
          {actor} created label <span className="font-medium">{activity.label}</span>
        </>
      );
    case "label_updated":
      return (
        <>
          {actor} updated label <span className="font-medium">{activity.label}</span>
        </>
      );
    case "label_deleted":
      return (
        <>
          {actor} deleted label <span className="font-medium">{activity.label}</span>
        </>
      );
    case "member_created":
      return (
        <>
          {actor} added new member {name}
        </>
      );
    case "member_updated":
      return (
        <>
          {actor} updated member {name}
        </>
      );
    case "member_deleted":
      return (
        <>
          {actor} removed member {name}
        </>
      );
    case "import_completed":
      return (
        <>
          Import completed for project {name}
        </>
      );
    default:
      return (
        <>
          <span className="font-medium">{activity.actor}</span>: {activity.type}
        </>
      );
  }
}
