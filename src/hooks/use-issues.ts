import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Issue, CreateIssue, UpdateIssue } from "@/types";
import { apiClient } from "@/lib/api-client";

interface IssueFilters {
  status?: string[];
  priority?: string[];
  assignee?: string;
  project?: string;
  label?: string[];
  q?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

async function fetchIssues(filters: IssueFilters = {}): Promise<Issue[]> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        params.set(key, value.join(","));
      } else {
        params.set(key, String(value));
      }
    }
  });

  const response = await apiClient.get<{ data: Issue[] }>(`/api/v1/issues?${params}`);
  return response.data;
}

async function createIssue(data: CreateIssue): Promise<Issue> {
  return apiClient.post<Issue>("/api/v1/issues", data);
}

async function updateIssue({
  id,
  data,
}: {
  id: string;
  data: UpdateIssue;
}): Promise<Issue> {
  return apiClient.patch<Issue>(`/api/v1/issues/${id}`, data);
}

async function updateIssueStatus({
  id,
  status,
}: {
  id: string;
  status: string;
}): Promise<Issue> {
  return apiClient.patch<Issue>(`/api/v1/issues/${id}/status`, { status });
}

export function useIssues(filters: IssueFilters = {}) {
  return useQuery({
    queryKey: ["issues", filters],
    queryFn: () => fetchIssues(filters),
  });
}

export function useCreateIssueMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createIssue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateIssueMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateIssue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateIssueStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateIssueStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

async function deleteIssue(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/issues/${id}`);
}

export function useDeleteIssueMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteIssue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

async function fetchIssueActivity(id: string): Promise<any[]> {
  const response = await apiClient.get<{ data: any[] }>(`/api/v1/issues/${id}/activity`);
  return response.data;
}

export function useIssueActivity(id: string) {
  return useQuery({
    queryKey: ["issue-activity", id],
    queryFn: () => fetchIssueActivity(id),
    enabled: !!id,
  });
}
