# Mission Control - AI-Augmented Project Management

## Project Overview
Mission Control is a high-performance, AI-augmented project and issue management platform designed for rapid execution and deep integration with development workflows. It draws inspiration from modern project management paradigms like Linear, focusing on "Cycles," "Triage," and "Command-based" navigation.

### Key Features
- **Project & Issue Tracking:** Robust lifecycle management for issues and projects with hierarchical relationships.
- **Kanban Board:** Dynamic drag-and-drop board for visualizing and managing workflow status (via `@dnd-kit`).
- **Global Actions:** Create new issues from anywhere in the app using the "New Issue" button or the `Cmd+K` keyboard shortcut.
- **Filtering & Views:** Advanced filtering by status and priority on the "All Issues" page.
- **My Issues:** Personalized view showing only issues assigned to the current authenticated user.
- **Import Pipeline:** Automated ingestion of project state from `STATUS.md` files (Sprint or Session based).
- **Activity Log:** Comprehensive audit trail of all actions and entity changes.
- **RBAC:** Multi-tier access control (Admin, Member, Viewer).

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS v4, Lucide Icons, Radix UI Primitives.
- **State Management:** TanStack Query v5 (server sync), Zustand (client UI state & global modals).
- **Database:** PostgreSQL with Drizzle ORM.
- **Authentication:** Custom JWT-based session management.
- **Testing:** Vitest (Unit/Integration), Playwright (E2E).

## Directory Structure
- `src/app/`: Next.js pages, API routes, and layouts.
- `src/components/`: Reusable UI components (board, issues, layout, ui).
  - `src/components/layout/global-modals.tsx`: Centralized modal management.
- `src/hooks/`: Custom React hooks (auth, issues, projects, ui-store).
- `src/lib/`: Core business logic, database schema, auth, and import processing.

## Building and Running

### Prerequisites
- Node.js (Latest LTS)
- PostgreSQL database

### Key Commands
- **Development:** `npm run dev`
- **Production Build:** `npm run build` && `npm start`
- **Database:**
  - `npx drizzle-kit generate` (Migrations)
  - `npx drizzle-kit push` (Schema sync)
- **Testing:**
  - `npm test` (Vitest)
  - `npm run test:e2e` (Playwright)

## Development Conventions

### Global State & UI
- **Modals:** Use `useUIStore` from `@/hooks/use-ui-store` to trigger global modals (e.g., `openNewIssueModal()`).
- **Keyboard Shortcuts:** Global listeners are defined in `src/components/layout/header.tsx`.
- **Filtering:** Use the `IssueFilters` interface in `useIssues` hook to pass filter parameters to the API.

### Authentication
- **User Data:** Use the `useAuth()` hook from `@/hooks/use-auth` to access the current logged-in user's profile on the client side.
- **Protection:** Backend routes are protected via `requireAuth` in `src/lib/auth.ts`.

### Coding Style
- **TypeScript:** Strict typing is mandatory.
- **Components:** Functional components with Tailwind CSS. Prefer reusable UI primitives.
- **API Design:** All RESTful APIs reside in `src/app/api/v1/`.
