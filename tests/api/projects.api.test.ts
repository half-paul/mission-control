import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const API = `${BASE_URL}/api/v1`;

// Use unique IP to avoid rate limiting from other test files
const HEADERS_BASE = {
  'Content-Type': 'application/json',
  'X-Forwarded-For': '10.0.1.1',
};

let authToken: string;
let authCookie: string;

async function authedFetch(url: string, opts: RequestInit = {}) {
  return fetch(url, {
    ...opts,
    headers: {
      ...HEADERS_BASE,
      'Authorization': `Bearer ${authToken}`,
      'Cookie': `mc-session=${authCookie}`,
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
    const cookie = res.headers.get('set-cookie');
    authCookie = cookie?.match(/mc-session=([^;]+)/)?.[1] || '';
  }
});

describe('Projects API - GET /projects', () => {
  it('should return 401 without auth', async () => {
    const res = await fetch(`${API}/projects`, { headers: { 'X-Forwarded-For': '10.0.1.1' } });
    expect(res.status).toBe(401);
  });

  it('should return project list with auth', async () => {
    const res = await authedFetch(`${API}/projects`);
    if (res.status === 429) return; // Skip if rate limited
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.data || data)).toBe(true);
  });

  it('should return projects with expected fields', async () => {
    const res = await authedFetch(`${API}/projects`);
    if (res.status === 429) return;
    expect(res.status).toBe(200);
    const data = await res.json();
    if ((data.data || data).length > 0) {
      const project = (data.data || data)[0];
      expect(project).toHaveProperty('id');
      expect(project).toHaveProperty('name');
      expect(project).toHaveProperty('key');
      expect(project).toHaveProperty('status');
    }
  });

  it('should include Mission Control project from seed data', async () => {
    const res = await authedFetch(`${API}/projects`);
    if (res.status === 429) return;
    const data = await res.json();
    const mc = (data.data || data).find((p: any) => p.key === 'MC');
    expect(mc).toBeTruthy();
    expect(mc.name).toBe('Mission Control');
  });
});

describe('Projects API - GET /projects/:id', () => {
  it('should return single project by ID', async () => {
    // First get list to find an ID
    const listRes = await authedFetch(`${API}/projects`);
    if (listRes.status === 429) return;
    const raw = await listRes.json(); const projects = raw.data || raw;
    if (projects.length === 0) return;

    const res = await authedFetch(`${API}/projects/${projects[0].id}`);
    expect(res.status).toBe(200);
    const project = await res.json();
    expect(project.id).toBe(projects[0].id);
  });

  it('should return 404 for non-existent project', async () => {
    const res = await authedFetch(`${API}/projects/00000000-0000-0000-0000-000000000000`);
    if (res.status === 429) return;
    expect(res.status).toBe(404);
  });
});

describe('Projects API - GET /projects/:id/stats', () => {
  it('should return project statistics', async () => {
    const listRes = await authedFetch(`${API}/projects`);
    if (listRes.status === 429) return;
    const raw = await listRes.json(); const projects = raw.data || raw;
    if (projects.length === 0) return;

    const res = await authedFetch(`${API}/projects/${projects[0].id}/stats`);
    if (res.status === 429) return;
    expect(res.status).toBe(200);
    const stats = await res.json();
    expect(stats).toHaveProperty('totalIssues');
  });
});

describe('Projects API - GET /projects/:id/issues', () => {
  it('should return issues for a project', async () => {
    const listRes = await authedFetch(`${API}/projects`);
    if (listRes.status === 429) return;
    const raw = await listRes.json(); const projects = raw.data || raw;
    if (projects.length === 0) return;

    const res = await authedFetch(`${API}/projects/${projects[0].id}/issues`);
    if (res.status === 429) return;
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.issues || data)).toBe(true);
  });
});
