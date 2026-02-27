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
    <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50">
      <table className="w-full">
        <thead className="border-b border-zinc-800 bg-zinc-950">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
              Issue
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
              Priority
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
              Assignee
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
              Project
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
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
              <td className="px-6 py-4">
                <Link
                  href={`/issues/${issue.id}`}
                  className="block hover:text-blue-400"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-zinc-500">
                      {issue.key}
                    </span>
                    <span className="font-medium text-zinc-50">
                      {issue.title}
                    </span>
                  </div>
                </Link>
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={issue.status} />
              </td>
              <td className="px-6 py-4">
                <PriorityIcon priority={issue.priority} />
              </td>
              <td className="px-6 py-4">
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
              <td className="px-6 py-4">
                <span className="text-sm text-zinc-300">
                  {issue.project.name}
                </span>
              </td>
              <td className="px-6 py-4">
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
