'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { DIE_SIDES } from '@/lib/utils/dice'
import { DiceD20Icon } from '@/lib/components/icons/dice'
import { DiePoolButton } from '@/lib/components/dice/DiePoolButton'
import { PercentileButton } from '@/lib/components/dice/PercentileButton'
import { DiceRollOverlay } from '@/lib/components/dice/DiceRollOverlay'
import { onPresenceChange, type DicePresence } from '@/lib/dice/diceSessionBridge'
import { useDicePoolState, type BuiltRoll } from '@/lib/dice/useDicePoolState'
import { useRollSubmission } from '@/lib/dice/useRollSubmission'
import { useDiceFabPreferences } from '@/lib/dice/useDiceFabPreferences'
import { useDiceAnimation } from '@/lib/dice/useDiceAnimation'

type SendState = 'idle' | 'pending' | 'sent' | 'failed'

export function GlobalDiceFab() {
  const { user } = useAuth()
  const [result, setResult] = useState<BuiltRoll | null>(null)
  const [overlayRoll, setOverlayRoll] = useState<BuiltRoll | null>(null)
  const [presence, setPresence] = useState<DicePresence | null>(null)
  const [sendState, setSendState] = useState<SendState>('idle')
  const [triggerTooltip, setTriggerTooltip] = useState(false)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const dp = useDicePoolState({ triggerRef, panelRef })
  const { submitRoll } = useRollSubmission(presence?.campaignId ?? '')
  const prefs = useDiceFabPreferences()
  const animation = useDiceAnimation()

  useEffect(() => onPresenceChange(setPresence), [])

  // Outside-click/Escape-to-close is already handled by useDicePoolState;
  // this effect only layers in focus management on top of its isOpen state.
  useEffect(() => {
    if (!dp.isOpen) return
    panelRef.current?.focus()
    const trigger = triggerRef.current
    return () => { trigger?.focus() }
  }, [dp.isOpen])

  const closeOverlay = useCallback(() => {
    animation.teardown()
    setOverlayRoll(null)
  }, [animation])

  const runAnimation = useCallback(
    (container: HTMLElement) => {
      if (!overlayRoll) return
      void animation.run(overlayRoll, container)
    },
    [animation, overlayRoll],
  )

  if (!user) return null

  async function performRoll(built: BuiltRoll) {
    // build → inline result + (maybe persist) → animate (decisions n124 / n126):
    // the overlay/animation opens only after a shared roll is persisted, but the
    // instant inline line renders straight away.
    setResult(built)
    if (prefs.sendToChat && presence) {
      setSendState('pending')
      const outcome = await submitRoll(built.formula, built.rolls, built.total, dp.visibility)
      setSendState(outcome === 'success' ? 'sent' : 'failed')
    } else {
      setSendState('idle')
    }
    setOverlayRoll(built)
  }

  function handleOpen() {
    setResult(null)
    setSendState('idle')
    dp.setIsOpen(true)
    setTriggerTooltip(false)
  }

  function handleRoll() {
    if (dp.poolTotal === 0 || sendState === 'pending') return
    void performRoll(dp.buildRoll())
  }

  function handlePercentileRoll() {
    if (sendState === 'pending') return
    void performRoll(dp.buildPercentileRoll())
  }

  async function handleRetry() {
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
          onMouseEnter={() => setTriggerTooltip(true)}
          onMouseLeave={() => setTriggerTooltip(false)}
          onFocus={() => setTriggerTooltip(true)}
          onBlur={() => setTriggerTooltip(false)}
          aria-label="Roll dice"
          className="bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg relative"
        >
          <DiceD20Icon width={28} height={28} aria-hidden="true" />
          {triggerTooltip && !dp.isOpen && (
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
              {DIE_SIDES.map(sides => (
                <DiePoolButton
                  key={sides}
                  sides={sides}
                  count={dp.pool[sides]}
                  onAdd={dp.handleAdd}
                  onRemove={dp.handleRemove}
                />
              ))}
              <PercentileButton onRoll={handlePercentileRoll} disabled={sendState === 'pending'} />
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
            {presence && (
              <label className="flex items-center gap-2 text-xs text-gray-200">
                <input
                  type="checkbox"
                  checked={prefs.sendToChat}
                  onChange={e => prefs.setSendToChat(e.target.checked)}
                />
                Send to session chat
              </label>
            )}
            <label className="flex items-center gap-2 text-xs text-gray-200">
              <input
                type="checkbox"
                checked={prefs.disableAnimation}
                onChange={e => prefs.setDisableAnimation(e.target.checked)}
              />
              Disable animation
            </label>
            <button
              type="button"
              onClick={handleRoll}
              disabled={dp.poolTotal === 0 || sendState === 'pending'}
              className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-3 py-1 rounded"
            >
              Roll
            </button>
            {result && (
              <div className="text-sm text-gray-200 bg-gray-700/50 rounded px-2 py-1.5">
                <div>
                  {result.formula} → [{result.rolls.join(', ')}] = <span className="font-bold text-white">{result.total}</span>
                </div>
                {sendState === 'pending' && <p className="mt-2 text-xs text-gray-300">Sending…</p>}
                {sendState === 'sent' && <p className="mt-2 text-xs text-green-400">Sent to session chat</p>}
                {sendState === 'failed' && (
                  <div className="mt-2 flex flex-col gap-1">
                    <p className="text-xs text-red-400">Couldn&apos;t send to session chat — try again</p>
                    {presence && (
                      <button
                        type="button"
                        onClick={handleRetry}
                        className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded self-start"
                      >
                        Retry send
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {overlayRoll && (
        <DiceRollOverlay
          built={overlayRoll}
          disableAnimation={prefs.disableAnimation}
          onClose={closeOverlay}
          onCanvasReady={runAnimation}
        />
      )}
    </>
  )
}
