import { validatePasswordForClient } from '@/lib/validation/password';

describe('validatePasswordForClient', () => {
  it('should return valid for a strong password', () => {
    const result = validatePasswordForClient('SecurePassword123');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject empty password', () => {
    const result = validatePasswordForClient('');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters long');
  });

  it('should reject password shorter than 8 characters', () => {
    const result = validatePasswordForClient('Short1A');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters long');
  });

  it('should reject password without uppercase letter', () => {
    const result = validatePasswordForClient('password123');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one uppercase letter');
  });

  it('should reject password without lowercase letter', () => {
    const result = validatePasswordForClient('PASSWORD123');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one lowercase letter');
  });

  it('should reject password without number', () => {
    const result = validatePasswordForClient('PasswordNoNum');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one number');
  });

  it('should reject password with multiple missing requirements', () => {
    const result = validatePasswordForClient('weak');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
    expect(result.errors).toContain('Password must be at least 8 characters long');
    expect(result.errors).toContain('Password must contain at least one uppercase letter');
    expect(result.errors).toContain('Password must contain at least one number');
  });

  it('should accept passwords exactly 8 characters long', () => {
    const result = validatePasswordForClient('Passwrd1');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept long passwords', () => {
    const result = validatePasswordForClient('VeryLongPasswordWith123Numbers');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept passwords with special characters', () => {
    const result = validatePasswordForClient('Password@123!');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept passwords with unicode characters', () => {
    const result = validatePasswordForClient('Pässwörd123');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
