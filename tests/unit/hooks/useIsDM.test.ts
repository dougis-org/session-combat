import React from 'react';
import { act } from 'react';
import { createReactRoot, unmountReactRoot } from '../helpers/reactRoot';
import { useIsDM } from '@/lib/hooks/useIsDM';

const useAuthMock = jest.fn();
jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}));

type HookResult = ReturnType<typeof useIsDM>;

function renderHook(campaignId: string): { result: { current: HookResult }; unmount: () => void } {
  const { container, root } = createReactRoot();
  const resultRef: { current: HookResult } = { current: { isDM: false, loading: true } };

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
    useAuthMock.mockReturnValue({ user: { userId: 'user-1' }, loading: false });
  });

  test('T1-1: current user is active dm -> isDM true', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ role: 'dm', status: 'active' }),
    });

    const { result, unmount } = renderHook('camp-1');
    await act(async () => {});

    expect(global.fetch).toHaveBeenCalledWith('/api/campaigns/camp-1/members/me');
    expect(result.current).toEqual({ isDM: true, loading: false });
    unmount();
  });

  test('T1-2: current user is active player -> isDM false', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ role: 'player', status: 'active' }),
    });

    const { result, unmount } = renderHook('camp-1');
    await act(async () => {});

    expect(result.current).toEqual({ isDM: false, loading: false });
    unmount();
  });

  test('T1-3: current user is dm but invited (not active) -> isDM false', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ role: 'dm', status: 'invited' }),
    });

    const { result, unmount } = renderHook('camp-1');
    await act(async () => {});

    expect(result.current).toEqual({ isDM: false, loading: false });
    unmount();
  });

  test('T1-4: current user not a member (404) -> isDM false', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404 });

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
      resolve({ ok: true, json: async () => ({ role: 'player', status: 'active' }) });
    });

    unmount();
  });

  test('while auth is still loading -> loading true, isDM false, no members fetch', async () => {
    useAuthMock.mockReturnValue({ user: null, loading: true });

    const { result, unmount } = renderHook('camp-1');
    await act(async () => {});

    expect(result.current).toEqual({ isDM: false, loading: true });
    expect(global.fetch).not.toHaveBeenCalled();
    unmount();
  });

  test('auth resolved with no user -> isDM false, loading false, no members fetch', async () => {
    useAuthMock.mockReturnValue({ user: null, loading: false });

    const { result, unmount } = renderHook('camp-1');
    await act(async () => {});

    expect(result.current).toEqual({ isDM: false, loading: false });
    expect(global.fetch).not.toHaveBeenCalled();
    unmount();
  });

  test('useAuth toggling loading (e.g. route-change recheck) without a userId change does not refetch', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ role: 'dm', status: 'active' }),
    });

    const { container, root } = createReactRoot();
    function Probe({ campaignId }: { campaignId: string }) {
      useIsDM(campaignId);
      return null;
    }
    act(() => { root.render(React.createElement(Probe, { campaignId: 'camp-1' })); });
    await act(async () => {});
    expect(global.fetch).toHaveBeenCalledTimes(1);

    useAuthMock.mockReturnValue({ user: { userId: 'user-1' }, loading: true });
    act(() => { root.render(React.createElement(Probe, { campaignId: 'camp-1' })); });
    useAuthMock.mockReturnValue({ user: { userId: 'user-1' }, loading: false });
    act(() => { root.render(React.createElement(Probe, { campaignId: 'camp-1' })); });
    await act(async () => {});

    expect(global.fetch).toHaveBeenCalledTimes(1);
    unmountReactRoot(container, root);
  });
});
