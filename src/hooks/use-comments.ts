import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface Comment {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  author: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

async function fetchComments(issueId: string): Promise<Comment[]> {
  const response = await apiClient.get<{ data: Comment[] }>(`/api/v1/issues/${issueId}/comments`);
  return response.data;
}

async function createComment({ issueId, body }: { issueId: string; body: string }): Promise<Comment> {
  return apiClient.post<Comment>(`/api/v1/issues/${issueId}/comments`, { body });
}

async function updateComment({ id, body }: { id: string; body: string }): Promise<Comment> {
  return apiClient.patch<Comment>(`/api/v1/comments/${id}`, { body });
}

async function deleteComment(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/comments/${id}`);
}

export function useComments(issueId: string) {
  return useQuery({
    queryKey: ["comments", issueId],
    queryFn: () => fetchComments(issueId),
    enabled: !!issueId,
  });
}

export function useCreateCommentMutation(issueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", issueId] });
      queryClient.invalidateQueries({ queryKey: ["issue-activity", issueId] });
    },
  });
}

export function useUpdateCommentMutation(issueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", issueId] });
    },
  });
}

export function useDeleteCommentMutation(issueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", issueId] });
      queryClient.invalidateQueries({ queryKey: ["issue-activity", issueId] });
    },
  });
}
