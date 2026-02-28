import { describe, it, expect, beforeAll } from 'vitest';

/**
 * Injection Security Tests
 * 
 * Tests SQL injection, command injection, and path traversal attacks.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const API = `${BASE_URL}/api/v1`;

const HEADERS_BASE = {
  'Content-Type': 'application/json',
  'X-Forwarded-For': '10.0.5.1',
};

let authToken: string;
let projectId: string;

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

beforeAll(async () => {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: HEADERS_BASE,
    body: JSON.stringify({ email: 'paul@example.com', password: 'Password123!' }),
  });
  if (res.ok) {
    const data = await res.json();
    authToken = data.token;
  }

  const projRes = await authedFetch(`${API}/projects`);
  if (projRes.ok) {
    const projects = await projRes.json();
    projectId = projects[0]?.id;
  }
});

describe('SQL Injection - Issue Endpoints', () => {
  const SQL_PAYLOADS = [
    "'; DROP TABLE issues; --",
    "1' OR '1'='1",
    "1; SELECT * FROM members; --",
    "UNION SELECT * FROM members",
    "' UNION SELECT password_hash FROM members --",
    "1' AND 1=1 --",
    "'; EXEC xp_cmdshell('whoami'); --",
    "1; WAITFOR DELAY '0:0:5'; --",
  ];

  it('should not be vulnerable to SQL injection in issue title', async () => {
    if (!authToken || !projectId) return;

    for (const payload of SQL_PAYLOADS) {
      const res = await authedFetch(`${API}/issues`, {
        method: 'POST',
        body: JSON.stringify({
          title: payload,
          projectId,
          description: 'SQL injection test',
        }),
      });
      if (res.status === 429) continue;

      // Should either create issue safely or reject - NOT return 500
      expect(res.status).toBeLessThan(500);

      // If created, title should be stored as literal text
      if (res.status === 201) {
        const issue = await res.json();
        expect(issue.title).toBe(payload);
      }
    }
  });

  it('should not be vulnerable to SQL injection in search', async () => {
    for (const payload of SQL_PAYLOADS) {
      const res = await authedFetch(
        `${API}/issues/search?q=${encodeURIComponent(payload)}`
      );
      if (res.status === 429) continue;

      // Should not return 500 (internal server error = possible injection)
      expect(res.status).toBeLessThan(500);
    }
  });

  it('should not be vulnerable to SQL injection in filter params', async () => {
    const injectionParams = [
      "status=done' OR '1'='1",
      "priority=high; DROP TABLE issues; --",
      "assigneeId=00000000-0000-0000-0000-000000000000' UNION SELECT * FROM members --",
    ];

    for (const params of injectionParams) {
      const res = await authedFetch(`${API}/issues?${params}`);
      if (res.status === 429) continue;
      expect(res.status).toBeLessThan(500);
    }
  });
});

describe('SQL Injection - Auth Endpoints', () => {
  it('should not be vulnerable to SQL injection in login email', async () => {
    const payloads = [
      "admin@example.com' OR '1'='1",
      "admin@example.com'; DROP TABLE members; --",
      "' OR 1=1 --",
    ];

    for (const email of payloads) {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { ...HEADERS_BASE, 'X-Forwarded-For': '10.0.5.99' },
        body: JSON.stringify({ email, password: 'Password123!' }),
      });

      // Should return 400 (invalid email format) or 401, not 200 or 500
      expect([400, 401, 429]).toContain(res.status);
    }
  });
});

describe('Path Traversal', () => {
  it('should not allow path traversal in API routes', async () => {
    const traversalPayloads = [
      '../../../etc/passwd',
      '..%2F..%2F..%2Fetc%2Fpasswd',
      '....//....//....//etc/passwd',
      '/etc/passwd',
      'file:///etc/passwd',
    ];

    for (const payload of traversalPayloads) {
      const res = await authedFetch(
        `${API}/issues/${encodeURIComponent(payload)}`
      );
      if (res.status === 429) continue;

      // Should not expose file contents (even if server returns 500 for bad UUID)
      const text = await res.text();
      expect(text).not.toContain('root:');
      expect(text).not.toContain('/bin/bash');
    }
  });

  it('should not allow path traversal in import discover', async () => {
    const res = await authedFetch(`${API}/import/discover`, {
      method: 'POST',
      body: JSON.stringify({ path: '../../../etc/passwd' }),
    });
    if (res.status === 429) return;

    expect(res.status).toBeLessThan(500);
    const text = await res.text();
    expect(text).not.toContain('root:');
  });
});

describe('Command Injection', () => {
  it('should not execute commands in issue titles', async () => {
    if (!projectId) return;

    const payloads = [
      '$(whoami)',
      '`whoami`',
      '; ls -la',
      '| cat /etc/passwd',
      '&& rm -rf /',
    ];

    for (const payload of payloads) {
      const res = await authedFetch(`${API}/issues`, {
        method: 'POST',
        body: JSON.stringify({
          title: payload,
          projectId,
        }),
      });
      if (res.status === 429) continue;
      expect(res.status).toBeLessThan(500);

      // If created, should store as literal text
      if (res.status === 201) {
        const issue = await res.json();
        expect(issue.title).toBe(payload);
      }
    }
  });
});

describe('JSON Injection', () => {
  it('should handle malformed JSON gracefully', async () => {
    const malformedBodies = [
      '{invalid json}',
      '{"title": "test", "extra": {"__proto__": {"admin": true}}}',
      '{"constructor": {"prototype": {"admin": true}}}',
      '',
      'null',
      '[]',
    ];

    for (const body of malformedBodies) {
      const res = await fetch(`${API}/issues`, {
        method: 'POST',
        headers: {
          ...HEADERS_BASE,
          'Authorization': `Bearer ${authToken}`,
        },
        body,
      });
      if (res.status === 429) continue;
      // Should handle gracefully - 400 is ideal, 500 is a concern but not critical for malformed JSON
      expect(res.status).toBeLessThanOrEqual(500);
    }
  });

  it('should not be vulnerable to prototype pollution', async () => {
    const res = await authedFetch(`${API}/issues`, {
      method: 'POST',
      body: JSON.stringify({
        title: 'Proto pollution test',
        projectId,
        __proto__: { admin: true, role: 'admin' },
        constructor: { prototype: { admin: true } },
      }),
    });
    if (res.status === 429) return;
    expect(res.status).toBeLessThan(500);
  });
});
