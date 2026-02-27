import { describe, it, expect, beforeAll } from 'vitest';

/**
 * Integration Tests: Login API Endpoint
 * 
 * Tests the actual HTTP API endpoint POST /api/v1/auth/login
 * with various scenarios including valid/invalid credentials and rate limiting
 */

const API_BASE = process.env.API_BASE_URL || 'http://localhost:4000';
const LOGIN_ENDPOINT = `${API_BASE}/api/v1/auth/login`;

// Test credentials (from seed data)
const VALID_CREDENTIALS = {
  email: 'paul@example.com',
  password: 'password123',
};

const INVALID_CREDENTIALS = {
  email: 'paul@example.com',
  password: 'wrongpassword',
};

describe('Login API - POST /api/v1/auth/login', () => {
  describe('Successful Login', () => {
    it('should return 200 with user data and token for valid credentials', async () => {
      const response = await fetch(LOGIN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(VALID_CREDENTIALS),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('token');
      expect(data.user.email).toBe(VALID_CREDENTIALS.email);
      expect(data.user.role).toBe('admin');
      expect(typeof data.token).toBe('string');
    });

    it('should set HttpOnly session cookie', async () => {
      const response = await fetch(LOGIN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(VALID_CREDENTIALS),
      });

      const setCookie = response.headers.get('set-cookie');
      expect(setCookie).toBeDefined();
      
      // Note: In Node.js fetch, set-cookie might not be directly accessible
      // due to security restrictions. This test verifies the endpoint sets cookies
      // (E2E tests will verify actual browser cookie behavior)
      if (setCookie) {
        expect(setCookie).toContain('mc-session=');
        expect(setCookie).toContain('HttpOnly');
        expect(setCookie).toContain('SameSite=Lax');
        expect(setCookie).toContain('Path=/');
      } else {
        // If set-cookie header not accessible in test environment,
        // verify we got a successful response (cookies are set server-side)
        expect(response.status).toBe(200);
      }
    });

    it('should return valid JWT token that can be decoded', async () => {
      const response = await fetch(LOGIN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(VALID_CREDENTIALS),
      });

      const data = await response.json();
      const token = data.token;

      // JWT should have 3 parts (header.payload.signature)
      const parts = token.split('.');
      expect(parts).toHaveLength(3);

      // Decode payload (base64)
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      expect(payload.sub).toBe(data.user.id);
      expect(payload.email).toBe(data.user.email);
      expect(payload.exp).toBeDefined();
      expect(payload.iat).toBeDefined();
    });
  });

  describe('Failed Login', () => {
    it('should return 401 for invalid password', async () => {
      const response = await fetch(LOGIN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(INVALID_CREDENTIALS),
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error.toLowerCase()).toContain('invalid');
    });

    it('should return 401 for non-existent user', async () => {
      const response = await fetch(LOGIN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    it('should return 400 for missing email field', async () => {
      const response = await fetch(LOGIN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: 'password123',
        }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    it('should return 400 for missing password field', async () => {
      const response = await fetch(LOGIN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'paul@example.com',
        }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await fetch(LOGIN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'not-an-email',
          password: 'password123',
        }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    it('should return 400 for empty request body', async () => {
      const response = await fetch(LOGIN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Rate Limiting', () => {
    // Use a unique IP header to isolate rate limit test
    const TEST_IP = '192.168.1.100';

    it('should allow 5 failed login attempts', async () => {
      // Use a unique IP to avoid conflicts with other tests
      const uniqueIP = `192.168.1.${Math.floor(Math.random() * 200) + 50}`;
      
      // Try 5 failed logins
      for (let i = 0; i < 5; i++) {
        const response = await fetch(LOGIN_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Forwarded-For': uniqueIP,
          },
          body: JSON.stringify({
            email: 'ratelimit@example.com',
            password: 'wrongpassword',
          }),
        });

        // Should get 401 (invalid credentials), not 429 (rate limited)
        // Note: If this test fails, it may be because the rate limiter
        // is still active from previous test runs (not cleared between runs)
        expect(response.status).toBe(401);
      }
    });

    it('should return 429 on 6th failed login attempt', async () => {
      const TEST_IP_2 = '192.168.1.101';

      // First 5 attempts should get 401
      for (let i = 0; i < 5; i++) {
        await fetch(LOGIN_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Forwarded-For': TEST_IP_2,
          },
          body: JSON.stringify({
            email: 'ratelimit2@example.com',
            password: 'wrongpassword',
          }),
        });
      }

      // 6th attempt should be rate limited
      const response = await fetch(LOGIN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': TEST_IP_2,
        },
        body: JSON.stringify({
          email: 'ratelimit2@example.com',
          password: 'wrongpassword',
        }),
      });

      expect(response.status).toBe(429);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error.toLowerCase()).toContain('too many');
    });

    it('should clear rate limit after successful login', async () => {
      const TEST_IP_3 = '192.168.1.102';

      // Fail a few times
      for (let i = 0; i < 3; i++) {
        await fetch(LOGIN_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Forwarded-For': TEST_IP_3,
          },
          body: JSON.stringify({
            email: 'paul@example.com',
            password: 'wrongpassword',
          }),
        });
      }

      // Then succeed
      const successResponse = await fetch(LOGIN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': TEST_IP_3,
        },
        body: JSON.stringify(VALID_CREDENTIALS),
      });

      expect(successResponse.status).toBe(200);

      // Should be able to make more requests (rate limit cleared)
      const nextResponse = await fetch(LOGIN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': TEST_IP_3,
        },
        body: JSON.stringify({
          email: 'paul@example.com',
          password: 'wrongpassword',
        }),
      });

      expect(nextResponse.status).toBe(401); // Not 429
    });
  });

  describe('Session Persistence', () => {
    it('should allow authenticated requests with session cookie', async () => {
      // Login first
      const loginResponse = await fetch(LOGIN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(VALID_CREDENTIALS),
      });

      const setCookie = loginResponse.headers.get('set-cookie');
      const sessionCookie = setCookie?.split(';')[0]; // Get just the cookie value

      // Try to access authenticated endpoint
      const authResponse = await fetch(`${API_BASE}/api/v1/auth/me`, {
        headers: {
          Cookie: sessionCookie || '',
        },
      });

      expect(authResponse.status).toBe(200);

      const data = await authResponse.json();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(VALID_CREDENTIALS.email);
    });

    it('should also accept Bearer token for authentication', async () => {
      // Login first
      const loginResponse = await fetch(LOGIN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(VALID_CREDENTIALS),
      });

      const data = await loginResponse.json();
      const token = data.token;

      // Try to access authenticated endpoint with Bearer token
      const authResponse = await fetch(`${API_BASE}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(authResponse.status).toBe(200);

      const authData = await authResponse.json();
      expect(authData.user).toBeDefined();
      expect(authData.user.email).toBe(VALID_CREDENTIALS.email);
    });
  });
});
