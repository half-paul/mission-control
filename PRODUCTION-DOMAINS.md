# Mission Control - Production Domain Deployment Guide

**Production Domains:**
- Portal (Frontend): `https://mission-control.uchitel.ca`
- API (Backend): `https://mission-control-api.uchitel.ca`

**Status:** ✅ Backend configured (Logan), ⏳ Waiting for frontend (Alex)

---

## Prerequisites

### 1. DNS Configuration

Ensure DNS records are configured to point to your server:

```bash
# A records (or CNAME if using a hostname)
mission-control.uchitel.ca      → <server-ip>
mission-control-api.uchitel.ca  → <server-ip>
```

**Verify DNS:**
```bash
dig mission-control.uchitel.ca +short
dig mission-control-api.uchitel.ca +short
```

### 2. SSL/TLS Certificates

**Option A: Let's Encrypt with Certbot (Recommended)**

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Generate certificates
sudo certbot certonly --nginx -d mission-control.uchitel.ca -d mission-control-api.uchitel.ca

# Auto-renewal (add to crontab)
0 0 1 * * certbot renew --quiet
```

**Option B: Caddy (Automatic SSL)**

Caddy automatically obtains and renews Let's Encrypt certificates. No manual certificate management needed.

### 3. Reverse Proxy Setup

Choose **Nginx** or **Caddy** as your reverse proxy.

---

## Deployment Steps

### Step 1: Update Environment Configuration

**After Alex completes frontend configuration:**

```bash
cd /home/paul/.openclaw/workspace/projects/mission-control

# Copy production environment template
cp .env.production.template .env

# Verify configuration
cat .env
```

**Expected `.env` contents:**
```bash
# Database
DATABASE_URL=postgresql://mc_prod:8ddJadcefd+BSfa5c8QyRXe+NVZrDP9d@postgres:5432/mission_control

# Authentication
NEXTAUTH_SECRET=2lXD1LzmlHpG+vVmWTkA/xg3DRBs2YzQulyA9vkHEmA=

# Production URLs
API_URL=https://mission-control-api.uchitel.ca
PORTAL_URL=https://mission-control.uchitel.ca
NEXTAUTH_URL=https://mission-control-api.uchitel.ca

# Frontend API URL
NEXT_PUBLIC_API_URL=https://mission-control-api.uchitel.ca

# Application
NODE_ENV=production
PROJECTS_PATH=/home/paul/.openclaw/workspace/projects
```

### Step 2: Configure Reverse Proxy

#### Option A: Nginx

```bash
# Copy nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/mission-control
sudo ln -s /etc/nginx/sites-available/mission-control /etc/nginx/sites-enabled/

# Update certificate paths in nginx.conf if needed
sudo nano /etc/nginx/sites-available/mission-control

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

#### Option B: Caddy

```bash
# Install Caddy (if not installed)
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# Copy Caddyfile
sudo cp Caddyfile /etc/caddy/Caddyfile

# Reload Caddy
sudo systemctl reload caddy
```

### Step 3: Rebuild and Restart Application

```bash
cd /home/paul/.openclaw/workspace/projects/mission-control

# Stop services
docker compose down

# Rebuild with new environment
docker compose up -d --build

# Verify containers are running
docker compose ps
```

### Step 4: Verify Deployment

#### Check Application Health

```bash
# Portal (Frontend)
curl -I https://mission-control.uchitel.ca
# Expected: HTTP/2 200

# API (Backend)
curl https://mission-control-api.uchitel.ca/api/v1/projects
# Expected: {"error":"Authentication required"}
```

#### Check SSL Certificates

```bash
# Portal
curl -vI https://mission-control.uchitel.ca 2>&1 | grep "SSL certificate"

# API
curl -vI https://mission-control-api.uchitel.ca 2>&1 | grep "SSL certificate"
```

#### Test CORS

```bash
# Simulate browser request from portal to API
curl -H "Origin: https://mission-control.uchitel.ca" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://mission-control-api.uchitel.ca/api/v1/projects

# Expected headers:
# Access-Control-Allow-Origin: https://mission-control.uchitel.ca
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

#### Test Authentication Flow

1. **Open portal in browser:** `https://mission-control.uchitel.ca`
2. **Click login**
3. **Verify redirect to:** `https://mission-control-api.uchitel.ca/api/v1/auth/login`
4. **After login, verify redirect back to portal**
5. **Check API calls in browser DevTools Network tab**
   - Should call `https://mission-control-api.uchitel.ca/api/v1/*`
   - Should include CORS headers

---

## Architecture

**Current Setup:**

```
┌─────────────────────────────────────────────────────┐
│  Internet                                           │
└─────────────────────────────────────────────────────┘
                          │
                          │ HTTPS
                          │
         ┌────────────────┴────────────────┐
         │                                 │
         │                                 │
    ┌────▼────┐                      ┌────▼────┐
    │  Nginx  │                      │  Nginx  │
    │  /Caddy │                      │  /Caddy │
    └────┬────┘                      └────┬────┘
         │                                 │
         │ mission-control.uchitel.ca      │ mission-control-api.uchitel.ca
         │                                 │
         │                                 │
         └────────────────┬────────────────┘
                          │
                          │ HTTP (localhost:4000)
                          │
                    ┌─────▼──────┐
                    │  Next.js   │
                    │  App       │
                    │            │
                    │  - Portal  │
                    │  - API     │
                    └─────┬──────┘
                          │
                    ┌─────▼──────┐
                    │ PostgreSQL │
                    │            │
                    │ localhost  │
                    │  :4001     │
                    └────────────┘
```

**Key Points:**
- Both domains route to the **same Next.js application** on localhost:4000
- Next.js serves both Portal (frontend) and API (backend) from one codebase
- CORS is configured in backend to allow `PORTAL_URL` origin
- Reverse proxy terminates SSL and forwards to Next.js
- Database accessible only on localhost (not exposed externally)

---

## Troubleshooting

### Issue: Portal loads but API calls fail

**Symptom:** Portal loads at https://mission-control.uchitel.ca but can't call API

**Check:**
1. **CORS configuration:**
   ```bash
   docker compose exec app env | grep PORTAL_URL
   # Should output: PORTAL_URL=https://mission-control.uchitel.ca
   ```

2. **Frontend API URL:**
   ```bash
   docker compose exec app env | grep NEXT_PUBLIC_API_URL
   # Should output: NEXT_PUBLIC_API_URL=https://mission-control-api.uchitel.ca
   ```

3. **Browser DevTools:**
   - Open Console
   - Check for CORS errors
   - Check Network tab for failed API calls

**Fix:**
```bash
# Update .env with correct URLs
nano .env

# Restart containers
docker compose restart app
```

### Issue: SSL Certificate errors

**Symptom:** Browser shows "Your connection is not private"

**Check:**
```bash
# Verify certificates exist
sudo ls -la /etc/letsencrypt/live/mission-control.uchitel.ca/

# Check certificate expiry
sudo certbot certificates
```

**Fix (Nginx):**
```bash
# Regenerate certificates
sudo certbot certonly --nginx -d mission-control.uchitel.ca -d mission-control-api.uchitel.ca

# Reload nginx
sudo systemctl reload nginx
```

**Fix (Caddy):**
```bash
# Caddy auto-manages certificates
# Check Caddy logs
sudo journalctl -u caddy -f
```

### Issue: NextAuth redirects fail

**Symptom:** Login redirects to wrong URL or fails

**Check:**
```bash
docker compose exec app env | grep NEXTAUTH_URL
# Should output: NEXTAUTH_URL=https://mission-control-api.uchitel.ca
```

**Fix:**
```bash
# Update NEXTAUTH_URL in .env
nano .env

# Set to API domain
NEXTAUTH_URL=https://mission-control-api.uchitel.ca

# Restart
docker compose restart app
```

### Issue: 502 Bad Gateway

**Symptom:** Nginx/Caddy returns 502 error

**Check:**
```bash
# Verify Next.js is running
docker compose ps

# Check Next.js logs
docker compose logs app --tail=50

# Verify localhost:4000 responds
curl http://localhost:4000
```

**Fix:**
```bash
# Restart Next.js
docker compose restart app

# Or rebuild if needed
docker compose up -d --build
```

---

## Rollback Procedure

If production deployment fails:

```bash
cd /home/paul/.openclaw/workspace/projects/mission-control

# 1. Stop services
docker compose down

# 2. Restore previous environment
cp .env.backup .env

# 3. Restart with old config
docker compose up -d

# 4. Revert reverse proxy config
sudo cp /etc/nginx/sites-available/mission-control.backup /etc/nginx/sites-available/mission-control
sudo systemctl reload nginx
```

---

## Post-Deployment Checklist

After successful deployment:

- [ ] Portal loads at https://mission-control.uchitel.ca
- [ ] API responds at https://mission-control-api.uchitel.ca/api/v1/projects
- [ ] SSL certificates valid (no browser warnings)
- [ ] Login flow works (redirects to API, back to Portal)
- [ ] API calls from Portal succeed (check DevTools Network)
- [ ] CORS headers present on API responses
- [ ] Database connections working
- [ ] Logs show no errors

---

## Next Steps (After Alex Completes Frontend)

1. **Alex delivers:** `NEXT_PUBLIC_API_URL` frontend configuration
2. **Kai executes:**
   - Copy `.env.production.template` → `.env`
   - Configure reverse proxy (Nginx or Caddy)
   - Rebuild containers with new environment
   - Verify deployment
3. **Tom validates:**
   - Portal loads
   - API calls work
   - Authentication flow
   - CORS functionality
4. **Bruce approves:**
   - Production deployment complete

---

**Last Updated:** 2026-02-27 06:59 PST  
**Status:** Backend ready (Logan ✅), Frontend pending (Alex ⏳)  
**Next Action:** Wait for Alex's frontend configuration
