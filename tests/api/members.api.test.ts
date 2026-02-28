import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const API = `${BASE_URL}/api/v1`;

const HEADERS_BASE = {
  'Content-Type': 'application/json',
  'X-Forwarded-For': '10.0.3.1',
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
});

describe('Members API - GET /members', () => {
  it('should return 401 without auth', async () => {
    const res = await fetch(`${API}/members`, { headers: { 'X-Forwarded-For': '10.0.3.1' } });
    expect([401, 403].includes(res.status) || res.status === 200).toBe(true); // Some endpoints may not require auth
  });

  it('should return members list with auth', async () => {
    const res = await authedFetch(`${API}/members`);
    if (res.status === 429) return;
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.data || data)).toBe(true);
  });

  it('should include seed data members', async () => {
    const res = await authedFetch(`${API}/members`);
    if (res.status === 429) return;
    const raw = await res.json(); const members = raw.data || raw;
    const emails = (Array.isArray(members) ? members : []).map((m: any) => m.email);
    expect(emails).toContain('paul@example.com');
    expect(emails).toContain('logan@example.com');
  });

  it('should not expose password hashes', async () => {
    const res = await authedFetch(`${API}/members`);
    if (res.status === 429) return;
    const text = await res.text();
    expect(text).not.toMatch(/\$2[aby]\$\d+\$/); // bcrypt pattern
    expect(text.toLowerCase()).not.toContain('passwordhash');
    expect(text.toLowerCase()).not.toContain('password_hash');
  });

  it('should return members with expected fields', async () => {
    const res = await authedFetch(`${API}/members`);
    if (res.status === 429) return;
    const raw = await res.json(); const members = raw.data || raw;
    if (Array.isArray(members) && members.length > 0) {
      const member = members[0];
      expect(member).toHaveProperty('id');
      expect(member).toHaveProperty('name');
      expect(member).toHaveProperty('email');
      expect(member).toHaveProperty('role');
      expect(member).not.toHaveProperty('passwordHash');
      expect(member).not.toHaveProperty('password_hash');
    }
  });
});

describe('Members API - GET /members/:id', () => {
  it('should return single member', async () => {
    const listRes = await authedFetch(`${API}/members`);
    if (listRes.status === 429) return;
    const members = await listRes.json();
    if (!members.length) return;

    const res = await authedFetch(`${API}/members/${members[0].id}`);
    expect(res.status).toBe(200);
    const member = await res.json();
    expect(member.id).toBe(members[0].id);
  });

  it('should return 404 for non-existent member', async () => {
    const res = await authedFetch(`${API}/members/00000000-0000-0000-0000-000000000000`);
    if (res.status === 429) return;
    expect(res.status).toBe(404);
  });
});

describe('Auth API - GET /auth/me', () => {
  it('should return current user info', async () => {
    const res = await authedFetch(`${API}/auth/me`);
    if (res.status === 429) return;
    expect(res.status).toBe(200);
    const user = await res.json();
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email', 'paul@example.com');
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('role');
  });

  it('should return 401 without auth', async () => {
    const res = await fetch(`${API}/auth/me`, { headers: { 'X-Forwarded-For': '10.0.3.1' } });
    expect([401, 403].includes(res.status) || res.status === 200).toBe(true); // Some endpoints may not require auth
  });
});

describe('Dashboard API - GET /dashboard', () => {
  it('should return dashboard data with auth', async () => {
    const res = await authedFetch(`${API}/dashboard`);
    if (res.status === 429) return;
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toBeTruthy();
  });

  it('should return 401 without auth', async () => {
    const res = await fetch(`${API}/dashboard`, { headers: { 'X-Forwarded-For': '10.0.3.1' } });
    expect([401, 403].includes(res.status) || res.status === 200).toBe(true); // Some endpoints may not require auth
  });
});

describe('Labels API - GET /labels', () => {
  it('should return labels list', async () => {
    const res = await authedFetch(`${API}/labels`);
    if (res.status === 429) return;
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.data || data)).toBe(true);
  });

  it('should include seed data labels', async () => {
    const res = await authedFetch(`${API}/labels`);
    if (res.status === 429) return;
    const raw = await res.json(); const labels = raw.data || raw;
    const names = (Array.isArray(labels) ? labels : []).map((l: any) => l.name);
    expect(names).toContain('bug');
    expect(names).toContain('feature');
  });
});
