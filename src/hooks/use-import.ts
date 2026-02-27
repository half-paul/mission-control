import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProjectSource, ImportPreview } from "@/types";
import { apiClient } from "@/lib/api-client";

async function discoverProjects(): Promise<{ sources: ProjectSource[] }> {
  return apiClient.get<{ sources: ProjectSource[] }>("/api/v1/import/discover");
}

async function previewImport(sourcePath: string): Promise<ImportPreview> {
  return apiClient.post<ImportPreview>("/api/v1/import/preview", { sourcePath });
}

async function runImport(sourcePath: string): Promise<{ runId: string }> {
  return apiClient.post<{ runId: string }>("/api/v1/import/run", { sourcePath });
}

export function useDiscoverProjects() {
  return useQuery({
    queryKey: ["import", "discover"],
    queryFn: discoverProjects,
  });
}

export function usePreviewImportMutation() {
  return useMutation({
    mutationFn: previewImport,
  });
}

export function useRunImportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: runImport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["import"] });
    },
  });
}
