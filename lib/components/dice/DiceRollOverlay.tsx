'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { BuiltRoll } from '@/lib/dice/useDicePoolState'

interface DiceRollOverlayProps {
  built: BuiltRoll
  /** When true, no dice canvas is mounted and the total modal shows immediately. */
  disableAnimation: boolean
  /** Close the overlay only — the caller keeps the dice panel open. */
  onClose: () => void
  /** Invoked with the canvas container once, when animation is enabled. */
  onCanvasReady?: (container: HTMLElement) => void
}

/**
 * Body-level portal (decision n047) that layers a dice tumble canvas and a total modal
 * above the `GlobalDiceFab` panel. Its Escape / outside-click handling runs in the capture
 * phase and `stopPropagation`s so the panel's own document-level close (see
 * `useDicePoolState`) does not also fire — dismissing the overlay closes only the overlay.
 */
export function DiceRollOverlay({ built, disableAnimation, onClose, onCanvasReady }: DiceRollOverlayProps) {
  const [root] = useState<HTMLDivElement | null>(() => {
    if (typeof document === 'undefined') return null
    const el = document.createElement('div')
    el.setAttribute('data-dice-roll-overlay-root', '')
    return el
  })
  const modalRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!root) return
    document.body.appendChild(root)
    return () => {
      root.remove()
    }
  }, [root])

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

  useEffect(() => {
    if (!disableAnimation && canvasRef.current) onCanvasReady?.(canvasRef.current)
  }, [disableAnimation, onCanvasReady])

  if (!root) return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
      {!disableAnimation && (
        <div
          ref={canvasRef}
          data-testid="dice-roll-canvas"
          className="pointer-events-none absolute inset-0"
        />
      )}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Dice roll result"
        className="relative bg-gray-800 border border-gray-700 rounded-lg shadow-xl px-10 py-8 text-center"
      >
        <p className="text-xs uppercase tracking-wide text-gray-400">{built.formula}</p>
        <p className="mt-1 text-5xl font-bold text-white">{built.total}</p>
      </div>
    </div>,
    root,
  )
}
