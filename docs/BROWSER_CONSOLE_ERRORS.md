# Mission Control - Browser Console Error Report

**Generated:** 2026-02-28T16:49:48.476Z
**Environment:** http://localhost:4000
**Pages Tested:** 7

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 0 |
| 🟠 High | 0 |
| 🟡 Medium | 0 |
| 🟢 Low | 6 |
| **Total** | **6** |

**Network Errors:** 6

---

## 🟢 Low Priority (6)

<details>
<summary>Click to expand</summary>

- **Dashboard:** Failed to load resource: the server responded with a status of 401 ()
- **Projects:** Failed to load resource: the server responded with a status of 401 ()
- **Kanban Board:** Failed to load resource: the server responded with a status of 401 ()
- **All Issues:** Failed to load resource: the server responded with a status of 401 ()
- **My Issues:** Failed to load resource: the server responded with a status of 401 ()
- **Settings:** Failed to load resource: the server responded with a status of 401 ()

</details>

---

## Network Errors

| URL | Status | Status Text |
|-----|--------|-------------|
| `https://mission-control.uchitel.ca/api/v1/dashboard` | 401 |  |
| `https://mission-control.uchitel.ca/api/v1/projects` | 401 |  |
| `https://mission-control.uchitel.ca/api/v1/issues?` | 401 |  |
| `https://mission-control.uchitel.ca/api/v1/issues?` | 401 |  |
| `https://mission-control.uchitel.ca/api/v1/issues?` | 401 |  |
| `https://mission-control.uchitel.ca/api/v1/import/discover` | 401 |  |

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

