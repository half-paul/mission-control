"use client";

import { useState, useEffect } from "react";

interface Agent {
  id: string;
  name: string;
  role: string;
  emoji: string;
  lastHeartbeat: string | null;
  nextCheckin: string | null;
  tokensLast24h: number;
}

type AgentStatus = "active" | "delayed" | "offline";

interface AgentStatsProps {
  agents?: Agent[];
}

const ACTIVE_THRESHOLD_MS = 35 * 60 * 1000;
const DELAYED_THRESHOLD_MS = 60 * 60 * 1000;

function getAgentStatus(lastHeartbeat: string | null): AgentStatus {
  if (!lastHeartbeat) return "offline";
  const elapsed = Date.now() - new Date(lastHeartbeat).getTime();
  if (elapsed < ACTIVE_THRESHOLD_MS) return "active";
  if (elapsed < DELAYED_THRESHOLD_MS) return "delayed";
  return "offline";
}

const statusConfig: Record<AgentStatus, { dot: string; badge: string; label: string }> = {
  active: { dot: "bg-green-500", badge: "bg-green-500/10 text-green-400", label: "Active" },
  delayed: { dot: "bg-yellow-500", badge: "bg-yellow-500/10 text-yellow-400", label: "Delayed" },
  offline: { dot: "bg-red-500", badge: "bg-red-500/10 text-red-400", label: "Offline" },
};

const mockAgents: Agent[] = [
  { id: "main", name: "Paul", role: "Admin", emoji: "👤", lastHeartbeat: new Date(Date.now() - 5 * 60 * 1000).toISOString(), nextCheckin: new Date(Date.now() + 25 * 60 * 1000).toISOString(), tokensLast24h: 45230 },
  { id: "bruce", name: "Bruce", role: "PM", emoji: "🦞", lastHeartbeat: new Date(Date.now() - 12 * 60 * 1000).toISOString(), nextCheckin: new Date(Date.now() + 18 * 60 * 1000).toISOString(), tokensLast24h: 62100 },
  { id: "david", name: "David", role: "Architect", emoji: "🏗️", lastHeartbeat: new Date(Date.now() - 40 * 60 * 1000).toISOString(), nextCheckin: new Date(Date.now() - 10 * 60 * 1000).toISOString(), tokensLast24h: 28400 },
  { id: "logan", name: "Logan", role: "Backend Dev", emoji: "👨‍💻", lastHeartbeat: new Date(Date.now() - 8 * 60 * 1000).toISOString(), nextCheckin: new Date(Date.now() + 22 * 60 * 1000).toISOString(), tokensLast24h: 38900 },
  { id: "alex", name: "Alex", role: "Frontend Dev", emoji: "⚛️", lastHeartbeat: new Date(Date.now() - 2 * 60 * 1000).toISOString(), nextCheckin: new Date(Date.now() + 28 * 60 * 1000).toISOString(), tokensLast24h: 32100 },
  { id: "rex", name: "Rex", role: "Code Reviewer", emoji: "🔍", lastHeartbeat: new Date(Date.now() - 90 * 60 * 1000).toISOString(), nextCheckin: null, tokensLast24h: 12450 },
  { id: "tom", name: "Tom", role: "QA Engineer", emoji: "⚙️", lastHeartbeat: new Date(Date.now() - 20 * 60 * 1000).toISOString(), nextCheckin: new Date(Date.now() + 10 * 60 * 1000).toISOString(), tokensLast24h: 19800 },
  { id: "dana", name: "Dana", role: "DB Engineer", emoji: "🗄️", lastHeartbeat: new Date(Date.now() - 120 * 60 * 1000).toISOString(), nextCheckin: null, tokensLast24h: 8200 },
];

function CountdownTimer({ targetTime }: { targetTime: string | null }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!targetTime) { setTimeLeft("—"); return; }
    const update = () => {
      const diff = new Date(targetTime).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Overdue"); return; }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      if (mins >= 60) {
        setTimeLeft(`${Math.floor(mins / 60)}h ${mins % 60}m`);
      } else {
        setTimeLeft(`${mins}:${secs.toString().padStart(2, "0")}`);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  return <span>{timeLeft}</span>;
}

function formatRelativeTime(isoDate: string | null): string {
  if (!isoDate) return "Never";
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
  return tokens.toString();
}

export function AgentStats({ agents }: AgentStatsProps) {
  const displayAgents = agents && agents.length > 0 ? agents : mockAgents;

  const activeCount = displayAgents.filter((a) => getAgentStatus(a.lastHeartbeat) === "active").length;
  const delayedCount = displayAgents.filter((a) => getAgentStatus(a.lastHeartbeat) === "delayed").length;
  const offlineCount = displayAgents.filter((a) => getAgentStatus(a.lastHeartbeat) === "offline").length;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-50">Agent Status</h2>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-zinc-400">{activeCount}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-yellow-500" />
            <span className="text-zinc-400">{delayedCount}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-zinc-400">{offlineCount}</span>
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {displayAgents.map((agent) => {
          const status = getAgentStatus(agent.lastHeartbeat);
          const config = statusConfig[status];
          return (
            <div key={agent.id} className="rounded-md border border-zinc-800 bg-zinc-950/50 p-3" data-testid={`agent-card-${agent.id}`}>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${config.dot}`} aria-label={`Status: ${config.label}`} />
                  <span className="text-sm" aria-hidden="true">{agent.emoji}</span>
                  <span className="text-sm font-medium text-zinc-100">{agent.name}</span>
                </div>
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${config.badge}`}>{config.label}</span>
              </div>
              <div className="mb-2 text-xs text-zinc-500">{agent.role}</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Last seen</span>
                  <span className="font-medium text-zinc-300">{formatRelativeTime(agent.lastHeartbeat)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Next check-in</span>
                  <span className="font-mono font-medium text-zinc-300"><CountdownTimer targetTime={agent.nextCheckin} /></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Tokens (24h)</span>
                  <span className="font-medium text-zinc-300">{formatTokens(agent.tokensLast24h)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {displayAgents.length === 0 && (
        <div className="py-8 text-center text-sm text-zinc-500">No agents configured</div>
      )}
    </div>
  );
}
