import { listRollsQuerySchema } from '@/lib/validation/rollQuery';

describe('listRollsQuerySchema', () => {
  it('accepts a well-formed query with defaults for limit/before', () => {
    const result = listRollsQuerySchema.safeParse({
      sessionId: 'session-1',
      limit: null,
      before: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sessionId).toBe('session-1');
      expect(result.data.limit).toBe(50);
      expect(result.data.before).toBeUndefined();
    }
  });

  it('trims sessionId', () => {
    const result = listRollsQuerySchema.safeParse({ sessionId: '  s1  ', limit: null, before: null });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.sessionId).toBe('s1');
  });

  it('rejects a missing sessionId', () => {
    const result = listRollsQuerySchema.safeParse({ sessionId: null, limit: null, before: null });
    expect(result.success).toBe(false);
  });

  it('rejects a whitespace-only sessionId', () => {
    const result = listRollsQuerySchema.safeParse({ sessionId: '   ', limit: null, before: null });
    expect(result.success).toBe(false);
  });

  it('rejects an oversized sessionId', () => {
    const result = listRollsQuerySchema.safeParse({
      sessionId: 'x'.repeat(129),
      limit: null,
      before: null,
    });
    expect(result.success).toBe(false);
  });

  it('defaults an invalid limit to 50', () => {
    const result = listRollsQuerySchema.safeParse({ sessionId: 's1', limit: 'not-a-number', before: null });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.limit).toBe(50);
  });

  it('caps limit at 100', () => {
    const result = listRollsQuerySchema.safeParse({ sessionId: 's1', limit: '200', before: null });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.limit).toBe(100);
  });

  it('defaults a limit with a trailing non-digit suffix to 50 (not a truncated parseInt)', () => {
    const result = listRollsQuerySchema.safeParse({ sessionId: 's1', limit: '200abc', before: null });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.limit).toBe(50);
  });

  it('defaults a decimal limit to 50 (not truncated to its integer part)', () => {
    const result = listRollsQuerySchema.safeParse({ sessionId: 's1', limit: '3.5', before: null });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.limit).toBe(50);
  });

  it('defaults an exponent-notation limit to 50', () => {
    const result = listRollsQuerySchema.safeParse({ sessionId: 's1', limit: '1e5', before: null });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.limit).toBe(50);
  });

  it('accepts a valid ISO before cursor', () => {
    const result = listRollsQuerySchema.safeParse({
      sessionId: 's1',
      limit: null,
      before: '2026-01-01T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.before).toEqual(new Date('2026-01-01T00:00:00.000Z'));
  });

  it('rejects an invalid before cursor', () => {
    const result = listRollsQuerySchema.safeParse({ sessionId: 's1', limit: null, before: 'not-a-date' });
    expect(result.success).toBe(false);
  });

  it('rejects an impossible calendar date instead of letting Date roll it over', () => {
    // JS `Date` silently normalizes Feb 30 into Mar 2 — the schema must not accept it.
    const result = listRollsQuerySchema.safeParse({
      sessionId: 's1',
      limit: null,
      before: '2026-02-30T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-canonical (but Date-parseable) before cursor', () => {
    const result = listRollsQuerySchema.safeParse({
      sessionId: 's1',
      limit: null,
      before: '2026-01-01', // parseable by `new Date`, but not the canonical ISO cursor form
    });
    expect(result.success).toBe(false);
  });
});
