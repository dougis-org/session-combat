'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { BuiltRoll } from '@/lib/dice/useDicePoolState'
import type { DiceAnimationStatus } from '@/lib/dice/useDiceAnimation'

/** Stable id so `@3d-dice/dice-box` can be handed a CSS selector for its mount point. */
export const DICE_ROLL_CANVAS_ID = 'dice-roll-canvas'

/**
 * Upper bound on how long the result modal stays hidden waiting for the tumble to report
 * completion. If the animation never signals (WebGL context lost, tab backgrounded, library
 * hang) the modal is revealed anyway so the user is never stranded without a result.
 *
 * Must comfortably exceed `useDiceAnimation`'s own dice-box init timeout (~6s) plus a
 * typical tumble, so a slow cold-cache load of the 3D engine is not mistaken for a hang and
 * torn down mid-animation.
 */
export const MODAL_REVEAL_FALLBACK_MS = 12000

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
  /** Called when the fallback timeout fires so the caller can tear the dice engine down. */
  onAnimationAbort?: () => void
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
  onAnimationAbort,
}: DiceRollOverlayProps) {
  const [root] = useState<HTMLDivElement | null>(() => {
    if (typeof document === 'undefined') return null
    const el = document.createElement('div')
    el.setAttribute('data-dice-roll-overlay-root', '')
    return el
  })
  const modalRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const canvasReadyFiredRef = useRef(false)
  const [fallbackElapsed, setFallbackElapsed] = useState(false)

  // The result modal stays hidden until the animation reports completion; it is shown
  // straight away on the non-animated paths, and unconditionally once the fallback timeout
  // elapses. `GlobalDiceFab` remounts this overlay per roll (via `key`), so `fallbackElapsed`
  // resets for each new roll without any in-effect state writes.
  const modalRevealed =
    disableAnimation || animationStatus === 'unsupported' || animationSettled || fallbackElapsed

  useEffect(() => {
    if (!root) return
    document.body.appendChild(root)
    return () => {
      root.remove()
    }
  }, [root])

  // Reliability backstop: if the tumble never signals completion (WebGL context lost, tab
  // backgrounded, library hang) reveal the modal anyway and tear the dice engine down.
  useEffect(() => {
    if (disableAnimation || animationStatus === 'unsupported' || animationSettled) return
    const timer = setTimeout(() => {
      setFallbackElapsed(true)
      onAnimationAbort?.()
    }, MODAL_REVEAL_FALLBACK_MS)
    return () => clearTimeout(timer)
  }, [disableAnimation, animationStatus, animationSettled, onAnimationAbort])

  // Restore focus to whatever the opener focused (the panel / trigger) when the overlay
  // closes — unconditionally, even if it is dismissed mid-tumble before the modal reveals.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    return () => previouslyFocused?.focus?.()
  }, [])

  // Move focus into the modal once it is revealed so keyboard / screen-reader users are not
  // left inside the now-inert panel behind it.
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
      if (modalRef.current?.contains(e.target as Node)) return
      e.stopPropagation()
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
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-black/60">
      {!disableAnimation && (
        <div
          ref={canvasRef}
          id={DICE_ROLL_CANVAS_ID}
          data-testid="dice-roll-canvas"
          className="pointer-events-none relative w-[90vw] max-w-[480px] h-[38vh] max-h-[340px]"
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
    </div>,
    root,
  )
}
