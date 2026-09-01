/**
 * Checked-in snapshot of the `@drdreo/dice-box-threejs@1.1.0` engine internals that the
 * dice-appearance feature depends on. Source of truth:
 * `node_modules/@drdreo/dice-box-threejs/dist/dice-box-threejs.es.js`
 *  - `fl`  — the named colorset registry (`id -> { category, texture }`)
 *  - the texture table preceding `fl` (`textureName -> { source: "textures/<file>.webp" }`)
 *  - `J_`  — the material preset table (its keys are the accepted `theme_material` values)
 *
 * If the engine is ever upgraded, re-derive this fixture from the new bundle. The
 * `diceAppearance.assets.test.ts` asset check is the tripwire: a stale entry here (or a
 * colorset added to `DICE_COLORSETS` whose texture is missing) fails the build.
 */

/** The exact keys of the engine's `J_` material preset table (accepted `theme_material`). */
export const MATERIAL_PRESET_KEYS = ['none', 'perfectmetal', 'metal', 'wood', 'glass'] as const

/**
 * For every colorset id the appearance registry may expose: the texture `*.webp` basenames
 * the engine resolves it to (via `fl[id].texture` -> the texture table `source`). An empty
 * array means the engine texture is `"none"` (`source: ""`), i.e. no asset is requested.
 */
export const COLORSET_TEXTURE_FILES: Readonly<Record<string, readonly string[]>> = {
  // Colors
  white: [],
  black: [],
  rainbow: [],
  // Damage Types
  radiant: ['paper'],
  fire: ['fire'],
  ice: ['ice'],
  poison: ['cloudy'],
  acid: ['marble'],
  thunder: ['cloudy'],
  lightning: ['ice'],
  air: ['cloudy'],
  water: ['water'],
  earth: ['speckles'],
  force: ['stars'],
  psychic: ['speckles'],
  necrotic: ['skulls'],
  // Custom Sets
  breebaby: ['marble'],
  pinkdreams: ['skulls'],
  inspired: [],
  bloodmoon: ['marble'],
  starynight: ['speckles'],
  glitterparty: ['glitter'],
  astralsea: ['astral'],
  bronze: ['bronze01', 'bronze02', 'bronze03', 'bronze03a', 'bronze03b', 'bronze04'],
} as const

/** Where the vendored engine textures live under `public/` (`scripts/vendor-dice-assets.mjs`). */
export const TEXTURE_PUBLIC_DIR = 'public/dice-box-threejs/textures'
