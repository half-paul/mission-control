import { NextRequest } from "next/server";
import { addClient, removeClient } from "@/lib/sse";
import { verifyToken } from "@/lib/auth";

// GET /api/v1/sse — Server-Sent Events stream (auth via query param token)
export async function GET(req: NextRequest) {
  // SSE can't send headers after connection, so auth via query param
  const token =
    req.nextUrl.searchParams.get("token") ||
    req.headers.get("authorization")?.replace("Bearer ", "") ||
    req.cookies.get("mc-session")?.value;

  if (!token) {
    return new Response("Authentication required", { status: 401 });
  }

  const user = await verifyToken(token);
  if (!user) {
    return new Response("Invalid or expired token", { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      addClient(send);

      req.signal.addEventListener("abort", () => {
        removeClient(send);
        clearInterval(heartbeat);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
