#!/usr/bin/env npx tsx
/**
 * Standalone cleanup script - removes orphaned test issues.
 * Run: npx tsx tests/scripts/cleanup-test-data.ts
 */
import { cleanupOrphanedTestIssues } from '../helpers/cleanup';

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const API = `${BASE_URL}/api/v1`;

async function main() {
  console.log('🧹 Cleaning up test data...\n');
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.250.99' },
    body: JSON.stringify({ email: 'paul@example.com', password: 'Password123!' }),
  });
  if (!res.ok) { console.error('❌ Auth failed. Is the app running?'); process.exit(1); }
  const { token } = await res.json();
  const deleted = await cleanupOrphanedTestIssues(token);
  console.log(`\n✅ Done. ${deleted} orphaned test issue(s) removed.`);
}
main().catch(console.error);
