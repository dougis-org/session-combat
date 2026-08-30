import {
  CUSTOM_MONSTERS,
  findCustomMonsterById,
  toEncounterMonster,
  toEncounterMonsters,
} from '../../../../lib/data/customMonsters';
import { GLOBAL_USER_ID } from '../../../../lib/constants';
import { DamageType } from '../../../../lib/constants';

describe('customMonsters', () => {
  it('should have custom monsters exported', () => {
    expect(Array.isArray(CUSTOM_MONSTERS)).toBe(true);
    expect(CUSTOM_MONSTERS.length).toBeGreaterThan(0);
  });

  it('all monsters should have GLOBAL_USER_ID and be global', () => {
    for (const monster of CUSTOM_MONSTERS) {
      expect(monster.userId).toBe(GLOBAL_USER_ID);
      expect(monster.isGlobal).toBe(true);
      expect(monster.id).toMatch(/^cm-/);
      expect(monster.name).toBeDefined();
    }
  });

  it('all monster damage arrays contain only canonical DamageType values', () => {
    for (const monster of CUSTOM_MONSTERS) {
      const arrays: (string[] | undefined)[] = [
        monster.damageResistances,
        monster.damageImmunities,
        monster.damageVulnerabilities,
      ];
      for (const arr of arrays) {
        if (!arr) continue;
        for (const v of arr) {
          // Allow descriptive notes like "bludgeoning, piercing, and slashing from nonmagical attacks"
          // only in trait descriptions, NOT in damage arrays. damage arrays must be
          // canonical types only.
          expect([
            'acid', 'bludgeoning', 'cold', 'fire', 'force',
            'lightning', 'necrotic', 'piercing', 'poison',
            'psychic', 'radiant', 'slashing', 'thunder',
          ] as DamageType[]).toContain(v as DamageType);
        }
      }
    }
  });

  it('includes the Vecna campaign bosses', () => {
    const ids = CUSTOM_MONSTERS.map((m) => m.id);
    expect(ids).toContain('cm-vecna');
    expect(ids).toContain('cm-kas-vampire');
    expect(ids).toContain('cm-kas-death-knight');
    expect(ids).toContain('cm-acererak');
    expect(ids).toContain('cm-miska');
    expect(ids).toContain('cm-lord-soth');
    expect(ids).toContain('cm-tiamat-servant');
    expect(ids).toContain('cm-necromancer-wizard');
  });
});

describe('findCustomMonsterById', () => {
  it('returns the template when id matches', () => {
    const found = findCustomMonsterById('cm-vecna');
    expect(found).toBeDefined();
    expect(found?.name).toMatch(/Vecna/);
  });

  it('returns undefined when id is unknown', () => {
    expect(findCustomMonsterById('cm-does-not-exist')).toBeUndefined();
  });
});

describe('toEncounterMonster', () => {
  const template = findCustomMonsterById('cm-deathwolf')!;

  it('produces a Monster-shaped instance with full HP', () => {
    const instance = toEncounterMonster(template)!;
    expect(instance.id).toBeDefined();
    expect(instance.id).not.toBe(template.id);
    expect(instance.hp).toBe(template.maxHp);
    expect(instance.templateId).toBe(template.id);
  });

  it('strips template-only fields', () => {
    const instance = toEncounterMonster(template)! as unknown as Record<string, unknown>;
    expect(instance.isGlobal).toBeUndefined();
    expect('legendaryActionCount' in instance ? instance.legendaryActionCount : undefined).toBeUndefined();
  });

  it('honors a caller-supplied instanceId', () => {
    const instance = toEncounterMonster(template, 'fixed-id')!;
    expect(instance.id).toBe('fixed-id');
  });
});

describe('toEncounterMonsters', () => {
  it('produces N distinct instances of the same template', () => {
    const list = toEncounterMonsters(findCustomMonsterById('cm-deathwolf')!, 4);
    expect(list).toHaveLength(4);
    const ids = new Set(list.map((m) => m.id));
    expect(ids.size).toBe(4);
    list.forEach((m) => expect(m.hp).toBe(m.maxHp));
  });

  it('returns empty array when template is undefined', () => {
    expect(toEncounterMonsters(undefined, 3)).toEqual([]);
  });
});
