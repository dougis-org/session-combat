import React from 'react';
import { act } from 'react';
import { createReactRoot, unmountReactRoot } from '../helpers/reactRoot';
import { useIsDM } from '@/lib/hooks/useIsDM';

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({ user: { userId: 'user-1' } }),
}));

type HookResult = ReturnType<typeof useIsDM>;

function renderHook(campaignId: string): { result: { current: HookResult }; unmount: () => void } {
  const { container, root } = createReactRoot();
  const resultRef: { current: HookResult } = { current: undefined as unknown as HookResult };

  function Probe() {
    const hookResult = useIsDM(campaignId);
    React.useEffect(() => { resultRef.current = hookResult; }, [hookResult]);
    return null;
  }

  act(() => { root.render(React.createElement(Probe)); });

  return {
    result: resultRef,
    unmount: () => unmountReactRoot(container, root),
  };
}

describe('useIsDM', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  test('T1-1: current user is active dm -> isDM true', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ members: [{ userId: 'user-1', role: 'dm', status: 'active' }] }),
    });

    const { result, unmount } = renderHook('camp-1');
    await act(async () => {});

    expect(result.current).toEqual({ isDM: true, loading: false });
    unmount();
  });

  test('T1-2: current user is active player -> isDM false', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ members: [{ userId: 'user-1', role: 'player', status: 'active' }] }),
    });

    const { result, unmount } = renderHook('camp-1');
    await act(async () => {});

    expect(result.current).toEqual({ isDM: false, loading: false });
    unmount();
  });

  test('T1-3: current user is dm but invited (not active) -> isDM false', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ members: [{ userId: 'user-1', role: 'dm', status: 'invited' }] }),
    });

    const { result, unmount } = renderHook('camp-1');
    await act(async () => {});

    expect(result.current).toEqual({ isDM: false, loading: false });
    unmount();
  });

  test('T1-4: current user not present in members -> isDM false', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ members: [{ userId: 'other-user', role: 'dm', status: 'active' }] }),
    });

    const { result, unmount } = renderHook('camp-1');
    await act(async () => {});

    expect(result.current).toEqual({ isDM: false, loading: false });
    unmount();
  });

  test('T1-5: before fetch resolves -> loading true, isDM false', async () => {
    let resolve!: (v: unknown) => void;
    (global.fetch as jest.Mock).mockReturnValue(new Promise(r => { resolve = r; }));

    const { result, unmount } = renderHook('camp-1');

    expect(result.current).toEqual({ isDM: false, loading: true });

    await act(async () => {
      resolve({ ok: true, json: async () => ({ members: [] }) });
    });

    unmount();
  });
});
