import { test, expect, Page, ConsoleMessage } from '@playwright/test';
import { clearAuth } from '../helpers/auth';
import fs from 'fs';
import path from 'path';

/**
 * Browser Console Error Testing
 * 
 * Systematically checks all Mission Control pages for:
 * - JavaScript errors
 * - React warnings
 * - Failed network requests
 * - Console errors
 * - CORS issues
 */

interface PageError {
  page: string;
  url: string;
  timestamp: string;
  type: 'error' | 'warning' | 'network' | 'info';
  message: string;
  stack?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

const errors: PageError[] = [];
const networkErrors: { url: string; status: number; statusText: string }[] = [];

// Pages to test
const PAGES = [
  { path: '/', name: 'Dashboard', requiresAuth: true },
  { path: '/login', name: 'Login', requiresAuth: false },
  { path: '/projects', name: 'Projects', requiresAuth: true },
  { path: '/board', name: 'Kanban Board', requiresAuth: true },
  { path: '/issues', name: 'All Issues', requiresAuth: true },
  { path: '/my-issues', name: 'My Issues', requiresAuth: true },
  { path: '/settings', name: 'Settings', requiresAuth: true },
];

function captureConsoleMessage(msg: ConsoleMessage, pageName: string, pageUrl: string) {
  const type = msg.type();
  const text = msg.text();
  
  // Filter out noise (HMR, Next.js dev messages, etc.)
  if (text.includes('Download the React DevTools')) return;
  if (text.includes('[HMR]')) return;
  if (text.includes('[Fast Refresh]')) return;
  if (text.includes('Turbopack')) return;
  
  // Only capture errors and warnings
  if (type === 'error' || type === 'warning') {
    const error: PageError = {
      page: pageName,
      url: pageUrl,
      timestamp: new Date().toISOString(),
      type: type === 'error' ? 'error' : 'warning',
      message: text,
      stack: msg.location() ? `${msg.location().url}:${msg.location().lineNumber}:${msg.location().columnNumber}` : undefined,
      severity: determineSeverity(text, type),
    };
    
    errors.push(error);
  }
}

function determineSeverity(message: string, type: string): 'critical' | 'high' | 'medium' | 'low' {
  // Critical: Crashes, undefined errors, CORS
  if (message.includes('Cannot read property') || 
      message.includes('is not a function') ||
      message.includes('CORS') ||
      message.includes('Failed to fetch') ||
      message.includes('Network request failed')) {
    return 'critical';
  }
  
  // High: React errors, null references
  if (type === 'error' && (
      message.includes('React') ||
      message.includes('undefined') ||
      message.includes('null')
  )) {
    return 'high';
  }
  
  // Medium: Warnings
  if (type === 'warning') {
    return 'medium';
  }
  
  // Low: Everything else
  return 'low';
}

async function checkPage(page: Page, pagePath: string, pageName: string, isAuthenticated: boolean) {
  console.log(`\nChecking ${pageName} (${pagePath})...`);
  
  // Navigate to page
  await page.goto(pagePath);
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Get current URL (might have redirected)
  const currentUrl = page.url();
  
  // Check if redirected to login (for protected pages)
  if (!isAuthenticated && currentUrl.includes('/login')) {
    console.log(`  ✓ Correctly redirected to login (protected page)`);
  }
  
  // Wait a bit for any async operations
  await page.waitForTimeout(2000);
  
  // Take screenshot
  const screenshotDir = path.join(__dirname, '../test-results/console-errors');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  const sanitizedName = pageName.replace(/\s+/g, '-').toLowerCase();
  const authState = isAuthenticated ? 'authenticated' : 'unauthenticated';
  await page.screenshot({
    path: path.join(screenshotDir, `${sanitizedName}-${authState}.png`),
    fullPage: true,
  });
  
  console.log(`  ✓ Screenshot saved`);
}

test.describe('Browser Console Errors - Unauthenticated', () => {
  // Prevent auto-loading auth cookies for unauthenticated tests
  test.use({ storageState: undefined });

  test.beforeEach(async ({ page }) => {
    // Clear any existing auth
    await clearAuth(page);
    
    // Set up console message listener
    page.on('console', (msg) => captureConsoleMessage(msg, 'unknown', page.url()));
    
    // Set up network error listener
    page.on('response', async (response) => {
      if (response.status() >= 400) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
        });
      }
    });
  });

  for (const { path: pagePath, name: pageName, requiresAuth } of PAGES) {
    test(`Check ${pageName} - unauthenticated`, async ({ page }) => {
      // Update console listener with correct page name
      page.removeAllListeners('console');
      page.on('console', (msg) => captureConsoleMessage(msg, pageName, page.url()));
      
      await checkPage(page, pagePath, pageName, false);
      
      // If this is a protected page, verify redirect to login
      if (requiresAuth && pagePath !== '/login') {
        await page.waitForTimeout(1000);
        const finalUrl = page.url();
        if (finalUrl.includes('/login')) {
          console.log(`  ✓ Protected route redirects to login`);
        } else {
          errors.push({
            page: pageName,
            url: finalUrl,
            timestamp: new Date().toISOString(),
            type: 'error',
            message: `Protected page did not redirect to login. Current URL: ${finalUrl}`,
            severity: 'high',
          });
        }
      }
    });
  }
});

test.describe('Browser Console Errors - Authenticated', () => {
  // Uses storageState for authentication (no login needed)
  
  test.beforeEach(async ({ page }) => {
    // Set up console and network listeners
    page.on('console', (msg) => captureConsoleMessage(msg, 'authenticated', page.url()));
    page.on('response', async (response) => {
      if (response.status() >= 400) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
        });
      }
    });
  });

  for (const { path: pagePath, name: pageName } of PAGES.filter(p => p.requiresAuth)) {
    test(`Check ${pageName} - authenticated`, async ({ page }) => {
      // Update console listener with correct page name
      page.removeAllListeners('console');
      page.on('console', (msg) => captureConsoleMessage(msg, pageName, page.url()));
      
      await checkPage(page, pagePath, pageName, true);
    });
  }
});

test.afterAll(async () => {
  // Generate report
  const reportPath = path.join(__dirname, '../../docs/BROWSER_CONSOLE_ERRORS.md');
  
  let report = `# Mission Control - Browser Console Error Report\n\n`;
  report += `**Generated:** ${new Date().toISOString()}\n`;
  report += `**Environment:** http://localhost:4000\n`;
  report += `**Pages Tested:** ${PAGES.length}\n\n`;
  
  report += `---\n\n`;
  
  // Summary
  const criticalErrors = errors.filter(e => e.severity === 'critical');
  const highErrors = errors.filter(e => e.severity === 'high');
  const mediumErrors = errors.filter(e => e.severity === 'medium');
  const lowErrors = errors.filter(e => e.severity === 'low');
  
  report += `## Summary\n\n`;
  report += `| Severity | Count |\n`;
  report += `|----------|-------|\n`;
  report += `| 🔴 Critical | ${criticalErrors.length} |\n`;
  report += `| 🟠 High | ${highErrors.length} |\n`;
  report += `| 🟡 Medium | ${mediumErrors.length} |\n`;
  report += `| 🟢 Low | ${lowErrors.length} |\n`;
  report += `| **Total** | **${errors.length}** |\n\n`;
  
  if (networkErrors.length > 0) {
    report += `**Network Errors:** ${networkErrors.length}\n\n`;
  }
  
  report += `---\n\n`;
  
  // Critical errors first
  if (criticalErrors.length > 0) {
    report += `## 🔴 Critical Errors (${criticalErrors.length})\n\n`;
    for (const error of criticalErrors) {
      report += `### ${error.page}\n\n`;
      report += `**URL:** \`${error.url}\`\n\n`;
      report += `**Message:**\n\`\`\`\n${error.message}\n\`\`\`\n\n`;
      if (error.stack) {
        report += `**Location:** \`${error.stack}\`\n\n`;
      }
      report += `**Timestamp:** ${error.timestamp}\n\n`;
      report += `---\n\n`;
    }
  }
  
  // High errors
  if (highErrors.length > 0) {
    report += `## 🟠 High Priority Errors (${highErrors.length})\n\n`;
    for (const error of highErrors) {
      report += `### ${error.page}\n\n`;
      report += `**URL:** \`${error.url}\`\n\n`;
      report += `**Message:**\n\`\`\`\n${error.message}\n\`\`\`\n\n`;
      if (error.stack) {
        report += `**Location:** \`${error.stack}\`\n\n`;
      }
      report += `---\n\n`;
    }
  }
  
  // Medium warnings
  if (mediumErrors.length > 0) {
    report += `## 🟡 Medium Priority Warnings (${mediumErrors.length})\n\n`;
    for (const error of mediumErrors) {
      report += `- **${error.page}:** ${error.message}\n`;
    }
    report += `\n---\n\n`;
  }
  
  // Low priority
  if (lowErrors.length > 0) {
    report += `## 🟢 Low Priority (${lowErrors.length})\n\n`;
    report += `<details>\n<summary>Click to expand</summary>\n\n`;
    for (const error of lowErrors) {
      report += `- **${error.page}:** ${error.message}\n`;
    }
    report += `\n</details>\n\n`;
    report += `---\n\n`;
  }
  
  // Network errors
  if (networkErrors.length > 0) {
    report += `## Network Errors\n\n`;
    report += `| URL | Status | Status Text |\n`;
    report += `|-----|--------|-------------|\n`;
    for (const netErr of networkErrors) {
      report += `| \`${netErr.url}\` | ${netErr.status} | ${netErr.statusText} |\n`;
    }
    report += `\n---\n\n`;
  }
  
  // No errors
  if (errors.length === 0 && networkErrors.length === 0) {
    report += `## ✅ No Errors Found!\n\n`;
    report += `All pages loaded without console errors or warnings.\n\n`;
  }
  
  // Screenshots
  report += `## Screenshots\n\n`;
  report += `Screenshots saved to: \`test-results/console-errors/\`\n\n`;
  for (const { name } of PAGES) {
    const sanitizedName = name.replace(/\s+/g, '-').toLowerCase();
    report += `- ${name}:\n`;
    report += `  - Unauthenticated: \`${sanitizedName}-unauthenticated.png\`\n`;
    if (PAGES.find(p => p.name === name)?.requiresAuth) {
      report += `  - Authenticated: \`${sanitizedName}-authenticated.png\`\n`;
    }
  }
  
  report += `\n---\n\n`;
  report += `## Test Details\n\n`;
  report += `- **Test Framework:** Playwright\n`;
  report += `- **Browser:** Chromium\n`;
  report += `- **Test Duration:** ~2-3 minutes\n`;
  report += `- **Credentials Used:** paul@example.com / password123\n\n`;
  
  // Write report
  fs.writeFileSync(reportPath, report);
  console.log(`\n✅ Report generated: ${reportPath}`);
  console.log(`📊 Total errors found: ${errors.length}`);
  console.log(`   🔴 Critical: ${criticalErrors.length}`);
  console.log(`   🟠 High: ${highErrors.length}`);
  console.log(`   🟡 Medium: ${mediumErrors.length}`);
  console.log(`   🟢 Low: ${lowErrors.length}`);
  if (networkErrors.length > 0) {
    console.log(`   🌐 Network errors: ${networkErrors.length}`);
  }
});
