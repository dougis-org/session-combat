'use client'

import { DiceD20Icon } from '@/lib/components/icons/dice'
import type { DicePoolState } from '@/lib/dice/useDicePoolState'

interface DiceTriggerButtonProps {
  dp: Pick<DicePoolState, 'isOpen' | 'setIsOpen'>
  isDisabled: boolean
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

export function DiceTriggerButton({ dp, isDisabled, triggerRef }: DiceTriggerButtonProps) {
  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={() => dp.setIsOpen(o => !o)}
      disabled={isDisabled}
      aria-label="Roll dice"
      aria-expanded={dp.isOpen}
      title="Dice Rolls for main screen pop out"
      className="text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-full flex items-center gap-1"
    >
      <DiceD20Icon width={24} height={24} aria-hidden="true" />
    </button>
  )
}
