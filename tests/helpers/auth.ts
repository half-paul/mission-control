import { Page } from '@playwright/test';

/**
 * Test helper functions for authentication
 */

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Default test credentials (from seed data)
 * Password: "Password123!" (from drizzle/seeds/dev.sql)
 */
export const TEST_USERS = {
  admin: {
    email: 'paul@example.com',
    password: 'Password123!',
  },
  member: {
    email: 'logan@example.com',
    password: 'Password123!',
  },
  developer: {
    email: 'alex@example.com',
    password: 'Password123!',
  },
} as const;

/**
 * Log in - NO-OP when using storageState
 * 
 * Most tests use Playwright's storageState feature to reuse authentication.
 * This helper is kept for backward compatibility and special cases.
 * 
 * @param page - Playwright page object
 * @param credentials - Email and password to use (ignored when using storageState)
 */
export async function login(page: Page, credentials: LoginCredentials = TEST_USERS.admin) {
  // When using storageState (configured in playwright.config.ts),
  // authentication is already loaded, so we just need to navigate
  await page.goto('/');
  
  // Verify we're logged in
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 2000 });
}

/**
 * Log in via the login page UI (DEPRECATED - use login() instead)
 * 
 * Note: This method is currently broken due to login redirect bug.
 * Use login() which uses API-based authentication instead.
 * 
 * @param page - Playwright page object
 * @param credentials - Email and password to use
 */
export async function loginViaUI(page: Page, credentials: LoginCredentials = TEST_USERS.admin) {
  // Navigate to login page
  await page.goto('/login');
  
  // Wait for login form to be visible
  await page.waitForSelector('form');
  
  // Fill in credentials
  await page.fill('input[name="email"], input[type="email"]', credentials.email);
  await page.fill('input[name="password"], input[type="password"]', credentials.password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for redirect after login (app redirects to / which is the dashboard)
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
}

/**
 * Log out via the logout button
 * 
 * @param page - Playwright page object
 */
export async function logout(page: Page) {
  // Click logout button (adjust selector based on actual implementation)
  await page.click('[data-testid="logout-button"], button:has-text("Logout"), button:has-text("Sign out")');
  
  // Wait for redirect to login
  await page.waitForURL('/login');
}

/**
 * Clear browser storage (cookies, localStorage, sessionStorage)
 * Useful for simulating a fresh user session
 * 
 * @param page - Playwright page object
 */
export async function clearAuth(page: Page) {
  await page.context().clearCookies();
  
  // Navigate to base URL first to ensure localStorage is accessible
  try {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  } catch (err) {
    // If page navigation fails, just clear cookies (auth is cookie-based anyway)
    console.log('Could not clear localStorage, but cookies are cleared');
  }
}
