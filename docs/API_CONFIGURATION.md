# Mission Control — API Configuration

**Author:** Alex ⚛️ (Frontend Developer)  
**Date:** 2026-02-27  
**Task:** Environment-driven API URL configuration  

---

## Overview

The Mission Control frontend now uses environment variables to configure API endpoints, allowing seamless deployment to different environments without code changes.

## Environment Variable

### `NEXT_PUBLIC_API_URL`

**Purpose:** Base URL for all API requests from the browser

**Format:** 
- **Development:** `http://localhost:3000` (Next.js dev server - monolith architecture)
- **Production:** `https://mission-control-api.uchitel.ca` (separate deployment)

**Required:** Yes (with fallback to `http://localhost:4000`)

**Note:** The `NEXT_PUBLIC_` prefix is required for Next.js to expose the variable to the browser.

---

## Configuration Files

### `.env.example` (Template)

```bash
# API Configuration (Frontend)
# Base URL for API requests from the browser
# Development: Same as Next.js dev server (monolith architecture)
# Production: Separate API domain
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Purpose:** Template for developers to copy to `.env.local`

**Location:** `/home/paul/.openclaw/workspace/projects/mission-control/.env.example`

### `.env.local` (Development)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Purpose:** Local development configuration

**Location:** `/home/paul/.openclaw/workspace/projects/mission-control/.env.local`

**Note:** This file is git-ignored and should be created locally by each developer

### Production Deployment

**Kai** will set:
```bash
NEXT_PUBLIC_API_URL=https://mission-control-api.uchitel.ca
```

---

## Implementation

### API Client (`src/lib/api-client.ts`)

Centralized API client configuration:

```typescript
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const apiClient = {
  baseUrl: API_BASE_URL,

  url(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${cleanPath}`;
  },

  async get<T>(path: string, options?: RequestInit): Promise<T> { ... },
  async post<T>(path: string, data?: unknown, options?: RequestInit): Promise<T> { ... },
  async patch<T>(path: string, data?: unknown, options?: RequestInit): Promise<T> { ... },
  async delete<T>(path: string, options?: RequestInit): Promise<T> { ... },
};
```

**Features:**
- Automatic URL construction
- Type-safe response handling
- Consistent error handling
- Helper methods for common HTTP verbs

### Updated Hooks

All data-fetching hooks now use `apiClient`:

**Before:**
```typescript
const res = await fetch("/api/v1/issues");
```

**After:**
```typescript
import { apiClient } from "@/lib/api-client";
const issues = await apiClient.get<Issue[]>("/api/v1/issues");
```

**Updated files:**
- `src/hooks/use-dashboard.ts`
- `src/hooks/use-issues.ts`
- `src/hooks/use-projects.ts`
- `src/hooks/use-import.ts`
- `src/hooks/use-sse.ts`

---

## Verification

### No Hardcoded URLs

```bash
# Search performed:
grep -r "localhost:4000" src/    # Only in api-client.ts (fallback)
grep -r "http://localhost" src/  # Only in api-client.ts + backend config
grep -r 'fetch("/api' src/       # No results
grep -r "fetch(\`/api" src/      # No results
```

**Result:** ✅ All frontend API calls now use `apiClient`

### Build Test

```bash
npm run build
```

**Result:** ✅ Build passes with no TypeScript errors

---

## Usage Examples

### Simple GET request

```typescript
import { apiClient } from "@/lib/api-client";

const projects = await apiClient.get<Project[]>("/api/v1/projects");
```

### POST with data

```typescript
const newIssue = await apiClient.post<Issue>("/api/v1/issues", {
  title: "Fix bug",
  projectId: "uuid",
  status: "todo",
});
```

### PATCH update

```typescript
const updated = await apiClient.patch<Issue>(`/api/v1/issues/${id}`, {
  status: "done",
});
```

### SSE (Server-Sent Events)

```typescript
const eventSource = new EventSource(apiClient.url("/api/v1/sse"));
```

---

## Deployment Checklist

### Development

- [x] `.env.example` updated with `NEXT_PUBLIC_API_URL`
- [x] `.env.local` updated with dev API URL
- [x] All hooks use `apiClient`
- [x] Build passes
- [x] No hardcoded URLs remain

### Production (For Kai)

- [ ] Set `NEXT_PUBLIC_API_URL=https://mission-control-api.uchitel.ca` in deployment environment
- [ ] Verify API endpoint is reachable from frontend
- [ ] Test CORS configuration (API must allow frontend origin)
- [ ] Verify SSE endpoint works cross-origin

---

## CORS Considerations

**Backend (Logan's responsibility):**

The API server must allow requests from the frontend origin:

```javascript
// Example CORS config (backend)
app.use(cors({
  origin: [
    'http://localhost:3000',                      // Dev frontend
    'https://mission-control.uchitel.ca',          // Production frontend
  ],
  credentials: true,
}));
```

**SSE Specific:**

Server-Sent Events require CORS headers:
```
Access-Control-Allow-Origin: <frontend-origin>
Access-Control-Allow-Credentials: true
```

---

## Troubleshooting

### Issue: API calls fail in production

**Check:**
1. `NEXT_PUBLIC_API_URL` is set correctly
2. Backend API is running and accessible
3. CORS headers are configured on backend
4. Network tab shows correct URL in browser

### Issue: SSE connection fails

**Check:**
1. SSE endpoint URL is correct (`apiClient.url("/api/v1/sse")`)
2. Backend supports SSE (Content-Type: text/event-stream)
3. CORS headers include EventSource origin

### Issue: Build uses old API URL

**Fix:**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

Environment variables are baked into the build at compile time.

---

## Summary

✅ **API URL is now configurable via environment variables**  
✅ **All frontend code uses centralized `apiClient`**  
✅ **No hardcoded URLs remain**  
✅ **Build passes with TypeScript strict mode**  
✅ **Ready for production deployment**  

**Files modified:** 7 (api-client.ts, 5 hooks, .env.example, .env.local)

— Alex ⚛️
