# Mission Control - Browser Console Error Report

**Generated:** 2026-02-27T22:27:51.154Z
**Environment:** http://localhost:4000
**Pages Tested:** 7

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 6 |
| 🟠 High | 0 |
| 🟡 Medium | 0 |
| 🟢 Low | 0 |
| **Total** | **6** |

---

## 🔴 Critical Errors (6)

### Login Flow

**URL:** `http://localhost:4000/login?redirect=%2F`

**Message:**
```
Login failed: TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
  navigated to "http://localhost:4000/login?redirect=%2F"
============================================================
```

**Timestamp:** 2026-02-27T22:26:41.403Z

---

### Login Flow

**URL:** `http://localhost:4000/login?redirect=%2F`

**Message:**
```
Login failed: TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
  navigated to "http://localhost:4000/login?redirect=%2F"
============================================================
```

**Timestamp:** 2026-02-27T22:26:54.753Z

---

### Login Flow

**URL:** `http://localhost:4000/login?redirect=%2F`

**Message:**
```
Login failed: TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
  navigated to "http://localhost:4000/login?redirect=%2F"
============================================================
```

**Timestamp:** 2026-02-27T22:27:08.001Z

---

### Login Flow

**URL:** `http://localhost:4000/login?redirect=%2F`

**Message:**
```
Login failed: TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
  navigated to "http://localhost:4000/login?redirect=%2F"
============================================================
```

**Timestamp:** 2026-02-27T22:27:21.340Z

---

### Login Flow

**URL:** `http://localhost:4000/login?redirect=%2F`

**Message:**
```
Login failed: TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
  navigated to "http://localhost:4000/login?redirect=%2F"
============================================================
```

**Timestamp:** 2026-02-27T22:27:34.750Z

---

### Login Flow

**URL:** `http://localhost:4000/login?redirect=%2F`

**Message:**
```
Login failed: TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
  navigated to "http://localhost:4000/login?redirect=%2F"
============================================================
```

**Timestamp:** 2026-02-27T22:27:48.150Z

---

## Screenshots

Screenshots saved to: `test-results/console-errors/`

- Dashboard:
  - Unauthenticated: `dashboard-unauthenticated.png`
  - Authenticated: `dashboard-authenticated.png`
- Login:
  - Unauthenticated: `login-unauthenticated.png`
- Projects:
  - Unauthenticated: `projects-unauthenticated.png`
  - Authenticated: `projects-authenticated.png`
- Kanban Board:
  - Unauthenticated: `kanban-board-unauthenticated.png`
  - Authenticated: `kanban-board-authenticated.png`
- All Issues:
  - Unauthenticated: `all-issues-unauthenticated.png`
  - Authenticated: `all-issues-authenticated.png`
- My Issues:
  - Unauthenticated: `my-issues-unauthenticated.png`
  - Authenticated: `my-issues-authenticated.png`
- Settings:
  - Unauthenticated: `settings-unauthenticated.png`
  - Authenticated: `settings-authenticated.png`

---

## Test Details

- **Test Framework:** Playwright
- **Browser:** Chromium
- **Test Duration:** ~2-3 minutes
- **Credentials Used:** paul@example.com / password123

