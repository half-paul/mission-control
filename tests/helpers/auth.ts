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
 */
export const TEST_USERS = {
  admin: {
    email: 'paul@example.com',
    password: 'QA_Test_Pass_123', // Updated during QA testing
  },
  member: {
    email: 'tom@example.com',
    password: 'QA_Test_Pass_123',
  },
  viewer: {
    email: 'alex@example.com',
    password: 'QA_Test_Pass_123',
  },
} as const;

/**
 * Log in via the login page UI
 * 
 * @param page - Playwright page object
 * @param credentials - Email and password to use
 */
export async function login(page: Page, credentials: LoginCredentials = TEST_USERS.admin) {
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
