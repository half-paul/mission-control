import { NextRequest, NextResponse } from "next/server";
import { db } from "./db";
import { members } from "./db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "dev-secret-change-me"
);
const TOKEN_EXPIRY = "7d";
const COOKIE_NAME = "mc-session";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  agentId: string | null;
}

// ─── JWT helpers ───────────────────────────────────────────
export async function createToken(user: AuthUser): Promise<string> {
  return new SignJWT({ sub: user.id, email: user.email, name: user.name, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as string,
      agentId: null,
    };
  } catch {
    return null;
  }
}

// ─── Login ─────────────────────────────────────────────────
export async function authenticateUser(
  email: string,
  password: string
): Promise<AuthUser | null> {
  const [member] = await db
    .select()
    .from(members)
    .where(and(eq(members.email, email), isNull(members.deletedAt)));

  if (!member) return null;

  const valid = await bcrypt.compare(password, member.passwordHash);
  if (!valid) return null;

  return {
    id: member.id,
    email: member.email,
    name: member.name,
    role: member.role || "member",
    agentId: member.agentId,
  };
}

// ─── Request authentication ────────────────────────────────
export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  // Check Authorization header first (Bearer token)
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    return verifyToken(token);
  }

  // Check cookie
  const cookie = req.cookies.get(COOKIE_NAME);
  if (cookie?.value) {
    return verifyToken(cookie.value);
  }

  return null;
}

// ─── Auth middleware ────────────────────────────────────────
export async function requireAuth(req: NextRequest): Promise<AuthUser | NextResponse> {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }
  return user;
}

export async function requireAdmin(req: NextRequest): Promise<AuthUser | NextResponse> {
  const result = await requireAuth(req);
  if (result instanceof NextResponse) return result;
  if (result.role !== "admin") {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }
  return result;
}

// ─── RBAC helper ───────────────────────────────────────────
// Viewers can only read; members and admins can write
export function canWrite(user: AuthUser): boolean {
  return user.role === "admin" || user.role === "member";
}

export function requireWrite(user: AuthUser): NextResponse | null {
  if (!canWrite(user)) {
    return NextResponse.json(
      { error: "Write access required. Viewers are read-only." },
      { status: 403 }
    );
  }
  return null;
}

export const COOKIE_NAME_EXPORT = COOKIE_NAME;
