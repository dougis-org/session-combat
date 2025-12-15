/**
 * D&D 5e SRD Elementals
 * Stone, air, fire, and water elementals
 */

import { MonsterTemplate } from '@/lib/types';

export const ELEMENTALS: Omit<MonsterTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt' | '_id'>[] = [
  {
    name: 'Gargoyle',
    size: 'medium',
    type: 'elemental',
    alignment: 'chaotic evil',
    ac: 15,
    hp: 52,
    maxHp: 52,
    speed: '30 ft., fly 60 ft.',
    abilityScores: {
      strength: 15,
      dexterity: 11,
      constitution: 16,
      intelligence: 6,
      wisdom: 11,
      charisma: 7,
    },
    damageResistances: ['bludgeoning', 'piercing', 'slashing', 'from nonmagical attacks', 'that aren\'t adamantine'],
    damageImmunities: ['poison'],
    conditionImmunities: ['exhaustion', 'frightened', 'paralyzed', 'petrified', 'poisoned'],
    senses: { darkvision: '60 ft.', passive_perception: '10' },
    languages: ['Terran'],
    challengeRating: 2,
    experiencePoints: 450,
    description: 'Gargoyles are stone elementals often found guarding buildings and strongholds.',
    source: 'SRD',
    isGlobal: true,
    traits: [
      {
        name: 'False Appearance',
        description: 'While the gargoyle remains motionless, it is indistinguishable from an inanimate statue.',
      },
    ],
    actions: [
      {
        name: 'Multiattack',
        description: 'The gargoyle makes two claw attacks or two slam attacks.',
      },
      {
        name: 'Claw',
        description: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage.',
        attackBonus: 4,
        damageDescription: '1d6 + 2 slashing',
      },
      {
        name: 'Slam',
        description: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 6 (1d8 + 2) bludgeoning damage.',
        attackBonus: 4,
        damageDescription: '1d8 + 2 bludgeoning',
      },
    ],
  },
];
