import { useQuery } from "@tanstack/react-query";
import { DashboardData } from "@/types";

async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch("/api/v1/dashboard");
  if (!res.ok) throw new Error("Failed to fetch dashboard data");
  return res.json();
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });
}
