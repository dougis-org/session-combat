'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { rollDicePool, DIE_SIDES, EMPTY_POOL, getActiveDiceGroups, buildPoolFormula, MAX_PER_DIE, MAX_MODIFIER } from '@/lib/utils/dice'
import { DIE_ICONS, DiceD20Icon } from '@/lib/components/icons/dice'
import { onPresenceChange, requestRoll, type DicePresence, type RollOutcome } from '@/lib/dice/diceSessionBridge'

type SendState = 'idle' | 'pending' | 'sent' | 'failed'

const SEND_BUTTON_LABEL: Record<Exclude<SendState, 'sent'>, string> = {
  idle: 'Send to session chat',
  pending: 'Sending…',
  failed: 'Retry send',
}

export function GlobalDiceFab() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [pool, setPool] = useState<Record<number, number>>(EMPTY_POOL)
  const [modifierText, setModifierText] = useState('0')
  const rawModifier = modifierText === '' || modifierText === '-' ? 0 : (parseInt(modifierText, 10) || 0)
  const modifier = Math.max(-MAX_MODIFIER, Math.min(MAX_MODIFIER, rawModifier))
  const [result, setResult] = useState<RollOutcome | null>(null)
  const [presence, setPresence] = useState<DicePresence | null>(null)
  const [sendState, setSendState] = useState<SendState>('idle')
  const [hoveredDie, setHoveredDie] = useState<number | null>(null)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const poolTotal = DIE_SIDES.reduce((sum, sides) => sum + pool[sides], 0)

  useEffect(() => onPresenceChange(setPresence), [])

  useEffect(() => {
    if (!isOpen) return
    panelRef.current?.focus()
    const trigger = triggerRef.current

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
      trigger?.focus()
    }
  }, [isOpen])

  if (!user) return null

  function handleAdd(sides: number) {
    setPool(prev => ({ ...prev, [sides]: Math.min(MAX_PER_DIE, prev[sides] + 1) }))
  }

  function handleRemove(sides: number) {
    setPool(prev => ({ ...prev, [sides]: Math.max(0, prev[sides] - 1) }))
  }

  function handleOpen() {
    setResult(null)
    setSendState('idle')
    setIsOpen(true)
  }

  function handleRoll() {
    if (poolTotal === 0) return
    const groups = getActiveDiceGroups(pool)
    const formula = buildPoolFormula(groups, modifier)
    const rolls = rollDicePool(groups).map(r => r.value)
    const total = rolls.reduce((sum, v) => sum + v, 0) + modifier
    setResult({ formula, rolls, total, visibility: { scope: 'group' } })
    setSendState('idle')
  }

  function handleSendToChat() {
    if (!result || !presence) return
    setSendState('pending')
    requestRoll({
      campaignId: presence.campaignId,
      sessionId: presence.sessionId,
      roll: result,
      onResult: outcome => setSendState(outcome === 'success' ? 'sent' : 'failed'),
    })
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        aria-label="Roll dice"
        title="Roll dice"
        className="fixed bottom-4 left-4 z-40 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
      >
        <DiceD20Icon width={28} height={28} aria-hidden="true" />
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50">
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="global-dice-fab-heading"
            tabIndex={-1}
            className="absolute bottom-4 left-4 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4 w-72 flex flex-col gap-3 outline-none"
          >
            <p id="global-dice-fab-heading" className="text-sm font-semibold text-white">Roll dice</p>
            <div className="flex flex-wrap gap-1 items-center">
              {DIE_SIDES.map(sides => {
                const Icon = DIE_ICONS[sides]
                return (
                  <div key={sides} className="relative flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleRemove(sides)}
                      aria-label={`Remove d${sides}`}
                      className="text-xs bg-gray-700 hover:bg-gray-600 text-white w-5 h-5 rounded"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdd(sides)}
                      disabled={pool[sides] >= MAX_PER_DIE}
                      aria-label={`Add d${sides}`}
                      onMouseEnter={() => setHoveredDie(sides)}
                      onMouseLeave={() => setHoveredDie(null)}
                      className="text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white px-2 py-1 rounded flex items-center gap-1"
                    >
                      <Icon width={21} height={21} aria-hidden="true" />
                      ×{pool[sides]}
                    </button>
                    {hoveredDie === sides && (
                      <div className="absolute left-1/2 bottom-full mb-1 -translate-x-1/2 bg-gray-800 border border-gray-700 rounded px-2 py-1 shadow-lg z-50 text-xs text-white whitespace-nowrap pointer-events-none">
                        d{sides}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={modifierText}
              onChange={e => {
                const v = e.target.value
                if (v === '' || v === '-' || /^-?\d{1,3}$/.test(v)) setModifierText(v)
              }}
              aria-label="Modifier"
              className="w-14 text-xs bg-gray-700 border border-gray-600 text-white rounded px-1 py-0.5"
            />
            <button
              type="button"
              onClick={handleRoll}
              disabled={poolTotal === 0}
              className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-3 py-1 rounded"
            >
              Roll
            </button>
            {result && (
              <div className="text-sm text-gray-200 bg-gray-700/50 rounded px-2 py-1.5">
                <div>
                  {result.formula} → [{result.rolls.join(', ')}] = <span className="font-bold text-white">{result.total}</span>
                </div>
                {presence && sendState !== 'sent' && (
                  <button
                    type="button"
                    onClick={handleSendToChat}
                    disabled={sendState === 'pending'}
                    className="mt-2 text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-3 py-1 rounded"
                  >
                    {SEND_BUTTON_LABEL[sendState as Exclude<SendState, 'sent'>]}
                  </button>
                )}
                {sendState === 'sent' && <p className="mt-2 text-xs text-green-400">Sent to session chat</p>}
                {sendState === 'failed' && <p className="mt-2 text-xs text-red-400">Couldn&apos;t send to session chat — try again</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
