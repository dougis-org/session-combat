/**
 * @jest-environment jsdom
 */
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import React from 'react';
import { act } from 'react';
import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { createRoot, Root } from 'react-dom/client';
import SessionsPage from '@/app/campaigns/[id]/sessions/page';

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'camp-1' }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement('a', { href, ...props }, children),
}));

jest.mock('@/lib/components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

jest.mock('@/lib/components/ui', () => ({
  ErrorBanner: ({ message }: { message: string | null }) =>
    message ? React.createElement('div', { role: 'alert' }, message) : null,
  LoadingState: ({ label }: { label: string }) =>
    React.createElement('div', { 'data-testid': 'loading' }, label),
  FormField: ({ label, children }: { label: string; children: React.ReactNode }) =>
    React.createElement('div', null, React.createElement('label', null, label), children),
  textInputClass: () => '',
}));

jest.mock('@/lib/utils/sessionEvents', () => ({
  buildNpcEventsFromMemberChanges: jest.fn(() => []),
}));

jest.mock('@/lib/hooks/useCampaignContext', () => ({
  useCampaignContext: jest.fn(),
}));

const { buildNpcEventsFromMemberChanges } = require('@/lib/utils/sessionEvents') as {
  buildNpcEventsFromMemberChanges: jest.Mock;
};

const { useCampaignContext } = require('@/lib/hooks/useCampaignContext') as {
  useCampaignContext: jest.Mock;
};

const MOCK_LOG = {
  id: 'log-1', userId: 'u1', campaignId: 'camp-1',
  sessionNumber: 3, title: 'Into the Mines',
  datePlayed: new Date('2026-04-15').toISOString(),
  summary: 'The party explored the mines.', events: [],
  milestone: false,
  createdAt: new Date('2026-04-15').toISOString(),
  updatedAt: new Date('2026-04-15').toISOString(),
};

const PARTY_ALICE_BOB = {
  id: 'p-1', userId: 'u1', name: 'Party A', campaignId: 'camp-1',
  members: [
    { characterId: 'c-1', addedAt: new Date().toISOString() },
    { characterId: 'c-2', addedAt: new Date().toISOString() },
  ],
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};

const PARTY_CAROL = {
  id: 'p-2', userId: 'u1', name: 'Party B', campaignId: 'camp-1',
  members: [
    { characterId: 'c-3', addedAt: new Date().toISOString() },
  ],
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};

let container: HTMLDivElement;
let root: Root;

function makeContext(parties: typeof PARTY_ALICE_BOB[]) {
  return {
    campaign: { id: 'camp-1', userId: 'u1', name: 'Test Campaign', moduleName: 'TCM', chapters: [], status: 'active', notes: '', createdAt: new Date(), updatedAt: new Date() },
    chapter: null,
    parties,
    allMembers: parties.flatMap(p => p.members),
    characters: [],
  };
}

function makeFetchForLogs(logs: object[]) {
  return jest.fn(async (url: RequestInfo | URL) => {
    const ok = true;
    const json = String(url).includes('/sessions')
      ? async () => logs
      : async () => [];
    return { ok, json } as unknown as Response;
  }) as typeof fetch;
}

async function clickButton(el: HTMLElement, text: string): Promise<void> {
  const btn = Array.from(el.querySelectorAll<HTMLButtonElement>('button'))
    .find(b => b.textContent?.includes(text));
  await act(async () => { btn?.click(); });
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  jest.clearAllMocks();
  buildNpcEventsFromMemberChanges.mockReturnValue([]);
});

afterEach(() => {
  act(() => { root.unmount(); });
  container.remove();
});

async function renderSessions(logs: object[], parties: typeof PARTY_ALICE_BOB[]) {
  global.fetch = makeFetchForLogs(logs);
  useCampaignContext.mockReturnValue({ context: makeContext(parties), loading: false, error: null, refresh: jest.fn() });
  await act(async () => { root.render(React.createElement(SessionsPage)); });
}

describe('Session Logs — D1 regression tests (before refactor)', () => {
  test('D1-1: single party linked to campaign → NPC events built from that party members', async () => {
    await renderSessions([], [PARTY_ALICE_BOB]);
    await clickButton(container, 'New Session');

    expect(buildNpcEventsFromMemberChanges).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ characterId: 'c-1' }),
        expect.objectContaining({ characterId: 'c-2' }),
      ]),
      null,
    );
  });

  test('D1-2: session list renders correctly for a campaign with existing logs', async () => {
    await renderSessions([MOCK_LOG], [PARTY_ALICE_BOB]);
    expect(container.textContent).toContain('Into the Mines');
    expect(container.textContent).toContain('#3');
  });

  test('D1-3: opening editor for new session shows the form', async () => {
    await renderSessions([], [PARTY_ALICE_BOB]);
    await clickButton(container, 'New Session');

    expect(container.textContent).toContain('Session #');
    expect(container.textContent).toContain('Date Played');
  });

  test('D1-4: no party linked to campaign → "No linked party found" message shown', async () => {
    await renderSessions([], []);
    await clickButton(container, 'New Session');
    expect(container.textContent).toContain('No linked party found');
  });
});

describe('Session Logs — D2 multi-party test (fails until D3 refactor)', () => {
  test('D2-1: two parties linked to same campaign → NPC events include members from both parties', async () => {
    await renderSessions([], [PARTY_ALICE_BOB, PARTY_CAROL]);
    await clickButton(container, 'New Session');

    expect(buildNpcEventsFromMemberChanges).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ characterId: 'c-1' }),
        expect.objectContaining({ characterId: 'c-2' }),
        expect.objectContaining({ characterId: 'c-3' }),
      ]),
      null,
    );
  });
});
