import { deriveUserMenuDisplay } from '@/lib/components/userMenuDisplay';

describe('deriveUserMenuDisplay', () => {
  it('shows a short single-token username in full', () => {
    expect(deriveUserMenuDisplay('douglas')).toEqual({
      label: 'douglas',
      initials: 'D',
      accessibleName: 'douglas',
    });
  });

  it('shows a very short username in full', () => {
    expect(deriveUserMenuDisplay('Al')).toEqual({
      label: 'Al',
      initials: 'A',
      accessibleName: 'Al',
    });
  });

  it('treats exactly 8 characters as short', () => {
    expect(deriveUserMenuDisplay('douglas8')).toEqual({
      label: 'douglas8',
      initials: 'D',
      accessibleName: 'douglas8',
    });
  });

  it('collapses to initials at 9 characters (boundary)', () => {
    expect(deriveUserMenuDisplay('douglas88')).toEqual({
      label: 'D',
      initials: 'D',
      accessibleName: 'douglas88',
    });
  });

  it('keeps a short multi-token username in full, spaces included', () => {
    expect(deriveUserMenuDisplay('jo doe')).toEqual({
      label: 'jo doe',
      initials: 'JD',
      accessibleName: 'jo doe',
    });
  });

  it('shows initials for a long multi-token username', () => {
    expect(deriveUserMenuDisplay('Douglas Adams')).toEqual({
      label: 'DA',
      initials: 'DA',
      accessibleName: 'Douglas Adams',
    });
  });

  it('shows a single initial for a long single-token username', () => {
    expect(deriveUserMenuDisplay('stridertheranger')).toEqual({
      label: 'S',
      initials: 'S',
      accessibleName: 'stridertheranger',
    });
  });

  it('collapses whitespace and uses first + last token', () => {
    expect(deriveUserMenuDisplay('  jo   bloggs  ')).toEqual({
      label: 'JB',
      initials: 'JB',
      accessibleName: 'jo   bloggs',
    });
  });

  it('uses only the first and last token, capped at 2 chars', () => {
    expect(deriveUserMenuDisplay('a b c d').initials).toBe('AD');
  });

  it.each([undefined, '', '   '])('falls back to Account for %p', (input) => {
    expect(deriveUserMenuDisplay(input)).toEqual({
      label: 'Account',
      initials: 'AC',
      accessibleName: 'Account',
    });
  });

  it('does not throw or interpret markup in the username', () => {
    expect(() => deriveUserMenuDisplay('<b>x</b>')).not.toThrow();
    const result = deriveUserMenuDisplay('<b>x</b>');
    expect(typeof result.label).toBe('string');
    expect(typeof result.initials).toBe('string');
  });

  it('handles non-ASCII tokens without throwing', () => {
    expect(deriveUserMenuDisplay('Þórr Odinson')).toEqual({
      label: 'ÞO',
      initials: 'ÞO',
      accessibleName: 'Þórr Odinson',
    });
  });

  it('takes the first code point of an astral first character', () => {
    expect(deriveUserMenuDisplay('👑arry Potter').initials).toBe('👑P');
  });
});
