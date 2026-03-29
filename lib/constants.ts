// Application-wide constants

/**
 * User ID for global/admin-controlled templates
 * Used to distinguish global monsters from user-created ones
 */
export const GLOBAL_USER_ID = 'GLOBAL';

// D&D 5e canonical damage types
export const DAMAGE_TYPES = [
  'acid',
  'bludgeoning',
  'cold',
  'fire',
  'force',
  'lightning',
  'necrotic',
  'piercing',
  'poison',
  'psychic',
  'radiant',
  'slashing',
  'thunder',
] as const;

export type DamageType = (typeof DAMAGE_TYPES)[number];

// Damage type families for grouped UI display
export const DAMAGE_TYPE_GROUPS = {
  Physical: ['bludgeoning', 'piercing', 'slashing'] as DamageType[],
  Elemental: ['acid', 'cold', 'fire', 'lightning', 'thunder'] as DamageType[],
  'Energy & Planar': ['force', 'necrotic', 'radiant'] as DamageType[],
  Other: ['poison', 'psychic'] as DamageType[],
} as const;

// Combat-scoped damage effect presets
import type { DamageEffectPreset } from '@/lib/types';

export const DAMAGE_EFFECT_PRESETS: readonly DamageEffectPreset[] = [
  {
    id: 'rage',
    label: 'Rage',
    description: 'Barbarian Rage: resistance to B/P/S damage',
    effects: [
      { type: 'bludgeoning', kind: 'resistance' },
      { type: 'piercing', kind: 'resistance' },
      { type: 'slashing', kind: 'resistance' },
    ],
  },
  {
    id: 'stoneskin',
    label: 'Stoneskin',
    description: 'Stoneskin spell: resistance to B/P/S damage',
    effects: [
      { type: 'bludgeoning', kind: 'resistance' },
      { type: 'piercing', kind: 'resistance' },
      { type: 'slashing', kind: 'resistance' },
    ],
  },
  {
    id: 'protection-from-energy',
    label: 'Protection from Energy',
    description: 'Choose one of: acid, cold, fire, lightning, or thunder',
    effects: [
      { type: null, kind: 'resistance', choicesLimited: ['acid', 'cold', 'fire', 'lightning', 'thunder'] as DamageType[] },
    ],
  },
  {
    id: 'fire-shield-warm',
    label: 'Fire Shield (Warm)',
    description: 'Fire Shield (warm variant): resistance to cold damage',
    effects: [
      { type: 'cold', kind: 'resistance' },
    ],
  },
  {
    id: 'fire-shield-chill',
    label: 'Fire Shield (Chill)',
    description: 'Fire Shield (chill variant): resistance to fire damage',
    effects: [
      { type: 'fire', kind: 'resistance' },
    ],
  },
  {
    id: 'absorb-elements',
    label: 'Absorb Elements',
    description: 'Absorb Elements: choose any damage type',
    effects: [
      { type: null, kind: 'resistance' },
    ],
  },
  {
    id: 'warding-bond',
    label: 'Warding Bond',
    description: 'Warding Bond spell: resistance to all damage types',
    effects: [
      { type: 'acid', kind: 'resistance' },
      { type: 'bludgeoning', kind: 'resistance' },
      { type: 'cold', kind: 'resistance' },
      { type: 'fire', kind: 'resistance' },
      { type: 'force', kind: 'resistance' },
      { type: 'lightning', kind: 'resistance' },
      { type: 'necrotic', kind: 'resistance' },
      { type: 'piercing', kind: 'resistance' },
      { type: 'poison', kind: 'resistance' },
      { type: 'psychic', kind: 'resistance' },
      { type: 'radiant', kind: 'resistance' },
      { type: 'slashing', kind: 'resistance' },
      { type: 'thunder', kind: 'resistance' },
    ],
  },
];
