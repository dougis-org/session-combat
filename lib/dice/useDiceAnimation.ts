'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BuiltRoll } from '@/lib/dice/useDicePoolState'
import { animatedDiceCount, toDiceBoxNotation } from '@/lib/dice/toDiceBoxNotation'
import { diceAnimationScale } from '@/lib/dice/diceAnimationScale'

/** `'idle'` while the 3D path is (or may be) usable; `'unsupported'` once it has failed. */
export type DiceAnimationStatus = 'idle' | 'unsupported'

const ASSET_PATH = '/dice-box/assets/'
const INIT_TIMEOUT_MS = 6000
/**
 * Cap on how long `box.roll()` may stay pending. dice-box `^1.1.4` exposes no way to abort a
 * wedged settle (lost WebGL context, throttled tab), so once this elapses we stop waiting,
 * tear the box down, and resolve `run()` — keeping the completion signal bounded for every
 * caller rather than leaving hang-recovery to each consumer.
 */
const ROLL_TIMEOUT_MS = 12000

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

function withTimeout<T>(promise: Promise<T>, ms: number, label = 'dice-box init'): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms)
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
  const webglOkRef = useRef<boolean | null>(null)
  const runIdRef = useRef(0)

  const teardown = useCallback(() => {
    // Bump the run token so any in-flight run() (still awaiting import/init) is abandoned.
    runIdRef.current += 1
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
      // Probe WebGL once per mounted hook, not once per roll — each probe otherwise leaks
      // a WebGL context and browsers cap concurrent contexts.
      if (webglOkRef.current === null) webglOkRef.current = hasWebGL()
      if (!webglOkRef.current) {
        markUnsupported(new Error('WebGL unavailable'))
        return
      }

      // Single-instance invariant: replace any open box (also bumps the run token).
      teardown()
      const myRun = runIdRef.current

      let box: DiceBoxLike
      try {
        const mod = await import('@3d-dice/dice-box')
        if (runIdRef.current !== myRun) return
        const DiceBox = mod.default
        // dice-box v1.1.x wants a single config object with a CSS *selector* string.
        if (!container.id) container.id = 'dice-roll-canvas'
        box = new DiceBox({
          container: `#${container.id}`,
          assetPath: ASSET_PATH,
          theme: 'default',
          // Enlarge the dice well past the library default (5) and shrink them progressively
          // once more than six animate, so the settled cluster fits above the result modal.
          scale: diceAnimationScale(animatedDiceCount(built)),
        }) as unknown as DiceBoxLike
        await withTimeout(box.init(), INIT_TIMEOUT_MS)
      } catch (err) {
        teardown()
        markUnsupported(err)
        return
      }

      if (runIdRef.current !== myRun) {
        try {
          box.clear()
        } catch {
          /* nothing to clear */
        }
        return
      }
      boxRef.current = box

      // A per-roll failure (malformed notation) or a settle that never completes tears the
      // box down and logs, but must NOT latch the whole session to the instant path.
      try {
        await withTimeout(box.roll(toDiceBoxNotation(built)), ROLL_TIMEOUT_MS, 'dice-box roll')
      } catch (err) {
        teardown()
        console.error('[dice-animation] roll failed', err)
      }
    },
    [markUnsupported, teardown],
  )

  return useMemo(() => ({ status, run, teardown }), [status, run, teardown])
}
