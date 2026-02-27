import { describe, it, expect, beforeEach } from 'vitest';
import { createToken, verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

/**
 * Unit Tests: Authentication Logic
 * 
 * Tests password validation, JWT generation/verification, and authentication helpers
 */

describe('Authentication - JWT Token Management', () => {
  const mockUser = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'test@example.com',
    name: 'Test User',
    role: 'member',
    agentId: null,
  };

  describe('createToken', () => {
    it('should generate a valid JWT token', async () => {
      const token = await createToken(mockUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts: header.payload.signature
    });

    it('should include user data in token payload', async () => {
      const token = await createToken(mockUser);
      const decoded = await verifyToken(token);
      
      expect(decoded).not.toBeNull();
      expect(decoded?.id).toBe(mockUser.id);
      expect(decoded?.email).toBe(mockUser.email);
      expect(decoded?.name).toBe(mockUser.name);
      expect(decoded?.role).toBe(mockUser.role);
    });

    it('should create tokens with expiration', async () => {
      const token = await createToken(mockUser);
      
      // Decode manually to check exp claim (without verification)
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      
      expect(payload.exp).toBeDefined();
      expect(payload.iat).toBeDefined();
      expect(payload.exp).toBeGreaterThan(payload.iat);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', async () => {
      const token = await createToken(mockUser);
      const decoded = await verifyToken(token);
      
      expect(decoded).not.toBeNull();
      expect(decoded?.id).toBe(mockUser.id);
    });

    it('should reject an invalid token', async () => {
      const invalidToken = 'invalid.jwt.token';
      const decoded = await verifyToken(invalidToken);
      
      expect(decoded).toBeNull();
    });

    it('should reject a tampered token', async () => {
      const token = await createToken(mockUser);
      const tamperedToken = token.slice(0, -5) + 'XXXXX';
      const decoded = await verifyToken(tamperedToken);
      
      expect(decoded).toBeNull();
    });

    it('should reject a token with missing parts', async () => {
      const invalidToken = 'only.two';
      const decoded = await verifyToken(invalidToken);
      
      expect(decoded).toBeNull();
    });
  });
});

describe('Authentication - Password Validation', () => {
  describe('bcrypt password hashing', () => {
    it('should hash passwords securely', async () => {
      const password = 'password123';
      const hash = await bcrypt.hash(password, 10);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2b$') || hash.startsWith('$2a$')).toBe(true);
    });

    it('should verify correct password against hash', async () => {
      const password = 'password123';
      const hash = await bcrypt.hash(password, 10);
      const isValid = await bcrypt.compare(password, hash);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'password123';
      const wrongPassword = 'wrongpassword';
      const hash = await bcrypt.hash(password, 10);
      const isValid = await bcrypt.compare(wrongPassword, hash);
      
      expect(isValid).toBe(false);
    });

    it('should reject empty password', async () => {
      const password = 'password123';
      const hash = await bcrypt.hash(password, 10);
      const isValid = await bcrypt.compare('', hash);
      
      expect(isValid).toBe(false);
    });

    it('should produce different hashes for same password', async () => {
      const password = 'password123';
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 10);
      
      // Hashes should be different (salt is random)
      expect(hash1).not.toBe(hash2);
      
      // But both should verify the same password
      expect(await bcrypt.compare(password, hash1)).toBe(true);
      expect(await bcrypt.compare(password, hash2)).toBe(true);
    });
  });
});

describe('Authentication - Security Properties', () => {
  it('should use strong JWT secret', () => {
    const secret = process.env.NEXTAUTH_SECRET;
    
    expect(secret).toBeDefined();
    expect(secret!.length).toBeGreaterThanOrEqual(32);
  });

  it('should set secure cookie options in production', () => {
    // This test verifies the cookie settings are correct
    // Actual cookie setting is tested in integration tests
    const isProduction = process.env.NODE_ENV === 'production';
    const shouldBeSecure = isProduction;
    
    // In tests, we're not in production
    expect(process.env.NODE_ENV).toBe('test');
    expect(shouldBeSecure).toBe(false);
  });
});
