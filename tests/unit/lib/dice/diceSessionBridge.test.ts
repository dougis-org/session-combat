import {
  announcePresence,
  clearPresence,
  onPresenceChange,
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

  it('rejects a malformed presence value instead of applying it', () => {
    const cb = jest.fn()
    onPresenceChange(cb)
    cb.mockClear()
    announcePresence({ campaignId: '', sessionId: 's1' } as never)
    expect(cb).not.toHaveBeenCalled()
  })
})

describe('diceSessionBridge — reliability', () => {
  it('resetDiceSessionBridge clears presence and listeners between tests', () => {
    const presenceCb = jest.fn()
    onPresenceChange(presenceCb)
    announcePresence({ campaignId: 'c1', sessionId: 's1' })

    resetDiceSessionBridge()

    const freshPresenceCb = jest.fn()
    onPresenceChange(freshPresenceCb)
    expect(freshPresenceCb).toHaveBeenCalledWith(null)
  })
})
