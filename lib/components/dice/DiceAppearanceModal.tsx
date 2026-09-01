'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  DICE_COLORSETS,
  DICE_COLORSET_CATEGORIES,
  DICE_MATERIALS,
  type DiceColorsetCategory,
} from '@/lib/dice/diceAppearance'

interface DiceAppearanceModalProps {
  /** Currently selected colorset id. */
  colorset: string
  /** Currently selected material id. */
  material: string
  onColorsetChange: (id: string) => void
  onMaterialChange: (id: string) => void
  /** Close the modal only — the caller keeps the dice panel open. */
  onClose: () => void
}

interface RadioOption {
  id: string
  name: string
}

/**
 * Roving-focus radiogroup of selectable option buttons. Arrow keys move the selection
 * (and commit it, matching the native `radiogroup` pattern); Enter/Space commit the focused
 * option. Selecting writes immediately — there is no Save button, matching the panel's
 * existing preference checkboxes.
 */
function OptionRadioGroup<T extends RadioOption>({
  label,
  options,
  value,
  onChange,
  renderOption,
  className,
}: {
  label: string
  options: readonly T[]
  value: string
  onChange: (id: string) => void
  renderOption: (option: T, selected: boolean) => React.ReactNode
  className?: string
}) {
  const selectedIndex = Math.max(
    0,
    options.findIndex(o => o.id === value),
  )

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const forward = e.key === 'ArrowRight' || e.key === 'ArrowDown'
    const backward = e.key === 'ArrowLeft' || e.key === 'ArrowUp'
    if (!forward && !backward) return
    e.preventDefault()
    const delta = forward ? 1 : -1
    const next = (selectedIndex + delta + options.length) % options.length
    onChange(options[next].id)
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className={className}
    >
      {options.map((option, index) => {
        const selected = option.id === value
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={index === selectedIndex ? 0 : -1}
            onClick={() => onChange(option.id)}
            className={`rounded-md border px-2 py-1 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-400 ${
              selected ? 'border-blue-400 bg-gray-700' : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            {renderOption(option, selected)}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Body-level portal (decision n047) for choosing the 3D dice colorset and material. Mirrors
 * the `DiceRollOverlay` interaction conventions: Escape / outside-click handling runs in the
 * capture phase and `stopPropagation`s so the dice panel's own document-level close (see
 * `useDicePoolState`) does not also fire — dismissing this modal closes only this modal.
 * Focus is pulled in on mount and restored to the opener on unmount.
 *
 * The picker renders a flat CSS swatch per colorset (copied from the engine's colorset
 * table), so opening it neither loads `@drdreo/dice-box-threejs` nor makes any network
 * request.
 */
export function DiceAppearanceModal({
  colorset,
  material,
  onColorsetChange,
  onMaterialChange,
  onClose,
}: DiceAppearanceModalProps) {
  const [root] = useState<HTMLDivElement | null>(() => {
    if (typeof document === 'undefined') return null
    const el = document.createElement('div')
    el.setAttribute('data-dice-appearance-modal-root', '')
    return el
  })
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!root) return
    document.body.appendChild(root)
    return () => {
      root.remove()
    }
  }, [root])

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    contentRef.current?.focus()
    return () => previouslyFocused?.focus?.()
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onClose()
    }
    function handlePointerDown(e: MouseEvent) {
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

  if (!root) return null

  const byCategory = (category: DiceColorsetCategory) =>
    DICE_COLORSETS.filter(c => c.category === category)

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-start bg-black/50 p-4">
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-label="Dice appearance"
        tabIndex={-1}
        className="flex max-h-[80vh] w-80 flex-col gap-3 overflow-y-auto rounded-lg border border-gray-700 bg-gray-800 p-4 text-white shadow-xl outline-none"
      >
        <p className="text-sm font-semibold">Dice appearance</p>
        <p className="text-xs text-gray-400">Applies to the 3D roll animation only.</p>

        <div className="flex flex-col gap-2">
          {DICE_COLORSET_CATEGORIES.map(category => (
            <div key={category} className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {category}
              </p>
              <OptionRadioGroup
                label={`${category} colorsets`}
                options={byCategory(category)}
                value={colorset}
                onChange={onColorsetChange}
                className="grid grid-cols-3 gap-1"
                renderOption={cs => (
                  <span className="flex flex-col items-center gap-1">
                    <span
                      aria-hidden="true"
                      className="flex h-6 w-full items-center justify-center rounded text-[10px] font-bold"
                      style={{ background: cs.swatch.bg, color: cs.swatch.fg }}
                    >
                      20
                    </span>
                    <span>{cs.name}</span>
                  </span>
                )}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Material</p>
          <OptionRadioGroup
            label="Material"
            options={DICE_MATERIALS}
            value={material}
            onChange={onMaterialChange}
            className="grid grid-cols-4 gap-1"
            renderOption={m => <span>{m.name}</span>}
          />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="self-end rounded bg-gray-700 px-3 py-1 text-xs hover:bg-gray-600"
        >
          Done
        </button>
      </div>
    </div>,
    root,
  )
}
