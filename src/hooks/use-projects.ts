import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Project, CreateProject, UpdateProject } from "@/types";
import { apiClient } from "@/lib/api-client";

async function fetchProjects(): Promise<Project[]> {
  const response = await apiClient.get<{ data: Project[] }>("/api/v1/projects");
  return response.data;
}

async function fetchProject(id: string): Promise<Project> {
  return apiClient.get<Project>(`/api/v1/projects/${id}`);
}

async function fetchProjectStats(id: string): Promise<any> {
  return apiClient.get<any>(`/api/v1/projects/${id}/stats`);
}

async function createProject(data: CreateProject): Promise<Project> {
  return apiClient.post<Project>("/api/v1/projects", data);
}

async function updateProject({
  id,
  data,
}: {
  id: string;
  data: UpdateProject;
}): Promise<Project> {
  return apiClient.patch<Project>(`/api/v1/projects/${id}`, data);
}

async function deleteProject(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/projects/${id}`);
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => fetchProject(id),
    enabled: !!id,
  });
}

export function useProjectStats(id: string) {
  return useQuery({
    queryKey: ["project-stats", id],
    queryFn: () => fetchProjectStats(id),
    enabled: !!id,
  });
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProject,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", data.id] });
    },
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
