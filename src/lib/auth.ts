import { NextRequest, NextResponse } from "next/server";
import { db } from "./db";
import { members } from "./db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { config } from "./config";

// #3: JWT secret management — enforce strong secret in production
const rawSecret = process.env.NEXTAUTH_SECRET;
if (process.env.NODE_ENV === "production") {
  if (!rawSecret) {
    throw new Error("FATAL: NEXTAUTH_SECRET environment variable is required in production");
  }
  if (rawSecret.length < 32) {
    throw new Error("FATAL: NEXTAUTH_SECRET must be at least 32 characters in production");
  }
  if (rawSecret === "dev-secret-change-me") {
    throw new Error("FATAL: NEXTAUTH_SECRET must not be the default dev value in production");
  }
}
const JWT_SECRET = new TextEncoder().encode(rawSecret || "dev-secret-change-me");
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

// ─── Ownership checks (IDOR prevention) ───────────────────
export async function requireProjectAccess(
  user: AuthUser,
  projectId: string
): Promise<NextResponse | null> {
  // Admins can access any project
  if (user.role === "admin") return null;

  const { eq, and, isNull } = await import("drizzle-orm");
  const { projects } = await import("./db/schema");

  const [project] = await db
    .select({ ownerId: projects.ownerId })
    .from(projects)
    .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)));

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.ownerId !== user.id) {
    return NextResponse.json(
      { error: "You don't have access to modify this project" },
      { status: 403 }
    );
  }

  return null;
}

export async function requireIssueAccess(
  user: AuthUser,
  issueId: string
): Promise<NextResponse | null> {
  // Admins can access any issue
  if (user.role === "admin") return null;

  const { eq, and, isNull } = await import("drizzle-orm");
  const { issues, projects } = await import("./db/schema");

  const [issue] = await db
    .select({ projectId: issues.projectId, assigneeId: issues.assigneeId, createdBy: issues.createdBy })
    .from(issues)
    .where(and(eq(issues.id, issueId), isNull(issues.deletedAt)));

  if (!issue) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  // Allow if user is assignee or creator
  if (issue.assigneeId === user.id || issue.createdBy === user.id) return null;

  // Allow if user owns the project
  if (issue.projectId) {
    const [project] = await db
      .select({ ownerId: projects.ownerId })
      .from(projects)
      .where(eq(projects.id, issue.projectId));

    if (project?.ownerId === user.id) return null;
  }

  return NextResponse.json(
    { error: "You don't have access to modify this issue" },
    { status: 403 }
  );
}

export const COOKIE_NAME_EXPORT = COOKIE_NAME;
