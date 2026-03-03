"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Hash, Calendar, User, Folder } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { IssueStatus, IssuePriority } from "@/types";
import { StatusBadge } from "@/components/issues/status-badge";
import { PriorityIcon } from "@/components/issues/priority-icon";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface SearchResult {
  id: string;
  key: string;
  title: string;
  description: string | null;
  status: IssueStatus;
  priority: IssuePriority;
  projectName: string;
  projectKey: string;
  assigneeName: string | null;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!initialQuery) return;
    performSearch(initialQuery);
  }, [initialQuery]);

  const performSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const response = await apiClient.get<{ data: SearchResult[] }>(`/api/v1/issues/search?q=${encodeURIComponent(q)}&limit=50`);
      setResults(response.data);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-50">Search</h1>
        <p className="mt-2 text-zinc-400">Search for issues across all projects</p>
      </div>

      <form onSubmit={handleSubmit} className="relative max-w-2xl">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search issues, descriptions..."
          className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900/50 pl-12 pr-4 text-zinc-100 outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all"
          autoFocus
        />
      </form>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-800 border-t-blue-500" />
          </div>
        ) : results.length > 0 ? (
          <div className="grid gap-4">
            {results.map((issue) => (
              <Link
                key={issue.id}
                href={`/issues/${issue.id}`}
                className="group flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-900/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2 text-xs font-mono text-zinc-500">
                      <Hash className="h-3 w-3" />
                      {issue.key}
                      <span className="text-zinc-700">•</span>
                      <Folder className="h-3 w-3" />
                      {issue.projectName}
                    </div>
                    <h3 className="truncate text-lg font-semibold text-zinc-50 group-hover:text-blue-400 transition-colors">
                      {issue.title}
                    </h3>
                    {issue.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-zinc-400 leading-relaxed">
                        {issue.description}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <PriorityIcon priority={issue.priority} />
                    <StatusBadge status={issue.status} />
                  </div>
                </div>
                
                <div className="mt-4 flex items-center gap-4 border-t border-zinc-800/50 pt-4 text-xs text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3 w-3" />
                    {issue.assigneeName || "Unassigned"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : query && !loading ? (
          <div className="py-20 text-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20">
            <Search className="mx-auto h-12 w-12 text-zinc-700 mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-zinc-400">No issues found for "{query}"</h3>
            <p className="mt-1 text-sm text-zinc-500">Try different keywords or check for typos.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-800 border-t-blue-500" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
