/**
 * @jest-environment jsdom
 */
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import React from 'react';
import { act } from 'react';
import { Root, createRoot } from 'react-dom/client';
import { Response as FetchResponse } from 'node-fetch';
import { CampaignsContent } from '@/app/campaigns/page';

jest.mock('@/lib/components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

function jsonResponse(body: unknown, status = 200): Response {
  return new FetchResponse(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  }) as unknown as Response;
}

const MOCK_CAMPAIGN = {
  id: 'camp-1',
  userId: 'user-1',
  name: 'My Campaign',
  moduleName: 'LMoP',
  chapters: [],
  active: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const MOCK_TEMPLATE = {
  id: 'tpl-1',
  userId: 'GLOBAL',
  isGlobal: true,
  name: 'Lost Mine of Phandelver',
  moduleName: 'LMoP',
  chapters: [
    { id: 'ch-1', title: 'Chapter 1', order: 0 },
    { id: 'ch-2', title: 'Chapter 2', order: 1 },
    { id: 'ch-3', title: 'Chapter 3', order: 2 },
    { id: 'ch-4', title: 'Chapter 4', order: 3 },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

let container: HTMLDivElement;
let root: Root;
let originalFetch: typeof global.fetch;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  originalFetch = global.fetch;
});

afterEach(() => {
  act(() => { root.unmount(); });
  container.remove();
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

function setupFetch(campaigns: unknown[] = [], templates: unknown[] = []) {
  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = input.toString();
    if (url === '/api/campaigns') return jsonResponse(campaigns);
    if (url === '/api/campaigns/global') return jsonResponse(templates);
    return jsonResponse({ error: 'not found' }, 404);
  }) as typeof fetch;
}

async function renderPage() {
  await act(async () => { root.render(React.createElement(CampaignsContent)); });
}

describe('Campaign Catalog UI', () => {
  it('renders Campaign Catalog section heading', async () => {
    setupFetch([], [MOCK_TEMPLATE]);
    await renderPage();
    expect(container.textContent).toContain('Campaign Catalog');
  });

  it('catalog section appears after user campaigns section in DOM', async () => {
    setupFetch([MOCK_CAMPAIGN], [MOCK_TEMPLATE]);
    await renderPage();
    const headings = Array.from(container.querySelectorAll('h1, h2'));
    const campaignsIndex = headings.findIndex(h => h.textContent?.includes('Campaigns'));
    const catalogIndex = headings.findIndex(h => h.textContent?.includes('Campaign Catalog'));
    expect(campaignsIndex).toBeGreaterThanOrEqual(0);
    expect(catalogIndex).toBeGreaterThan(campaignsIndex);
  });

  it('shows template name, moduleName, chapter count, and Copy button', async () => {
    setupFetch([], [MOCK_TEMPLATE]);
    await renderPage();
    expect(container.textContent).toContain('Lost Mine of Phandelver');
    expect(container.textContent).toContain('LMoP');
    expect(container.textContent).toContain('4 chapters');
    const buttons = Array.from(container.querySelectorAll('button'));
    expect(buttons.some(b => b.textContent?.trim() === 'Copy')).toBe(true);
  });

  it('shows empty state when catalog is empty', async () => {
    setupFetch([], []);
    await renderPage();
    expect(container.textContent).toContain('No campaign templates available yet');
  });

  it('Copy button calls POST to correct URL and refreshes campaigns', async () => {
    const newCampaign = { ...MOCK_CAMPAIGN, id: 'camp-new', name: 'Lost Mine of Phandelver' };
    let campaignsList = [MOCK_CAMPAIGN];

    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      if (url === '/api/campaigns') return jsonResponse(campaignsList);
      if (url === '/api/campaigns/global') return jsonResponse([MOCK_TEMPLATE]);
      if (url === `/api/campaigns/global/${MOCK_TEMPLATE.id}/copy` && init?.method === 'POST') {
        campaignsList = [...campaignsList, newCampaign];
        return jsonResponse(newCampaign, 201);
      }
      return jsonResponse({ error: 'not found' }, 404);
    }) as typeof fetch;

    await renderPage();

    const copyButton = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.trim() === 'Copy'
    );
    expect(copyButton).toBeTruthy();

    await act(async () => { copyButton!.click(); });

    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    const copyCall = fetchMock.mock.calls.find(
      ([url, init]) => url.toString().includes('/copy') && (init as RequestInit)?.method === 'POST'
    );
    expect(copyCall).toBeTruthy();
  });

  it('Copy button shows loading state during in-flight request', async () => {
    let resolveCopy!: (value: unknown) => void;
    const copyPromise = new Promise((resolve) => { resolveCopy = resolve; });

    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      if (url === '/api/campaigns') return jsonResponse([]);
      if (url === '/api/campaigns/global') return jsonResponse([MOCK_TEMPLATE]);
      if (url.includes('/copy') && (init as RequestInit)?.method === 'POST') {
        await copyPromise;
        return jsonResponse({}, 201);
      }
      return jsonResponse({ error: 'not found' }, 404);
    }) as typeof fetch;

    await renderPage();

    const copyButton = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.trim() === 'Copy'
    );

    act(() => { copyButton!.click(); });

    const loadingButton = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.includes('Copying')
    );
    expect(loadingButton).toBeTruthy();
    expect((loadingButton as HTMLButtonElement).disabled).toBe(true);

    resolveCopy(undefined);
    await act(async () => { await copyPromise; });
  });

  it('Copy failure shows inline error message', async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      if (url === '/api/campaigns') return jsonResponse([]);
      if (url === '/api/campaigns/global') return jsonResponse([MOCK_TEMPLATE]);
      if (url.includes('/copy') && (init as RequestInit)?.method === 'POST') {
        return jsonResponse({ error: 'Server error' }, 500);
      }
      return jsonResponse({ error: 'not found' }, 404);
    }) as typeof fetch;

    await renderPage();

    const copyButton = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.trim() === 'Copy'
    );
    await act(async () => { copyButton!.click(); });

    expect(container.textContent).toContain('Server error');
  });

  it('catalog fetch failure does not crash page — user campaigns still render', async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url === '/api/campaigns') return jsonResponse([MOCK_CAMPAIGN]);
      if (url === '/api/campaigns/global') return jsonResponse({ error: 'DB error' }, 500);
      return jsonResponse({ error: 'not found' }, 404);
    }) as typeof fetch;

    await renderPage();

    expect(container.textContent).toContain('My Campaign');
    expect(container.textContent).toContain('Campaign Catalog');
  });
});
