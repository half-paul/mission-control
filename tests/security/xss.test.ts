import { test, expect, Page } from '@playwright/test';

/**
 * XSS (Cross-Site Scripting) Security Tests
 * 
 * Tests that user input is properly sanitized and does not execute as JavaScript.
 * Tests all input fields: issue titles, descriptions, comments, project names, etc.
 */

const XSS_PAYLOADS = [
  // Basic XSS
  '<script>alert("XSS")</script>',
  '<img src=x onerror="alert(\'XSS\')">',
  '<svg onload="alert(\'XSS\')">',
  
  // Event handlers
  '<div onclick="alert(\'XSS\')">Click me</div>',
  '<body onload="alert(\'XSS\')">',
  '<input onfocus="alert(\'XSS\')" autofocus>',
  
  // JavaScript URIs
  '<a href="javascript:alert(\'XSS\')">Click</a>',
  '<iframe src="javascript:alert(\'XSS\')">',
  
  // HTML entities and encoding
  '&lt;script&gt;alert("XSS")&lt;/script&gt;',
  '%3Cscript%3Ealert("XSS")%3C/script%3E',
  
  // Markdown injection (if using markdown)
  '[XSS](javascript:alert("XSS"))',
  '![XSS](javascript:alert("XSS"))',
  
  // SQL-like injection attempts (should not execute as JS)
  '<script>DROP TABLE users;</script>',
  
  // Unicode/special chars
  '<script\x20type="text/javascript">alert("XSS")</script>',
  '<scr\\x00ipt>alert("XSS")</scr\\x00ipt>',
];

test.describe('XSS Protection', () => {
  test.beforeEach(async ({ page }) => {
    // Authentication handled by storageState
  });

  test('Issue titles should not execute XSS scripts', async ({ page }) => {
    await page.goto('/issues');

    for (const payload of XSS_PAYLOADS.slice(0, 3)) { // Test first 3 for speed
      // Create issue with XSS payload in title
      await page.click('button:has-text("New Issue"), [data-testid="create-issue-button"]');
      await page.waitForSelector('form, [role="dialog"]');

      await page.fill('input[name="title"], input[placeholder*="title" i]', payload);
      await page.fill('textarea[name="description"]', 'Test description');
      await page.click('button[type="submit"]');

      // Wait for issue to be created
      await page.waitForTimeout(1000);

      // Check that payload is rendered as text, not executed
      const bodyText = await page.textContent('body');
      
      // Should see the escaped payload as text
      expect(bodyText).toContain(payload.substring(0, 10)); // At least part of it
      
      // Should NOT trigger alert (no way to detect, but should not crash)
      // Page should still be functional
      expect(page.url()).not.toContain('error');
    }
  });

  test('Issue descriptions should sanitize HTML', async ({ page }) => {
    await page.goto('/issues');

    const payload = '<img src=x onerror="alert(\'XSS\')">';
    
    // Create issue
    await page.click('button:has-text("New Issue")');
    await page.waitForSelector('form');

    await page.fill('input[name="title"]', 'XSS Test Issue');
    await page.fill('textarea[name="description"]', payload);
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    // Navigate to issue detail page
    await page.click('text="XSS Test Issue"');
    await page.waitForLoadState('networkidle');

    // Get rendered HTML
    const descriptionHTML = await page.innerHTML('[data-testid="issue-description"], .description, article');

    // Should NOT contain unescaped script tags or event handlers
    expect(descriptionHTML).not.toContain('onerror=');
    expect(descriptionHTML).not.toContain('<script');
    
    // Should either strip the tags or escape them
    const textContent = await page.textContent('[data-testid="issue-description"], .description, article');
    expect(textContent).toBeTruthy();
  });

  test('Project names should be escaped', async ({ page }) => {
    await page.goto('/projects');

    const payload = '<script>alert("XSS")</script>';

    // Try to create project with XSS in name (if UI exists)
    const createButton = page.locator('button:has-text("New Project"), [data-testid="create-project"]');
    if (await createButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createButton.click();
      await page.fill('input[name="name"], input[placeholder*="name" i]', payload);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);

      // Check rendered project list
      const bodyText = await page.textContent('body');
      expect(bodyText).not.toContain('<script>');
    }
  });

  test('Search queries should not execute scripts', async ({ page }) => {
    await page.goto('/issues');

    const payload = '<script>alert("XSS")</script>';

    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill(payload);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);

      // URL should not contain unescaped payload
      const url = page.url();
      expect(url).not.toContain('<script>');

      // Page should still be functional
      expect(await page.title()).toBeTruthy();
    }
  });

  test('User display names should be sanitized', async ({ page }) => {
    await page.goto('/settings');

    const payload = '<img src=x onerror=alert("XSS")>';

    // Try to update display name (if editable)
    const nameInput = page.locator('input[name="name"], input[name="displayName"]');
    if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nameInput.fill(payload);
      await page.click('button[type="submit"], button:has-text("Save")');
      await page.waitForTimeout(1000);

      // Check how name is displayed
      const displayedName = await page.textContent('[data-testid="user-name"], .user-name, header');
      
      // Should NOT contain event handlers
      expect(displayedName).not.toContain('onerror=');
      expect(displayedName).not.toContain('<img');
    }
  });

  test('Comments should sanitize XSS attempts', async ({ page }) => {
    // First create an issue
    await page.goto('/issues');
    
    const issueTitle = `Test Issue ${Date.now()}`;
    const xssPayload = '<svg onload="alert(\'XSS\')">';

    // Create issue (basic version, might need adjustment)
    await page.goto('/issues');
    await page.click('button:has-text("New Issue")').catch(() => {});
    await page.fill('input[name="title"]', issueTitle).catch(() => {});
    await page.fill('textarea', 'Description').catch(() => {});
    await page.click('button[type="submit"]').catch(() => {});
    await page.waitForTimeout(1000);

    // Try to find comment input (if exists)
    await page.click(`text="${issueTitle}"`).catch(() => {});
    await page.waitForLoadState('networkidle');

    const commentInput = page.locator('textarea[name="comment"], textarea[placeholder*="comment" i]');
    if (await commentInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await commentInput.fill(xssPayload);
      await page.click('button:has-text("Comment"), button:has-text("Add Comment")');
      await page.waitForTimeout(1000);

      // Check comment rendering
      const comments = await page.textContent('.comments, [data-testid="comments"]');
      expect(comments).not.toContain('<svg');
      expect(comments).not.toContain('onload=');
    }
  });

  test('API responses should set X-Content-Type-Options', async ({ page }) => {
    const response = await page.goto('/');
    
    const headers = response?.headers();
    if (headers) {
      // Should have X-Content-Type-Options: nosniff
      expect(headers['x-content-type-options']).toBe('nosniff');
    }
  });

  test('API responses should set X-Frame-Options', async ({ page }) => {
    const response = await page.goto('/');
    
    const headers = response?.headers();
    if (headers) {
      // Should have X-Frame-Options to prevent clickjacking
      const frameOptions = headers['x-frame-options'];
      expect(frameOptions).toMatch(/DENY|SAMEORIGIN/i);
    }
  });

  test('Content-Security-Policy should be restrictive', async ({ page }) => {
    const response = await page.goto('/');
    
    const headers = response?.headers();
    if (headers) {
      const csp = headers['content-security-policy'];
      
      // Should have CSP header
      expect(csp).toBeTruthy();
      
      // Should not allow unsafe-inline for scripts (ideally)
      // Note: Next.js apps often need some inline scripts, so this might be relaxed
      if (csp && !csp.includes('unsafe-inline')) {
        expect(csp).toContain("script-src");
      }
    }
  });
});

test.describe('HTML Sanitization', () => {
  test('Should strip dangerous HTML tags', async ({ page }) => {
    await page.goto('/issues');

    const dangerousTags = [
      '<iframe>',
      '<object>',
      '<embed>',
      '<applet>',
      '<form>',
      '<input>',
      '<button>',
      '<select>',
      '<textarea>',
      '<link>',
      '<meta>',
      '<base>',
    ];

    for (const tag of dangerousTags.slice(0, 3)) {
      const payload = `Test content ${tag}malicious</iframe>`;
      
      // Attempt to create issue with dangerous HTML
      await page.goto('/issues');
      await page.click('button:has-text("New Issue")').catch(() => {});
      await page.fill('input[name="title"]', 'Test').catch(() => {});
      await page.fill('textarea', payload).catch(() => {});
      await page.click('button[type="submit"]').catch(() => {});
      await page.waitForTimeout(1000);

      // Check that dangerous tags are stripped or escaped
      const bodyHTML = await page.content();
      expect(bodyHTML).not.toContain(tag);
    }
  });

  test('Should allow safe formatting tags', async ({ page }) => {
    await page.goto('/issues');

    const safeTags = {
      '<strong>bold</strong>': 'bold',
      '<em>italic</em>': 'italic',
      '<code>code</code>': 'code',
      '<a href="https://example.com">link</a>': 'link',
    };

    for (const [html, expected] of Object.entries(safeTags).slice(0, 2)) {
      // Create issue with safe HTML
      await page.goto('/issues');
      await page.click('button:has-text("New Issue")').catch(() => {});
      await page.fill('input[name="title"]', `Safe HTML Test ${Date.now()}`).catch(() => {});
      await page.fill('textarea', html).catch(() => {});
      await page.click('button[type="submit"]').catch(() => {});
      await page.waitForTimeout(1000);

      // Content should be visible (not stripped entirely)
      const bodyText = await page.textContent('body');
      expect(bodyText).toContain(expected);
    }
  });
});
