import {
  DEFAULT_PREFERENCES,
  DOCK_MIN_HEIGHT,
  PREFERENCES_SCHEMA_VERSION,
  isValidPreferenceValue,
  resolvePreferences,
  partitionPreferenceDelta,
  validatePreferencePatch,
  sparseKnownValues,
} from '@/lib/preferences/schema'

const dockSize = (over: Partial<{ height: number; screenWidth: number; screenHeight: number }> = {}) => ({
  height: 400,
  screenWidth: 1280,
  screenHeight: 800,
  ...over,
})

describe('isValidPreferenceValue', () => {
  it('accepts a correctly-typed value for a known path', () => {
    expect(isValidPreferenceValue('dice.sendToChat', true)).toBe(true)
    expect(isValidPreferenceValue('dice.disableAnimation', null)).toBe(true)
    expect(isValidPreferenceValue('chat.size', dockSize())).toBe(true)
    expect(isValidPreferenceValue('dice.color', { foreground: '#000', background: '#fff' })).toBe(true)
    expect(isValidPreferenceValue('dice.surface', 'green-felt')).toBe(true)
    expect(isValidPreferenceValue('dice.surface', null)).toBe(true)
  })

  it('rejects wrong types, out-of-range sizes, and unknown paths', () => {
    expect(isValidPreferenceValue('dice.sendToChat', 1)).toBe(false)
    expect(isValidPreferenceValue('chat.size', dockSize({ height: DOCK_MIN_HEIGHT - 1 }))).toBe(false)
    expect(isValidPreferenceValue('dice.color', '<script>')).toBe(false)
    expect(isValidPreferenceValue('dice.surface', 123)).toBe(false)
    expect(isValidPreferenceValue('totally.unknown', 'x')).toBe(false)
  })
})

describe('DEFAULT_PREFERENCES', () => {
  it('has exactly the v1 keys with expected defaults', () => {
    expect(DEFAULT_PREFERENCES).toEqual({
      dice: { sendToChat: false, disableAnimation: null, color: null, surface: null, material: null },
      chat: { pinned: false, size: null },
      combat: { autoScrollToNextCombatant: true },
    })
    expect(PREFERENCES_SCHEMA_VERSION).toBe(1)
  })
})

describe('dice.color', () => {
  it('accepts a valid { foreground, background } object', () => {
    expect(isValidPreferenceValue('dice.color', { foreground: '#000', background: '#ff0000' })).toBe(true)
  })

  it('accepts null', () => {
    expect(isValidPreferenceValue('dice.color', null)).toBe(true)
  })

  it('rejects an object missing background', () => {
    expect(isValidPreferenceValue('dice.color', { foreground: '#000' })).toBe(false)
  })

  it('rejects an object with an invalid hex on one field', () => {
    expect(isValidPreferenceValue('dice.color', { foreground: 'red', background: '#fff' })).toBe(false)
  })

  it('rejects an otherwise-valid object carrying an extra key', () => {
    // Extra keys must not reach persistence or the rendering engine unfiltered —
    // useDiceAnimation.ts spreads this object verbatim into theme_customColorset.
    expect(
      isValidPreferenceValue('dice.color', { foreground: '#000', background: '#fff', material: 'wood' }),
    ).toBe(false)
    expect(
      isValidPreferenceValue('dice.color', { foreground: '#000', background: '#fff', outline: '#fff' }),
    ).toBe(false)
  })

  it('rejects the old single-hex-string shape', () => {
    expect(isValidPreferenceValue('dice.color', '#ff0000')).toBe(false)
  })

  it('resolvePreferences repairs a malformed stored object to null (no partial repair)', () => {
    expect(resolvePreferences({ dice: { color: { foreground: '#000' } } }).dice.color).toBeNull()
  })

  it('validatePreferencePatch rejects an object with one invalid hex field, no partial write', () => {
    const res = validatePreferencePatch({ dice: { color: { foreground: '#000', background: 'nothex' } } })
    expect(res.ok).toBe(false)
  })
})

describe('dice.surface', () => {
  it.each(['default', 'blue-felt', 'red-felt', 'green-felt', 'taverntable', 'mahogany', 'stainless', 'cyberpunk', 'cagetown'])('accepts %s', (v) => {
    expect(isValidPreferenceValue('dice.surface', v)).toBe(true)
  })

  it('accepts null', () => {
    expect(isValidPreferenceValue('dice.surface', null)).toBe(true)
  })

  it('rejects an old, now-unsupported value', () => {
    expect(isValidPreferenceValue('dice.surface', 'stone')).toBe(false)
  })

  it('resolvePreferences repairs an out-of-enum stored value to null', () => {
    expect(resolvePreferences({ dice: { surface: 'stone' } }).dice.surface).toBeNull()
  })

  it('validatePreferencePatch rejects an old unsupported value', () => {
    expect(validatePreferencePatch({ dice: { surface: 'felt' } }).ok).toBe(false)
  })
})

describe('dice.material', () => {
  it.each(['glass', 'none', 'metal', 'wood'])('accepts %s', (v) => {
    expect(isValidPreferenceValue('dice.material', v)).toBe(true)
  })

  it('accepts null', () => {
    expect(isValidPreferenceValue('dice.material', null)).toBe(true)
  })

  it('rejects the display label instead of the engine value', () => {
    expect(isValidPreferenceValue('dice.material', 'plastic')).toBe(false)
  })

  it('resolvePreferences repairs a malformed stored value to null', () => {
    expect(resolvePreferences({ dice: { material: 'unknown' } }).dice.material).toBeNull()
  })

  it('validatePreferencePatch accepts a valid material', () => {
    expect(validatePreferencePatch({ dice: { material: 'wood' } })).toEqual({
      ok: true,
      values: { dice: { material: 'wood' } },
    })
  })

  it('sparseKnownValues includes an explicit stored dice.material', () => {
    expect(sparseKnownValues({ dice: { material: 'metal' } })).toEqual({ dice: { material: 'metal' } })
  })

  it('partitionPreferenceDelta routes a null (default) dice.material to $unset', () => {
    expect(partitionPreferenceDelta({ dice: { material: null } })).toEqual({
      set: {},
      unset: { 'preferences.values.dice.material': '' },
    })
  })
})

describe('combat.autoScrollToNextCombatant', () => {
  it('accepts true and false', () => {
    expect(isValidPreferenceValue('combat.autoScrollToNextCombatant', true)).toBe(true)
    expect(isValidPreferenceValue('combat.autoScrollToNextCombatant', false)).toBe(true)
  })

  it('rejects non-boolean values', () => {
    for (const v of ['yes', 1, null, {}]) {
      expect(isValidPreferenceValue('combat.autoScrollToNextCombatant', v)).toBe(false)
    }
  })

  it('resolves to the default true when nothing is stored', () => {
    expect(resolvePreferences({}).combat.autoScrollToNextCombatant).toBe(true)
  })

  it('degrades a malformed stored value to the default', () => {
    expect(resolvePreferences({ combat: { autoScrollToNextCombatant: 'yes' } }).combat.autoScrollToNextCombatant).toBe(true)
  })

  it('resolves a valid stored false value', () => {
    expect(resolvePreferences({ combat: { autoScrollToNextCombatant: false } }).combat.autoScrollToNextCombatant).toBe(false)
  })

  it('sparseKnownValues includes an explicit stored value', () => {
    expect(sparseKnownValues({ combat: { autoScrollToNextCombatant: false } })).toEqual({
      combat: { autoScrollToNextCombatant: false },
    })
  })

  it('validatePreferencePatch accepts a boolean and rejects a non-boolean', () => {
    expect(validatePreferencePatch({ combat: { autoScrollToNextCombatant: true } })).toEqual({
      ok: true,
      values: { combat: { autoScrollToNextCombatant: true } },
    })
    expect(validatePreferencePatch({ combat: { autoScrollToNextCombatant: 'true' } }).ok).toBe(false)
  })

  it('partitionPreferenceDelta unsets the default and sets a non-default value', () => {
    expect(partitionPreferenceDelta({ combat: { autoScrollToNextCombatant: true } })).toEqual({
      set: {},
      unset: { 'preferences.values.combat.autoScrollToNextCombatant': '' },
    })
    expect(partitionPreferenceDelta({ combat: { autoScrollToNextCombatant: false } })).toEqual({
      set: { 'preferences.values.combat.autoScrollToNextCombatant': false },
      unset: {},
    })
  })
})

describe('resolvePreferences', () => {
  it('returns full defaults for {} and for junk input', () => {
    expect(resolvePreferences({})).toEqual(DEFAULT_PREFERENCES)
    expect(resolvePreferences(null)).toEqual(DEFAULT_PREFERENCES)
    expect(resolvePreferences('nope')).toEqual(DEFAULT_PREFERENCES)
  })

  it('deep-merges a partial stored delta without mutating defaults', () => {
    const r = resolvePreferences({ dice: { sendToChat: true } })
    expect(r.dice.sendToChat).toBe(true)
    expect(r.chat.pinned).toBe(false)
    expect(DEFAULT_PREFERENCES.dice.sendToChat).toBe(false)
  })

  it('drops unknown keys', () => {
    const r = resolvePreferences({ dice: { bogus: 5 }, extra: true })
    expect(r).toEqual(DEFAULT_PREFERENCES)
  })

  it('repairs a wrongly-typed stored value by falling back to the default', () => {
    const r = resolvePreferences({ dice: { sendToChat: 'yes' }, chat: { size: { height: 5 } } })
    expect(r.dice.sendToChat).toBe(false)
    expect(r.chat.size).toBeNull()
  })

  it('accepts a valid stored DockSize', () => {
    const size = dockSize()
    expect(resolvePreferences({ chat: { size } }).chat.size).toEqual(size)
  })
})

describe('validatePreferencePatch — rejections', () => {
  it.each([null, undefined, [], 'x', 5, true])('rejects non-object body %p', (body) => {
    expect(validatePreferencePatch(body as unknown).ok).toBe(false)
  })

  it('rejects wrongly-typed values', () => {
    expect(validatePreferencePatch({ dice: { sendToChat: 1 } }).ok).toBe(false)
    expect(validatePreferencePatch({ chat: { size: 'large' } }).ok).toBe(false)
  })

  it('rejects an out-of-range dock height', () => {
    expect(validatePreferencePatch({ chat: { size: dockSize({ height: DOCK_MIN_HEIGHT - 1 }) } }).ok).toBe(false)
    expect(validatePreferencePatch({ chat: { size: dockSize({ height: 999999 }) } }).ok).toBe(false)
  })

  it('rejects a body with no known keys', () => {
    expect(validatePreferencePatch({ bogusKey: 5 }).ok).toBe(false)
  })

  it('rejects dice.color with markup / non-hex / the old string shape', () => {
    expect(validatePreferencePatch({ dice: { color: '<script>' } }).ok).toBe(false)
    expect(validatePreferencePatch({ dice: { color: 'red' } }).ok).toBe(false)
  })
})

describe('validatePreferencePatch — acceptances', () => {
  it('strips unknown keys and keeps known ones', () => {
    const res = validatePreferencePatch({ dice: { sendToChat: true }, bogusKey: 5 })
    expect(res).toEqual({ ok: true, values: { dice: { sendToChat: true } } })
  })

  it('accepts dice.disableAnimation of true / false / null', () => {
    for (const v of [true, false, null]) {
      expect(validatePreferencePatch({ dice: { disableAnimation: v } }).ok).toBe(true)
    }
  })

  it('accepts dice.color object / null and dice.surface enum / null', () => {
    expect(validatePreferencePatch({ dice: { color: null } }).ok).toBe(true)
    expect(validatePreferencePatch({ dice: { color: { foreground: '#a1b', background: '#fff' } } }).ok).toBe(true)
    expect(validatePreferencePatch({ dice: { color: { foreground: '#aabbcc', background: '#000' } } }).ok).toBe(true)
    expect(validatePreferencePatch({ dice: { surface: null } }).ok).toBe(true)
    expect(validatePreferencePatch({ dice: { surface: 'mahogany' } }).ok).toBe(true)
  })

  it('accepts a valid DockSize and chat.size null', () => {
    expect(validatePreferencePatch({ chat: { size: dockSize() } }).ok).toBe(true)
    expect(validatePreferencePatch({ chat: { size: null } }).ok).toBe(true)
  })
})

describe('partitionPreferenceDelta', () => {
  it('routes non-default values to $set', () => {
    expect(partitionPreferenceDelta({ dice: { sendToChat: true }, chat: { pinned: true } })).toEqual({
      set: {
        'preferences.values.dice.sendToChat': true,
        'preferences.values.chat.pinned': true,
      },
      unset: {},
    })
  })

  it('routes values equal to the default to $unset', () => {
    expect(partitionPreferenceDelta({ dice: { sendToChat: false }, chat: { size: null } })).toEqual({
      set: {},
      unset: {
        'preferences.values.dice.sendToChat': '',
        'preferences.values.chat.size': '',
      },
    })
  })
})
