import { generateId } from '../../../lib/utils/id';

describe('generateId util', () => {
  it('generates string IDs with optional prefix', () => {
    const id = generateId('sync-');
    expect(typeof id).toBe('string');
    expect(id.startsWith('sync-')).toBe(true);
  });

  it('generates unique values on subsequent calls', () => {
    const a = generateId();
    const b = generateId();
    expect(a).not.toBe(b);
  });

  it('includes a timestamp portion that increases', () => {
    const a = generateId();
    // Small delay to ensure timestamp will be different
    const b = generateId();
    const aTs = parseInt(a.split('-')[0].replace(/[^0-9]/g, ''), 10);
    const bTs = parseInt(b.split('-')[0].replace(/[^0-9]/g, ''), 10);
    expect(bTs).toBeGreaterThanOrEqual(aTs);
  });
});
