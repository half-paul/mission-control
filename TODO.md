# Mission Control - Project TODO

## 🚀 High Priority (Core Functionality)

### Project Management
- [x] **Project Detail Page**: Create `/src/app/projects/[id]/page.tsx` with project stats, issues list, and settings.
- [ ] **Create Project Modal**: Implement "New Project" button and modal form in `GlobalModals`.
- [ ] **Project Mutations**: Add `useCreateProjectMutation`, `useUpdateProjectMutation`, and `useDeleteProjectMutation` hooks.
- [ ] **Project Layout**: Polish `src/app/projects/page.tsx` grid and add empty states.

### Issue Experience
- [ ] **Markdown Editor**: Replace standard `Textarea` in `IssueForm` with a markdown-capable editor (e.g., `react-md-editor`).
- [ ] **Issue Comments**: Implement adding, editing, and deleting comments on the issue detail page.
- [ ] **Issue Subscriptions**: Add ability for users to subscribe/watch issues.

### Global Actions & Search
- [ ] **Command Palette (Cmd+K)**: Implement a true command palette (using `cmdk` or similar) for global search and quick actions.
- [ ] **Global Search Page**: Create `/src/app/search/page.tsx` for comprehensive search results.
- [ ] **Quick Navigation**: Implement keyboard shortcuts for view switching (G then I, G then B, etc.).

---

## 🛠️ Medium Priority (Features & Polish)

### Filtering & Views
- [ ] **Advanced Filter Bar**: Build a more robust UI for filtering by status, priority, assignee, project, and multiple labels.
- [ ] **Saved Filters**: Implement UI to create, edit, and select saved filters (backend exists).
- [ ] **View Management**: Allow workspace/team/private visibility for views.

### Import Pipeline
- [ ] **Import Preview**: Build a modal to display parsed results from `STATUS.md` before finalizing the import.
- [ ] **Import History**: Create `/src/app/settings/import-history/page.tsx` to view past import runs and logs.
- [ ] **Import Feedback**: Replace `alert()`/`confirm()` with proper modal and toast notifications.

### UI/UX Polish
- [ ] **Toast Notifications**: Integrate `sonner` or `react-hot-toast` for success/error feedback on all mutations.
- [ ] **Loading Skeletons**: Replace full-page spinners with skeleton screens for projects, issues, and dashboard.
- [ ] **Mobile Responsive Polish**: Improve sidebar behavior on mobile and optimize the issues table for small screens.

---

## ⚙️ Low Priority (Infrastructure & Enhancements)

### User & Team Management
- [ ] **Avatar Uploads**: Implement file upload for member avatars (currently shows initials).
- [ ] **Team Settings**: Create UI for configuring Cycles, Triage, and Workflow rules.
- [ ] **Activity Log Page**: Dedicated page for workspace-wide activity audit trail.

### Advanced Concepts
- [ ] **Cycles (Sprints)**: Implement automated, repeating cycles for issue prioritization.
- [ ] **Initiatives**: High-level grouping for projects with progress tracking.
- [ ] **Archive**: Implement archive rules and archive view for old issues.

---

## 🧪 Testing & Reliability
- [ ] **E2E Test Coverage**: Increase Playwright coverage for Projects and Import flows.
- [ ] **Integration Tests**: Add Vitest integration tests for complex import logic.
- [ ] **Error Boundary**: Implement global and local error boundaries for better failure handling.

---

*Last Updated: 2026-03-02*
