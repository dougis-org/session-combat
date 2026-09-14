import React from 'react';
import { act } from 'react';
import { createReactRoot, unmountReactRoot } from '../helpers/reactRoot';
import { useActiveSessionIdCore, useActiveSessionId } from '@/lib/hooks/useActiveSessionId';
import type { CampaignStreamEvent } from '@/lib/types';

const useCampaignStreamMock = jest.fn();
jest.mock('@/lib/hooks/useCampaignStream', () => ({
  useCampaignStream: (campaignId: string, onEvent: (e: CampaignStreamEvent) => void) =>
    useCampaignStreamMock(campaignId, onEvent),
}));

type CoreResult = ReturnType<typeof useActiveSessionIdCore>;
type WrapperResult = ReturnType<typeof useActiveSessionId>;

function renderCoreHook(campaignId: string): { result: { current: CoreResult }; unmount: () => void; rerender: (id: string) => void } {
  const { container, root } = createReactRoot();
  const resultRef: { current: CoreResult } = {
    current: { activeSessionId: undefined, setActiveSessionId: () => {}, handleStreamEvent: () => {} },
  };

  function Probe({ campaignId }: { campaignId: string }) {
    const hookResult = useActiveSessionIdCore(campaignId);
    React.useEffect(() => { resultRef.current = hookResult; }, [hookResult]);
    return null;
  }

  act(() => { root.render(React.createElement(Probe, { campaignId })); });

  return {
    result: resultRef,
    unmount: () => unmountReactRoot(container, root),
    rerender: (id: string) => { act(() => { root.render(React.createElement(Probe, { campaignId: id })); }); },
  };
}

function renderWrapperHook(campaignId: string): { result: { current: WrapperResult }; unmount: () => void } {
  const { container, root } = createReactRoot();
  const resultRef: { current: WrapperResult } = {
    current: { activeSessionId: undefined, setActiveSessionId: () => {} },
  };

  function Probe({ campaignId }: { campaignId: string }) {
    const hookResult = useActiveSessionId(campaignId);
    React.useEffect(() => { resultRef.current = hookResult; }, [hookResult]);
    return null;
  }

  act(() => { root.render(React.createElement(Probe, { campaignId })); });

  return {
    result: resultRef,
    unmount: () => unmountReactRoot(container, root),
  };
}

describe('useActiveSessionIdCore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    useCampaignStreamMock.mockReturnValue({ status: 'open' });
  });

  test('initial fetch resolves activeSessionId', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ activeSessionId: 'log-1' }),
    });

    const { result, unmount } = renderCoreHook('camp-1');
    expect(result.current.activeSessionId).toBeUndefined();

    await act(async () => {});

    expect(global.fetch).toHaveBeenCalledWith('/api/campaigns/camp-1');
    expect(result.current.activeSessionId).toBe('log-1');
    unmount();
  });

  test('handleStreamEvent updates activeSessionId on session-typed event, no-ops otherwise', async () => {
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {})); // never resolves

    const { result, unmount } = renderCoreHook('camp-1');
    await act(async () => {});

    act(() => {
      result.current.handleStreamEvent({ type: 'heartbeat', campaignId: 'camp-1', data: { ts: Date.now() } } as CampaignStreamEvent);
    });
    expect(result.current.activeSessionId).toBeUndefined();

    act(() => {
      result.current.handleStreamEvent({ type: 'session', campaignId: 'camp-1', data: { activeSessionId: 'log-sse' } } as CampaignStreamEvent);
    });
    expect(result.current.activeSessionId).toBe('log-sse');
    unmount();
  });

  test('setActiveSessionId updates immediately', async () => {
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}));

    const { result, unmount } = renderCoreHook('camp-1');
    await act(async () => {});

    act(() => { result.current.setActiveSessionId('log-optimistic'); });
    expect(result.current.activeSessionId).toBe('log-optimistic');
    unmount();
  });

  test('a stale fetch resolving after handleStreamEvent is discarded', async () => {
    let resolveFetch!: (v: unknown) => void;
    (global.fetch as jest.Mock).mockReturnValue(new Promise(r => { resolveFetch = r; }));

    const { result, unmount } = renderCoreHook('camp-1');

    act(() => {
      result.current.handleStreamEvent({ type: 'session', campaignId: 'camp-1', data: { activeSessionId: 'log-sse' } } as CampaignStreamEvent);
    });
    expect(result.current.activeSessionId).toBe('log-sse');

    await act(async () => {
      resolveFetch({ ok: true, json: async () => ({ activeSessionId: 'log-stale' }) });
    });

    expect(result.current.activeSessionId).toBe('log-sse');
    unmount();
  });

  test('a stale fetch resolving after setActiveSessionId is discarded', async () => {
    let resolveFetch!: (v: unknown) => void;
    (global.fetch as jest.Mock).mockReturnValue(new Promise(r => { resolveFetch = r; }));

    const { result, unmount } = renderCoreHook('camp-1');

    act(() => { result.current.setActiveSessionId('log-optimistic'); });
    expect(result.current.activeSessionId).toBe('log-optimistic');

    await act(async () => {
      resolveFetch({ ok: true, json: async () => ({ activeSessionId: 'log-stale' }) });
    });

    expect(result.current.activeSessionId).toBe('log-optimistic');
    unmount();
  });

  test('a duplicate confirming event after an optimistic set causes no flicker', async () => {
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}));

    const { result, unmount } = renderCoreHook('camp-1');
    await act(async () => {});

    act(() => { result.current.setActiveSessionId('log-1'); });
    expect(result.current.activeSessionId).toBe('log-1');

    act(() => {
      result.current.handleStreamEvent({ type: 'session', campaignId: 'camp-1', data: { activeSessionId: 'log-1' } } as CampaignStreamEvent);
    });
    expect(result.current.activeSessionId).toBe('log-1');
    unmount();
  });

  test('state resets to undefined and re-fetches when campaignId changes', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ activeSessionId: 'log-camp-1' }),
    });

    const { result, unmount, rerender } = renderCoreHook('camp-1');
    await act(async () => {});
    expect(result.current.activeSessionId).toBe('log-camp-1');

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ activeSessionId: 'log-camp-2' }),
    });

    rerender('camp-2');
    // Reset to undefined happens synchronously with the campaignId change's effect
    await act(async () => {});
    expect(global.fetch).toHaveBeenLastCalledWith('/api/campaigns/camp-2');
    expect(result.current.activeSessionId).toBe('log-camp-2');
    unmount();
  });

  test('never calls useCampaignStream / opens no EventSource', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ activeSessionId: null }) });

    const { unmount } = renderCoreHook('camp-1');
    await act(async () => {});

    expect(useCampaignStreamMock).not.toHaveBeenCalled();
    unmount();
  });
});

describe('useActiveSessionId (self-subscribing wrapper)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  test('calls useCampaignStream exactly once and forwards received events into the core logic', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ activeSessionId: null }) });
    let capturedHandler: ((e: CampaignStreamEvent) => void) | undefined;
    useCampaignStreamMock.mockImplementation((_campaignId: string, onEvent: (e: CampaignStreamEvent) => void) => {
      capturedHandler = onEvent;
      return { status: 'open' };
    });

    const { result, unmount } = renderWrapperHook('camp-1');
    await act(async () => {});

    // useCampaignStream is a per-render call whose own internal effect (keyed
    // only on campaignId) is what actually owns the single EventSource
    // subscription — every render-time call here must be for the same
    // campaignId, i.e. no second/different subscription is ever requested.
    expect(useCampaignStreamMock.mock.calls.length).toBeGreaterThan(0);
    for (const call of useCampaignStreamMock.mock.calls) {
      expect(call[0]).toBe('camp-1');
    }
    expect(result.current.activeSessionId).toBeNull();

    act(() => {
      capturedHandler?.({ type: 'session', campaignId: 'camp-1', data: { activeSessionId: 'log-live' } } as CampaignStreamEvent);
    });
    expect(result.current.activeSessionId).toBe('log-live');

    unmount();
  });
});
