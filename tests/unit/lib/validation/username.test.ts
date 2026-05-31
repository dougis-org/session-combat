import { validateUsername } from '@/lib/validation/username';

describe('validateUsername', () => {
  describe('Happy Path', () => {
    it('should pass a valid username', () => {
      const result = validateUsername('doug_42');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept hyphen and underscore', () => {
      const result = validateUsername('doug-is_cool');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept exactly 4 characters', () => {
      const result = validateUsername('abcd');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept exactly 20 characters', () => {
      const result = validateUsername('a'.repeat(20));
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Length Failures', () => {
    it('should reject a username with 3 characters', () => {
      const result = validateUsername('abc');
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('username');
      expect(result.errors[0].message).toContain('minimum length');
    });

    it('should reject a username with 21 characters', () => {
      const result = validateUsername('a'.repeat(21));
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('username');
      expect(result.errors[0].message).toContain('maximum length');
    });
  });

  describe('Charset Failures', () => {
    it('should reject a username with spaces', () => {
      const result = validateUsername('doug smith');
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('username');
    });

    it('should reject a username with @ symbol', () => {
      const result = validateUsername('doug@site');
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('username');
    });
  });

  describe('Reserved Words', () => {
    it('should reject "admin" (lowercase)', () => {
      const result = validateUsername('admin');
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('username');
      expect(result.errors[0].message).toContain('reserved');
    });

    it('should reject "Admin" (mixed case)', () => {
      const result = validateUsername('Admin');
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('username');
    });

    it('should reject "ADMIN" (all caps)', () => {
      const result = validateUsername('ADMIN');
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('username');
    });

    const reservedWords = ['root', 'system', 'support', 'moderator', 'api', 'null', 'undefined'];
    reservedWords.forEach((word) => {
      it(`should reject reserved word "${word}" in lowercase and mixed-case`, () => {
        const lowerResult = validateUsername(word);
        expect(lowerResult.valid).toBe(false);
        expect(lowerResult.errors.some(e => e.message.toLowerCase().includes('reserved'))).toBe(true);
        expect(lowerResult.errors[0].field).toBe('username');

        // Mixed-case variant
        const mixed = word.charAt(0).toUpperCase() + word.slice(1);
        const mixedResult = validateUsername(mixed);
        expect(mixedResult.valid).toBe(false);
        expect(mixedResult.errors.some(e => e.message.toLowerCase().includes('reserved'))).toBe(true);
        expect(mixedResult.errors[0].field).toBe('username');
      });
    });
  });

  describe('Non-String Input', () => {
    it('should reject null input', () => {
      const result = validateUsername(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('username');
    });

    it('should reject undefined input', () => {
      const result = validateUsername(undefined);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('username');
    });

    it('should reject number input', () => {
      const result = validateUsername(42);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('username');
    });

    it('should reject object input', () => {
      const result = validateUsername({});
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('username');
    });
  });
});
