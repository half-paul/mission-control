import { FolderKanban, AlertCircle, Flame, CheckCircle } from "lucide-react";
import { DashboardData } from "@/types";

interface StatsCardsProps {
  data: DashboardData;
}

export function StatsCards({ data }: StatsCardsProps) {
  const stats = [
    {
      name: "Active Projects",
      value: data.activeProjects.length,
      icon: FolderKanban,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      name: "Overdue Issues",
      value: data.overdueIssues.length,
      icon: AlertCircle,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      name: "Critical Issues",
      value: data.criticalIssues.length,
      icon: Flame,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      name: "My In Progress",
      value: data.myIssues.inProgress,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.name}
            className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-6"
          >
            <div className={`rounded-lg p-3 ${stat.bgColor}`}>
              <Icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">{stat.name}</p>
              <p className="text-2xl font-bold text-zinc-50">{stat.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
