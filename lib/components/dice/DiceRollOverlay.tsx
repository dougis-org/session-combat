'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { BuiltRoll } from '@/lib/dice/useDicePoolState'
import {
  IMPORT_TIMEOUT_MS,
  INIT_TIMEOUT_MS,
  ROLL_TIMEOUT_MS,
  type DiceAnimationStatus,
} from '@/lib/dice/useDiceAnimation'
import { DICE_ANIM_CAP } from '@/lib/dice/toDiceBoxNotation'

/**
 * One die in the result-modal readout: the rolled value as the dominant element with a
 * small non-dominant size tag (`d{sides}`, or `d%` for a percentile face). Every die —
 * pool or percentile, known size or not — renders through this single path; there is no
 * die-face SVG, pip pattern, or number-over-icon overlay (issue #634). The 3D tumble
 * already provides the physical-dice fantasy; this readout is a plain numeric echo of the
 * already-decided values.
 */
function DieReadoutChip({ value, label }: { value: string | number; label: string }) {
  return (
    <div
      data-testid="die-readout-chip"
      className="flex flex-col items-center justify-center min-w-[3rem] rounded-md bg-gray-700/60 px-3 py-2"
    >
      <span data-testid="die-face" className="text-2xl font-bold leading-none text-white">
        {value}
      </span>
      <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </span>
    </div>
  )
}

function StaticRollResult({ built }: { built: BuiltRoll }) {
  if (built.percentileFaces && built.percentileFaces.length >= 2) {
    const tens = built.percentileFaces[0] === 10 ? '00' : `${built.percentileFaces[0]}0`
    const ones = built.percentileFaces[1] === 10 ? '0' : `${built.percentileFaces[1]}`
    return (
      <div className="flex flex-row flex-wrap justify-center items-center gap-4 mt-4 mb-2">
        <DieReadoutChip value={tens} label="d%" />
        <DieReadoutChip value={ones} label="d%" />
      </div>
    )
  }

  // Above the animation cap the tumble only ever shows the first DICE_ANIM_CAP dice, so the
  // readout matches it and adds a "+N more" note. The total below is always the full pool.
  const shown = built.breakdown.slice(0, DICE_ANIM_CAP)
  const remainder = built.breakdown.length - shown.length

  return (
    <div className="flex flex-row flex-wrap justify-center items-center gap-4 mt-4 mb-2 max-w-[80vw]">
      {shown.map((die, idx) => (
        <DieReadoutChip key={idx} value={die.value} label={`d${die.sides}`} />
      ))}
      {remainder > 0 && (
        <span data-testid="dice-readout-remainder" className="text-lg font-bold text-gray-400">
          +{remainder} more
        </span>
      )}
    </div>
  )
}

/** Stable id for the dice engine's mount point / a CSS selector into it. */
export const DICE_ROLL_CANVAS_ID = 'dice-roll-canvas'

/**
 * Last-resort bound on how long the result modal stays hidden waiting for the tumble to
 * report completion. `useDiceAnimation.run()` is fully self-bounded (import + init + settle,
 * and it reports completion even on a failed roll), so `animationSettled` — or the
 * `'unsupported'` status — normally reveals the modal well within this window. This only
 * catches a pathological case where `run()`'s promise never settles at all (e.g. a React
 * render/effect that never runs); it derives from the hook's own caps plus margin so a
 * slow-but-successful roll can never be cut mid-tumble.
 *
 * On expiry the overlay reveals the modal and sets the canvas band aside (`hidden`) so the
 * result is centred; the dice engine is *not* torn down — it is released when the overlay
 * closes or the next roll starts (`useDiceAnimation`'s single-instance teardown).
 */
export const MODAL_REVEAL_FALLBACK_MS =
  IMPORT_TIMEOUT_MS + INIT_TIMEOUT_MS + ROLL_TIMEOUT_MS + 5000

interface DiceRollOverlayProps {
  built: BuiltRoll
  /** When true, no dice canvas is mounted and the total modal shows immediately. */
  disableAnimation: boolean
  /** Close the overlay only — the caller keeps the dice panel open. */
  onClose: () => void
  /** Invoked with the canvas container once, when animation is enabled. */
  onCanvasReady?: (container: HTMLElement) => void
  /** True once the dice have settled (the animation completion signal). */
  animationSettled?: boolean
  /** Current animation status; `'unsupported'` reveals the modal immediately. */
  animationStatus?: DiceAnimationStatus
}

/**
 * Body-level portal (decision n047) that layers a bounded, centered dice tumble canvas
 * above the result modal — both visible together, the dice settling in the clear zone just
 * above the total. The modal stays hidden until the animation reports completion (or is
 * skipped / unsupported / times out). Escape / outside-click handling runs in the capture
 * phase and `stopPropagation`s so the panel's own document-level close (see
 * `useDicePoolState`) does not also fire — dismissing the overlay closes only the overlay.
 */
export function DiceRollOverlay({
  built,
  disableAnimation,
  onClose,
  onCanvasReady,
  animationSettled = false,
  animationStatus = 'idle',
}: DiceRollOverlayProps) {
  const [root] = useState<HTMLDivElement | null>(() => {
    if (typeof document === 'undefined') return null
    const el = document.createElement('div')
    el.setAttribute('data-dice-roll-overlay-root', '')
    return el
  })
  const modalRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const canvasReadyFiredRef = useRef(false)
  const [fallbackElapsed, setFallbackElapsed] = useState(false)
  const [liveResult, setLiveResult] = useState('')

  // The result modal stays hidden until the animation reports completion; it is shown
  // straight away on the non-animated paths, and unconditionally once the fallback timeout
  // elapses. `GlobalDiceFab` remounts this overlay per roll (via `key`), so `fallbackElapsed`
  // resets for each new roll without any in-effect state writes.
  const modalRevealed =
    disableAnimation || animationStatus === 'unsupported' || animationSettled || fallbackElapsed

  // Whether this overlay ever started a tumble — captured at mount and never revised, so a
  // later `disableAnimation` toggle cannot unmount dice-box's canvas mid-run (v1.1.4 has no
  // `destroy`; unmounting would strand its <canvas> and render loop). The host stays mounted
  // for the overlay's life but only *reserves layout space* while a tumble can be seen; on
  // the disabled / unsupported / post-fallback paths it collapses to `hidden` so the modal
  // stays centred instead of sitting below a blank gap.
  const [animationAttempted] = useState(!disableAnimation)
  const reserveCanvasSpace =
    !disableAnimation && animationStatus !== 'unsupported' && !fallbackElapsed

  useEffect(() => {
    if (!root) return
    document.body.appendChild(root)
    return () => {
      root.remove()
    }
  }, [root])

  // Reliability backstop: if the tumble never signals completion (WebGL context lost, tab
  // backgrounded, library hang) reveal the modal anyway so the user is never stranded.
  useEffect(() => {
    if (disableAnimation || animationStatus === 'unsupported' || animationSettled) return
    const timer = setTimeout(() => setFallbackElapsed(true), MODAL_REVEAL_FALLBACK_MS)
    return () => clearTimeout(timer)
  }, [disableAnimation, animationStatus, animationSettled])

  // Populate the live region a tick after mount, not in the initial commit — screen readers
  // announce subsequent mutations to a live region, not the content it renders with.
  useEffect(() => {
    const t = setTimeout(() => setLiveResult(`${built.formula} rolled ${built.total}`), 50)
    return () => clearTimeout(t)
  }, [built.formula, built.total])

  // Pull focus into the overlay as soon as it mounts — including during the tumble, before
  // the modal reveals — so keyboard / screen-reader users are not left on the now-obscured
  // dice panel behind it. Restore focus to the opener when the overlay closes.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    contentRef.current?.focus()
    return () => previouslyFocused?.focus?.()
  }, [])

  // Hand focus to the result dialog once it is revealed.
  useEffect(() => {
    if (modalRevealed) modalRef.current?.focus()
  }, [modalRevealed])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onClose()
    }
    function handlePointerDown(e: MouseEvent) {
      // Always stop the press from reaching the dice panel's own document-level close
      // handler behind the overlay. "Outside" = outside the centered dice+modal stack —
      // clicking the dice area (or the space it will occupy before the modal reveals) must
      // not dismiss the overlay, only the surrounding backdrop does.
      e.stopPropagation()
      if (contentRef.current?.contains(e.target as Node)) return
      onClose()
    }
    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('mousedown', handlePointerDown, true)
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('mousedown', handlePointerDown, true)
    }
  }, [onClose])

  // Hand the canvas container to the caller so it can start the tumble — exactly once per
  // mount. `GlobalDiceFab` remounts the overlay per roll, so each roll re-arms cleanly.
  useEffect(() => {
    if (canvasReadyFiredRef.current || disableAnimation || !canvasRef.current) return
    canvasReadyFiredRef.current = true
    onCanvasReady?.(canvasRef.current)
  }, [disableAnimation, onCanvasReady])

  if (!root) return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/60">
      {/* Convey the result to assistive tech without waiting for the gated visual dialog
          (which is held back for the tumble, up to the fallback window). Populated a tick
          after mount so the live region actually announces. */}
      <p className="sr-only" role="status" aria-live="polite">
        {liveResult}
      </p>
      <div ref={contentRef} tabIndex={-1} className="flex flex-col items-center gap-6 outline-none">
        {animationAttempted && (
          <div
            ref={canvasRef}
            id={DICE_ROLL_CANVAS_ID}
            data-testid="dice-roll-canvas"
            className={
              reserveCanvasSpace
                ? 'pointer-events-none relative w-[90vw] max-w-[480px] h-[38vh] max-h-[340px]'
                : 'hidden'
            }
          />
        )}
        {modalRevealed && (
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Dice roll result"
            aria-describedby="dice-roll-result-total"
            tabIndex={-1}
            className="relative bg-gray-800 border border-gray-700 rounded-lg shadow-xl px-10 py-8 text-center"
          >
            <p className="text-2xl font-bold uppercase tracking-wide text-gray-400">{built.formula}</p>
            <StaticRollResult built={built} />
            <p id="dice-roll-result-total" className="mt-1 text-5xl font-bold text-white">{built.total}</p>
          </div>
        )}
      </div>
    </div>,
    root,
  )
}
