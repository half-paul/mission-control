"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // SSE will be initialized separately in a client component mounted after hydration
  useEffect(() => {
    // Dynamic import SSE hook only on client side
    if (typeof window !== 'undefined') {
      import('@/hooks/use-sse').then(({ useSSE }) => {
        // Hook is already called in the imported module if needed
        // For now, we'll skip auto-initialization and let pages opt-in
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
