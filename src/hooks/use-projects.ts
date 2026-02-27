import { useQuery } from "@tanstack/react-query";
import { Project } from "@/types";

async function fetchProjects(): Promise<Project[]> {
  const res = await fetch("/api/v1/projects");
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });
}
