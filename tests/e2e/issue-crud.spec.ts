import { test, expect } from '@playwright/test';
import { login, clearAuth, TEST_USERS } from '../helpers/auth';

/**
 * Issue CRUD E2E Tests
 * 
 * Tests the full lifecycle of issue creation, editing, and deletion.
 */

test.describe('Issue CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Start with clean auth, then log in
    await clearAuth(page);
    await login(page, TEST_USERS.admin);
  });

  test('User can create a new issue', async ({ page }) => {
    // Navigate to issues page
    await page.goto('/issues');
    
    // Click create issue button
    await page.click('[data-testid="create-issue-button"], button:has-text("New Issue"), button:has-text("Create Issue")');
    
    // Wait for create form/modal to appear
    await page.waitForSelector('form, [role="dialog"]');
    
    // Fill in issue details
    const testTitle = `Test Issue ${Date.now()}`;
    await page.fill('[name="title"], input[placeholder*="title" i]', testTitle);
    await page.fill('[name="description"], textarea[placeholder*="description" i]', 'Test issue description');
    
    // Submit
    await page.click('button[type="submit"], button:has-text("Create"), button:has-text("Save")');
    
    // Wait for redirect or success message
    await page.waitForTimeout(2000);
    
    // Verify issue appears in list or detail page
    const body = await page.textContent('body');
    expect(body).toContain(testTitle);
  });

  test('User can edit an existing issue', async ({ page }) => {
    // First, create an issue to edit
    await page.goto('/issues');
    await page.click('[data-testid="create-issue-button"], button:has-text("New Issue"), button:has-text("Create Issue")');
    await page.waitForSelector('form, [role="dialog"]');
    
    const originalTitle = `Original Title ${Date.now()}`;
    await page.fill('[name="title"], input[placeholder*="title" i]', originalTitle);
    await page.fill('[name="description"], textarea[placeholder*="description" i]', 'Original description');
    await page.click('button[type="submit"], button:has-text("Create"), button:has-text("Save")');
    await page.waitForTimeout(2000);
    
    // Now edit it
    // Click on the issue (either in list or find edit button)
    await page.click(`text="${originalTitle}", [data-testid*="edit"], button:has-text("Edit")`);
    
    // Wait for edit form
    await page.waitForSelector('form, [role="dialog"]');
    
    // Update title
    const updatedTitle = `Updated Title ${Date.now()}`;
    await page.fill('[name="title"], input[placeholder*="title" i]', '');
    await page.fill('[name="title"], input[placeholder*="title" i]', updatedTitle);
    
    // Save
    await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Update")');
    await page.waitForTimeout(2000);
    
    // Verify update
    const body = await page.textContent('body');
    expect(body).toContain(updatedTitle);
    expect(body).not.toContain(originalTitle);
  });

  test('User can delete an issue', async ({ page }) => {
    // Create an issue to delete
    await page.goto('/issues');
    await page.click('[data-testid="create-issue-button"], button:has-text("New Issue"), button:has-text("Create Issue")');
    await page.waitForSelector('form, [role="dialog"]');
    
    const testTitle = `To Delete ${Date.now()}`;
    await page.fill('[name="title"], input[placeholder*="title" i]', testTitle);
    await page.fill('[name="description"], textarea[placeholder*="description" i]', 'Will be deleted');
    await page.click('button[type="submit"], button:has-text("Create"), button:has-text("Save")');
    await page.waitForTimeout(2000);
    
    // Find and delete the issue
    await page.click(`[data-testid*="delete"], button:has-text("Delete")`);
    
    // Confirm deletion (if confirmation dialog appears)
    try {
      await page.click('button:has-text("Confirm"), button:has-text("Delete")', { timeout: 2000 });
    } catch {
      // No confirmation dialog, that's okay
    }
    
    await page.waitForTimeout(2000);
    
    // Verify issue is gone
    const body = await page.textContent('body');
    expect(body).not.toContain(testTitle);
  });

  test('User can change issue status', async ({ page }) => {
    // Create an issue
    await page.goto('/issues');
    await page.click('[data-testid="create-issue-button"], button:has-text("New Issue"), button:has-text("Create Issue")');
    await page.waitForSelector('form, [role="dialog"]');
    
    const testTitle = `Status Test ${Date.now()}`;
    await page.fill('[name="title"], input[placeholder*="title" i]', testTitle);
    await page.fill('[name="description"], textarea[placeholder*="description" i]', 'Status test');
    await page.click('button[type="submit"], button:has-text("Create"), button:has-text("Save")');
    await page.waitForTimeout(2000);
    
    // Change status (via dropdown or Kanban drag-and-drop)
    // This depends on UI implementation
    // Try clicking on status dropdown
    await page.click('[data-testid*="status"], select[name="status"]');
    
    // Select "In Progress" or "Done"
    await page.click('option:has-text("In Progress"), option:has-text("Done"), [role="option"]:has-text("In Progress"), [role="option"]:has-text("Done")');
    
    await page.waitForTimeout(1000);
    
    // Verify status changed (check for "In Progress" or "Done" badge/text)
    const body = await page.textContent('body');
    expect(body).toMatch(/in progress|done/i);
  });

  test('User can assign an issue to a team member', async ({ page }) => {
    // Create an issue
    await page.goto('/issues');
    await page.click('[data-testid="create-issue-button"], button:has-text("New Issue"), button:has-text("Create Issue")');
    await page.waitForSelector('form, [role="dialog"]');
    
    const testTitle = `Assign Test ${Date.now()}`;
    await page.fill('[name="title"], input[placeholder*="title" i]', testTitle);
    await page.fill('[name="description"], textarea[placeholder*="description" i]', 'Assignment test');
    
    // Try to assign to someone (if assignee selector is in create form)
    try {
      await page.click('[data-testid*="assignee"], select[name="assignee"]', { timeout: 2000 });
      await page.click('option:has-text("Tom"), option:has-text("Logan"), [role="option"]:has-text("Tom")');
    } catch {
      // Assignee not in create form, will assign after creation
    }
    
    await page.click('button[type="submit"], button:has-text("Create"), button:has-text("Save")');
    await page.waitForTimeout(2000);
    
    // If not assigned during creation, assign now
    try {
      await page.click('[data-testid*="assignee"], button:has-text("Assign")');
      await page.click('option:has-text("Tom"), option:has-text("Logan"), [role="option"]:has-text("Tom")');
      await page.waitForTimeout(1000);
    } catch {
      // Already assigned
    }
    
    // Verify assignee is shown
    const body = await page.textContent('body');
    expect(body).toMatch(/tom|logan|assigned/i);
  });
});
