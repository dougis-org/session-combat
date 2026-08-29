'use client'

import { useEffect, useState } from 'react'
import { rollDicePool, DIE_SIDES, EMPTY_POOL, getActiveDiceGroups, buildPoolFormula, MAX_PER_DIE, MAX_MODIFIER, type DieSides } from '@/lib/utils/dice'
import type { RollVisibility } from '@/lib/types'

const ROLL_VISIBILITY_SCOPES = ['group', 'dm-only'] as const

export function isRollVisibilityScope(value: string): value is RollVisibility['scope'] {
  return (ROLL_VISIBILITY_SCOPES as readonly string[]).includes(value)
}

export interface BuiltRoll {
  formula: string
  rolls: number[]
  total: number
}

interface UseDicePoolStateArgs {
  triggerRef: React.RefObject<HTMLButtonElement | null>
  panelRef: React.RefObject<HTMLDivElement | null>
}

export function useDicePoolState({ triggerRef, panelRef }: UseDicePoolStateArgs) {
  const [isOpen, setIsOpen] = useState(false)
  const [pool, setPool] = useState<Record<number, number>>(EMPTY_POOL)
  const [modifierText, setModifierText] = useState('0')
  const rawModifier = modifierText === '' || modifierText === '-' ? 0 : (parseInt(modifierText, 10) || 0)
  const modifier = Math.max(-MAX_MODIFIER, Math.min(MAX_MODIFIER, rawModifier))
  const [visibility, setVisibility] = useState<RollVisibility>({ scope: 'group' })

  const poolTotal = DIE_SIDES.reduce((sum, sides) => sum + pool[sides], 0)

  useEffect(() => {
    if (!isOpen) return
    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node
      if (panelRef.current?.contains(target)) return
      if (triggerRef.current?.contains(target)) return
      setIsOpen(false)
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, panelRef, triggerRef])

  function handleAdd(sides: DieSides) {
    setPool(prev => ({ ...prev, [sides]: Math.min(MAX_PER_DIE, prev[sides] + 1) }))
  }

  function handleRemove(sides: DieSides) {
    setPool(prev => ({ ...prev, [sides]: Math.max(0, prev[sides] - 1) }))
  }

  function reset() {
    setPool(EMPTY_POOL)
    setModifierText('0')
  }

  function buildRoll(): BuiltRoll {
    const groups = getActiveDiceGroups(pool)
    const formula = buildPoolFormula(groups, modifier)
    const rolls = rollDicePool(groups).map(r => r.value)
    const total = rolls.reduce((sum, v) => sum + v, 0) + modifier
    return { formula, rolls, total }
  }

  return {
    isOpen, setIsOpen, pool, modifierText, setModifierText, visibility, setVisibility,
    poolTotal, handleAdd, handleRemove, buildRoll, reset,
  }
}

export type DicePoolState = ReturnType<typeof useDicePoolState>
