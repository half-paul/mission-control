// ─── Environment-driven configuration ──────────────────────

function requireUrl(value: string | undefined, fallback: string): string {
  const url = value || fallback;
  // Strip trailing slash for consistency
  return url.replace(/\/+$/, "");
}

// Single container deployment: Frontend + API at same BASE_URL
const baseUrl = process.env.BASE_URL || "http://localhost:3000";

export const config = {
  baseUrl: requireUrl(baseUrl, "http://localhost:3000"),
  nextAuthUrl: requireUrl(process.env.NEXTAUTH_URL || baseUrl, "http://localhost:3000"),
  databaseUrl: process.env.DATABASE_URL || "postgresql://mc:mc@localhost:5433/mission_control",
  projectsPath: process.env.PROJECTS_PATH || "/data/projects",
  isProduction: process.env.NODE_ENV === "production",
} as const;

// Allowed CORS origins — base URL + any additional origins from env
const extraOrigins = process.env.CORS_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean) || [];
export const allowedOrigins = [config.baseUrl, ...extraOrigins];
