"use client";

import Link from "next/link";
import { Issue } from "@/types";
import { StatusBadge } from "./status-badge";
import { PriorityIcon } from "./priority-icon";
import { formatDistanceToNow } from "date-fns";

interface IssueTableProps {
  issues: Issue[];
}

export function IssueTable({ issues }: IssueTableProps) {
  if (issues.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-12 text-center">
        <p className="text-zinc-400">No issues found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/50">
      <table className="w-full min-w-[800px] md:min-w-full">
        <thead className="border-b border-zinc-800 bg-zinc-950">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
              Issue
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
              Priority
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400 md:table-cell">
              Assignee
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400 lg:table-cell">
              Project
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400 sm:table-cell">
              Updated
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {issues.map((issue) => (
            <tr
              key={issue.id}
              className="transition-colors hover:bg-zinc-800/50"
            >
              <td className="px-4 py-4 max-w-[200px] md:max-w-none">
                <Link
                  href={`/issues/${issue.id}`}
                  className="block hover:text-blue-400"
                >
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-2">
                    <span className="font-mono text-[10px] text-zinc-500 md:text-xs">
                      {issue.key}
                    </span>
                    <span className="truncate font-medium text-zinc-50">
                      {issue.title}
                    </span>
                  </div>
                </Link>
              </td>
              <td className="px-4 py-4">
                <StatusBadge status={issue.status} />
              </td>
              <td className="px-4 py-4">
                <PriorityIcon priority={issue.priority} />
              </td>
              <td className="hidden px-4 py-4 md:table-cell">
                {issue.assignee ? (
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-50">
                      {issue.assignee.name[0]}
                    </div>
                    <span className="text-sm text-zinc-300">
                      {issue.assignee.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-zinc-500">Unassigned</span>
                )}
              </td>
              <td className="hidden px-4 py-4 lg:table-cell">
                <span className="text-sm text-zinc-300">
                  {issue.project.name}
                </span>
              </td>
              <td className="hidden px-4 py-4 sm:table-cell">
                <span className="text-xs text-zinc-400">
                  {formatDistanceToNow(new Date(issue.updatedAt), {
                    addSuffix: true,
                  })}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
