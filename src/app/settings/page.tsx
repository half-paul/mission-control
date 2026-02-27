"use client";

import { useDiscoverProjects, useRunImportMutation } from "@/hooks/use-import";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Folder } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function SettingsPage() {
  const { data, isLoading, error } = useDiscoverProjects();
  const runImportMutation = useRunImportMutation();

  const handleImport = async (sourcePath: string) => {
    if (confirm("Import this project? This will create issues in Mission Control.")) {
      try {
        await runImportMutation.mutateAsync(sourcePath);
        alert("Import completed successfully!");
      } catch (err) {
        alert(`Import failed: ${(err as Error).message}`);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-zinc-800 border-t-blue-500" />
          <p className="text-sm text-zinc-400">Discovering projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-500">
            Failed to discover projects: {(error as Error).message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-50">Settings</h1>
        <p className="mt-2 text-zinc-400">Import projects and configure system settings</p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="mb-4 text-xl font-semibold text-zinc-50">Import Projects</h2>
          <p className="mb-6 text-sm text-zinc-400">
            Detected project sources from <code className="rounded bg-zinc-800 px-1 py-0.5">/data/projects</code>
          </p>

          {data?.sources && data.sources.length === 0 && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-12 text-center">
              <p className="text-zinc-400">No project sources found</p>
            </div>
          )}

          <div className="space-y-4">
            {data?.sources.map((source) => (
              <div
                key={source.path}
                className="rounded-lg border border-zinc-800 bg-zinc-900 p-6"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Folder className="h-5 w-5 text-blue-500" />
                    <div>
                      <h3 className="font-semibold text-zinc-50">{source.name}</h3>
                      <p className="text-sm text-zinc-500">{source.path}</p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      source.format === "sprint-based"
                        ? "bg-purple-500/10 text-purple-400"
                        : source.format === "session-based"
                        ? "bg-blue-500/10 text-blue-400"
                        : "bg-zinc-700 text-zinc-400"
                    }
                  >
                    {source.format}
                  </Badge>
                </div>

                <div className="mb-4 flex gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4 text-zinc-500" />
                    <span className={source.hasStatusMd ? "text-green-400" : "text-red-400"}>
                      STATUS.md {source.hasStatusMd ? "✓" : "✗"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4 text-zinc-500" />
                    <span className={source.hasAgentMapping ? "text-green-400" : "text-zinc-600"}>
                      AGENT_MAPPING.md {source.hasAgentMapping ? "✓" : "—"}
                    </span>
                  </div>
                </div>

                <div className="mb-4 text-xs text-zinc-500">
                  Last modified:{" "}
                  {formatDistanceToNow(new Date(source.lastModified), { addSuffix: true })}
                </div>

                {source.existingProject && (
                  <div className="mb-4 rounded bg-zinc-800 p-3 text-sm text-zinc-400">
                    Already imported as: <span className="font-medium text-zinc-50">{source.existingProject.name}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled
                  >
                    Preview Import
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleImport(source.path)}
                    disabled={runImportMutation.isPending || !source.hasStatusMd}
                  >
                    {runImportMutation.isPending ? "Importing..." : "Import Now"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
