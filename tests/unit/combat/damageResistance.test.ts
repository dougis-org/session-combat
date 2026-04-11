import { describe, test, expect } from '@jest/globals';
import { applyDamageWithType, mergeActiveDamageEffects, removeActiveDamageEffects } from '@/lib/utils/combat';
import type { ActiveDamageEffect } from '@/lib/types';

const eff = (
  type: ActiveDamageEffect['type'],
  kind: ActiveDamageEffect['kind'],
  label: string = kind,
): ActiveDamageEffect => ({ type, kind, label });

// ---------------------------------------------------------------------------
// applyDamageWithType
// ---------------------------------------------------------------------------

describe('applyDamageWithType – no modifiers', () => {
  test('applies raw damage unchanged when no resistances', () => {
    expect(applyDamageWithType(30, 0, 10, 'fire', {})).toEqual({
      hp: 20, tempHp: 0, effectiveDamage: 10,
    });
  });

  test('non-matching resistance type: fire damage not reduced', () => {
    expect(applyDamageWithType(30, 0, 10, 'fire', { damageResistances: ['cold'] })).toEqual({
      hp: 20, tempHp: 0, effectiveDamage: 10,
    });
  });

  test('0 raw damage always returns unchanged hp/tempHp', () => {
    expect(applyDamageWithType(30, 5, 0, 'fire', {})).toEqual({
      hp: 30, tempHp: 5, effectiveDamage: 0,
    });
  });
});

describe('applyDamageWithType – stat-based resistance', () => {
  test('resistance halves damage (floors)', () => {
    expect(applyDamageWithType(30, 0, 10, 'fire', { damageResistances: ['fire'] })).toEqual({
      hp: 25, tempHp: 0, effectiveDamage: 5,
    });
  });

  test('resistance floors odd damage (7 → 3)', () => {
    expect(applyDamageWithType(30, 0, 7, 'fire', { damageResistances: ['fire'] })).toEqual({
      hp: 27, tempHp: 0, effectiveDamage: 3,
    });
  });

  test('resistant damage absorbed by tempHp first, then regular hp', () => {
    // effectiveDamage = 5; all absorbed by tempHp
    expect(applyDamageWithType(30, 5, 10, 'fire', { damageResistances: ['fire'] })).toEqual({
      hp: 30, tempHp: 0, effectiveDamage: 5,
    });
  });
});

describe('applyDamageWithType – stat-based immunity', () => {
  test('immunity from stats: deals 0 damage', () => {
    expect(applyDamageWithType(30, 0, 20, 'fire', { damageImmunities: ['fire'] })).toEqual({
      hp: 30, tempHp: 0, effectiveDamage: 0,
    });
  });

  test('immunity supersedes vulnerability (0 damage)', () => {
    expect(applyDamageWithType(30, 0, 10, 'fire', {
      damageImmunities: ['fire'],
      damageVulnerabilities: ['fire'],
    })).toEqual({ hp: 30, tempHp: 0, effectiveDamage: 0 });
  });
});

describe('applyDamageWithType – stat-based vulnerability', () => {
  test('vulnerability from stats: doubles damage', () => {
    expect(applyDamageWithType(30, 0, 10, 'fire', { damageVulnerabilities: ['fire'] })).toEqual({
      hp: 10, tempHp: 0, effectiveDamage: 20,
    });
  });

  test('vulnerable damage interacts with tempHp correctly', () => {
    // effectiveDamage = 20; 3 absorbed by temp, 17 from hp → 13 remaining
    expect(applyDamageWithType(30, 3, 10, 'fire', { damageVulnerabilities: ['fire'] })).toEqual({
      hp: 13, tempHp: 0, effectiveDamage: 20,
    });
  });
});

describe('applyDamageWithType – resistance + vulnerability cancel', () => {
  test('same type resistance + vulnerability = normal damage (both stat-based)', () => {
    expect(applyDamageWithType(30, 0, 10, 'fire', {
      damageResistances: ['fire'],
      damageVulnerabilities: ['fire'],
    })).toEqual({ hp: 20, tempHp: 0, effectiveDamage: 10 });
  });

  test('stat resistance + active vulnerability = normal damage', () => {
    expect(applyDamageWithType(30, 0, 10, 'fire', {
      damageResistances: ['fire'],
      activeDamageEffects: [eff('fire', 'vulnerability', 'Curse')],
    })).toEqual({ hp: 20, tempHp: 0, effectiveDamage: 10 });
  });
});

describe('applyDamageWithType – active damage effects', () => {
  test('resistance from activeDamageEffects: halves damage', () => {
    expect(applyDamageWithType(30, 0, 10, 'fire', {
      activeDamageEffects: [eff('fire', 'resistance', 'Rage')],
    })).toEqual({ hp: 25, tempHp: 0, effectiveDamage: 5 });
  });

  test('immunity from activeDamageEffects: deals 0 damage', () => {
    expect(applyDamageWithType(30, 0, 20, 'fire', {
      activeDamageEffects: [eff('fire', 'immunity', 'Fire Immunity')],
    })).toEqual({ hp: 30, tempHp: 0, effectiveDamage: 0 });
  });

  test('vulnerability from activeDamageEffects: doubles damage', () => {
    expect(applyDamageWithType(30, 0, 10, 'fire', {
      activeDamageEffects: [eff('fire', 'vulnerability', 'Weakened')],
    })).toEqual({ hp: 10, tempHp: 0, effectiveDamage: 20 });
  });

  test('active effect on different type does not apply', () => {
    expect(applyDamageWithType(30, 0, 10, 'fire', {
      activeDamageEffects: [eff('cold', 'resistance', 'Cold Resist')],
    })).toEqual({ hp: 20, tempHp: 0, effectiveDamage: 10 });
  });
});

// ---------------------------------------------------------------------------
// mergeActiveDamageEffects
// ---------------------------------------------------------------------------

describe('mergeActiveDamageEffects', () => {
  test('adds new effect when no existing effects', () => {
    const result = mergeActiveDamageEffects([], [eff('fire', 'resistance', 'Rage')]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ type: 'fire', kind: 'resistance' });
  });

  test('adds new effect when it targets a different type', () => {
    const result = mergeActiveDamageEffects([eff('fire', 'resistance', 'A')], [eff('cold', 'resistance', 'B')]);
    expect(result).toHaveLength(2);
  });

  test('same type + same kind: replaces existing with new entry', () => {
    const result = mergeActiveDamageEffects([eff('fire', 'resistance', 'Old')], [eff('fire', 'resistance', 'New')]);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('New');
  });

  test('immunity replaces resistance on same type', () => {
    const result = mergeActiveDamageEffects([eff('fire', 'resistance', 'A')], [eff('fire', 'immunity', 'B')]);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('immunity');
  });

  test('immunity replaces vulnerability on same type', () => {
    const result = mergeActiveDamageEffects([eff('fire', 'vulnerability', 'A')], [eff('fire', 'immunity', 'B')]);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('immunity');
  });

  test('immunity removes both resistance and vulnerability for same type', () => {
    const result = mergeActiveDamageEffects(
      [eff('fire', 'resistance', 'A'), eff('fire', 'vulnerability', 'B')],
      [eff('fire', 'immunity', 'C')],
    );
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('immunity');
  });

  test('resistance does not overwrite existing immunity on same type', () => {
    const result = mergeActiveDamageEffects([eff('fire', 'immunity', 'A')], [eff('fire', 'resistance', 'B')]);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('immunity');
  });

  test('vulnerability does not overwrite existing immunity on same type', () => {
    const result = mergeActiveDamageEffects([eff('fire', 'immunity', 'A')], [eff('fire', 'vulnerability', 'B')]);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('immunity');
  });

  test('resistance and vulnerability for same type can coexist', () => {
    const result = mergeActiveDamageEffects([eff('fire', 'resistance', 'Warding Bond')], [eff('fire', 'vulnerability', 'Curse')]);
    expect(result).toHaveLength(2);
    expect(result.some(e => e.kind === 'resistance')).toBe(true);
    expect(result.some(e => e.kind === 'vulnerability')).toBe(true);
  });

  test('vulnerability does not overwrite resistance for same type', () => {
    const result = mergeActiveDamageEffects([eff('fire', 'vulnerability', 'Curse')], [eff('fire', 'resistance', 'Warding Bond')]);
    expect(result).toHaveLength(2);
  });

  test('returns new array, does not mutate existing', () => {
    const existing = [eff('fire', 'resistance', 'A')];
    const result = mergeActiveDamageEffects(existing, [eff('cold', 'resistance', 'B')]);
    expect(result).not.toBe(existing);
    expect(existing).toHaveLength(1);
  });

  test('merges multiple new effects at once', () => {
    const result = mergeActiveDamageEffects([], [
      eff('fire', 'resistance', 'A'),
      eff('cold', 'resistance', 'B'),
      eff('lightning', 'resistance', 'C'),
    ]);
    expect(result).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// removeActiveDamageEffects
// ---------------------------------------------------------------------------

describe('removeActiveDamageEffects', () => {
  test('removes matching type + kind', () => {
    const effects = [eff('fire', 'resistance', 'A'), eff('cold', 'resistance', 'B')];
    const result = removeActiveDamageEffects(effects, 'fire', 'resistance');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('cold');
  });

  test('returns unchanged array when no match found', () => {
    const result = removeActiveDamageEffects([eff('fire', 'resistance', 'A')], 'cold', 'resistance');
    expect(result).toHaveLength(1);
  });

  test('removes all effects matching a kind when type is null', () => {
    const effects = [eff('fire', 'resistance', 'A'), eff('cold', 'resistance', 'B'), eff('fire', 'immunity', 'C')];
    const result = removeActiveDamageEffects(effects, null, 'resistance');
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('immunity');
  });

  test('returns new array, does not mutate existing', () => {
    const effects = [eff('fire', 'resistance', 'A')];
    const result = removeActiveDamageEffects(effects, 'fire', 'resistance');
    expect(result).not.toBe(effects);
    expect(effects).toHaveLength(1);
  });

  test('empty input returns empty array', () => {
    expect(removeActiveDamageEffects([], 'fire', 'resistance')).toEqual([]);
  });
});
