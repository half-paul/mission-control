import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProjectSource, ImportPreview } from "@/types";

async function discoverProjects(): Promise<{ sources: ProjectSource[] }> {
  const res = await fetch("/api/v1/import/discover");
  if (!res.ok) throw new Error("Failed to discover projects");
  return res.json();
}

async function previewImport(sourcePath: string): Promise<ImportPreview> {
  const res = await fetch("/api/v1/import/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sourcePath }),
  });
  if (!res.ok) throw new Error("Failed to preview import");
  return res.json();
}

async function runImport(sourcePath: string): Promise<{ runId: string }> {
  const res = await fetch("/api/v1/import/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sourcePath }),
  });
  if (!res.ok) throw new Error("Failed to run import");
  return res.json();
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
