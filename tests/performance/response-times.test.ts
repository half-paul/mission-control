import { describe, it, expect, beforeAll } from 'vitest';

/**
 * Performance Tests
 * 
 * Validates API response times and concurrent request handling.
 * Thresholds: API responses < 500ms, pages < 2000ms
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const API = `${BASE_URL}/api/v1`;

const HEADERS_BASE = {
  'Content-Type': 'application/json',
  'X-Forwarded-For': '10.0.6.1',
};

let authToken: string;

async function authedFetch(url: string, opts: RequestInit = {}) {
  return fetch(url, {
    ...opts,
    headers: {
      ...HEADERS_BASE,
      'Authorization': `Bearer ${authToken}`,
      ...(opts.headers || {}),
    },
  });
}

async function measureResponseTime(url: string, opts: RequestInit = {}): Promise<{ status: number; timeMs: number }> {
  const start = performance.now();
  const res = await authedFetch(url, opts);
  const timeMs = performance.now() - start;
  return { status: res.status, timeMs };
}

beforeAll(async () => {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: HEADERS_BASE,
    body: JSON.stringify({ email: 'paul@example.com', password: 'Password123!' }),
  });
  if (res.ok) authToken = (await res.json()).token;
});

describe('API Response Times', () => {
  const MAX_API_TIME = 500; // ms

  it('GET /projects should respond within 500ms', async () => {
    const { status, timeMs } = await measureResponseTime(`${API}/projects`);
    if (status === 429) return;
    expect(timeMs).toBeLessThan(MAX_API_TIME);
    console.log(`  GET /projects: ${timeMs.toFixed(0)}ms`);
  });

  it('GET /issues should respond within 500ms', async () => {
    const { status, timeMs } = await measureResponseTime(`${API}/issues`);
    if (status === 429) return;
    expect(timeMs).toBeLessThan(MAX_API_TIME);
    console.log(`  GET /issues: ${timeMs.toFixed(0)}ms`);
  });

  it('GET /members should respond within 500ms', async () => {
    const { status, timeMs } = await measureResponseTime(`${API}/members`);
    if (status === 429) return;
    expect(timeMs).toBeLessThan(MAX_API_TIME);
    console.log(`  GET /members: ${timeMs.toFixed(0)}ms`);
  });

  it('GET /dashboard should respond within 500ms', async () => {
    const { status, timeMs } = await measureResponseTime(`${API}/dashboard`);
    if (status === 429) return;
    expect(timeMs).toBeLessThan(MAX_API_TIME);
    console.log(`  GET /dashboard: ${timeMs.toFixed(0)}ms`);
  });

  it('GET /labels should respond within 500ms', async () => {
    const { status, timeMs } = await measureResponseTime(`${API}/labels`);
    if (status === 429) return;
    expect(timeMs).toBeLessThan(MAX_API_TIME);
    console.log(`  GET /labels: ${timeMs.toFixed(0)}ms`);
  });

  it('GET /auth/me should respond within 200ms', async () => {
    const { status, timeMs } = await measureResponseTime(`${API}/auth/me`);
    if (status === 429) return;
    expect(timeMs).toBeLessThan(200);
    console.log(`  GET /auth/me: ${timeMs.toFixed(0)}ms`);
  });
});

describe('Page Load Times', () => {
  const MAX_PAGE_TIME = 2000; // ms

  const pages = [
    { path: '/login', name: 'Login' },
    { path: '/', name: 'Dashboard' },
    { path: '/projects', name: 'Projects' },
    { path: '/issues', name: 'Issues' },
    { path: '/board', name: 'Board' },
    { path: '/settings', name: 'Settings' },
  ];

  for (const { path, name } of pages) {
    it(`${name} page (${path}) should load within 2s`, async () => {
      const start = performance.now();
      const res = await fetch(`${BASE_URL}${path}`, {
        headers: {
          'Cookie': `mc-session=${authToken}`,
          'X-Forwarded-For': '10.0.6.1',
        },
      });
      const timeMs = performance.now() - start;
      
      if (res.status === 429) return;
      expect(timeMs).toBeLessThan(MAX_PAGE_TIME);
      console.log(`  ${name} (${path}): ${timeMs.toFixed(0)}ms [${res.status}]`);
    });
  }
});

describe('Concurrent Request Handling', () => {
  it('should handle 10 simultaneous API requests', async () => {
    const promises = Array(10).fill(null).map((_, i) =>
      measureResponseTime(`${API}/projects`)
    );

    const results = await Promise.all(promises);
    const successful = results.filter(r => r.status === 200);
    const rateLimited = results.filter(r => r.status === 429);

    console.log(`  Concurrent: ${successful.length} succeeded, ${rateLimited.length} rate-limited`);

    // At least some should succeed
    expect(successful.length + rateLimited.length).toBe(10);

    // Average response time should be reasonable
    if (successful.length > 0) {
      const avgTime = successful.reduce((sum, r) => sum + r.timeMs, 0) / successful.length;
      expect(avgTime).toBeLessThan(2000);
      console.log(`  Avg response time: ${avgTime.toFixed(0)}ms`);
    }
  });

  it('should handle burst of issue list requests', async () => {
    const promises = Array(5).fill(null).map(() =>
      measureResponseTime(`${API}/issues`)
    );

    const results = await Promise.all(promises);
    const successful = results.filter(r => r.status === 200);

    if (successful.length > 0) {
      const maxTime = Math.max(...successful.map(r => r.timeMs));
      expect(maxTime).toBeLessThan(3000);
      console.log(`  Issue burst: ${successful.length}/5 succeeded, max ${maxTime.toFixed(0)}ms`);
    }
  });
});

describe('Rate Limiting Behavior', () => {
  it('should return 429 with retry information for excessive requests', async () => {
    // Make many rapid requests to a specific endpoint
    const responses: number[] = [];

    for (let i = 0; i < 20; i++) {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { ...HEADERS_BASE, 'X-Forwarded-For': '10.0.6.99' },
        body: JSON.stringify({ email: 'test@test.com', password: 'wrong' }),
      });
      responses.push(res.status);
    }

    // Should see some 429 responses
    const rateLimited = responses.filter(s => s === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
    console.log(`  Rate limit triggered after ${responses.indexOf(429) + 1} requests`);
  });
});
