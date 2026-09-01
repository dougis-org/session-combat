'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DiceResults } from '@drdreo/dice-box-threejs'
import type { BuiltRoll } from '@/lib/dice/useDicePoolState'
import { animatedDiceCount, toDiceBoxNotation } from '@/lib/dice/toDiceBoxNotation'
import { diceAnimationScale } from '@/lib/dice/diceAnimationScale'
import { reconcileDiceFaces, type SettledDie } from '@/lib/dice/reconcileDiceFaces'
import { DEFAULT_COLORSET, DEFAULT_MATERIAL } from '@/lib/dice/diceAppearance'

/** Resolved 3D dice appearance passed through to the engine's `theme_*` options. */
export interface DiceAppearanceOptions {
  colorset: string
  material: string
}

const DEFAULT_APPEARANCE: DiceAppearanceOptions = {
  colorset: DEFAULT_COLORSET,
  material: DEFAULT_MATERIAL,
}

/** `'idle'` while the 3D path is (or may be) usable; `'unsupported'` once it has failed. */
export type DiceAnimationStatus = 'idle' | 'unsupported'

/** Where `scripts/vendor-dice-assets.mjs` places the engine's textures under `public/`. */
const ASSET_PATH = '/dice-box-threejs/'
/** Cap on how long the lazy `import('@drdreo/dice-box-threejs')` chunk may take to load. */
export const IMPORT_TIMEOUT_MS = 15000
/** Cap on how long `box.initialize()` (WebGL context + texture load) may stay pending. */
export const INIT_TIMEOUT_MS = 6000
/**
 * Cap on how long the settle (`box.roll()` plus one `box.add()` per extra die-size group)
 * may stay pending. The engine exposes no way to abort a wedged settle — a lost WebGL
 * context, a throttled background tab, or a physics solve that never converges — so once
 * this elapses we stop waiting, tear the box down, and resolve `run()`, keeping the
 * completion signal bounded for every caller.
 */
export const ROLL_TIMEOUT_MS = 12000

/** Physics-solver effort for forcing `@` faces. High enough to land d4..d20 reliably; kept
 * modest so a bad solve fails fast rather than spinning. One shared bound for every die
 * size — d4 forcing (restored by the vendored engine patch, #627) settles well within it
 * (spike: forced d4 ~1.7-2.1s, on par with forced d6). */
const ITERATION_LIMIT = 2000

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
  initialize: () => Promise<unknown>
  roll: (notation: string) => Promise<DiceResults>
  add: (notation: string) => Promise<unknown>
  getDiceResults: () => DiceResults
  clearDice: () => void
}

/** Thrown internally when the engine's settled faces do not match the decided roll. */
class FaceMismatchError extends Error {
  constructor() {
    super('dice-box settled faces did not match the decided roll')
    this.name = 'FaceMismatchError'
  }
}

/** Flatten the engine's grouped results into a flat list of settled dice. */
function flattenSettled(results: DiceResults): SettledDie[] {
  return results.sets.flatMap(set => set.rolls.map(die => ({ sides: die.sides, value: die.value })))
}

export interface DiceAnimation {
  status: DiceAnimationStatus
  /**
   * Play the predetermined tumble for `built` inside `container`. Resolves to `true` once
   * the tumble for this roll is **over and this run is still the current one** — whether the
   * dice settled on the decided faces, the engine settled on other faces (reconciliation
   * mismatch), or the settle failed / hit `ROLL_TIMEOUT_MS` (either way the animation is
   * done and the caller should reveal the result). Resolves to `false` when the reveal is
   * not this run's job: WebGL unavailable or a library/asset/init failure (these also set
   * `status` to `'unsupported'` and log once), or the run was superseded by a later
   * `run()` / `teardown()`. `run()` is self-bounded (`IMPORT_TIMEOUT_MS` +
   * `INIT_TIMEOUT_MS` + `ROLL_TIMEOUT_MS`). A second `run()` while one is active tears the
   * first down first (single-instance invariant).
   */
  run: (built: BuiltRoll, container: HTMLElement) => Promise<boolean>
  /** Tear down any active box. Safe to call repeatedly. */
  teardown: () => void
}

export function useDiceAnimation(
  appearance: DiceAppearanceOptions = DEFAULT_APPEARANCE,
): DiceAnimation {
  const [status, setStatus] = useState<DiceAnimationStatus>('idle')
  const boxRef = useRef<DiceBoxLike | null>(null)
  // Kept in a ref so `run()` reads the latest choice without changing its identity — the
  // next roll always builds a fresh `DiceBox` (per-run teardown), so a mid-open change just
  // takes effect on the following roll.
  const appearanceRef = useRef(appearance)
  appearanceRef.current = appearance
  const unsupportedRef = useRef(false)
  const loggedRef = useRef(false)
  const mismatchLoggedRef = useRef(false)
  const webglOkRef = useRef<boolean | null>(null)
  const runIdRef = useRef(0)

  const teardown = useCallback(() => {
    // Bump the run token so any in-flight run() (still awaiting import/init) is abandoned.
    runIdRef.current += 1
    if (boxRef.current) {
      try {
        boxRef.current.clearDice()
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
    async (built: BuiltRoll, container: HTMLElement): Promise<boolean> => {
      if (unsupportedRef.current) return false
      // Probe WebGL once per mounted hook, not once per roll — each probe otherwise leaks
      // a WebGL context and browsers cap concurrent contexts.
      if (webglOkRef.current === null) webglOkRef.current = hasWebGL()
      if (!webglOkRef.current) {
        markUnsupported(new Error('WebGL unavailable'))
        return false
      }

      // Single-instance invariant: replace any open box (also bumps the run token).
      teardown()
      const myRun = runIdRef.current

      const plan = toDiceBoxNotation(built)
      // Nothing to animate (e.g. a modifier-only formula) — let the caller reveal at once.
      if (plan.groups.length === 0) return runIdRef.current === myRun

      let box: DiceBoxLike | undefined
      try {
        const mod = await withTimeout(
          import('@drdreo/dice-box-threejs'),
          IMPORT_TIMEOUT_MS,
          'dice-box import',
        )
        if (runIdRef.current !== myRun) return false
        const DiceBox = mod.default
        box = new DiceBox(container, {
          assetPath: ASSET_PATH,
          baseScale: diceAnimationScale(animatedDiceCount(built)),
          sounds: false,
          shadows: false,
          iterationLimit: ITERATION_LIMIT,
          theme_colorset: appearanceRef.current.colorset,
          theme_customColorset: null,
          theme_material: appearanceRef.current.material,
        }) as unknown as DiceBoxLike
        await withTimeout(box.initialize(), INIT_TIMEOUT_MS)
      } catch (err) {
        if (runIdRef.current === myRun) {
          // Genuine failure for the current run — latch the whole session to the instant path.
          teardown()
          markUnsupported(err)
        } else if (box) {
          // A stale run (a newer run() or teardown already superseded it): clear only our own
          // half-built box and leave the current run's shared state untouched.
          try {
            box.clearDice()
          } catch {
            /* nothing to clear */
          }
        }
        return false
      }

      if (!box || runIdRef.current !== myRun) {
        try {
          box?.clearDice()
        } catch {
          /* nothing to clear */
        }
        return false
      }
      boxRef.current = box

      // A per-roll failure (settle error / timeout) or a reconciliation mismatch (the engine
      // settled on faces other than the decided ones — e.g. a d4 group if the vendored engine
      // patch is absent) tears the box down and logs, but must NOT latch the whole session to
      // the instant path. Either way the tumble for this roll is over — report "reveal the
      // modal" so the caller does not wait out the overlay's fallback.
      try {
        const activeBox = box
        await withTimeout(
          (async () => {
            await activeBox.roll(plan.groups[0].notation)
            for (const group of plan.groups.slice(1)) {
              await activeBox.add(group.notation)
            }
            const settled = flattenSettled(activeBox.getDiceResults())
            if (!reconcileDiceFaces(plan.groups, settled)) {
              throw new FaceMismatchError()
            }
          })(),
          ROLL_TIMEOUT_MS,
          'dice-box roll',
        )
      } catch (err) {
        if (err instanceof FaceMismatchError) {
          if (!mismatchLoggedRef.current) {
            mismatchLoggedRef.current = true
            console.warn(
              '[dice-animation] settled faces did not match the decided roll; revealing the result without the tumble',
            )
          }
        } else {
          console.error('[dice-animation] roll failed', err)
        }
        // Drop the box without bumping the run token — this run still owns its reveal, and
        // the next run() teardown (or an explicit teardown) re-arms the 3D path.
        if (boxRef.current === box) {
          try {
            box.clearDice()
          } catch {
            /* box already gone */
          }
          boxRef.current = null
        }
      }

      // Report completion only if this run is still the current one (a superseding run or an
      // explicit teardown will have bumped the token, and that run owns the reveal instead).
      return runIdRef.current === myRun
    },
    [markUnsupported, teardown],
  )

  return useMemo(() => ({ status, run, teardown }), [status, run, teardown])
}
