import {
  validateAbilityScores,
  validateAbility,
  validateAbilityArray,
} from '@/lib/validation/dnd';

const validScores = {
  strength: 10,
  dexterity: 14,
  constitution: 12,
  intelligence: 8,
  wisdom: 16,
  charisma: 10,
};

describe('validateAbilityScores', () => {
  it('returns valid for a full set of six valid scores', () => {
    const result = validateAbilityScores(validScores);
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.value).toEqual(validScores);
  });

  it('returns invalid with field "abilityScores.charisma" when charisma is missing', () => {
    const { charisma: _charisma, ...noCharisma } = validScores;
    const result = validateAbilityScores(noCharisma);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error.field).toBe('abilityScores.charisma');
  });

  it('returns invalid with field "abilityScores.strength" when strength is 0', () => {
    const result = validateAbilityScores({ ...validScores, strength: 0 });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error.field).toBe('abilityScores.strength');
  });

  it('returns invalid with field "abilityScores.strength" when strength is 31', () => {
    const result = validateAbilityScores({ ...validScores, strength: 31 });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error.field).toBe('abilityScores.strength');
  });

  it('returns invalid with message "abilityScores must be an object" for non-object', () => {
    const result = validateAbilityScores('high');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error.message).toBe('abilityScores must be an object');
  });

  it('returns invalid for null', () => {
    const result = validateAbilityScores(null);
    expect(result.valid).toBe(false);
  });
});

describe('validateAbility', () => {
  it('returns valid for an ability with required fields only', () => {
    const result = validateAbility({ name: 'Multiattack', description: 'The creature makes two attacks.' });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value.name).toBe('Multiattack');
      expect(result.value.description).toBe('The creature makes two attacks.');
    }
  });

  it('returns valid with all optional fields present', () => {
    const input = {
      name: 'Bite',
      description: 'Melee attack.',
      attackBonus: 5,
      damageDescription: '1d6 + 3',
      saveDC: 14,
      saveType: 'Dexterity',
      recharge: 'Recharge 5-6',
    };
    const result = validateAbility(input);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value.attackBonus).toBe(5);
      expect(result.value.saveDC).toBe(14);
      expect(result.value.recharge).toBe('Recharge 5-6');
    }
  });

  it('returns invalid with field containing "name" when name is missing', () => {
    const result = validateAbility({ description: 'The creature makes two attacks.' });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error.field).toContain('name');
  });

  it('returns invalid with field containing "description" when description is missing', () => {
    const result = validateAbility({ name: 'Multiattack' });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error.field).toContain('description');
  });

  it('returns invalid with message "ability must be an object" for non-object', () => {
    const result = validateAbility('not an object');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error.message).toBe('ability must be an object');
  });
});

describe('validateAbilityArray', () => {
  it('returns valid for an array of valid abilities', () => {
    const input = [
      { name: 'Bite', description: 'Melee attack.' },
      { name: 'Claw', description: 'Melee attack.' },
    ];
    const result = validateAbilityArray(input, 'actions');
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.value).toHaveLength(2);
  });

  it('returns empty array for undefined', () => {
    expect(validateAbilityArray(undefined, 'traits')).toEqual({ valid: true, value: [] });
  });

  it('returns invalid with message containing "must be an array" for non-array', () => {
    const result = validateAbilityArray('not an array', 'actions');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error.message).toContain('must be an array');
  });

  it('returns invalid with field "actions[1].description" when second element is missing description', () => {
    const input = [
      { name: 'Bite', description: 'Melee.' },
      { name: 'Claw' },
    ];
    const result = validateAbilityArray(input, 'actions');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error.field).toContain('actions[1]');
  });
});
