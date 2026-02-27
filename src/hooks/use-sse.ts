"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SSEEvent } from "@/types";

export function useSSE() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const eventSource = new EventSource("/api/v1/sse");

    eventSource.onmessage = (event) => {
      try {
        const data: SSEEvent = JSON.parse(event.data);

        // Invalidate relevant queries based on event type
        switch (data.type) {
          case "issue_created":
          case "issue_updated":
          case "issue_status_changed":
          case "issue_deleted":
            queryClient.invalidateQueries({ queryKey: ["issues"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            break;

          case "project_updated":
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            break;

          case "member_updated":
            queryClient.invalidateQueries({ queryKey: ["members"] });
            break;
        }
      } catch (error) {
        console.error("Failed to parse SSE event:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      // EventSource will automatically try to reconnect
    };

    return () => {
      eventSource.close();
    };
  }, [queryClient]);
}
