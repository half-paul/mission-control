import { useQuery } from "@tanstack/react-query";
import { Project } from "@/types";
import { apiClient } from "@/lib/api-client";

async function fetchProjects(): Promise<Project[]> {
  const response = await apiClient.get<{ data: Project[] }>("/api/v1/projects");
  return response.data;
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });
}
