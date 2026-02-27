# Mission Control — Quick Start Guide

**Status:** ✅ Ready for local development  
**Updated:** 2026-02-27

---

## Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Docker (optional, for containerized DB)

---

## Local Development Setup

### 1. Database Setup

**Option A: Docker (Recommended)**

```bash
cd /home/paul/.openclaw/workspace/projects/mission-control
docker-compose up -d postgres
```

**Option B: Local PostgreSQL**

```bash
# Create database
createdb mission_control

# Or via psql
psql -U postgres -c "CREATE DATABASE mission_control;"
```

### 2. Environment Configuration

```bash
# Copy example env file
cp .env.example .env.local

# Edit .env.local with your settings:
DATABASE_URL=postgresql://mc:mc@localhost:5433/mission_control
NEXTAUTH_SECRET=dev-secret-change-in-production-minimum-32-characters-required
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Run Database Migrations

```bash
# Install dependencies
npm install

# Run migrations
npm run db:push

# Or manually:
npx drizzle-kit push
```

### 4. Seed Database (Optional but Recommended)

```bash
# Connect to database
psql -U mc -d mission_control -h localhost -p 5433

# Run seed file
\i drizzle/seeds/dev.sql

# Exit
\q
```

**Seed creates:**
- 8 team members (Paul, David, Dana, Logan, Alex, Rex, Tom, Bruce)
- 10 labels (bug, feature, enhancement, etc.)
- 1 project (Mission Control - MC)
- 4 sample issues

### 5. Start Development Server

```bash
npm run dev
```

**Servers:**
- Frontend: http://localhost:3000
- API: http://localhost:4000 (if separate backend)

---

## Login Credentials

**After seeding, use:**

| Email | Password | Role |
|-------|----------|------|
| paul@example.com | Password123! | Admin |
| david@example.com | Password123! | Member (System Architect) |
| dana@example.com | Password123! | Member (Database Engineer) |
| logan@example.com | Password123! | Member (Backend Developer) |
| alex@example.com | Password123! | Member (Frontend Developer) |
| rex@example.com | Password123! | Member (Code Reviewer) |
| tom@example.com | Password123! | Member (QA Engineer) |
| bruce@example.com | Password123! | Member (PM/Product Owner) |

**All passwords:** `Password123!`

---

## Access the Application

1. **Visit:** http://localhost:3000
2. **Login page:** http://localhost:3000/login
3. **Enter credentials:** `paul@example.com` / `password123`
4. **Dashboard:** Should redirect to dashboard after successful login

---

## Troubleshooting

### 401 Unauthorized on Every Request

**Cause:** Database not seeded or migrations not run

**Fix:**
```bash
# Check if database exists
psql -U mc -h localhost -p 5433 -l | grep mission_control

# Run migrations
npm run db:push

# Seed database
psql -U mc -d mission_control -h localhost -p 5433 < drizzle/seeds/dev.sql
```

### Login Page Shows 404

**Cause:** Frontend not built or dev server not running

**Fix:**
```bash
npm run dev
```

### Database Connection Failed

**Cause:** PostgreSQL not running or wrong credentials

**Fix:**
```bash
# If using Docker
docker-compose up -d postgres

# Check if running
docker-compose ps

# Check logs
docker-compose logs postgres
```

### NEXTAUTH_SECRET Error on Build

**Cause:** Secret too short (must be ≥32 characters)

**Fix:**
```bash
# Generate a secure secret
openssl rand -base64 32

# Add to .env.local
NEXTAUTH_SECRET=<generated-secret>
```

### CORS Errors in Browser Console

**Cause:** API URL mismatch or CORS not configured

**Fix:**
```bash
# Check .env.local
NEXT_PUBLIC_API_URL=http://localhost:4000

# If backend is on different port, update accordingly
```

---

## Database Commands

**Push schema changes:**
```bash
npm run db:push
```

**Generate migrations:**
```bash
npm run db:generate
```

**Run migrations:**
```bash
npm run db:migrate
```

**Open Drizzle Studio:**
```bash
npm run db:studio
```

---

## Build for Production

```bash
# Build
npm run build

# Start production server
npm start
```

**Production environment variables:**
```bash
DATABASE_URL=postgresql://user:pass@host:5432/mission_control
NEXTAUTH_SECRET=<32-char-secret>
NEXTAUTH_URL=https://mission-control.uchitel.ca
NEXT_PUBLIC_API_URL=https://mission-control-api.uchitel.ca
```

---

## Docker Compose (Full Stack)

```bash
# Start all services (frontend + backend + database)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Reset everything (⚠️ deletes data)
docker-compose down -v
```

---

## API Endpoints

Base: `http://localhost:4000/api/v1`

**Auth:**
- POST `/auth/login` — Login with email/password
- POST `/auth/logout` — Logout
- GET `/auth/me` — Get current user

**Issues:**
- GET `/issues` — List issues (with filters)
- POST `/issues` — Create issue
- GET `/issues/:id` — Get issue
- PATCH `/issues/:id` — Update issue
- PATCH `/issues/:id/status` — Update status

**Projects:**
- GET `/projects` — List projects
- POST `/projects` — Create project
- GET `/projects/:id` — Get project
- GET `/projects/:id/stats` — Project stats

**Dashboard:**
- GET `/dashboard` — Dashboard data

**Import:**
- GET `/import/discover` — Discover projects
- POST `/import/preview` — Preview import
- POST `/import/run` — Run import

**SSE (Real-time):**
- GET `/sse` — Server-Sent Events stream

---

## Project Structure

```
mission-control/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/
│   │   │   └── login/         # Login page
│   │   ├── api/v1/            # API routes
│   │   ├── board/             # Kanban board
│   │   ├── issues/            # Issues list
│   │   ├── projects/          # Projects list
│   │   └── settings/          # Settings (import)
│   ├── components/            # React components
│   ├── hooks/                 # React hooks (TanStack Query)
│   ├── lib/                   # Utilities, DB, auth
│   └── types/                 # TypeScript types
├── drizzle/
│   ├── migrations/            # Database migrations
│   └── seeds/                 # Seed data
├── docker-compose.yml         # Docker services
├── Dockerfile                 # Frontend container
└── package.json
```

---

## Support

- **Frontend Issues:** Alex ⚛️
- **Backend Issues:** Logan 👨‍💻
- **Database Issues:** Dana 🗄️
- **Architecture Questions:** David 🏗️

**Documentation:**
- `FRONTEND_STATUS.md` — Frontend implementation details
- `API_CONFIGURATION.md` — API URL configuration guide
- `ARCHITECTURE.md` — System architecture (in David's workspace)

---

**Happy coding!** 🚀
