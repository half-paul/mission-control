import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "./lib/rate-limit";
import { allowedOrigins } from "./lib/config";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ──────────────────────────────────────────────────────────
  // Auth Protection (Frontend Routes)
  // ──────────────────────────────────────────────────────────
  
  // Public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/api/v1/auth/login',
    '/api/v1/auth/logout',
  ];

  // Static assets and Next.js internals (already excluded by matcher)
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  const isApiRoute = pathname.startsWith('/api/v1');

  // Check auth for protected frontend routes
  if (!isPublicRoute && !isApiRoute) {
    const token = req.cookies.get('mc-session'); // Cookie name from src/lib/auth.ts
    
    if (!token) {
      // Redirect to login if no auth token
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ──────────────────────────────────────────────────────────
  // API Route Handling (CORS + Rate Limiting)
  // ──────────────────────────────────────────────────────────

  if (!isApiRoute) {
    // Not an API route, skip CORS/rate limiting
    return NextResponse.next();
  }

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return handleCors(req, new NextResponse(null, { status: 204 }));
  }

  // Skip rate limiting for SSE (long-lived connections)
  if (pathname === "/api/v1/sse") {
    return handleCors(req, NextResponse.next());
  }

  // Rate limiting for API routes
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
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, etc.
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};
