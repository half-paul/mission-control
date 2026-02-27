import { useQuery } from "@tanstack/react-query";
import { DashboardData } from "@/types";
import { apiClient } from "@/lib/api-client";

async function fetchDashboard(): Promise<DashboardData> {
  return apiClient.get<DashboardData>("/api/v1/dashboard");
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });
}
