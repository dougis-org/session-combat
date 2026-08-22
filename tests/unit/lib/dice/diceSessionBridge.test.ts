import {
  announcePresence,
  clearPresence,
  onPresenceChange,
  requestRoll,
  onRollRequested,
  resetDiceSessionBridge,
} from '@/lib/dice/diceSessionBridge'

afterEach(() => {
  resetDiceSessionBridge()
})

describe('diceSessionBridge — presence channel', () => {
  it('announcing presence notifies current subscribers', () => {
    const cb = jest.fn()
    onPresenceChange(cb)
    cb.mockClear()
    announcePresence({ campaignId: 'c1', sessionId: 's1' })
    expect(cb).toHaveBeenCalledWith({ campaignId: 'c1', sessionId: 's1' })
  })

  it('clearing presence notifies current subscribers with null', () => {
    announcePresence({ campaignId: 'c1', sessionId: 's1' })
    const cb = jest.fn()
    onPresenceChange(cb)
    cb.mockClear()
    clearPresence()
    expect(cb).toHaveBeenCalledWith(null)
  })

  it('a newly-registered subscriber immediately receives the current presence value', () => {
    announcePresence({ campaignId: 'c1', sessionId: 's1' })
    const cb = jest.fn()
    onPresenceChange(cb)
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith({ campaignId: 'c1', sessionId: 's1' })
  })

  it('a newly-registered subscriber with no presence is invoked once with null', () => {
    const cb = jest.fn()
    onPresenceChange(cb)
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith(null)
  })

  it('unsubscribing stops further notifications', () => {
    const cb = jest.fn()
    const unsubscribe = onPresenceChange(cb)
    cb.mockClear()
    unsubscribe()
    announcePresence({ campaignId: 'c1', sessionId: 's1' })
    clearPresence()
    expect(cb).not.toHaveBeenCalled()
  })
})

describe('diceSessionBridge — roll-request channel', () => {
  it('requesting a roll notifies current subscribers with the full scoped payload', () => {
    const cb = jest.fn()
    onRollRequested(cb)
    const payload = {
      campaignId: 'c1',
      sessionId: 's1',
      roll: { formula: '1d20', rolls: [14], total: 14, visibility: { scope: 'group' as const } },
    }
    requestRoll(payload)
    expect(cb).toHaveBeenCalledWith(payload)
  })

  it('a roll request with no subscribers is a silent no-op', () => {
    expect(() =>
      requestRoll({
        campaignId: 'c1',
        sessionId: 's1',
        roll: { formula: '1d6', rolls: [3], total: 3, visibility: { scope: 'group' } },
      })
    ).not.toThrow()
  })

  it('a malformed roll request (invalid ids, out-of-bounds dice) is silently dropped', () => {
    const cb = jest.fn()
    onRollRequested(cb)
    requestRoll({
      campaignId: '',
      sessionId: 's1',
      roll: { formula: '1d6', rolls: [3], total: 3, visibility: { scope: 'group' } },
    } as never)
    requestRoll({
      campaignId: 'c1',
      sessionId: 's1',
      roll: { formula: '1d6', rolls: [999], total: 999, visibility: { scope: 'group' } },
    })
    requestRoll({
      campaignId: 'c1',
      sessionId: 's1',
      roll: { formula: '1d6', rolls: Array(500).fill(1), total: 500, visibility: { scope: 'group' } },
    })
    expect(cb).not.toHaveBeenCalled()
  })

  it('unsubscribing stops further roll-request notifications', () => {
    const cb = jest.fn()
    const unsubscribe = onRollRequested(cb)
    unsubscribe()
    requestRoll({
      campaignId: 'c1',
      sessionId: 's1',
      roll: { formula: '1d6', rolls: [3], total: 3, visibility: { scope: 'group' } },
    })
    expect(cb).not.toHaveBeenCalled()
  })
})

describe('diceSessionBridge — reliability', () => {
  it('resetDiceSessionBridge clears presence and listeners between tests', () => {
    const presenceCb = jest.fn()
    const rollCb = jest.fn()
    onPresenceChange(presenceCb)
    onRollRequested(rollCb)
    announcePresence({ campaignId: 'c1', sessionId: 's1' })

    resetDiceSessionBridge()

    const freshPresenceCb = jest.fn()
    onPresenceChange(freshPresenceCb)
    expect(freshPresenceCb).toHaveBeenCalledWith(null)

    requestRoll({
      campaignId: 'c1',
      sessionId: 's1',
      roll: { formula: '1d6', rolls: [3], total: 3, visibility: { scope: 'group' } },
    })
    expect(rollCb).not.toHaveBeenCalled()
  })
})
