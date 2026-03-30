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

/**
 * Normalize an array of unknown values to canonical DamageType entries.
 * Lowercases and trims each value, then filters to known types.
 * Safe to call with any input (non-strings are coerced via String()).
 */
export function filterToDamageTypes(values: unknown[]): DamageType[] {
  return (values as string[])
    .map(v => String(v).toLowerCase().trim())
    .filter((v): v is DamageType => (DAMAGE_TYPES as readonly string[]).includes(v));
}

// Damage type families for grouped UI display
export const DAMAGE_TYPE_GROUPS = {
  Physical: ['bludgeoning', 'piercing', 'slashing'] as DamageType[],
  Elemental: ['acid', 'cold', 'fire', 'lightning', 'thunder'] as DamageType[],
  'Energy & Planar': ['force', 'necrotic', 'radiant'] as DamageType[],
  Other: ['poison', 'psychic'] as DamageType[],
} as const;

// Combat-scoped damage effect presets
import type { DamageEffectPreset } from '@/lib/types';

const BPS_RESISTANCE_EFFECTS = (
  ['bludgeoning', 'piercing', 'slashing'] as DamageType[]
).map(type => ({ type, kind: 'resistance' as const }));

export const DAMAGE_EFFECT_PRESETS: readonly DamageEffectPreset[] = [
  {
    id: 'rage',
    label: 'Rage',
    description: 'Barbarian Rage: resistance to B/P/S damage',
    effects: BPS_RESISTANCE_EFFECTS,
  },
  {
    id: 'stoneskin',
    label: 'Stoneskin',
    description: 'Stoneskin spell: resistance to B/P/S damage',
    effects: BPS_RESISTANCE_EFFECTS,
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
    effects: DAMAGE_TYPES.map(t => ({ type: t, kind: 'resistance' as const })),
  },
];
