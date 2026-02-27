# Verify Mission Control URL Configuration

Quick guide to verify that Mission Control is using relative URLs (not hardcoded localhost:3000).

---

## Quick Test

### 1. Check Login Page

Open your browser to `http://localhost:4000/login` and open Developer Tools (F12).

**Go to Network tab** and try to login with:
- Email: `paul@example.com`
- Password: `password123`

**Expected:**
```
Request URL: http://localhost:4000/api/v1/auth/login
```

**❌ Wrong (old behavior):**
```
Request URL: http://localhost:3000/api/v1/auth/login
```

---

### 2. Check Built JavaScript

```bash
# Check if localhost:3000 appears in login page HTML
curl -s http://localhost:4000/login | grep -o "localhost:3000"
```

**Expected:** No output (string not found)

**❌ Wrong:** Returns `localhost:3000`

---

### 3. Test API Directly

```bash
# Should work and return JSON with user details
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"paul@example.com","password":"password123"}'
```

**Expected:**
```json
{
  "user": {
    "id": "550e8400-...",
    "email": "paul@example.com",
    "name": "Paul",
    "role": "admin"
  },
  "token": "eyJhbGci..."
}
```

---

## How It Works

### Build-Time Configuration

Mission Control uses **Next.js environment variables** which are processed at build time:

```dockerfile
# Dockerfile
ARG NEXT_PUBLIC_API_URL=
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN npm run build
```

**Empty string** (`NEXT_PUBLIC_API_URL=`) means:
- `src/lib/api-client.ts` exports `API_BASE_URL = ''`
- Client-side code calls `/api/v1/projects` (relative URL)
- Browser resolves to same origin automatically

**Absolute URL** (`NEXT_PUBLIC_API_URL=https://api.example.com`) means:
- `src/lib/api-client.ts` exports `API_BASE_URL = 'https://api.example.com'`
- Client-side code calls `https://api.example.com/api/v1/projects`
- Useful for multi-container deployments

---

## Troubleshooting

### Issue: Login still goes to localhost:3000

**Cause:** Docker image was built with old hardcoded value

**Fix:**
```bash
cd /home/paul/.openclaw/workspace/projects/mission-control
docker compose down
docker compose build --no-cache app
docker compose up -d
```

**Verify:**
```bash
# Should show relative URL in browser Network tab
# Or test with curl (should NOT contain localhost:3000)
curl -s http://localhost:4000/login | grep localhost:3000
```

---

### Issue: Build arg not taking effect

**Check docker-compose.yml:**
```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-}  # Must be here!
```

**Check Dockerfile:**
```dockerfile
ARG NEXT_PUBLIC_API_URL=
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
```

**Rebuild:**
```bash
docker compose build --no-cache --build-arg NEXT_PUBLIC_API_URL= app
docker compose up -d
```

---

### Issue: CORS errors

**Symptom:** Browser console shows CORS policy errors

**Cause:** Usually means client is trying to call different origin

**Fix for single-container:**
```bash
# Ensure NEXT_PUBLIC_API_URL is empty (relative URLs)
echo "NEXT_PUBLIC_API_URL=" > .env
docker compose build --no-cache app
docker compose up -d
```

**Fix for multi-container:**
```bash
# Set CORS_ORIGINS on API server
echo "CORS_ORIGINS=https://frontend.example.com" >> .env
docker compose restart app
```

---

## Current Configuration

**Check what's currently set:**

```bash
# What was used during last build?
docker compose exec app env | grep NEXT_PUBLIC

# What's in docker-compose.yml?
grep -A 5 "build:" docker-compose.yml
```

**Expected for single-container:**
```bash
# Should be empty or not set
NEXT_PUBLIC_API_URL=
```

---

## Summary

✅ **Correct:** Empty `NEXT_PUBLIC_API_URL` → Relative URLs  
✅ **Works with:** Reverse proxy, same-origin deployment  
✅ **No CORS:** Client and API on same domain  

❌ **Wrong:** Hardcoded `localhost:3000` in Dockerfile  
❌ **Wrong:** Setting `NEXT_PUBLIC_*` at runtime (doesn't work)  

**Key point:** `NEXT_PUBLIC_*` variables are baked into the build. Change requires rebuild!
