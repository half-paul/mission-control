# Mission Control - Production Deployment

**Status:** ✅ LIVE  
**Deployed:** 2026-02-26 23:40 PST  
**Promoted to Production:** 2026-02-27 00:08 PST  
**Authorization:** Paul (VP of Security, Product Owner)  
**PM Approval:** Bruce  
**QA Validation:** Tom (100% pass rate)  
**Security Review:** Rex (Grade A-)  

---

## Production Environment

### Access
```
Application URL: http://localhost:4000
Database Host:   localhost:4001
Environment:     production
```

### Services
```
mission-control-app:        Node.js 25, Next.js 16.1.6
mission-control-postgres:   PostgreSQL 16 (Alpine)
```

### Docker Compose
```bash
cd /home/paul/.openclaw/workspace/projects/mission-control
docker compose ps
```

---

## Production Credentials

**⚠️ SENSITIVE - DO NOT COMMIT TO GIT**

### Authentication
```bash
NEXTAUTH_SECRET=2lXD1LzmlHpG+vVmWTkA/xg3DRBs2YzQulyA9vkHEmA=
NEXTAUTH_URL=http://localhost:4000
```

### Database
```bash
Database:       mission_control
Production User: mc_prod
Password:       8ddJadcefd+BSfa5c8QyRXe+NVZrDP9d
Connection URL: postgresql://mc_prod:8ddJadcefd+BSfa5c8QyRXe+NVZrDP9d@postgres:5432/mission_control
```

**Emergency Access (Dev Credentials):**
```bash
User:     mc
Password: mc
```

---

## Validation Results

### QA Testing (Tom)
**Initial QA (19 tests):** 100% PASS  
**Staging Validation:** 100% PASS

**Categories:**
- ✅ XSS Sanitization: Grade A+
- ✅ Import Pipeline: Grade A (54 issues from Raisin Protect Sprint 7)
- ✅ Data Integrity: Grade A (soft delete, foreign keys, uniqueness)
- ✅ Security: Grade A (authentication, rate limiting, IDOR)
- ✅ Performance: Grade A+ (<20ms response times vs 150-200ms targets)

### Security Review (Rex)
**Grade:** A-  
**Findings:** All critical security controls implemented and validated

### Performance Benchmarks
```
Dashboard:  <20ms (target: 200ms) - 10x better than target
Issues:     <20ms (target: 150ms) - 7.5x better than target
Search:     <20ms (target: 200ms) - 10x better than target
```

---

## Production Data

### Current State
```
Members:  8 (seeded)
Projects: 1 (seeded)
Issues:   4 (seeded)
Labels:   TBD
```

### Data Import Capability
- ✅ STATUS.md format detection
- ✅ Sprint format parsing
- ✅ Session transcript parsing
- ✅ Agent mapping (SA→David, DBE→Dana, etc.)

---

## Deployment History

### Initial Deployment (2026-02-26 21:42 PST)
- **Decision:** Paul chose "option B" (direct to production without staging)
- **Status:** Dev credentials, proof-of-concept
- **Outcome:** Successful deployment, API responding, database seeded

### Staging Hardening (2026-02-26 23:40 PST)
- **Action:** Rotated credentials, production config
- **Changes:** NEXTAUTH_SECRET, mc_prod user, NODE_ENV=production
- **Validation:** Bruce authorized staging deployment

### Staging Validation (2026-02-26 23:50 PST)
- **QA Engineer:** Tom
- **Results:** 100% pass rate (XSS, import pipeline, data integrity)
- **Performance:** All metrics exceeded targets by 7.5-10x

### Production Promotion (2026-02-27 00:08 PST)
- **Authorization:** Paul approved production deployment
- **PM Approval:** Bruce authorized promotion
- **Action:** Staging promoted to production status

---

## Monitoring & Health Checks

### Application Health
```bash
# Check application status
curl http://localhost:4000

# Check API health
curl http://localhost:4000/api/v1/projects
# Expected: {"error":"Authentication required"}

# Check Docker status
docker compose ps
```

### Database Health
```bash
# Check database connectivity
docker compose exec postgres psql -U mc_prod -d mission_control -c "SELECT COUNT(*) FROM members;"

# Check database size
docker compose exec postgres psql -U mc_prod -d mission_control -c "SELECT pg_size_pretty(pg_database_size('mission_control'));"
```

### Logs
```bash
# Application logs (last 50 lines)
docker compose logs app --tail=50 -f

# Database logs
docker compose logs postgres --tail=50 -f

# All logs
docker compose logs -f
```

---

## Backup & Recovery

### Database Backup

**Automated Backup (Recommended):**
```bash
# Add to crontab (daily at 2 AM)
0 2 * * * cd /home/paul/.openclaw/workspace/projects/mission-control && docker compose exec -T postgres pg_dump -U mc_prod mission_control | gzip > /home/paul/backups/mission-control/mission_control_$(date +\%Y\%m\%d_\%H\%M\%S).sql.gz
```

**Manual Backup:**
```bash
# Create backup directory
mkdir -p /home/paul/backups/mission-control

# Backup database
docker compose exec -T postgres pg_dump -U mc_prod mission_control > /home/paul/backups/mission-control/mission_control_$(date +%Y%m%d_%H%M%S).sql
```

**Restore from Backup:**
```bash
# Stop application (prevent writes during restore)
docker compose stop app

# Restore database
docker compose exec -T postgres psql -U mc_prod -d mission_control < /home/paul/backups/mission-control/mission_control_YYYYMMDD_HHMMSS.sql

# Restart application
docker compose start app
```

### Rollback Procedure

**If critical issues found:**
```bash
cd /home/paul/.openclaw/workspace/projects/mission-control

# 1. Stop services
docker compose down

# 2. Restore previous backup (if needed)
docker compose exec -T postgres psql -U mc_prod -d mission_control < /path/to/backup.sql

# 3. Optionally: Switch back to dev credentials
cp .env.local .env

# 4. Restart services
docker compose up -d

# 5. Verify
curl http://localhost:4000
```

---

## Maintenance

### Restart Services
```bash
cd /home/paul/.openclaw/workspace/projects/mission-control

# Restart all services
docker compose restart

# Restart specific service
docker compose restart app
docker compose restart postgres
```

### Update Application
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose up -d --build

# Verify deployment
curl http://localhost:4000
```

### Database Maintenance
```bash
# Vacuum database (reclaim space)
docker compose exec postgres psql -U mc_prod -d mission_control -c "VACUUM ANALYZE;"

# Check database statistics
docker compose exec postgres psql -U mc_prod -d mission_control -c "SELECT schemaname, tablename, n_live_tup, n_dead_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC;"
```

---

## Security

### Credential Rotation Schedule
- **NEXTAUTH_SECRET:** Rotate every 90 days
- **Database Password:** Rotate every 90 days
- **Emergency Access (mc/mc):** Disable after initial setup complete

### Rotation Procedure
```bash
# 1. Generate new secret
openssl rand -base64 32

# 2. Update .env file
nano .env  # Update NEXTAUTH_SECRET

# 3. Restart application
docker compose restart app

# 4. Update this documentation
```

### Access Control
- **Application Access:** Authentication required (NextAuth)
- **Database Access:** Production user only (mc_prod)
- **Docker Access:** Host user (paul)

---

## Troubleshooting

### Application Not Responding
```bash
# Check container status
docker compose ps

# Check logs for errors
docker compose logs app --tail=100

# Restart if needed
docker compose restart app
```

### Database Connection Errors
```bash
# Check PostgreSQL status
docker compose ps postgres

# Check PostgreSQL logs
docker compose logs postgres --tail=100

# Test connection
docker compose exec postgres psql -U mc_prod -d mission_control -c "SELECT version();"
```

### Performance Issues
```bash
# Check resource usage
docker stats

# Check database queries
docker compose exec postgres psql -U mc_prod -d mission_control -c "SELECT pid, usename, query, state FROM pg_stat_activity WHERE state != 'idle';"
```

---

## Contact & Support

**Deployment Lead:** Kai (DevOps Engineer)  
**PM/Product Owner:** Bruce  
**QA Engineer:** Tom  
**Security Review:** Rex  
**Product Owner:** Paul (VP of Security)

**Documentation:**
- Production Config: `/home/paul/.openclaw/workspace-kai/memory/staging-config.md`
- Deployment Log: `/home/paul/.openclaw/workspace-kai/memory/2026-02-26.md`
- This File: `/home/paul/.openclaw/workspace/projects/mission-control/PRODUCTION.md`

---

## Future Enhancements

### External Deployment (When Infrastructure Available)
- Deploy to external server/cloud
- Configure domain and SSL/TLS
- Set up CDN
- Configure monitoring/alerting (Prometheus, Grafana)
- Set up automated backups to cloud storage
- Configure high availability (if needed)

### Feature Roadmap
- Health check endpoint: `/api/health`
- Metrics endpoint: `/api/metrics`
- Admin dashboard
- Real-time notifications (SSE/WebSocket)
- Export functionality (issues → STATUS.md)

---

**Last Updated:** 2026-02-27 00:10 PST  
**Next Review:** 2026-03-27 (30 days)
