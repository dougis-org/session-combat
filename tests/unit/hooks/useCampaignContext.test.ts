/**
 * @jest-environment jsdom
 */
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { useCampaignContext } from '@/lib/hooks/useCampaignContext';
import { CampaignContext } from '@/lib/types';

jest.mock('@/lib/utils/campaignContext', () => ({
  fetchCampaignContext: jest.fn(),
}));

const { fetchCampaignContext } = require('@/lib/utils/campaignContext') as { fetchCampaignContext: any };  

const makeContext = (): CampaignContext => ({
  campaign: {
    id: 'camp-1', userId: 'u1', name: 'CoS', moduleName: 'CoS',
    chapters: [], status: 'active', notes: '', createdAt: new Date(), updatedAt: new Date(),
  },
  chapter: null,
  parties: [],
  allMembers: [],
  characters: [],
});

type HookResult = ReturnType<typeof useCampaignContext>;

function renderHook(): { result: { current: HookResult }; unmount: () => void } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const resultRef: { current: HookResult } = { current: undefined as unknown as HookResult };

  function Probe() {
    const hookResult = useCampaignContext('camp-1');
    React.useEffect(() => { resultRef.current = hookResult; }, [hookResult]);
    return null;
  }

  act(() => { root.render(React.createElement(Probe)); });

  return {
    result: resultRef,
    unmount: () => { act(() => { root.unmount(); }); container.remove(); },
  };
}

describe('useCampaignContext', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test('A4-1: loading is true on mount until fetch resolves', async () => {
    let resolve!: (ctx: CampaignContext) => void;
    fetchCampaignContext.mockReturnValue(new Promise<CampaignContext>(r => { resolve = r; }));

    const { result, unmount } = renderHook();
    expect(result.current.loading).toBe(true);

    await act(async () => { resolve(makeContext()); });
    expect(result.current.loading).toBe(false);
    unmount();
  });

  test('A4-2: after successful fetch, loading false and context non-null', async () => {
    fetchCampaignContext.mockResolvedValue(makeContext());

    const { result, unmount } = renderHook();
    await act(async () => {});

    expect(result.current.loading).toBe(false);
    expect(result.current.context).not.toBeNull();
    expect(result.current.error).toBeNull();
    unmount();
  });

  test('A4-3: on fetch error, error is non-null and context is null', async () => {
    fetchCampaignContext.mockRejectedValue(new Error('Network error'));

    const { result, unmount } = renderHook();
    await act(async () => {});

    expect(result.current.error).not.toBeNull();
    expect(result.current.context).toBeNull();
    expect(result.current.loading).toBe(false);
    unmount();
  });

  test('A4-4: calling refresh() re-triggers fetchCampaignContext', async () => {
    fetchCampaignContext.mockResolvedValue(makeContext());

    const { result, unmount } = renderHook();
    await act(async () => {});

    expect(fetchCampaignContext).toHaveBeenCalledTimes(1);

    await act(async () => { result.current.refresh(); });
    await act(async () => {});

    expect(fetchCampaignContext).toHaveBeenCalledTimes(2);
    unmount();
  });
});
