/**
 * Test Cleanup Utility
 * 
 * Tracks and deletes issues created during test runs.
 * Ensures no test artifacts remain in the database.
 * 
 * Usage:
 *   import { TestCleanup } from '../helpers/cleanup';
 *   const cleanup = new TestCleanup();
 *   cleanup.track(issueId);       // in test
 *   await cleanup.run();           // in afterAll
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const API = `${BASE_URL}/api/v1`;

export class TestCleanup {
  private issueIds: string[] = [];
  private token: string | null = null;
  private ip: string;

  constructor(ip = '10.0.250.1') {
    this.ip = ip;
  }

  track(id: string) {
    if (id && !this.issueIds.includes(id)) {
      this.issueIds.push(id);
    }
  }

  private async getToken(): Promise<string | null> {
    if (this.token) return this.token;
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': this.ip },
        body: JSON.stringify({ email: 'paul@example.com', password: 'Password123!' }),
      });
      if (res.ok) {
        this.token = (await res.json()).token;
        return this.token;
      }
    } catch { /* best effort */ }
    return null;
  }

  async run(): Promise<{ deleted: number; failed: number }> {
    if (this.issueIds.length === 0) return { deleted: 0, failed: 0 };
    const token = await this.getToken();
    if (!token) {
      console.warn(`[cleanup] Auth failed. ${this.issueIds.length} test issues NOT cleaned.`);
      return { deleted: 0, failed: this.issueIds.length };
    }

    let deleted = 0, failed = 0;
    for (const id of this.issueIds) {
      try {
        const res = await fetch(`${API}/issues/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}`, 'X-Forwarded-For': this.ip },
        });
        (res.ok || res.status === 404) ? deleted++ : failed++;
      } catch { failed++; }
    }
    if (deleted) console.log(`[cleanup] Deleted ${deleted} test issue(s)`);
    if (failed) console.warn(`[cleanup] Failed to delete ${failed} test issue(s)`);
    this.issueIds = [];
    return { deleted, failed };
  }
}

/** Bulk cleanup: find and delete issues matching test title patterns */
export async function cleanupOrphanedTestIssues(token: string, ip = '10.0.250.1'): Promise<number> {
  const PATTERNS = [
    'API Test Issue', 'To Be Deleted', 'XSS Test Issue', 'Status Test',
    'Assign Test', 'Original Title', 'To Delete', 'Proto pollution test',
    'SQL injection test', 'Safe HTML Test', 'Test Issue ',
  ];
  let totalDeleted = 0;
  try {
    const res = await fetch(`${API}/issues`, {
      headers: { 'Authorization': `Bearer ${token}`, 'X-Forwarded-For': ip },
    });
    if (!res.ok) return 0;
    const data = await res.json();
    const issues = data.data || data.issues || data || [];
    for (const issue of issues) {
      if (PATTERNS.some(p => issue.title?.startsWith(p))) {
        const d = await fetch(`${API}/issues/${issue.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}`, 'X-Forwarded-For': ip },
        });
        if (d.ok) totalDeleted++;
      }
    }
  } catch { /* best effort */ }
  if (totalDeleted) console.log(`[cleanup] Bulk-deleted ${totalDeleted} orphaned test issue(s)`);
  return totalDeleted;
}
