/**
 * @jest-environment jsdom
 */
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { setupUiTest } from '@/tests/unit/helpers/uiTestSetup';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement('a', { href, ...props }, children),
}));

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'camp-1' }),
}));

jest.mock('@/lib/components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

jest.mock('@/lib/components/ui', () => ({
  ErrorBanner: ({ message }: { message: string | null }) =>
    message ? React.createElement('div', { role: 'alert' }, message) : null,
  LoadingState: ({ label }: { label: string }) =>
    React.createElement('div', null, label),
  FormField: ({ label, children }: { label: string; children: React.ReactNode }) =>
    React.createElement('div', null, React.createElement('label', null, label), children),
  textInputClass: () => '',
}));

jest.mock('@/lib/utils/sessionEvents', () => ({
  buildNpcEventsFromMemberChanges: jest.fn(() => []),
}));

jest.mock('@/lib/hooks/useCampaignContext', () => ({
  useCampaignContext: jest.fn(() => ({
    context: null,
    loading: false,
    error: null,
    refresh: jest.fn(),
  })),
}));

const MOCK_LOG = {
  id: 'log-1',
  userId: 'u1',
  campaignId: 'camp-1',
  sessionNumber: 3,
  title: 'Into the Mines',
  datePlayed: new Date('2026-04-15').toISOString(),
  summary: 'The party explored the mines.',
  events: [],
  milestone: false,
  createdAt: new Date('2026-04-15').toISOString(),
  updatedAt: new Date('2026-04-15').toISOString(),
};

const MILESTONE_LOG = {
  ...MOCK_LOG,
  id: 'log-2',
  sessionNumber: 2,
  title: 'Level Up!',
  milestone: true,
  newLevel: 5,
};

const ctx = setupUiTest();

async function renderWithData(logs: object[], parties: object[] = []) {
  global.fetch = jest.fn(async (url: RequestInfo | URL) => {
    const s = String(url);
    if (s.includes('/sessions')) return { ok: true, json: async () => logs } as unknown as Response;
    if (s.includes('/parties')) return { ok: true, json: async () => parties } as unknown as Response;
    return { ok: true, json: async () => [] } as unknown as Response;
  }) as typeof fetch;

  const { default: SessionsPage } = await import('@/app/campaigns/[id]/sessions/page');
  await act(async () => {
    ctx.root = createRoot(ctx.container);
    ctx.root.render(React.createElement(SessionsPage));
  });
}

describe('SessionsPage — session log display', () => {
  test('renders session title and number', async () => {
    await renderWithData([MOCK_LOG]);
    expect(ctx.container.textContent).toContain('Into the Mines');
    expect(ctx.container.textContent).toContain('#3');
  });

  test('renders milestone badge with level', async () => {
    await renderWithData([MILESTONE_LOG]);
    expect(ctx.container.textContent).toContain('Level 5');
  });

  test('renders milestone badge as "Level Up" when newLevel is 0', async () => {
    const log = { ...MILESTONE_LOG, newLevel: 0 };
    await renderWithData([log]);
    expect(ctx.container.textContent).toContain('Level Up');
  });

  test('shows empty state when no logs', async () => {
    await renderWithData([]);
    expect(ctx.container.textContent).toContain('No sessions logged yet');
  });

  test('shows "+ New Session" button', async () => {
    await renderWithData([]);
    const buttons = Array.from(ctx.container.querySelectorAll('button'));
    expect(buttons.some(b => b.textContent?.includes('New Session'))).toBe(true);
  });

  test('renders session form when button clicked', async () => {
    await renderWithData([]);
    const btn = Array.from(ctx.container.querySelectorAll('button'))
      .find(b => b.textContent?.includes('New Session'));
    await act(async () => { btn?.click(); });
    expect(ctx.container.textContent).toContain('Session #');
    expect(ctx.container.textContent).toContain('Date Played');
  });

  test('shows no-linked-party notice when no party found', async () => {
    // useCampaignContext mock returns no parties by default (context: null)
    await renderWithData([]);
    const btn = Array.from(ctx.container.querySelectorAll('button'))
      .find(b => b.textContent?.includes('New Session'));
    await act(async () => { btn?.click(); });
    expect(ctx.container.textContent).toContain('No linked party found');
  });

  test('fetches sessions on load', async () => {
    await renderWithData([MOCK_LOG]);
    // useCampaignContext is mocked, so only the sessions fetch is real
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
