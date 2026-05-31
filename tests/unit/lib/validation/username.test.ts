import { validateUsername } from '@/lib/validation/username';

function expectValid(value: unknown) {
  const result = validateUsername(value);
  expect(result.valid).toBe(true);
  expect(result.errors).toHaveLength(0);
}

function expectInvalid(value: unknown, messageFragment?: string) {
  const result = validateUsername(value);
  expect(result.valid).toBe(false);
  expect(result.errors.length).toBeGreaterThanOrEqual(1);
  expect(result.errors.every(e => e.field === 'username')).toBe(true);
  if (messageFragment) {
    expect(result.errors.some(e => e.message.includes(messageFragment))).toBe(true);
  }
}

describe('validateUsername', () => {
  describe('Happy Path', () => {
    it('should pass a valid username', () => expectValid('doug_42'));
    it('should accept hyphen and underscore', () => expectValid('doug-is_cool'));
    it('should accept exactly 4 characters', () => expectValid('abcd'));
    it('should accept exactly 20 characters', () => expectValid('a'.repeat(20)));
  });

  describe('Length Failures', () => {
    it('should reject a username with 3 characters', () =>
      expectInvalid('abc', 'minimum length'));
    it('should reject a username with 21 characters', () =>
      expectInvalid('a'.repeat(21), 'maximum length'));
  });

  describe('Charset Failures', () => {
    it('should reject a username with spaces', () => expectInvalid('doug smith'));
    it('should reject a username with @ symbol', () => expectInvalid('doug@site'));
  });

  describe('Reserved Words', () => {
    it('should reject "admin" (lowercase)', () => expectInvalid('admin', 'reserved'));
    it('should reject "Admin" (mixed case)', () => expectInvalid('Admin'));
    it('should reject "ADMIN" (all caps)', () => expectInvalid('ADMIN'));

    const reservedWords = ['root', 'system', 'support', 'moderator', 'api', 'null', 'undefined'];
    reservedWords.forEach((word) => {
      it(`should reject reserved word "${word}" in lowercase and mixed-case`, () => {
        expectInvalid(word, 'reserved');
        expectInvalid(word.charAt(0).toUpperCase() + word.slice(1), 'reserved');
      });
    });
  });

  describe('Non-String Input', () => {
    it('should reject null input', () => expectInvalid(null));
    it('should reject undefined input', () => expectInvalid(undefined));
    it('should reject number input', () => expectInvalid(42));
    it('should reject object input', () => expectInvalid({}));
  });
});
