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
  switch (activity.type) {
    case "issue_created":
      return (
        <>
          <span className="font-medium">{activity.actor}</span> created issue{" "}
          <span className="font-medium">{activity.issue}</span>
        </>
      );
    case "status_changed":
      return (
        <>
          <span className="font-medium">{activity.actor}</span> moved{" "}
          <span className="font-medium">{activity.issue}</span> from{" "}
          <Badge variant="secondary" className="mx-1">
            {activity.from}
          </Badge>
          to{" "}
          <Badge variant="secondary" className="mx-1">
            {activity.to}
          </Badge>
        </>
      );
    default:
      return JSON.stringify(activity);
  }
}
