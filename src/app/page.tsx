"use client";

import { useDashboard } from "@/hooks/use-dashboard";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ProjectList } from "@/components/dashboard/project-list";

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-zinc-800 border-t-blue-500" />
          <p className="text-sm text-zinc-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-500">
            Failed to load dashboard: {(error as Error).message}
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-50">Dashboard</h1>
        <p className="mt-2 text-zinc-400">
          Overview of your projects and tasks
        </p>
      </div>

      <StatsCards data={data} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ProjectList projects={data.activeProjects} />
        <ActivityFeed activities={data.recentActivity} />
      </div>
    </div>
  );
}
