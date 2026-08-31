import type { BuiltRoll } from '@/lib/dice/useDicePoolState'

// Shared test harness for `useDiceAnimation` specs: a stateful stand-in for
// `@drdreo/dice-box-threejs` plus the common fixtures. `roll()` / `add()` parse the "@"
// notation and accumulate settled dice; `getDiceResults()` returns the running set. By
// default every die settles on its forced value so reconciliation passes.

export interface FakeDie {
  sides: number
  value: number
}

export const engineMock = {
  initMock: jest.fn().mockResolvedValue(undefined),
  clearMock: jest.fn(),
  ctorMock: jest.fn(),
  rollMock: jest.fn(),
  addMock: jest.fn(),
  accumulated: [] as FakeDie[],
  /** Override the faces a given notation settles on (for mismatch tests). */
  faceOverride: null as ((notation: string, forced: FakeDie[]) => FakeDie[]) | null,
  /** When set, roll() returns this promise instead of settling (hang / supersede tests). */
  rollOverride: null as (() => Promise<unknown>) | null,
}

function parseNotation(notation: string): FakeDie[] {
  const [head, tail] = notation.split('@')
  const [, qtyStr, sidesStr] = head.match(/^(\d+)d(\d+)$/)!
  const sides = Number(sidesStr)
  if (tail) return tail.split(',').map(v => ({ sides, value: Number(v) }))
  // no "@": plain roll — deterministic filler so tests are stable (never the forced value)
  return Array.from({ length: Number(qtyStr) }, () => ({ sides, value: sides }))
}

function toResults(dice: FakeDie[]) {
  const bySize = new Map<number, FakeDie[]>()
  for (const d of dice) bySize.set(d.sides, [...(bySize.get(d.sides) ?? []), d])
  return {
    notation: '',
    modifier: 0,
    total: dice.reduce((s, d) => s + d.value, 0),
    sets: [...bySize.entries()].map(([sides, rolls]) => ({
      num: rolls.length,
      type: `d${sides}`,
      sides,
      total: rolls.reduce((s, d) => s + d.value, 0),
      rolls: rolls.map((d, id) => ({ type: `d${sides}`, sides, id, value: d.value, reason: 'forced' })),
    })),
  }
}

/** Factory for `jest.mock('@drdreo/dice-box-threejs', () => diceBoxMockFactory())`. */
export function diceBoxMockFactory() {
  return {
    __esModule: true,
    default: class {
      constructor(...args: unknown[]) {
        engineMock.ctorMock(...args)
      }
      initialize = engineMock.initMock
      clearDice = engineMock.clearMock
      roll = (notation: string) => {
        engineMock.rollMock(notation)
        if (engineMock.rollOverride) return engineMock.rollOverride()
        engineMock.accumulated = []
        const forced = parseNotation(notation)
        engineMock.accumulated.push(
          ...(engineMock.faceOverride ? engineMock.faceOverride(notation, forced) : forced),
        )
        return Promise.resolve(toResults(engineMock.accumulated))
      }
      add = (notation: string) => {
        engineMock.addMock(notation)
        const forced = parseNotation(notation)
        const settled = engineMock.faceOverride ? engineMock.faceOverride(notation, forced) : forced
        engineMock.accumulated.push(...settled)
        return Promise.resolve(settled)
      }
      getDiceResults = () => toResults(engineMock.accumulated)
    },
  }
}

export function resetEngineMock() {
  jest.clearAllMocks()
  engineMock.accumulated = []
  engineMock.faceOverride = null
  engineMock.rollOverride = null
  engineMock.initMock.mockResolvedValue(undefined)
}

export const built: BuiltRoll = {
  formula: '2d6',
  rolls: [3, 4],
  total: 7,
  breakdown: [{ sides: 6, value: 3 }, { sides: 6, value: 4 }],
  modifier: 0,
}

export function poolBuilt(n: number, sides = 6): BuiltRoll {
  const breakdown = Array.from({ length: n }, () => ({ sides, value: 3 }))
  return { formula: `${n}d${sides}`, rolls: breakdown.map(d => d.value), total: n * 3, breakdown, modifier: 0 }
}

export function stubWebGL(available: boolean) {
  const original = HTMLCanvasElement.prototype.getContext
  jest
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockImplementation(function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (type === 'webgl' || type === 'experimental-webgl') {
        return available ? ({} as unknown as RenderingContext) : null
      }
      return (original as (...a: unknown[]) => unknown).call(this, type, ...rest) as RenderingContext | null
    })
}
