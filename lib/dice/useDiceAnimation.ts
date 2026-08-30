'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BuiltRoll } from '@/lib/dice/useDicePoolState'
import { toDiceBoxNotation } from '@/lib/dice/toDiceBoxNotation'

/** `'idle'` while the 3D path is (or may be) usable; `'unsupported'` once it has failed. */
export type DiceAnimationStatus = 'idle' | 'unsupported'

const ASSET_PATH = '/dice-box/assets/'
const INIT_TIMEOUT_MS = 6000

/** True only when a real WebGL context can be created. */
function hasWebGL(): boolean {
  if (typeof document === 'undefined' || typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    return gl != null
  } catch {
    return false
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('dice-box init timed out')), ms)
    promise.then(
      value => {
        clearTimeout(timer)
        resolve(value)
      },
      err => {
        clearTimeout(timer)
        reject(err)
      },
    )
  })
}

interface DiceBoxLike {
  init: () => Promise<unknown>
  roll: (notation: string) => Promise<unknown>
  clear: () => void
}

export interface DiceAnimation {
  status: DiceAnimationStatus
  /**
   * Play the predetermined tumble for `built` inside `container`, resolving when the dice
   * settle. If WebGL is unavailable or the library/assets fail to load, resolves
   * immediately (instant path), sets `status` to `'unsupported'`, and logs once. A second
   * `run()` while one is active tears the first down first (single-instance invariant).
   */
  run: (built: BuiltRoll, container: HTMLElement) => Promise<void>
  /** Tear down any active box. Safe to call repeatedly. */
  teardown: () => void
}

export function useDiceAnimation(): DiceAnimation {
  const [status, setStatus] = useState<DiceAnimationStatus>('idle')
  const boxRef = useRef<DiceBoxLike | null>(null)
  const unsupportedRef = useRef(false)
  const loggedRef = useRef(false)

  const teardown = useCallback(() => {
    if (boxRef.current) {
      try {
        boxRef.current.clear()
      } catch {
        /* box already gone */
      }
      boxRef.current = null
    }
  }, [])

  useEffect(() => teardown, [teardown])

  const markUnsupported = useCallback((reason: unknown) => {
    unsupportedRef.current = true
    setStatus('unsupported')
    if (!loggedRef.current) {
      loggedRef.current = true
      // Existing client logging convention: plain console.* (see SessionControl, clientStorage).
      console.warn('[dice-animation] falling back to the instant path', reason)
    }
  }, [])

  const run = useCallback(
    async (built: BuiltRoll, container: HTMLElement) => {
      if (unsupportedRef.current) return
      if (!hasWebGL()) {
        markUnsupported(new Error('WebGL unavailable'))
        return
      }

      // Single-instance invariant: replace any open box.
      teardown()

      try {
        const mod = await import('@3d-dice/dice-box')
        const DiceBox = mod.default
        const box = new DiceBox(container, {
          assetPath: ASSET_PATH,
          origin: typeof window !== 'undefined' ? window.location.origin : undefined,
          theme: 'default',
        }) as unknown as DiceBoxLike
        await withTimeout(box.init(), INIT_TIMEOUT_MS)
        boxRef.current = box
        await box.roll(toDiceBoxNotation(built))
      } catch (err) {
        teardown()
        markUnsupported(err)
      }
    },
    [markUnsupported, teardown],
  )

  return useMemo(() => ({ status, run, teardown }), [status, run, teardown])
}
