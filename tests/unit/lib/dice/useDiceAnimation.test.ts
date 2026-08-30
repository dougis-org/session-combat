import { renderHook, act } from '@testing-library/react'
import type { BuiltRoll } from '@/lib/dice/useDicePoolState'
import { useDiceAnimation } from '@/lib/dice/useDiceAnimation'

const rollMock = jest.fn().mockResolvedValue([])
const initMock = jest.fn().mockResolvedValue(undefined)
const clearMock = jest.fn()
const ctorMock = jest.fn()

jest.mock('@3d-dice/dice-box', () => ({
  __esModule: true,
  default: class {
    constructor(...args: unknown[]) {
      ctorMock(...args)
    }
    init = initMock
    roll = rollMock
    clear = clearMock
  },
}))

const built: BuiltRoll = {
  formula: '2d6', rolls: [3, 4], total: 7,
  breakdown: [{ sides: 6, value: 3 }, { sides: 6, value: 4 }], modifier: 0,
}

function stubWebGL(available: boolean) {
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

let warnSpy: jest.SpyInstance

beforeEach(() => {
  jest.clearAllMocks()
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  warnSpy.mockRestore()
  jest.restoreAllMocks()
})

describe('useDiceAnimation — degradation', () => {
  it('WebGL unavailable → run() resolves immediately, status is unsupported, logs once', async () => {
    stubWebGL(false)
    const container = document.createElement('div')
    const { result } = renderHook(() => useDiceAnimation())

    await act(async () => {
      await result.current.run(built, container)
    })

    expect(result.current.status).toBe('unsupported')
    expect(ctorMock).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledTimes(1)

    // a second roll does not log again
    await act(async () => {
      await result.current.run(built, container)
    })
    expect(warnSpy).toHaveBeenCalledTimes(1)
  })

  it('library init rejection → instant resolve, single log, status unsupported', async () => {
    stubWebGL(true)
    initMock.mockRejectedValueOnce(new Error('asset load failed'))
    const container = document.createElement('div')
    const { result } = renderHook(() => useDiceAnimation())

    await act(async () => {
      await result.current.run(built, container)
    })

    expect(result.current.status).toBe('unsupported')
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(rollMock).not.toHaveBeenCalled()
  })
})

describe('useDiceAnimation — dynamic import is lazy', () => {
  it('the 3D library constructor is never invoked when run() is not called', () => {
    stubWebGL(true)
    renderHook(() => useDiceAnimation())
    expect(ctorMock).not.toHaveBeenCalled()
  })
})

describe('useDiceAnimation — single-instance invariant', () => {
  it('a second run() tears down the first box before starting a new one', async () => {
    stubWebGL(true)
    const container = document.createElement('div')
    const { result } = renderHook(() => useDiceAnimation())

    await act(async () => {
      await result.current.run(built, container)
    })
    expect(ctorMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      await result.current.run(built, container)
    })
    // first box cleared before the second constructed
    expect(clearMock).toHaveBeenCalled()
    expect(ctorMock).toHaveBeenCalledTimes(2)
  })

  it('run() passes the predetermined notation to roll()', async () => {
    stubWebGL(true)
    const container = document.createElement('div')
    const { result } = renderHook(() => useDiceAnimation())
    await act(async () => {
      await result.current.run(built, container)
    })
    expect(rollMock).toHaveBeenCalledWith('2d6@3,4')
  })
})
