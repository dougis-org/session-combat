/**
 * Curated registry of selectable 3D dice appearances for the global dice fab.
 *
 * The 3D tumble is rendered by `@drdreo/dice-box-threejs@1.1.0`, which bundles a large
 * named-colorset table (`fl`) and a small material-preset table (`J_`). This module is a
 * hand-maintained, engine-decoupled subset: only the non-licensed, non-novelty colorsets
 * (categories `Colors`, `Damage Types`, `Custom Sets`) and the four confirmed material
 * presets. Swatch colors are copied from the engine's `fl` entry so the picker can render a
 * flat CSS preview without loading the engine.
 *
 * Every colorset here must have its texture asset vendored under
 * `public/dice-box-threejs/textures/` — enforced by `diceAppearance.assets.test.ts`.
 *
 * TODO(add-user-preference-persistence): the persisted ids map onto that branch's
 * `PreferenceValues.dice.colorset` / `PreferenceValues.dice.material` — keep the shape a
 * plain string so it can be adopted without a migration.
 */

export type DiceColorsetCategory = 'Colors' | 'Damage Types' | 'Custom Sets'

/** Category render/order for the appearance modal. */
export const DICE_COLORSET_CATEGORIES: readonly DiceColorsetCategory[] = [
  'Colors',
  'Damage Types',
  'Custom Sets',
]

export interface DiceColorset {
  /** Engine `fl` key, passed straight through as `theme_colorset`. */
  id: string
  /** Display label. */
  name: string
  category: DiceColorsetCategory
  /** Flat CSS colors for the picker swatch (foreground text over background fill). */
  swatch: { fg: string; bg: string }
}

export interface DiceMaterial {
  /** Engine `J_` key, passed straight through as `theme_material`. */
  id: string
  /** Display label. */
  name: string
}

export const DEFAULT_COLORSET = 'white'
export const DEFAULT_MATERIAL = 'glass'

export const DICE_COLORSETS: readonly DiceColorset[] = [
  // ── Colors ────────────────────────────────────────────────────────────────
  { id: 'white', name: 'White', category: 'Colors', swatch: { fg: '#000000', bg: '#FFFFFF' } },
  { id: 'black', name: 'Black', category: 'Colors', swatch: { fg: '#FFFFFF', bg: '#000000' } },
  { id: 'rainbow', name: 'Rainbow', category: 'Colors', swatch: { fg: '#FF5959', bg: '#00008E' } },
  // ── Damage Types ──────────────────────────────────────────────────────────
  { id: 'radiant', name: 'Radiant', category: 'Damage Types', swatch: { fg: '#F9B333', bg: '#FFFFFF' } },
  { id: 'fire', name: 'Fire', category: 'Damage Types', swatch: { fg: '#F8D84F', bg: '#F43C04' } },
  { id: 'ice', name: 'Ice', category: 'Damage Types', swatch: { fg: '#60E9FF', bg: '#253F70' } },
  { id: 'poison', name: 'Poison', category: 'Damage Types', swatch: { fg: '#D6A8FF', bg: '#66409E' } },
  { id: 'acid', name: 'Acid', category: 'Damage Types', swatch: { fg: '#A9FF70', bg: '#69F006' } },
  { id: 'thunder', name: 'Thunder', category: 'Damage Types', swatch: { fg: '#FFC500', bg: '#7D7D7D' } },
  { id: 'lightning', name: 'Lightning', category: 'Damage Types', swatch: { fg: '#F17105', bg: '#EDDEA4' } },
  { id: 'air', name: 'Air', category: 'Damage Types', swatch: { fg: '#4B6B73', bg: '#A4CCD6' } },
  { id: 'water', name: 'Water', category: 'Damage Types', swatch: { fg: '#60E9FF', bg: '#6B98A3' } },
  { id: 'earth', name: 'Earth', category: 'Damage Types', swatch: { fg: '#6C9943', bg: '#56341A' } },
  { id: 'force', name: 'Force', category: 'Damage Types', swatch: { fg: '#FFFFFF', bg: '#FF68FF' } },
  { id: 'psychic', name: 'Psychic', category: 'Damage Types', swatch: { fg: '#D6A8FF', bg: '#934FC3' } },
  { id: 'necrotic', name: 'Necrotic', category: 'Damage Types', swatch: { fg: '#FFFFFF', bg: '#6F0000' } },
  // ── Custom Sets ───────────────────────────────────────────────────────────
  { id: 'breebaby', name: 'Pastel Sunset', category: 'Custom Sets', swatch: { fg: '#5E175E', bg: '#A1D9FC' } },
  { id: 'pinkdreams', name: 'Pink Dreams', category: 'Custom Sets', swatch: { fg: '#FFFFFF', bg: '#F400A1' } },
  { id: 'inspired', name: 'Inspired', category: 'Custom Sets', swatch: { fg: '#FFD800', bg: '#C4C4B6' } },
  { id: 'bloodmoon', name: 'Blood Moon', category: 'Custom Sets', swatch: { fg: '#CDB800', bg: '#6F0000' } },
  { id: 'starynight', name: 'Stary Night', category: 'Custom Sets', swatch: { fg: '#E2E2E2', bg: '#233660' } },
  { id: 'glitterparty', name: 'Glitter Party', category: 'Custom Sets', swatch: { fg: '#FFFFFF', bg: '#7FC9FF' } },
  { id: 'astralsea', name: 'Astral Sea', category: 'Custom Sets', swatch: { fg: '#565656', bg: '#FFFFFF' } },
  { id: 'bronze', name: 'Thylean Bronze', category: 'Custom Sets', swatch: { fg: '#FF9159', bg: '#643100' } },
]

export const DICE_MATERIALS: readonly DiceMaterial[] = [
  { id: 'glass', name: 'Glass' },
  { id: 'none', name: 'Plastic' },
  { id: 'metal', name: 'Metal' },
  { id: 'wood', name: 'Wood' },
]

const COLORSET_IDS = new Set(DICE_COLORSETS.map(c => c.id))
const MATERIAL_IDS = new Set(DICE_MATERIALS.map(m => m.id))

export interface ResolvedDiceAppearance {
  colorset: string
  material: string
}

/**
 * Coerce arbitrary stored values (absent, wrong type, or an id no longer in the registry)
 * to a valid appearance. Never throws — a hand-edited `localStorage` entry or a colorset
 * dropped by an engine upgrade falls back to the engine defaults.
 */
export function resolveDiceAppearance(
  rawColorset: unknown,
  rawMaterial: unknown,
): ResolvedDiceAppearance {
  return {
    colorset:
      typeof rawColorset === 'string' && COLORSET_IDS.has(rawColorset)
        ? rawColorset
        : DEFAULT_COLORSET,
    material:
      typeof rawMaterial === 'string' && MATERIAL_IDS.has(rawMaterial)
        ? rawMaterial
        : DEFAULT_MATERIAL,
  }
}
