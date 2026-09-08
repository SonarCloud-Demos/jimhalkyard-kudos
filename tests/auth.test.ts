import { describe, test, expect, beforeAll } from 'bun:test';
import { hashPassword, verifyPassword, generateToken, verifyToken } from '../src/services/auth.service';

describe('Auth Service', () => {
  describe('Password Hashing', () => {
    test('should hash password successfully', async () => {
      const password = 'test123456';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    test('should produce different hashes for same password', async () => {
      const password = 'test123456';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    test('should verify correct password', async () => {
      const password = 'test123456';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    test('should reject incorrect password', async () => {
      const password = 'test123456';
      const wrongPassword = 'wrong123456';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });
  });

  describe('JWT Generation and Verification', () => {
    test('should generate valid JWT', async () => {
      const payload = {
        userId: 1,
        role: 'EMPLOYEE' as const,
        department: 'Engineering',
      };

      const token = await generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    test('should verify valid JWT and extract payload', async () => {
      const payload = {
        userId: 1,
        role: 'EMPLOYEE' as const,
        department: 'Engineering',
      };

      const token = await generateToken(payload);
      const decoded = await verifyToken(token);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.department).toBe(payload.department);
    });

    test('should reject invalid JWT', async () => {
      const invalidToken = 'invalid.token.here';

      await expect(verifyToken(invalidToken)).rejects.toThrow();
    });

    test('should reject tampered JWT', async () => {
      const payload = {
        userId: 1,
        role: 'EMPLOYEE' as const,
        department: 'Engineering',
      };

      const token = await generateToken(payload);
      const tamperedToken = token.slice(0, -5) + 'xxxxx';

      await expect(verifyToken(tamperedToken)).rejects.toThrow();
    });
  });
});
