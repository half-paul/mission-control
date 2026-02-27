import { test, expect } from '@playwright/test';
import { login, logout, clearAuth, TEST_USERS } from '../helpers/auth';

/**
 * Authentication E2E Tests
 * 
 * CRITICAL: These tests prevent regressions like the login page 404 incident.
 * All tests record video for post-deployment review.
 */

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start each test with a clean slate (no auth)
    await clearAuth(page);
  });

  test('Login page exists and is accessible', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Verify we're on the login page (not 404)
    expect(page.url()).toContain('/login');
    
    // Verify login form is visible
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"], input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Fresh user can log in with valid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Fill login form
    await page.fill('input[name="email"], input[type="email"]', TEST_USERS.admin.email);
    await page.fill('input[name="password"], input[type="password"]', TEST_USERS.admin.password);
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should redirect away from login after successful auth
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
    
    // Verify we're authenticated (not seeing login page)
    expect(page.url()).not.toContain('/login');
    
    // Verify we can see protected content (not 401 error)
    const body = await page.textContent('body');
    expect(body).not.toContain('401');
    expect(body).not.toContain('Unauthorized');
    expect(body).not.toContain('Authentication required');
  });

  test('Invalid credentials show error message', async ({ page }) => {
    await page.goto('/login');
    
    // Try to log in with wrong password
    await page.fill('input[name="email"], input[type="email"]', TEST_USERS.admin.email);
    await page.fill('input[name="password"], input[type="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');
    
    // Should stay on login page
    await page.waitForTimeout(1000); // Wait for error to appear
    expect(page.url()).toContain('/login');
    
    // Should show error message
    const body = await page.textContent('body');
    expect(body?.toLowerCase()).toMatch(/invalid|incorrect|wrong|error/);
  });

  test('Unauthenticated user gets redirected to login', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/projects');
    
    // Should redirect to login (or show auth error)
    await page.waitForURL('/login', { timeout: 5000 }).catch(() => {});
    
    // Either redirected to login OR page shows auth error
    const url = page.url();
    const body = await page.textContent('body');
    const isProtected = url.includes('/login') || 
                        body?.includes('Authentication') || 
                        body?.includes('Sign in');
    expect(isProtected).toBeTruthy();
  });

  test('User can access protected routes after login', async ({ page }) => {
    // Log in first
    await login(page, TEST_USERS.admin);
    
    // Try to access various protected routes
    const protectedRoutes = ['/projects', '/issues', '/settings'];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      // Should NOT redirect to login
      expect(page.url()).not.toContain('/login');
      
      // Should NOT see 401 errors
      const body = await page.textContent('body');
      expect(body).not.toContain('401');
      expect(body).not.toContain('Unauthorized');
    }
  });

  test('User can log out successfully', async ({ page }) => {
    // Log in first
    await login(page, TEST_USERS.admin);
    
    // Verify we're logged in
    expect(page.url()).not.toContain('/login');
    
    // Log out
    await logout(page);
    
    // Should be on login page
    expect(page.url()).toContain('/login');
    
    // Try accessing protected page
    await page.goto('/projects');
    
    // Should redirect back to login (session cleared)
    await page.waitForURL('/login', { timeout: 5000 }).catch(() => {});
    const body = await page.textContent('body');
    const isProtected = page.url().includes('/login') || 
                        body?.includes('Authentication') || 
                        body?.includes('Sign in');
    expect(isProtected).toBeTruthy();
  });

  test('Session persists across page reloads', async ({ page }) => {
    // Log in
    await login(page, TEST_USERS.admin);
    
    // Navigate to a protected page
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should still be authenticated (not redirected to login)
    expect(page.url()).not.toContain('/login');
    
    // Should still see content (not 401)
    const body = await page.textContent('body');
    expect(body).not.toContain('401');
    expect(body).not.toContain('Unauthorized');
  });

  test('Different user roles can log in', async ({ page }) => {
    const users = [TEST_USERS.admin, TEST_USERS.member, TEST_USERS.viewer];
    
    for (const user of users) {
      // Clear session
      await clearAuth(page);
      
      // Log in as this user
      await page.goto('/login');
      await page.fill('input[name="email"], input[type="email"]', user.email);
      await page.fill('input[name="password"], input[type="password"]', user.password);
      await page.click('button[type="submit"]');
      
      // Should redirect away from login
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
      expect(page.url()).not.toContain('/login');
    }
  });
});
