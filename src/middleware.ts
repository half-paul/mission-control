import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "./lib/rate-limit";

export function middleware(req: NextRequest) {
  // Only apply to API routes
  if (!req.nextUrl.pathname.startsWith("/api/v1")) {
    return NextResponse.next();
  }

  // Skip rate limiting for SSE (long-lived connections)
  if (req.nextUrl.pathname === "/api/v1/sse") {
    return NextResponse.next();
  }

  // #6: Rate limiting
  const rateLimitResponse = checkRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  return NextResponse.next();
}

export const config = {
  matcher: "/api/v1/:path*",
};
