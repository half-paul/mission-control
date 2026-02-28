"use client";

interface Agent {
  id: string;
  name: string;
  lastHeartbeat: string | null;
  nextCheckin: string | null;
  tokensLast24h: number;
  isActive: boolean;
}

interface AgentStatsProps {
  agents?: Agent[];
}

export function AgentStats({ agents = [] }: AgentStatsProps) {
  // Mock data for now - will be replaced with real API call
  const mockAgents: Agent[] = [
    {
      id: "agent-paul",
      name: "Paul's Agent",
      lastHeartbeat: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      nextCheckin: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
      tokensLast24h: 45230,
      isActive: true,
    },
    {
      id: "agent-alex",
      name: "Alex (Frontend)",
      lastHeartbeat: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      nextCheckin: new Date(Date.now() + 28 * 60 * 1000).toISOString(),
      tokensLast24h: 32100,
      isActive: true,
    },
    {
      id: "agent-logan",
      name: "Logan (Backend)",
      lastHeartbeat: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      nextCheckin: null,
      tokensLast24h: 12450,
      isActive: false,
    },
  ];

  const displayAgents = agents.length > 0 ? agents : mockAgents;

  const formatRelativeTime = (isoDate: string | null): string => {
    if (!isoDate) return "Never";
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (Math.abs(diffMins) < 1) return "Just now";
    if (diffMins < 0) {
      if (Math.abs(diffMins) < 60) return `${Math.abs(diffMins)}m ago`;
      return `${Math.abs(diffHours)}h ago`;
    }
    if (diffMins < 60) return `in ${diffMins}m`;
    return `in ${diffHours}h`;
  };

  const formatTokens = (tokens: number): string => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-50">Active Agents</h2>
        <span className="text-sm text-zinc-400">
          {displayAgents.filter((a) => a.isActive).length} / {displayAgents.length} active
        </span>
      </div>

      <div className="space-y-3">
        {displayAgents.map((agent) => (
          <div
            key={agent.id}
            className="rounded-md border border-zinc-800 bg-zinc-950/50 p-4"
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    agent.isActive ? "bg-green-500" : "bg-zinc-600"
                  }`}
                />
                <h3 className="font-medium text-zinc-100">{agent.name}</h3>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  agent.isActive
                    ? "bg-green-500/10 text-green-400"
                    : "bg-zinc-700 text-zinc-400"
                }`}
              >
                {agent.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-zinc-500">Last Heartbeat</div>
                <div className="mt-1 font-medium text-zinc-300">
                  {formatRelativeTime(agent.lastHeartbeat)}
                </div>
              </div>
              <div>
                <div className="text-zinc-500">Next Checkin</div>
                <div className="mt-1 font-medium text-zinc-300">
                  {agent.nextCheckin ? formatRelativeTime(agent.nextCheckin) : "N/A"}
                </div>
              </div>
              <div>
                <div className="text-zinc-500">Tokens (24h)</div>
                <div className="mt-1 font-medium text-zinc-300">
                  {formatTokens(agent.tokensLast24h)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {displayAgents.length === 0 && (
        <div className="py-8 text-center text-sm text-zinc-500">
          No agents configured yet
        </div>
      )}
    </div>
  );
}
