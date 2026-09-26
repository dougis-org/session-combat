import { readFileSync } from 'fs'
import { join } from 'path'
import { DICE_SURFACE_VALUES, DICE_MATERIAL_VALUES } from '@/lib/preferences/schema'

// Tripwire against the vendored @drdreo/dice-box-threejs engine bundle: DICE_SURFACE_VALUES
// and DICE_MATERIAL_VALUES must stay real, accepted engine option values, not the package's
// (incorrect, for theme_surface) shipped .d.ts. An unguarded `j_[theme_surface]` lookup in the
// engine throws for any key not in its theme table, which the useDiceAnimation try/catch
// swallows into a session-wide fallback — so a stale value here is a silent, permanent
// regression, not a compile error. If this fails after an engine upgrade, re-derive the
// tuples from the new bundle's `j_` (surface theme) and `MATERIAL_PRESET_KEYS`-equivalent
// tables rather than trusting the package's .d.ts.
describe('dice.surface / dice.material enums match the vendored engine bundle', () => {
  const bundlePath = join(
    process.cwd(),
    'node_modules/@drdreo/dice-box-threejs/dist/dice-box-threejs.es.js',
  )
  const bundle = readFileSync(bundlePath, 'utf-8')

  it('every DICE_SURFACE_VALUES member is a real theme_surface key in the engine bundle', () => {
    for (const v of DICE_SURFACE_VALUES) {
      // Each theme key appears as a quoted object key ("blue-felt": {…) or bare identifier
      // (default: {…) in the j_ table literal. Plain substring checks (not a dynamically
      // built RegExp — `v` is always a hardcoded DICE_SURFACE_VALUES member, but a
      // non-literal RegExp is still flagged as a DoS-pattern smell by static analysis).
      const quoted = bundle.includes(`"${v}": {`) || bundle.includes(`'${v}': {`)
      const bare = bundle.includes(`${v}: {`)
      expect(quoted || bare).toBe(true)
    }
  })

  it('every DICE_MATERIAL_VALUES member is a real theme_material preset key', () => {
    // The known-good preset key set from the engine's material table, checked into this
    // test rather than re-parsed from the bundle (the table itself is compact and stable).
    const MATERIAL_PRESET_KEYS = ['none', 'perfectmetal', 'metal', 'wood', 'glass']
    for (const v of DICE_MATERIAL_VALUES) {
      expect(MATERIAL_PRESET_KEYS).toContain(v)
    }
  })

  it('regression guard: wood-table / wood-tray are NOT real engine theme_surface keys', () => {
    // These appear in the package's (incorrect) .d.ts and were mistakenly used as the
    // DICE_SURFACE_VALUES source in an earlier version of this enum. They are the engine's
    // *inner* surface-material sound-file field values, not accepted theme_surface option
    // values -- confirm they stay out of DICE_SURFACE_VALUES.
    expect(DICE_SURFACE_VALUES as readonly string[]).not.toContain('wood-table')
    expect(DICE_SURFACE_VALUES as readonly string[]).not.toContain('wood-tray')
  })
})
