import {
  DICE_COLORSETS,
  DICE_COLORSET_CATEGORIES,
  DICE_MATERIALS,
  DEFAULT_COLORSET,
  DEFAULT_MATERIAL,
  resolveDiceAppearance,
} from '@/lib/dice/diceAppearance'
import {
  COLORSET_TEXTURE_FILES,
  MATERIAL_PRESET_KEYS,
} from './__fixtures__/diceBoxEngineFacts'

const CSS_COLOR = /^#[0-9a-fA-F]{3,8}$/

describe('diceAppearance — engine-facts fixture (task 1.1)', () => {
  it('1.1-a material preset keys match the engine J_ table exactly', () => {
    expect([...MATERIAL_PRESET_KEYS].sort()).toEqual(
      ['glass', 'metal', 'none', 'perfectmetal', 'wood'].sort(),
    )
  })

  it('1.1-b every registry colorset id has a texture mapping in the fixture', () => {
    for (const cs of DICE_COLORSETS) {
      expect(COLORSET_TEXTURE_FILES).toHaveProperty(cs.id)
    }
  })
})

describe('diceAppearance — colorset registry (tasks 2.1 / 2.2)', () => {
  const EXCLUDED_IDS = ['test', 'tigerking', 'acleaf', 'isabelle', 'thecage']
  const EXCLUDED_PREFIX = /^(swrpg_|swa_|swl_|xwing_)/

  it('2.1-a every entry is in an allowed category', () => {
    for (const cs of DICE_COLORSETS) {
      expect(DICE_COLORSET_CATEGORIES).toContain(cs.category)
    }
  })

  it('2.1-b excludes licensed and novelty sets', () => {
    for (const cs of DICE_COLORSETS) {
      expect(EXCLUDED_IDS).not.toContain(cs.id)
      expect(cs.id).not.toMatch(EXCLUDED_PREFIX)
    }
  })

  it('2.1-c contains the expected curated ids', () => {
    const expected = [
      'white', 'black', 'rainbow',
      'radiant', 'fire', 'ice', 'poison', 'acid', 'thunder', 'lightning',
      'air', 'water', 'earth', 'force', 'psychic', 'necrotic',
      'breebaby', 'pinkdreams', 'inspired', 'bloodmoon', 'starynight',
      'glitterparty', 'astralsea', 'bronze',
    ]
    expect(DICE_COLORSETS.map(c => c.id).sort()).toEqual(expected.sort())
  })

  it('2.1-d each entry has a non-empty name, category, and CSS-color swatch', () => {
    for (const cs of DICE_COLORSETS) {
      expect(cs.name.trim().length).toBeGreaterThan(0)
      expect(cs.category.length).toBeGreaterThan(0)
      expect(cs.swatch.fg).toMatch(CSS_COLOR)
      expect(cs.swatch.bg).toMatch(CSS_COLOR)
    }
  })

  it('2.1-d colorset ids are unique', () => {
    expect(new Set(DICE_COLORSETS.map(c => c.id)).size).toBe(DICE_COLORSETS.length)
  })
})

describe('diceAppearance — material registry (task 2.1-e)', () => {
  it('exposes exactly the four confirmed materials, with none named "Plastic"', () => {
    expect(DICE_MATERIALS.map(m => m.id).sort()).toEqual(['glass', 'metal', 'none', 'wood'])
    expect(DICE_MATERIALS.find(m => m.id === 'none')?.name).toBe('Plastic')
  })

  it('every material id is a real engine preset key', () => {
    for (const m of DICE_MATERIALS) {
      expect(MATERIAL_PRESET_KEYS as readonly string[]).toContain(m.id)
    }
  })
})

describe('diceAppearance — defaults (task 2.1-f)', () => {
  it('DEFAULT_COLORSET is white and DEFAULT_MATERIAL is glass, both present in the registry', () => {
    expect(DEFAULT_COLORSET).toBe('white')
    expect(DEFAULT_MATERIAL).toBe('glass')
    expect(DICE_COLORSETS.some(c => c.id === DEFAULT_COLORSET)).toBe(true)
    expect(DICE_MATERIALS.some(m => m.id === DEFAULT_MATERIAL)).toBe(true)
  })
})

describe('resolveDiceAppearance (task 2.4)', () => {
  it('2.4-a passes a valid pair through unchanged', () => {
    expect(resolveDiceAppearance('fire', 'metal')).toEqual({ colorset: 'fire', material: 'metal' })
  })

  it('2.4-b unknown colorset string falls back to the default', () => {
    expect(resolveDiceAppearance('nope', 'metal').colorset).toBe('white')
  })

  it.each([
    ['number', 42],
    ['object', {}],
    ['array', []],
    ['undefined', undefined],
    ['null', null],
    ['boolean', true],
  ])('2.4-c %s inputs resolve to defaults without throwing', (_label, value) => {
    expect(() => resolveDiceAppearance(value, value)).not.toThrow()
    expect(resolveDiceAppearance(value, value)).toEqual({
      colorset: 'white',
      material: 'glass',
    })
  })

  it('2.4-d resolves each field independently', () => {
    expect(resolveDiceAppearance('bloodmoon', 'not-real')).toEqual({
      colorset: 'bloodmoon',
      material: 'glass',
    })
    expect(resolveDiceAppearance('not-real', 'wood')).toEqual({
      colorset: 'white',
      material: 'wood',
    })
  })
})
