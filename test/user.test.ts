import { describe, expect, it } from 'bun:test';
import { UserSchema } from '../src/db/models/User';

describe('User Schema Validation', () => {
  it('should validate a valid user object', () => {
    const validUser = {
      email: 'test@example.com',
      password: 'password123',
      role: 'user' as const,
    };

    const result = UserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('test@example.com');
      expect(result.data.role).toBe('user');
    }
  });

  it('should reject invalid email', () => {
    const invalidUser = {
      email: 'invalid-email',
      password: 'password123',
      role: 'user' as const,
    };

    const result = UserSchema.safeParse(invalidUser);
    expect(result.success).toBe(false);
  });

  it('should reject short password', () => {
    const invalidUser = {
      email: 'test@example.com',
      password: '123',
      role: 'user' as const,
    };

    const result = UserSchema.safeParse(invalidUser);
    expect(result.success).toBe(false);
  });

  it('should reject invalid role', () => {
    const invalidUser = {
      email: 'test@example.com',
      password: 'password123',
      role: 'invalid' as any,
    };

    const result = UserSchema.safeParse(invalidUser);
    expect(result.success).toBe(false);
  });
});
