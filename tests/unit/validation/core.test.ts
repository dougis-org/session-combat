import {
  validateString,
  validateNumber,
  validateStringArray,
  validateRecord,
  validateStringRecord,
  validateNumberRecord,
  validateEntityId,
  parseCampaignIdInput,
} from '@/lib/validation/core';

describe('validateString', () => {
  it('returns valid for a plain string', () => {
    expect(validateString('goblin', 'name')).toEqual({ valid: true, value: 'goblin' });
  });

  it('returns invalid when required and value is undefined', () => {
    const result = validateString(undefined, 'name', { required: true });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error.field).toBe('name');
  });

  it('returns empty string when not required and value is undefined', () => {
    expect(validateString(undefined, 'name')).toEqual({ valid: true, value: '' });
  });

  it('returns invalid for non-string value', () => {
    const result = validateString(42, 'name');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error.message).toMatch(/must be a string, got number/);
  });

  it('trims and passes when padded string meets minLength', () => {
    expect(validateString('  ab  ', 'name', { minLength: 2 })).toEqual({ valid: true, value: 'ab' });
  });

  it('returns invalid when whitespace-only string fails minLength after trim', () => {
    const result = validateString('   ', 'name', { minLength: 1 });
    expect(result.valid).toBe(false);
  });

  it('preserves interior whitespace after trimming edges', () => {
    expect(validateString('  hello world  ', 'desc')).toEqual({ valid: true, value: 'hello world' });
  });

  it('returns invalid when string (no whitespace) is shorter than minLength', () => {
    const result = validateString('a', 'name', { minLength: 3 });
    expect(result.valid).toBe(false);
  });
});

describe('validateNumber', () => {
  it('returns valid for a finite number', () => {
    expect(validateNumber(10, 'maxHp')).toEqual({ valid: true, value: 10 });
  });

  it('returns invalid when required and value is undefined', () => {
    const result = validateNumber(undefined, 'maxHp', { required: true });
    expect(result.valid).toBe(false);
  });

  it('returns 0 when not required and value is undefined', () => {
    expect(validateNumber(undefined, 'maxHp')).toEqual({ valid: true, value: 0 });
  });

  it('returns invalid for a string value', () => {
    const result = validateNumber('ten', 'maxHp');
    expect(result.valid).toBe(false);
  });

  it('returns invalid for Infinity', () => {
    const result = validateNumber(Infinity, 'hp');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error.message).toMatch(/must be a valid number/);
  });

  it('returns invalid when value is below min', () => {
    const result = validateNumber(-1, 'ac', { min: 0 });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error.message).toMatch(/must be at least 0/);
  });

  it('returns invalid when value is above max', () => {
    const result = validateNumber(31, 'ac', { max: 30 });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error.message).toMatch(/must be at most 30/);
  });
});

describe('validateStringArray', () => {
  it('returns valid for a string array', () => {
    expect(validateStringArray(['Common', 'Elvish'], 'languages')).toEqual({
      valid: true,
      value: ['Common', 'Elvish'],
    });
  });

  it('returns empty array for undefined', () => {
    expect(validateStringArray(undefined, 'languages')).toEqual({ valid: true, value: [] });
  });

  it('returns empty array for null', () => {
    expect(validateStringArray(null, 'languages')).toEqual({ valid: true, value: [] });
  });

  it('returns invalid for non-array', () => {
    const result = validateStringArray('Common', 'languages');
    expect(result.valid).toBe(false);
  });

  it('returns invalid with index when array contains non-string element', () => {
    const result = validateStringArray(['Common', 42], 'languages');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error.index).toBe(1);
  });
});

describe('validateRecord', () => {
  it('returns valid for a string-predicate record', () => {
    const result = validateRecord({ a: 'x', b: 'y' }, 'rec', (v) => typeof v === 'string');
    expect(result).toEqual({ valid: true, value: { a: 'x', b: 'y' } });
  });

  it('returns empty object for undefined', () => {
    const result = validateRecord(undefined, 'rec', (v) => typeof v === 'string');
    expect(result).toEqual({ valid: true, value: {} });
  });

  it('returns invalid for an array', () => {
    const result = validateRecord([], 'rec', (v) => typeof v === 'string');
    expect(result.valid).toBe(false);
  });

  it('returns invalid with field key when value fails predicate', () => {
    const result = validateRecord({ key: 42 }, 'rec', (v) => typeof v === 'string');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error.field).toContain('key');
  });
});

describe('validateStringRecord', () => {
  it('returns valid for a record with string values', () => {
    expect(validateStringRecord({ darkvision: '60 ft.' }, 'senses')).toEqual({
      valid: true,
      value: { darkvision: '60 ft.' },
    });
  });

  it('returns invalid for a record with numeric values', () => {
    const result = validateStringRecord({ darkvision: 60 }, 'senses');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error.field).toContain('darkvision');
  });
});

describe('validateNumberRecord', () => {
  it('returns valid for a record with number values', () => {
    expect(validateNumberRecord({ strength: 2, dexterity: 3 }, 'savingThrows')).toEqual({
      valid: true,
      value: { strength: 2, dexterity: 3 },
    });
  });

  it('returns invalid for a record with string values', () => {
    const result = validateNumberRecord({ strength: 'high' }, 'savingThrows');
    expect(result.valid).toBe(false);
  });
});

describe('validateEntityId', () => {
  it('returns valid for a normal id string', () => {
    expect(validateEntityId('party-123')).toEqual({ valid: true, value: 'party-123' });
  });

  it('returns invalid for an empty string', () => {
    const result = validateEntityId('');
    expect(result.valid).toBe(false);
  });

  it('returns invalid for a whitespace-only string', () => {
    const result = validateEntityId('   ');
    expect(result.valid).toBe(false);
  });

  it('returns invalid for a value over 200 characters', () => {
    const result = validateEntityId('x'.repeat(201));
    expect(result.valid).toBe(false);
  });

  it('returns invalid for a non-string value', () => {
    const result = validateEntityId(42);
    expect(result.valid).toBe(false);
  });
});

describe('parseCampaignIdInput', () => {
  it('returns omit when value is undefined', () => {
    expect(parseCampaignIdInput(undefined)).toEqual({ kind: 'omit' });
  });

  it('returns invalid for a non-string value', () => {
    for (const badValue of [null, 42, true, [], {}]) {
      expect(parseCampaignIdInput(badValue)).toEqual({ kind: 'invalid' });
    }
  });

  it('returns set with an empty value for an empty or whitespace-only string (the documented unlink value)', () => {
    expect(parseCampaignIdInput('')).toEqual({ kind: 'set', value: '' });
    expect(parseCampaignIdInput('   ')).toEqual({ kind: 'set', value: '' });
  });

  it('returns set with the trimmed value for a normal campaign id', () => {
    expect(parseCampaignIdInput('  camp-1  ')).toEqual({ kind: 'set', value: 'camp-1' });
  });

  it('returns invalid for a campaign id over 200 characters', () => {
    expect(parseCampaignIdInput('x'.repeat(201))).toEqual({ kind: 'invalid' });
  });
});
