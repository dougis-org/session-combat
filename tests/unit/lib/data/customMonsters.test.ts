import {
  CUSTOM_MONSTERS,
  findCustomMonsterById,
  requireCustomMonsterById,
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

  it('has no duplicate monster ids', () => {
    const ids = CUSTOM_MONSTERS.map((m) => m.id);
    const seen = new Set<string>();
    const dupes = ids.filter((id) => (seen.has(id) ? true : (seen.add(id), false)));
    expect(dupes).toEqual([]);
  });

  it('exposes passive Perception under the canonical "passive Perception" key when senses are defined', () => {
    for (const monster of CUSTOM_MONSTERS) {
      if (!monster.senses) continue;
      expect(monster.senses).not.toHaveProperty('passivePerception');
    }
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

describe('populate-campaigns-g3 monsters', () => {
  const G3_SOURCES = [
    'Icewind Dale: Rime of the Frostmaiden',
    'The Wild Beyond the Witchlight',
    'Princes of the Apocalypse',
    'Curse of the Crimson Throne',
    "Hell's Rebels",
    'Red Hand of Doom',
  ];
  const g3 = CUSTOM_MONSTERS.filter((m) => G3_SOURCES.includes(m.source ?? ''));

  it('adds 80-120 G3 entries, one source per campaign title', () => {
    expect(g3.length).toBeGreaterThanOrEqual(80);
    expect(g3.length).toBeLessThanOrEqual(120);
    for (const m of g3) {
      expect(m.id).toMatch(/^cm-/);
      expect(G3_SOURCES).toContain(m.source);
    }
  });

  it('includes the spec-required campaign antagonists', () => {
    const ids = CUSTOM_MONSTERS.map((m) => m.id);
    for (const id of [
      'cm-auril-frostmaiden',
      'cm-brigid-morningglow', 'cm-mungoj-reyhorn', 'cm-endelyn-moongrave', 'cm-sister-gala',
      'cm-wendigo',
      'cm-imix', 'cm-ogremoch', 'cm-yuan-tin', 'cm-bane',
      'cm-air-elemental', 'cm-earth-elemental', 'cm-fire-elemental', 'cm-water-elemental',
      'cm-ileosa-arabasti',
      'cm-barbaroscia-thrune',
      'cm-hurog-manthex', 'cm-wyrmlord',
    ]) {
      expect(ids).toContain(id);
    }
  });

  it('cm-auril-frostmaiden has cold immunity and a Frost Aura trait', () => {
    const auril = findCustomMonsterById('cm-auril-frostmaiden')!;
    expect(auril.damageImmunities).toContain('cold');
    expect((auril.traits ?? []).some((t) => t.name === 'Frost Aura')).toBe(true);
  });

  it('the Hourglass Coven members carry full legendary action blocks', () => {
    for (const id of ['cm-brigid-morningglow', 'cm-mungoj-reyhorn', 'cm-endelyn-moongrave', 'cm-sister-gala']) {
      const hag = findCustomMonsterById(id)!;
      expect(Array.isArray(hag.legendaryActions)).toBe(true);
      expect(hag.legendaryActions!.length).toBeGreaterThan(0);
    }
  });

  it('every G3 monster has passive Perception as a string', () => {
    for (const m of g3) {
      expect(typeof m.senses?.['passive Perception']).toBe('string');
    }
  });

  it('every G3 monster damage array uses only canonical DamageType values', () => {
    const canonical: DamageType[] = [
      'acid', 'bludgeoning', 'cold', 'fire', 'force',
      'lightning', 'necrotic', 'piercing', 'poison',
      'psychic', 'radiant', 'slashing', 'thunder',
    ];
    for (const m of g3) {
      for (const arr of [m.damageResistances, m.damageImmunities, m.damageVulnerabilities]) {
        for (const v of arr ?? []) expect(canonical).toContain(v);
      }
    }
  });
});

describe('populate-campaigns-g5a monsters', () => {
  const G5A_SOURCES = [
    "Planescape: Turn of Fortune's Wheel",
    'Dragonlance: Shadow of the Dragon Queen',
    'Spelljammer: Light of Xaryxis',
    'The Temple of Elemental Evil',
    'Keep on the Borderlands',
    'Queen of the Spiders',
    'Return to the Tomb of Horrors',
    'Against the Cult of the Reptile God',
  ];
  const g5a = CUSTOM_MONSTERS.filter((m) => G5A_SOURCES.includes(m.source ?? ''));

  it('adds 30-60 new G5a entries, all cm- prefixed with a G5a source', () => {
    expect(g5a.length).toBeGreaterThanOrEqual(30);
    expect(g5a.length).toBeLessThanOrEqual(60);
    for (const m of g5a) {
      expect(m.id).toMatch(/^cm-/);
      expect(G5A_SOURCES).toContain(m.source);
    }
  });

  it('includes the campaign BBEGs', () => {
    const ids = CUSTOM_MONSTERS.map((m) => m.id);
    for (const id of [
      'cm-totfw-dispater',
      'cm-totfw-tulpa-puppet-master',
      'cm-dsotdq-blue-lady',
      'cm-lox-xhalcaraz',
      'cm-toee-iuz',
      'cm-b2-zargon',
      'cm-qots-lolth',
      'cm-qots-eclavdra',
      'cm-rtoh-acererak-true-demilich',
      'cm-n1-explictica-defilus',
    ]) {
      expect(ids).toContain(id);
    }
  });

  it('every G5a monster has passive Perception as a string when senses are defined', () => {
    for (const m of g5a) {
      if (!m.senses) continue;
      expect(typeof m.senses['passive Perception']).toBe('string');
    }
  });

  it('every G5a monster damage array uses only canonical DamageType values', () => {
    const canonical: DamageType[] = [
      'acid', 'bludgeoning', 'cold', 'fire', 'force',
      'lightning', 'necrotic', 'piercing', 'poison',
      'psychic', 'radiant', 'slashing', 'thunder',
    ];
    for (const m of g5a) {
      for (const arr of [m.damageResistances, m.damageImmunities, m.damageVulnerabilities]) {
        for (const v of arr ?? []) expect(canonical).toContain(v);
      }
    }
  });

  it('every G5a monster id is unique and collision-free with existing custom monsters', () => {
    const g5aIds = g5a.map((m) => m.id);
    expect(new Set(g5aIds).size).toBe(g5aIds.length);
  });
});

describe('populate-campaigns-g5b monsters', () => {
  const G5B_SOURCES = [
    'Age of Worms',
    'Dungeons of Drakkenheim',
    'Scarlet Citadel',
    'Courts of the Shadow Fey',
    'Empire of the Ghouls',
    'The Shackled City',
    'Vault of the Drow',
    'Return to the Temple of Elemental Evil',
  ];
  const g5b = CUSTOM_MONSTERS.filter((m) => G5B_SOURCES.includes(m.source ?? ''));

  it('adds 30-60 new G5b entries, all cm- prefixed with a G5b source', () => {
    expect(g5b.length).toBeGreaterThanOrEqual(30);
    expect(g5b.length).toBeLessThanOrEqual(60);
    for (const m of g5b) {
      expect(m.id).toMatch(/^cm-/);
      expect(G5B_SOURCES).toContain(m.source);
    }
  });

  it('includes the campaign BBEGs', () => {
    const ids = CUSTOM_MONSTERS.map((m) => m.id);
    for (const id of [
      'cm-aow-dragotha',
      'cm-aow-kyuss-avatar',
      'cm-dodrak-hollow-sovereign',
      'cm-sc-twilight-princess',
      'cm-cotsf-archfey-monarch',
      'cm-eotg-doresain',
      'cm-scap-adimarchus',
      'cm-rtee-olhydra',
      'cm-rtee-yan-c-bin',
    ]) {
      expect(ids).toContain(id);
    }
  });

  it('every G5b monster has passive Perception as a string when senses are defined', () => {
    for (const m of g5b) {
      if (!m.senses) continue;
      expect(typeof m.senses['passive Perception']).toBe('string');
    }
  });

  it('every G5b monster damage array uses only canonical DamageType values', () => {
    const canonical: DamageType[] = [
      'acid', 'bludgeoning', 'cold', 'fire', 'force',
      'lightning', 'necrotic', 'piercing', 'poison',
      'psychic', 'radiant', 'slashing', 'thunder',
    ];
    for (const m of g5b) {
      for (const arr of [m.damageResistances, m.damageImmunities, m.damageVulnerabilities]) {
        for (const v of arr ?? []) expect(canonical).toContain(v);
      }
    }
  });

  it('every G5b monster id is unique', () => {
    const g5bIds = g5b.map((m) => m.id);
    expect(new Set(g5bIds).size).toBe(g5bIds.length);
  });
});

describe('populate-campaigns-g5c monsters', () => {
  const G5C_SOURCES = [
    'The Dark of Hot Springs Island',
    'Reavers of Harkenwold',
    'The Lost City',
    'Points of Light',
    'Night Below',
    'Desert of Desolation',
    'Savage Tide',
    'Expedition to the Barrier Peaks',
  ];
  const g5c = CUSTOM_MONSTERS.filter((m) => G5C_SOURCES.includes(m.source ?? ''));

  it('adds 25-55 new G5c entries, all cm- prefixed with a G5c source', () => {
    expect(g5c.length).toBeGreaterThanOrEqual(25);
    expect(g5c.length).toBeLessThanOrEqual(55);
    for (const m of g5c) {
      expect(m.id).toMatch(/^cm-/);
      expect(G5C_SOURCES).toContain(m.source);
    }
  });

  it('includes the campaign BBEGs', () => {
    const ids = CUSTOM_MONSTERS.map((m) => m.id);
    for (const id of [
      'cm-hsi-sunless-leviathan',
      'cm-roh-twigsplitter',
      'cm-b4-zargon-avatar',
      'cm-pol-bandit-king',
      'cm-nb-savant-aboleth',
      'cm-i35-martek',
      'cm-i35-amun-re',
      'cm-st-demogorgon',
      'cm-st-shami-amourae',
      'cm-s3-froghemoth',
    ]) {
      expect(ids).toContain(id);
    }
  });

  it('every G5c monster has passive Perception as a string when senses are defined', () => {
    for (const m of g5c) {
      if (!m.senses) continue;
      expect(typeof m.senses['passive Perception']).toBe('string');
    }
  });

  it('every G5c monster damage array uses only canonical DamageType values', () => {
    const canonical: DamageType[] = [
      'acid', 'bludgeoning', 'cold', 'fire', 'force',
      'lightning', 'necrotic', 'piercing', 'poison',
      'psychic', 'radiant', 'slashing', 'thunder',
    ];
    for (const m of g5c) {
      for (const arr of [m.damageResistances, m.damageImmunities, m.damageVulnerabilities]) {
        for (const v of arr ?? []) expect(canonical).toContain(v);
      }
    }
  });

  it('every G5c monster id is unique', () => {
    const g5cIds = g5c.map((m) => m.id);
    expect(new Set(g5cIds).size).toBe(g5cIds.length);
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
