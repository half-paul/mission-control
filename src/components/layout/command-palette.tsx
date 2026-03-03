"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { 
  Search, 
  PlusCircle, 
  FolderPlus, 
  LayoutDashboard, 
  ListTodo, 
  FolderKanban,
  Settings,
  Circle
} from "lucide-react";
import { useUIStore } from "@/hooks/use-ui-store";
import { apiClient } from "@/lib/api-client";
import { IssueStatus, IssuePriority } from "@/types";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  key: string;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  projectName: string;
  projectKey: string;
}

export function CommandPalette() {
  const router = useRouter();
  const { 
    isCommandPaletteOpen, 
    setCommandPaletteOpen, 
    openNewIssueModal, 
    openNewProjectModal 
  } = useUIStore();
  
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (!search) {
      setResults([]);
      return;
    }

    const handler = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await apiClient.get<{ data: SearchResult[] }>(`/api/v1/issues/search?q=${encodeURIComponent(search)}`);
        setResults(response.data);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [search]);

  const runCommand = (command: () => void) => {
    setCommandPaletteOpen(false);
    command();
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-zinc-950/50 backdrop-blur-sm"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div 
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="flex flex-col h-full">
          <div className="flex items-center border-b border-zinc-800 px-4">
            <Search className="mr-3 h-4 w-4 text-zinc-500" />
            <Command.Input
              autoFocus
              placeholder="Search issues, actions..."
              className="flex h-12 w-full bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
              value={search}
              onValueChange={setSearch}
            />
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-800">
            <Command.Empty className="py-6 text-center text-sm text-zinc-500">
              {loading ? "Searching..." : "No results found."}
            </Command.Empty>

            {results.length > 0 && (
              <Command.Group heading="Issues" className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                {results.map((issue) => (
                  <Command.Item
                    key={issue.id}
                    onSelect={() => runCommand(() => router.push(`/issues/${issue.id}`))}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors aria-selected:bg-zinc-800 aria-selected:text-zinc-50"
                  >
                    <span className="font-mono text-xs text-zinc-500">{issue.key}</span>
                    <span className="truncate flex-1">{issue.title}</span>
                    <span className="text-[10px] text-zinc-600">{issue.projectName}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group heading="Actions" className="px-2 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 border-t border-zinc-800/50 mt-2">
              <Command.Item
                onSelect={() => runCommand(() => openNewIssueModal())}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors aria-selected:bg-zinc-800 aria-selected:text-zinc-50"
              >
                <PlusCircle className="h-4 w-4 text-zinc-500" />
                Create New Issue
                <kbd className="ml-auto text-[10px] text-zinc-600 font-sans">C</kbd>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => openNewProjectModal())}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors aria-selected:bg-zinc-800 aria-selected:text-zinc-50"
              >
                <FolderPlus className="h-4 w-4 text-zinc-500" />
                Create New Project
                <kbd className="ml-auto text-[10px] text-zinc-600 font-sans">P</kbd>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Navigation" className="px-2 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 border-t border-zinc-800/50 mt-2">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/"))}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors aria-selected:bg-zinc-800 aria-selected:text-zinc-50"
              >
                <LayoutDashboard className="h-4 w-4 text-zinc-500" />
                Go to Dashboard
                <kbd className="ml-auto text-[10px] text-zinc-600 font-sans">G D</kbd>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/issues"))}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors aria-selected:bg-zinc-800 aria-selected:text-zinc-50"
              >
                <ListTodo className="h-4 w-4 text-zinc-500" />
                Go to All Issues
                <kbd className="ml-auto text-[10px] text-zinc-600 font-sans">G I</kbd>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/board"))}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors aria-selected:bg-zinc-800 aria-selected:text-zinc-50"
              >
                <FolderKanban className="h-4 w-4 text-zinc-500" />
                Go to Board
                <kbd className="ml-auto text-[10px] text-zinc-600 font-sans">G B</kbd>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/settings"))}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors aria-selected:bg-zinc-800 aria-selected:text-zinc-50"
              >
                <Settings className="h-4 w-4 text-zinc-500" />
                Go to Settings
                <kbd className="ml-auto text-[10px] text-zinc-600 font-sans">G S</kbd>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
