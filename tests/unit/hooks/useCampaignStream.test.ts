import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useCampaignStream } from '@/lib/hooks/useCampaignStream';
import { CampaignStreamEvent } from '@/lib/types';

// ---------------------------------------------------------------------------
// MockEventSource
// ---------------------------------------------------------------------------

class MockEventSource {
  static instances: MockEventSource[] = [];
  static OPEN = 1;
  static CONNECTING = 0;
  static CLOSED = 2;

  url: string;
  readyState: number = MockEventSource.CONNECTING;
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((e: MessageEvent) => void) | null = null;
  close = jest.fn(() => { this.readyState = MockEventSource.CLOSED; });

  private listeners: Record<string, Array<(e: MessageEvent) => void>> = {};

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, handler: (e: MessageEvent) => void) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(handler);
  }

  triggerOpen() {
    this.readyState = MockEventSource.OPEN;
    this.onopen?.();
  }

  triggerError(readyState: number) {
    this.readyState = readyState;
    this.onerror?.();
  }

  triggerEvent(type: string, data: string) {
    const event = new MessageEvent(type, { data });
    (this.listeners[type] ?? []).forEach(h => h(event));
  }
}

// ---------------------------------------------------------------------------
// renderHook helper (matches project's custom pattern)
// ---------------------------------------------------------------------------

type HookProps = { campaignId: string; onEvent: (e: CampaignStreamEvent) => void };
type HookResult = { current: { status: string } };

function renderHook(props: HookProps): { result: HookResult; rerender: (p: HookProps) => void; unmount: () => void } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const resultRef: HookResult = { current: { status: 'connecting' } };
  let latestProps = props;

  function Probe() {
    const hookResult = useCampaignStream(latestProps.campaignId, latestProps.onEvent);
    React.useEffect(() => { resultRef.current = hookResult; });
    return null;
  }

  act(() => { root.render(React.createElement(Probe)); });

  return {
    result: resultRef,
    rerender: (newProps: HookProps) => {
      latestProps = newProps;
      act(() => { root.render(React.createElement(Probe)); });
    },
    unmount: () => { act(() => { root.unmount(); }); container.remove(); },
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  MockEventSource.instances = [];
  (globalThis as unknown as Record<string, unknown>).EventSource = MockEventSource;
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

// ---------------------------------------------------------------------------
// T1 — Connection lifecycle
// ---------------------------------------------------------------------------

describe('T1 — Connection lifecycle', () => {
  test('T1-1: initial status is connecting', () => {
    const onEvent = jest.fn();
    const { result, unmount } = renderHook({ campaignId: 'c1', onEvent });
    expect(result.current.status).toBe('connecting');
    unmount();
  });

  test('T1-2: status becomes open after onopen', () => {
    const onEvent = jest.fn();
    const { result, unmount } = renderHook({ campaignId: 'c1', onEvent });
    const [mockEs] = MockEventSource.instances;
    act(() => { mockEs.triggerOpen(); });
    expect(result.current.status).toBe('open');
    unmount();
  });

  test('T1-3: EventSource constructed with correct URL', () => {
    const onEvent = jest.fn();
    const { unmount } = renderHook({ campaignId: 'campaign-abc', onEvent });
    expect(MockEventSource.instances[0].url).toBe('/api/campaigns/campaign-abc/stream');
    unmount();
  });

  test('T1-4: campaignId change closes previous EventSource and opens new one', () => {
    const onEvent = jest.fn();
    const { result, rerender, unmount } = renderHook({ campaignId: 'a', onEvent });
    const first = MockEventSource.instances[0];
    act(() => { first.triggerOpen(); });
    expect(result.current.status).toBe('open');

    rerender({ campaignId: 'b', onEvent });

    expect(first.close).toHaveBeenCalled();
    expect(MockEventSource.instances).toHaveLength(2);
    expect(MockEventSource.instances[1].url).toBe('/api/campaigns/b/stream');
    expect(result.current.status).toBe('connecting');
    unmount();
  });
});

// ---------------------------------------------------------------------------
// T2 — Event dispatch
// ---------------------------------------------------------------------------

describe('T2 — Event dispatch', () => {
  test('T2-1: addEventListener(heartbeat) called, onmessage not assigned', () => {
    const onEvent = jest.fn();
    const { unmount } = renderHook({ campaignId: 'c1', onEvent });
    const mockEs = MockEventSource.instances[0];
    // Verify heartbeat listener was registered (spy on addEventListener calls)
    const listeners = (mockEs as unknown as Record<string, unknown>)['listeners'] as Record<string, unknown[]>;
    expect(listeners['heartbeat']).toHaveLength(1);
    expect(mockEs.onmessage).toBeNull();
    unmount();
  });

  test('T2-2: addEventListener(change) called', () => {
    const onEvent = jest.fn();
    const { unmount } = renderHook({ campaignId: 'c1', onEvent });
    const mockEs = MockEventSource.instances[0];
    const listeners = (mockEs as unknown as Record<string, unknown>)['listeners'] as Record<string, unknown[]>;
    expect(listeners['change']).toHaveLength(1);
    unmount();
  });

  test('T2-3: heartbeat event dispatched to onEvent', () => {
    const onEvent = jest.fn();
    const { unmount } = renderHook({ campaignId: 'c1', onEvent });
    const mockEs = MockEventSource.instances[0];
    act(() => { mockEs.triggerOpen(); });
    act(() => {
      mockEs.triggerEvent('heartbeat', '{"type":"heartbeat","campaignId":"c1","data":{"ts":1000}}');
    });
    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onEvent).toHaveBeenCalledWith({ type: 'heartbeat', campaignId: 'c1', data: { ts: 1000 } });
    unmount();
  });

  test('T2-4: change event dispatched to onEvent', () => {
    const onEvent = jest.fn();
    const { unmount } = renderHook({ campaignId: 'c1', onEvent });
    const mockEs = MockEventSource.instances[0];
    act(() => { mockEs.triggerOpen(); });
    act(() => {
      mockEs.triggerEvent('change', '{"type":"change","campaignId":"c1","data":{"name":"updated"}}');
    });
    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onEvent).toHaveBeenCalledWith({ type: 'change', campaignId: 'c1', data: { name: 'updated' } });
    unmount();
  });

  test('T2-5: updated onEvent ref receives subsequent events without reconnect', () => {
    const fn1 = jest.fn();
    const fn2 = jest.fn();
    const { rerender, unmount } = renderHook({ campaignId: 'c1', onEvent: fn1 });
    const mockEs = MockEventSource.instances[0];
    act(() => { mockEs.triggerOpen(); });

    rerender({ campaignId: 'c1', onEvent: fn2 });

    act(() => {
      mockEs.triggerEvent('change', '{"type":"change","campaignId":"c1","data":{}}');
    });

    expect(fn2).toHaveBeenCalledTimes(1);
    expect(fn1).not.toHaveBeenCalled();
    expect(MockEventSource.instances).toHaveLength(1); // no reconnect
    unmount();
  });
});

// ---------------------------------------------------------------------------
// T3 — Reconnect behaviour
// ---------------------------------------------------------------------------

describe('T3 — Reconnect behaviour', () => {
  beforeEach(() => { jest.useFakeTimers(); });

  test('T3-1: onerror + CLOSED → status error, reconnect after 1000ms', () => {
    const onEvent = jest.fn();
    const { result, unmount } = renderHook({ campaignId: 'c1', onEvent });
    const first = MockEventSource.instances[0];
    act(() => { first.triggerOpen(); });
    act(() => { first.triggerError(MockEventSource.CLOSED); });

    expect(result.current.status).toBe('error');
    expect(MockEventSource.instances).toHaveLength(1);

    act(() => { jest.advanceTimersByTime(1_000); });
    expect(MockEventSource.instances).toHaveLength(2);
    unmount();
  });

  test('T3-2: backoff doubles on second failure (2000ms)', () => {
    const onEvent = jest.fn();
    const { unmount } = renderHook({ campaignId: 'c1', onEvent });
    const first = MockEventSource.instances[0];
    act(() => { first.triggerOpen(); });
    act(() => { first.triggerError(MockEventSource.CLOSED); });
    act(() => { jest.advanceTimersByTime(1_000); }); // reconnect → 2nd ES

    const second = MockEventSource.instances[1];
    act(() => { second.triggerError(MockEventSource.CLOSED); });
    expect(MockEventSource.instances).toHaveLength(2);

    act(() => { jest.advanceTimersByTime(2_000); });
    expect(MockEventSource.instances).toHaveLength(3);
    unmount();
  });

  test('T3-3: backoff doubles again to 4000ms on third failure', () => {
    const onEvent = jest.fn();
    const { unmount } = renderHook({ campaignId: 'c1', onEvent });
    act(() => { MockEventSource.instances[0].triggerOpen(); });
    act(() => { MockEventSource.instances[0].triggerError(MockEventSource.CLOSED); });
    act(() => { jest.advanceTimersByTime(1_000); });
    act(() => { MockEventSource.instances[1].triggerError(MockEventSource.CLOSED); });
    act(() => { jest.advanceTimersByTime(2_000); });
    act(() => { MockEventSource.instances[2].triggerError(MockEventSource.CLOSED); });
    expect(MockEventSource.instances).toHaveLength(3);
    act(() => { jest.advanceTimersByTime(4_000); });
    expect(MockEventSource.instances).toHaveLength(4);
    unmount();
  });

  test('T3-4: backoff is capped at 30000ms', () => {
    const onEvent = jest.fn();
    const { unmount } = renderHook({ campaignId: 'c1', onEvent });

    // Drive through failures: 1s, 2s, 4s, 8s, 16s → next would be 32s but capped
    const delays = [1_000, 2_000, 4_000, 8_000, 16_000];
    act(() => { MockEventSource.instances[0].triggerOpen(); });
    for (const d of delays) {
      const last = MockEventSource.instances[MockEventSource.instances.length - 1];
      act(() => { last.triggerError(MockEventSource.CLOSED); });
      act(() => { jest.advanceTimersByTime(d); });
    }

    // After 5 failures (delays used: 1,2,4,8,16), next delay scheduled should be 30000
    const last = MockEventSource.instances[MockEventSource.instances.length - 1];
    act(() => { last.triggerError(MockEventSource.CLOSED); });
    const beforeCount = MockEventSource.instances.length;
    act(() => { jest.advanceTimersByTime(29_999); });
    expect(MockEventSource.instances).toHaveLength(beforeCount); // not fired yet
    act(() => { jest.advanceTimersByTime(1); });
    expect(MockEventSource.instances).toHaveLength(beforeCount + 1); // fired at 30s
    unmount();
  });

  test('T3-5: backoff resets to 1000ms after successful reconnect', () => {
    const onEvent = jest.fn();
    const { unmount } = renderHook({ campaignId: 'c1', onEvent });
    act(() => { MockEventSource.instances[0].triggerOpen(); });
    act(() => { MockEventSource.instances[0].triggerError(MockEventSource.CLOSED); });
    act(() => { jest.advanceTimersByTime(1_000); });

    // Second EventSource connects successfully → resets delay
    act(() => { MockEventSource.instances[1].triggerOpen(); });
    act(() => { MockEventSource.instances[1].triggerError(MockEventSource.CLOSED); });

    expect(MockEventSource.instances).toHaveLength(2);
    act(() => { jest.advanceTimersByTime(1_000); }); // should fire at 1000ms (reset)
    expect(MockEventSource.instances).toHaveLength(3);
    unmount();
  });

  test('T3-6: onerror with CONNECTING state does not schedule reconnect', () => {
    const onEvent = jest.fn();
    const { unmount } = renderHook({ campaignId: 'c1', onEvent });
    act(() => { MockEventSource.instances[0].triggerOpen(); });
    act(() => { MockEventSource.instances[0].triggerError(MockEventSource.CONNECTING); });
    act(() => { jest.runAllTimers(); });
    expect(MockEventSource.instances).toHaveLength(1);
    unmount();
  });
});

// ---------------------------------------------------------------------------
// T4 — Teardown
// ---------------------------------------------------------------------------

describe('T4 — Teardown', () => {
  test('T4-1: es.close() called on unmount (open state)', () => {
    const onEvent = jest.fn();
    const { unmount } = renderHook({ campaignId: 'c1', onEvent });
    const mockEs = MockEventSource.instances[0];
    act(() => { mockEs.triggerOpen(); });
    unmount();
    expect(mockEs.close).toHaveBeenCalled();
  });

  test('T4-2: pending reconnect timer cancelled on unmount', () => {
    jest.useFakeTimers();
    const onEvent = jest.fn();
    const { unmount } = renderHook({ campaignId: 'c1', onEvent });
    act(() => { MockEventSource.instances[0].triggerOpen(); });
    act(() => { MockEventSource.instances[0].triggerError(MockEventSource.CLOSED); });

    // Unmount before 1000ms timer fires
    unmount();
    act(() => { jest.runAllTimers(); });
    expect(MockEventSource.instances).toHaveLength(1); // no second ES created
  });

  test('T4-3: unmount before onopen does not throw', () => {
    const onEvent = jest.fn();
    const { unmount } = renderHook({ campaignId: 'c1', onEvent });
    const mockEs = MockEventSource.instances[0];
    expect(() => { unmount(); }).not.toThrow();
    expect(mockEs.close).toHaveBeenCalled();
  });
});
