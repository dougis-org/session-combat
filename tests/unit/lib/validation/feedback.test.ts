import {
  sanitizePageUrl,
  validateFeedbackInput,
} from '@/lib/validation/feedback';

describe('sanitizePageUrl', () => {
  it.each([
    ['https://app.example/combat/abc', 'https://app.example/combat/abc'],
    ['/relative/path', '/relative/path'],
  ])('keeps allowed URL %s', (input, expected) => {
    expect(sanitizePageUrl(input)).toBe(expected);
  });

  it.each(['//evil.example', 'http://evil.example', 'javascript:alert(1)', 'ftp://x', ''])(
    'drops disallowed URL %s',
    (input) => {
      expect(sanitizePageUrl(input)).toBe('');
    }
  );

  it('returns empty string for non-string input', () => {
    expect(sanitizePageUrl(undefined)).toBe('');
    expect(sanitizePageUrl(42)).toBe('');
  });

  it('strips control characters before applying the allowlist', () => {
    expect(sanitizePageUrl('https://app.example/a\r\n\tb\x00')).toBe('https://app.example/ab');
  });

  it('clamps the URL to the maximum length', () => {
    const long = 'https://app.example/' + 'a'.repeat(5000);
    expect(sanitizePageUrl(long).length).toBe(2048);
  });
});

describe('validateFeedbackInput', () => {
  const base = { type: 'bug', title: 'Broke', description: 'details', pageUrl: '/combat' };

  it.each([null, undefined, [], 42, 'string'])('rejects non-object body %p', (body) => {
    const result = validateFeedbackInput(body);
    expect(result).toEqual({ valid: false, error: 'Invalid request body' });
  });

  it('rejects an invalid type', () => {
    expect(validateFeedbackInput({ ...base, type: 'other' })).toEqual({
      valid: false,
      error: 'type must be "bug" or "feature"',
    });
  });

  it.each([{ ...base, title: '' }, { ...base, title: '   ' }, { ...base, title: 123 }])(
    'rejects a missing/blank title %p',
    (body) => {
      expect(validateFeedbackInput(body)).toEqual({ valid: false, error: 'title is required' });
    }
  );

  it('rejects an over-long title', () => {
    expect(validateFeedbackInput({ ...base, title: 'x'.repeat(201) })).toEqual({
      valid: false,
      error: 'title must be 200 characters or fewer',
    });
  });

  it('rejects an over-long description', () => {
    expect(validateFeedbackInput({ ...base, description: 'x'.repeat(2001) })).toEqual({
      valid: false,
      error: 'description must be 2000 characters or fewer',
    });
  });

  it('normalizes a valid body', () => {
    const result = validateFeedbackInput({
      type: 'feature',
      title: '  Trim me  ',
      pageUrl: '//evil',
    });
    expect(result).toEqual({
      valid: true,
      value: { type: 'feature', title: 'Trim me', description: '', pageUrl: '' },
    });
  });
});
