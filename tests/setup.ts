/**
 * Vitest global setup
 * Runs before all tests
 */

// Mock environment variables for testing
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-jwt-signing-in-tests';
// NODE_ENV is read-only in production builds, don't try to set it
// process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://mc:mc@localhost:5434/mission_control';
process.env.BASE_URL = 'http://localhost:4000';
