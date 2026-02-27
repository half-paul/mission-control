import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Issue, CreateIssue, UpdateIssue } from "@/types";

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

  const res = await fetch(`/api/v1/issues?${params}`);
  if (!res.ok) throw new Error("Failed to fetch issues");
  return res.json();
}

async function createIssue(data: CreateIssue): Promise<Issue> {
  const res = await fetch("/api/v1/issues", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create issue");
  return res.json();
}

async function updateIssue({
  id,
  data,
}: {
  id: string;
  data: UpdateIssue;
}): Promise<Issue> {
  const res = await fetch(`/api/v1/issues/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update issue");
  return res.json();
}

async function updateIssueStatus({
  id,
  status,
}: {
  id: string;
  status: string;
}): Promise<Issue> {
  const res = await fetch(`/api/v1/issues/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update issue status");
  return res.json();
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
