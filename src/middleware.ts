import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "./lib/rate-limit";
import { allowedOrigins } from "./lib/config";

export function middleware(req: NextRequest) {
  // Only apply to API routes
  if (!req.nextUrl.pathname.startsWith("/api/v1")) {
    return NextResponse.next();
  }

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return handleCors(req, new NextResponse(null, { status: 204 }));
  }

  // Skip rate limiting for SSE (long-lived connections)
  if (req.nextUrl.pathname === "/api/v1/sse") {
    return handleCors(req, NextResponse.next());
  }

  // #6: Rate limiting
  const rateLimitResponse = checkRateLimit(req);
  if (rateLimitResponse) return handleCors(req, rateLimitResponse);

  return handleCors(req, NextResponse.next());
}

function handleCors(req: NextRequest, response: NextResponse): NextResponse {
  const origin = req.headers.get("origin");

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Max-Age", "86400");
  }

  return response;
}

export const config = {
  matcher: "/api/v1/:path*",
};
