import { useQuery } from "@tanstack/react-query";
import { Project } from "@/types";
import { apiClient } from "@/lib/api-client";

async function fetchProjects(): Promise<Project[]> {
  return apiClient.get<Project[]>("/api/v1/projects");
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });
}
