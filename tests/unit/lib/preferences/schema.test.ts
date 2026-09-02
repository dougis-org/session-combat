import {
  DEFAULT_PREFERENCES,
  DOCK_MIN_HEIGHT,
  PREFERENCES_SCHEMA_VERSION,
  isValidPreferenceValue,
  resolvePreferences,
  partitionPreferenceDelta,
  validatePreferencePatch,
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
    expect(isValidPreferenceValue('dice.color', '#a1b')).toBe(true)
    expect(isValidPreferenceValue('dice.surface', 'wood')).toBe(true)
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
      dice: { sendToChat: false, disableAnimation: null, color: null, surface: null },
      chat: { pinned: false, size: null },
    })
    expect(PREFERENCES_SCHEMA_VERSION).toBe(1)
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

  it('rejects dice.color with markup / non-hex', () => {
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

  it('accepts dice.color and dice.surface null and valid strings', () => {
    expect(validatePreferencePatch({ dice: { color: null } }).ok).toBe(true)
    expect(validatePreferencePatch({ dice: { color: '#a1b' } }).ok).toBe(true)
    expect(validatePreferencePatch({ dice: { color: '#aabbcc' } }).ok).toBe(true)
    expect(validatePreferencePatch({ dice: { surface: null } }).ok).toBe(true)
    expect(validatePreferencePatch({ dice: { surface: 'wood' } }).ok).toBe(true)
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
