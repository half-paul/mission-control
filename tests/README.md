# Mission Control E2E Testing Guide

## Overview

End-to-end (E2E) testing infrastructure using Playwright with video recording enabled for all tests.

**Purpose:** Prevent critical UI regressions (like the login page 404 incident) by testing complete user workflows.

---

## Quick Start

### Install Dependencies

```bash
npm install
```

### Run Tests

```bash
# Run all E2E tests (headless mode)
npm run test:e2e

# Run tests with UI (interactive mode)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests step-by-step
npm run test:e2e:debug

# Run only authentication tests
npm run test:e2e:auth

# View test report
npm run test:e2e:report
```

---

## Test Suites

### 1. Authentication Tests (`tests/e2e/auth.spec.ts`)

**Critical tests to prevent login page regressions:**

- ✅ Login page exists and is accessible (not 404)
- ✅ Fresh user can log in with valid credentials
- ✅ Invalid credentials show error message
- ✅ Unauthenticated user gets redirected to login
- ✅ User can access protected routes after login
- ✅ User can log out successfully
- ✅ Session persists across page reloads
- ✅ Different user roles can log in

**Why these tests matter:**  
These tests directly prevent the login page 404 incident. If the login page is broken, these tests will fail immediately.

### 2. Issue CRUD Tests (`tests/e2e/issue-crud.spec.ts`)

**Full issue lifecycle testing:**

- ✅ User can create a new issue
- ✅ User can edit an existing issue
- ✅ User can delete an issue
- ✅ User can change issue status
- ✅ User can assign an issue to a team member

### 3. Import Pipeline Tests (`tests/e2e/import.spec.ts`)

**STATUS.md import workflow testing:**

- ✅ User can discover projects with STATUS.md files
- ✅ User can preview import results
- ✅ User can execute import and see imported issues
- ✅ Import prevents duplicates on re-import
- ✅ Imported issues have correct metadata

---

## Video Recording

**All tests record video automatically.**

### Configuration

Video recording is enabled in `playwright.config.ts`:

```typescript
use: {
  video: 'on',  // Record ALL tests
  screenshot: 'only-on-failure',
  trace: 'retain-on-failure',
}
```

### Video Locations

Videos are saved to:
```
test-results/
  <test-suite-name>/
    <test-name>/
      video.webm
      screenshots/
      traces/
```

Example:
```
test-results/
  auth-Authentication-Flow/
    Login-page-exists-and-is-accessible-chromium/
      video.webm
      trace.zip
```

### Viewing Videos

**Option 1: Direct playback**
```bash
# Videos are in .webm format, playable in most browsers
open test-results/**/video.webm
```

**Option 2: Playwright HTML Report**
```bash
npm run test:e2e:report
```

The HTML report includes embedded video playback for each test.

---

## Test Credentials

Test users are defined in `tests/helpers/auth.ts`:

```typescript
export const TEST_USERS = {
  admin: {
    email: 'paul@example.com',
    password: 'QA_Test_Pass_123',
  },
  member: {
    email: 'tom@example.com',
    password: 'QA_Test_Pass_123',
  },
  viewer: {
    email: 'alex@example.com',
    password: 'QA_Test_Pass_123',
  },
};
```

**Important:** These credentials must match the seeded database users.

---

## Writing New Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { login, clearAuth, TEST_USERS } from '../helpers/auth';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh
    await clearAuth(page);
    
    // Log in if testing authenticated features
    await login(page, TEST_USERS.admin);
  });

  test('User can do something', async ({ page }) => {
    // Navigate to page
    await page.goto('/feature');
    
    // Interact with UI
    await page.click('[data-testid="button"]');
    
    // Assert expected outcome
    await expect(page.locator('h1')).toContainText('Success');
  });
});
```

### Best Practices

**1. Use data-testid attributes in UI**
```tsx
// Good
<button data-testid="create-issue-button">Create Issue</button>

// Bad (fragile, breaks if text changes)
<button>Create Issue</button>
```

**2. Wait for navigation/state changes**
```typescript
// Good
await page.click('button');
await page.waitForURL('/dashboard');
await expect(page.locator('h1')).toBeVisible();

// Bad (flaky)
await page.click('button');
// Hope we're on the right page
```

**3. Clean up test data**
```typescript
test.afterEach(async ({ page }) => {
  // Delete test issues, projects, etc.
  // Or use database truncation in staging
});
```

**4. Keep tests isolated**
- Each test should work independently
- Don't rely on state from previous tests
- Use `beforeEach` to set up clean state

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
      
      - name: Start app
        run: |
          npm run build
          npm run start &
          npx wait-on http://localhost:4000
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: test-results/
          
      - name: Upload videos
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: test-videos
          path: test-results/**/video.webm
```

---

## Debugging Failed Tests

### 1. View Video Recording

```bash
# Open the HTML report
npm run test:e2e:report

# Find the failed test
# Click on it to see:
# - Video playback
# - Screenshots
# - Trace file
```

### 2. Run in Debug Mode

```bash
npm run test:e2e:debug

# This opens Playwright Inspector
# You can step through the test line-by-line
```

### 3. Run in Headed Mode

```bash
npm run test:e2e:headed

# Watch the browser execute the test in real-time
```

### 4. View Trace

```bash
# Open trace file in Playwright Trace Viewer
npx playwright show-trace test-results/<test-name>/trace.zip
```

---

## Maintenance

### Update Test Credentials

If database seeds change, update `tests/helpers/auth.ts`:

```typescript
export const TEST_USERS = {
  admin: {
    email: 'new-admin@example.com',
    password: 'NewPassword123!',
  },
  // ...
};
```

### Add New Test Suites

1. Create file in `tests/e2e/`
2. Follow naming convention: `feature.spec.ts`
3. Import helpers from `tests/helpers/`
4. Add to CI/CD pipeline

### Review Test Coverage

```bash
# Generate coverage report (if configured)
npm run test:e2e -- --reporter=html

# Review uncovered user flows
# Add tests for critical paths
```

---

## Troubleshooting

### "Browser not found" Error

```bash
npx playwright install chromium
```

### "Connection refused" Error

Ensure the app is running:
```bash
npm run dev
# Or
npm run start
```

Update `BASE_URL` in `playwright.config.ts` if needed.

### Tests Timeout

Increase timeout in `playwright.config.ts`:
```typescript
use: {
  actionTimeout: 30000,  // 30 seconds
  navigationTimeout: 60000,  // 60 seconds
}
```

### Flaky Tests

- Add explicit waits: `await page.waitForSelector()`
- Use `waitForLoadState('networkidle')`
- Avoid hard-coded `sleep()` delays
- Check for race conditions

---

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Test Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright CI/CD Guide](https://playwright.dev/docs/ci)
- [Video Recording Guide](https://playwright.dev/docs/videos)

---

## Support

Questions or issues with E2E testing?
- Check `/tests/README.md` (this file)
- Review Playwright docs
- Ask the team in #qa-testing channel
