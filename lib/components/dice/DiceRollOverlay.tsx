'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { BuiltRoll } from '@/lib/dice/useDicePoolState'
import type { DiceAnimationStatus } from '@/lib/dice/useDiceAnimation'

/** Stable id so `@3d-dice/dice-box` can be handed a CSS selector for its mount point. */
export const DICE_ROLL_CANVAS_ID = 'dice-roll-canvas'

/**
 * Upper bound on how long the result modal stays hidden waiting for the tumble to report
 * completion. `useDiceAnimation` bounds only dice-box *init* (~6s); a wedged physics settle
 * (context lost, tab backgrounded, library hang) can leave `box.roll()` — and therefore the
 * `animationSettled` signal — pending forever, so this timeout is the sole guarantee the
 * modal appears.
 *
 * On expiry the overlay only *reveals the modal* — it does not tear the dice engine down.
 * A slow-but-live tumble that overruns this window keeps playing beneath the modal rather
 * than being cut mid-air; the engine is released when the overlay closes or the next roll
 * starts (`useDiceAnimation`'s single-instance teardown). Kept generously above a healthy
 * worst case so the reveal is rarely the thing the user notices.
 */
export const MODAL_REVEAL_FALLBACK_MS = 20000

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

  // The result modal stays hidden until the animation reports completion; it is shown
  // straight away on the non-animated paths, and unconditionally once the fallback timeout
  // elapses. `GlobalDiceFab` remounts this overlay per roll (via `key`), so `fallbackElapsed`
  // resets for each new roll without any in-effect state writes.
  const modalRevealed =
    disableAnimation || animationStatus === 'unsupported' || animationSettled || fallbackElapsed

  // The canvas host is mounted for the whole overlay lifetime whenever animation was
  // attempted (dice-box `^1.1.4` has no `destroy`, so unmounting it mid-run would strand its
  // <canvas> and render loop). It only *reserves layout space* while a tumble can actually
  // be seen — on the unsupported / post-fallback paths it collapses to `hidden` so the modal
  // stays centred instead of being pushed down behind a blank gap.
  const reserveCanvasSpace = animationStatus !== 'unsupported' && !fallbackElapsed

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
      {/* Convey the result to assistive tech immediately — the visual dialog is gated on the
          tumble finishing, which can be several seconds (or the fallback window). */}
      <p className="sr-only" role="status" aria-live="polite">
        {built.formula} rolled {built.total}
      </p>
      <div ref={contentRef} tabIndex={-1} className="flex flex-col items-center gap-6 outline-none">
        {!disableAnimation && (
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
            tabIndex={-1}
            className="relative bg-gray-800 border border-gray-700 rounded-lg shadow-xl px-10 py-8 text-center"
          >
            <p className="text-xs uppercase tracking-wide text-gray-400">{built.formula}</p>
            <p className="mt-1 text-5xl font-bold text-white">{built.total}</p>
          </div>
        )}
      </div>
    </div>,
    root,
  )
}
