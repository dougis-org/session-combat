'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { DIE_SIDES, MAX_PER_DIE } from '@/lib/utils/dice'
import { DIE_ICONS, DiceD20Icon } from '@/lib/components/icons/dice'
import { onPresenceChange, type DicePresence } from '@/lib/dice/diceSessionBridge'
import { useDicePoolState, type BuiltRoll } from '@/lib/dice/useDicePoolState'
import { useRollSubmission } from '@/lib/dice/useRollSubmission'

type SendState = 'idle' | 'pending' | 'sent' | 'failed'

const SEND_BUTTON_LABEL: Record<Exclude<SendState, 'sent'>, string> = {
  idle: 'Send to session chat',
  pending: 'Sending…',
  failed: 'Retry send',
}

export function GlobalDiceFab() {
  const { user } = useAuth()
  const [result, setResult] = useState<BuiltRoll | null>(null)
  const [presence, setPresence] = useState<DicePresence | null>(null)
  const [sendState, setSendState] = useState<SendState>('idle')
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const dp = useDicePoolState({ triggerRef, panelRef })
  const { submitRoll } = useRollSubmission(presence?.campaignId ?? '')

  useEffect(() => onPresenceChange(setPresence), [])

  // Outside-click/Escape-to-close is already handled by useDicePoolState;
  // this effect only layers in focus management on top of its isOpen state.
  useEffect(() => {
    if (!dp.isOpen) return
    panelRef.current?.focus()
    const trigger = triggerRef.current
    return () => { trigger?.focus() }
  }, [dp.isOpen])

  if (!user) return null

  function handleOpen() {
    setResult(null)
    setSendState('idle')
    dp.setIsOpen(true)
    setHoveredTooltip(null)
  }

  function handleRoll() {
    if (dp.poolTotal === 0) return
    setResult(dp.buildRoll())
    setSendState('idle')
  }

  async function handleSendToChat() {
    if (!result || !presence) return
    setSendState('pending')
    const outcome = await submitRoll(result.formula, result.rolls, result.total, dp.visibility)
    setSendState(outcome === 'success' ? 'sent' : 'failed')
  }

  return (
    <>
      <div className="fixed bottom-4 left-4 z-40 flex items-center">
        <button
          ref={triggerRef}
          type="button"
          onClick={handleOpen}
          onMouseEnter={() => setHoveredTooltip('trigger')}
          onMouseLeave={() => setHoveredTooltip(null)}
          onFocus={() => setHoveredTooltip('trigger')}
          onBlur={() => setHoveredTooltip(null)}
          aria-label="Roll dice"
          className="bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg relative"
        >
          <DiceD20Icon width={28} height={28} aria-hidden="true" />
          {hoveredTooltip === 'trigger' && !dp.isOpen && (
            <div className="absolute left-full ml-3 bg-gray-800 border border-gray-700 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none">
              Roll dice
            </div>
          )}
        </button>
      </div>
      {dp.isOpen && (
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
                  <div key={sides} className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => dp.handleRemove(sides)}
                      aria-label={`Remove d${sides}`}
                      className="text-xs bg-gray-700 hover:bg-gray-600 text-white w-5 h-5 rounded"
                    >
                      −
                    </button>
                    <div className="relative flex">
                      <button
                        type="button"
                        onClick={() => dp.handleAdd(sides)}
                        onMouseEnter={() => setHoveredTooltip(`d${sides}`)}
                        onMouseLeave={() => setHoveredTooltip(null)}
                        onFocus={() => setHoveredTooltip(`d${sides}`)}
                        onBlur={() => setHoveredTooltip(null)}
                        disabled={dp.pool[sides] >= MAX_PER_DIE}
                        aria-label={`Add d${sides}`}
                        className="text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white px-2 py-1 rounded flex items-center gap-1"
                      >
                        <Icon width={21} height={21} aria-hidden="true" />
                        ×{dp.pool[sides]}
                      </button>
                      {hoveredTooltip === `d${sides}` && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-800 border border-gray-700 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none z-10">
                          d{sides}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={dp.modifierText}
              onChange={e => {
                const v = e.target.value
                if (v === '' || v === '-' || /^-?\d{1,3}$/.test(v)) dp.setModifierText(v)
              }}
              aria-label="Modifier"
              className="w-14 text-xs bg-gray-700 border border-gray-600 text-white rounded px-1 py-0.5"
            />
            <button
              type="button"
              onClick={handleRoll}
              disabled={dp.poolTotal === 0}
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
