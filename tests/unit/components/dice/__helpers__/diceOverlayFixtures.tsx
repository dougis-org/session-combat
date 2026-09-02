import { useEffect, useState } from 'react'
import type { BuiltRoll } from '@/lib/dice/useDicePoolState'

/** Baseline `3d6+2` roll used across the DiceRollOverlay spec family. */
export const built: BuiltRoll = {
  formula: '3d6+2',
  rolls: [3, 4, 5],
  total: 14,
  breakdown: [
    { sides: 6, value: 3 },
    { sides: 6, value: 4 },
    { sides: 6, value: 5 },
  ],
  modifier: 2,
}

/** Stands in for the FAB panel: uses a document-level Escape/outside-click close like useDicePoolState. */
export function PanelStub() {
  const [open, setOpen] = useState(true)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    function onDown() {
      setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [])
  return open ? <div data-testid="panel-stub">panel</div> : null
}
