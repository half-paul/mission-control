import { test as setup, expect } from '@playwright/test';
import { TEST_USERS } from '../helpers/auth';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Get base URL
  const baseURL = process.env.BASE_URL || 'http://localhost:4000';
  
  // Call login API directly (unique IP to avoid rate limiting from test runs)
  const response = await page.request.post(`${baseURL}/api/v1/auth/login`, {
    headers: {
      'X-Forwarded-For': `10.99.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    },
    data: {
      email: TEST_USERS.admin.email,
      password: TEST_USERS.admin.password,
    },
  });
  
  // Verify login succeeded
  if (!response.ok()) {
    throw new Error(`Login API failed: ${response.status()} ${response.statusText()}`);
  }
  
  // Extract session cookie from response
  const cookies = response.headers()['set-cookie'];
  if (!cookies) {
    throw new Error('Login succeeded but no session cookie returned');
  }
  
  // Parse and set session cookie
  const sessionCookie = cookies.split(';')[0];
  const [name, value] = sessionCookie.split('=');
  
  await page.context().addCookies([{
    name,
    value,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'Lax',
  }]);
  
  // Navigate to dashboard to verify auth worked
  await page.goto('/');
  await expect(page).not.toHaveURL('/login');
  
  // Save signed-in state to reuse in tests
  await page.context().storageState({ path: authFile });
});
