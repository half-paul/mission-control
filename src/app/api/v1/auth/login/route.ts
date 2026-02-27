import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, createToken, COOKIE_NAME_EXPORT } from "@/lib/auth";
import { handleError, errorResponse } from "@/lib/errors";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Rate limit tracking (in-memory, per-IP)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(req: NextRequest) {
  try {
    // Rate limit check
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const now = Date.now();
    const attempts = loginAttempts.get(ip);

    if (attempts) {
      if (now > attempts.resetAt) {
        loginAttempts.delete(ip);
      } else if (attempts.count >= MAX_ATTEMPTS) {
        return errorResponse(429, "Too many login attempts. Try again later.");
      }
    }

    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    const user = await authenticateUser(email, password);
    if (!user) {
      // Track failed attempt
      const current = loginAttempts.get(ip) || { count: 0, resetAt: now + WINDOW_MS };
      current.count++;
      loginAttempts.set(ip, current);

      return errorResponse(401, "Invalid email or password");
    }

    // Clear failed attempts on success
    loginAttempts.delete(ip);

    const token = await createToken(user);

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
    });

    response.cookies.set(COOKIE_NAME_EXPORT, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (err) {
    return handleError(err);
  }
}
