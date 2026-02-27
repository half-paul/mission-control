# Mission Control - Deployment Configuration

This document explains how to configure Mission Control for different deployment scenarios, with focus on the **single container deployment** (frontend + API together).

---

## Deployment Modes

### Single Container (Default) ✅ Recommended

**What it is:**
- Frontend (Next.js) and API run in the same container
- Next.js API routes (`/api/v1/*`) serve the backend
- Client-side code uses **relative URLs** (no separate API domain needed)
- Simplest deployment for reverse proxy access

**When to use:**
- ✅ Production deployment behind a reverse proxy (nginx, Caddy, Traefik)
- ✅ Single domain setup (e.g., `mission-control.uchitel.ca`)
- ✅ Docker/Docker Compose deployments
- ✅ Default recommended configuration

**Configuration:**
```bash
# .env
BASE_URL=https://mission-control.uchitel.ca
NEXTAUTH_URL=https://mission-control.uchitel.ca
NEXT_PUBLIC_API_URL=                      # Empty = relative URLs
NODE_ENV=production
```

**How it works:**
1. User visits `https://mission-control.uchitel.ca`
2. Frontend loads from same origin
3. Client-side code calls `/api/v1/projects` → resolves to `https://mission-control.uchitel.ca/api/v1/projects`
4. No CORS issues, no separate API domain needed

---

### Multi-Container (Optional)

**What it is:**
- Frontend and API run in separate containers/servers
- Client-side code uses **absolute URLs** to API server
- Requires CORS configuration

**When to use:**
- Different scaling requirements for frontend vs API
- Separate domains (e.g., `app.example.com` + `api.example.com`)
- Microservices architecture

**Configuration:**
```bash
# Frontend .env
BASE_URL=https://mission-control.uchitel.ca
NEXTAUTH_URL=https://mission-control.uchitel.ca
NEXT_PUBLIC_API_URL=https://api.mission-control.uchitel.ca  # Absolute URL
NODE_ENV=production

# API .env
BASE_URL=https://api.mission-control.uchitel.ca
CORS_ORIGINS=https://mission-control.uchitel.ca
NODE_ENV=production
```

---

## Environment Variables Reference

### Server-Side (Backend)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BASE_URL` | Yes | `http://localhost:4000` | Public base URL for the application |
| `NEXTAUTH_URL` | Yes | `${BASE_URL}` | Authentication callback URL |
| `NEXTAUTH_SECRET` | **Yes** | *(none)* | JWT secret (min 32 chars in production) |
| `DATABASE_URL` | Yes | `postgresql://...` | PostgreSQL connection string |
| `PROJECTS_PATH` | No | `/data/projects` | Path for STATUS.md imports |
| `NODE_ENV` | Yes | `production` | Environment mode |
| `CORS_ORIGINS` | No | *(none)* | Additional allowed CORS origins (comma-separated) |

### Client-Side (Frontend)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | No | *(empty)* | API base URL. **Leave empty for single-container** |

---

## Docker Configuration

### Single Container Deployment

**docker-compose.yml:**
```yaml
services:
  app:
    build: .
    ports:
      - "4000:3000"
    environment:
      - BASE_URL=${BASE_URL:-http://localhost:4000}
      - NEXTAUTH_URL=${NEXTAUTH_URL:-${BASE_URL}}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - DATABASE_URL=postgresql://mc:mc@postgres:5432/mission_control
      - NEXT_PUBLIC_API_URL=                    # Empty = relative URLs
      - NODE_ENV=production
      - PROJECTS_PATH=/data/projects
    volumes:
      - /path/to/projects:/data/projects:ro
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: mission_control
      POSTGRES_USER: mc
      POSTGRES_PASSWORD: mc
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

**.env file:**
```bash
BASE_URL=https://mission-control.uchitel.ca
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
```

---

## Reverse Proxy Configuration

### Nginx Example

```nginx
server {
    listen 443 ssl http2;
    server_name mission-control.uchitel.ca;

    ssl_certificate /etc/ssl/certs/mission-control.crt;
    ssl_certificate_key /etc/ssl/private/mission-control.key;

    location / {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Caddy Example

```caddyfile
mission-control.uchitel.ca {
    reverse_proxy localhost:4000
}
```

---

## Production Checklist

### Before Deployment

- [ ] Set `BASE_URL` to your public domain
- [ ] Generate secure `NEXTAUTH_SECRET` (32+ chars)
- [ ] Set `NEXTAUTH_URL` to match `BASE_URL`
- [ ] **Leave `NEXT_PUBLIC_API_URL` empty** for single-container
- [ ] Configure PostgreSQL with strong password
- [ ] Set `NODE_ENV=production`
- [ ] Configure SSL/TLS certificate
- [ ] Set up reverse proxy (nginx/Caddy)
- [ ] Test authentication flow
- [ ] Verify API calls work (check browser Network tab)

### After Deployment

- [ ] Verify login works at `https://your-domain.com`
- [ ] Check browser console for errors
- [ ] Test API endpoints (should use same domain)
- [ ] Monitor logs for CORS errors (should be none in single-container)
- [ ] Set up database backups
- [ ] Configure monitoring/alerts

---

## Troubleshooting

### Issue: "CORS errors in browser console"

**Cause:** Client-side code is trying to call API on different domain

**Solution (Single Container):**
- Ensure `NEXT_PUBLIC_API_URL` is **empty** (not set)
- Restart container after changing environment variable
- Clear browser cache

**Solution (Multi Container):**
- Set `CORS_ORIGINS` on API server to include frontend URL
- Example: `CORS_ORIGINS=https://mission-control.uchitel.ca`

### Issue: "Authentication redirects to localhost"

**Cause:** `NEXTAUTH_URL` not set correctly

**Solution:**
- Set `NEXTAUTH_URL=https://your-domain.com`
- Restart application
- Clear cookies and try again

### Issue: "API calls return 404"

**Cause:** Client trying to call wrong API URL

**Solution:**
- Check `NEXT_PUBLIC_API_URL` value
- For single-container: Should be empty
- For multi-container: Should be full API URL
- Rebuild Docker image after changing `NEXT_PUBLIC_*` vars

---

## Migration: Multi-Container → Single Container

If you're currently running separate frontend/API containers and want to simplify:

1. **Update environment variables:**
   ```bash
   # Before (Multi-Container)
   NEXT_PUBLIC_API_URL=https://api.mission-control.uchitel.ca
   
   # After (Single Container)
   NEXT_PUBLIC_API_URL=
   ```

2. **Rebuild Docker image:**
   ```bash
   docker compose down
   docker compose build --no-cache
   docker compose up -d
   ```

3. **Update reverse proxy:**
   - Remove separate API domain configuration
   - Route everything to single container

4. **Update DNS:**
   - Remove `api.mission-control.uchitel.ca` A record (if exists)
   - Keep only `mission-control.uchitel.ca`

5. **Test:**
   - Login should work
   - API calls should use same domain
   - No CORS errors

---

## Best Practices

### ✅ Do

- Use single-container deployment for simplicity
- Leave `NEXT_PUBLIC_API_URL` empty for same-origin APIs
- Use `BASE_URL` for all server-side URL generation
- Keep secrets in `.env` files (never commit)
- Use strong `NEXTAUTH_SECRET` in production

### ❌ Don't

- Don't hardcode URLs in code (use environment variables)
- Don't expose database credentials in public configs
- Don't use default secrets in production
- Don't forget to set `NODE_ENV=production`
- Don't use `localhost` in production `BASE_URL`

---

## Summary

**For reverse proxy deployment (recommended):**

```bash
# .env
BASE_URL=https://mission-control.uchitel.ca
NEXTAUTH_SECRET=<secure-random-32-chars>
NEXTAUTH_URL=https://mission-control.uchitel.ca
NEXT_PUBLIC_API_URL=                # Empty!
NODE_ENV=production
```

**Key points:**
- ✅ Single container = Frontend + API together
- ✅ Empty `NEXT_PUBLIC_API_URL` = Relative URLs (same origin)
- ✅ One domain for everything
- ✅ No CORS configuration needed
- ✅ Simplest to deploy and maintain

---

**Need help?** Check:
- [Quick Start Guide](QUICK_START.md) for local development
- [Production Deployment](PRODUCTION.md) for production setup
- [API Configuration](API_CONFIGURATION.md) for API endpoint details
