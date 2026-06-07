import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Response as FetchResponse } from 'node-fetch';

jest.mock('@/lib/components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

jest.mock('@/lib/components/ui', () => ({
  ErrorBanner: ({ message }: { message: string | null }) =>
    message ? React.createElement('div', { role: 'alert' }, message) : null,
  LoadingState: ({ label }: { label: string }) =>
    React.createElement('div', { 'data-testid': 'loading' }, label),
}));

import InvitationsPage from '@/app/invitations/page';

function jsonResponse(body: unknown, status = 200): Response {
  return new FetchResponse(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  }) as unknown as Response;
}

const MOCK_INVITATIONS = [
  {
    id: 'inv-1',
    campaignId: 'camp-1',
    campaignName: 'Dragon Heist',
    invitedBy: 'dungeonmaster',
    invitedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'inv-2',
    campaignId: 'camp-2',
    campaignName: 'Curse of Strahd',
    invitedBy: 'otherDM',
    invitedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
];

let originalFetch: typeof global.fetch;

beforeEach(() => {
  originalFetch = global.fetch;
  jest.useFakeTimers({ advanceTimers: true });
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('InvitationsPage', () => {
  it('renders loading state while fetch is pending', () => {
    global.fetch = jest.fn(() => new Promise(() => {})) as jest.MockedFunction<typeof fetch>;
    render(<InvitationsPage />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('renders error banner when fetch fails', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error'))) as jest.MockedFunction<typeof fetch>;
    render(<InvitationsPage />);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('renders empty state when invitations list is empty', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve(jsonResponse({ invitations: [] }))
    ) as jest.MockedFunction<typeof fetch>;
    render(<InvitationsPage />);
    await waitFor(() => {
      expect(screen.getByText('No pending invitations')).toBeInTheDocument();
    });
  });

  it('renders invite rows with campaign name, invitedBy, relative time', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve(jsonResponse({ invitations: MOCK_INVITATIONS }))
    ) as jest.MockedFunction<typeof fetch>;
    render(<InvitationsPage />);
    await waitFor(() => {
      expect(screen.getByText('Dragon Heist')).toBeInTheDocument();
    });
    expect(screen.getByText('Invited by: dungeonmaster')).toBeInTheDocument();
    expect(screen.getByText(/2 days ago/)).toBeInTheDocument();
    expect(screen.getByText('Curse of Strahd')).toBeInTheDocument();
  });

  it('Accept click calls PATCH with { action: "accept" }, removes invite from list, shows success toast', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime.bind(jest) });
    let fetchCalls = 0;
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      if (init?.method === 'PATCH') return jsonResponse({ status: 'accepted' });
      fetchCalls++;
      return jsonResponse({ invitations: fetchCalls === 1 ? MOCK_INVITATIONS : [] });
    }) as jest.MockedFunction<typeof fetch>;

    render(<InvitationsPage />);
    await waitFor(() => expect(screen.getByText('Dragon Heist')).toBeInTheDocument());

    const acceptButtons = screen.getAllByRole('button', { name: /accept/i });
    await user.click(acceptButtons[0]);

    await waitFor(() => {
      const patchCall = (global.fetch as jest.MockedFunction<typeof fetch>).mock.calls.find(
        ([, init]) => (init as RequestInit)?.method === 'PATCH'
      );
      expect(patchCall).toBeDefined();
      expect(JSON.parse((patchCall![1] as RequestInit).body as string)).toEqual({ action: 'accept' });
    });

    await waitFor(() => expect(screen.queryByText('Dragon Heist')).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Joined "Dragon Heist"!'));
  });

  it('Decline click calls PATCH with { action: "decline" }, removes invite from list, shows success toast', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime.bind(jest) });
    let fetchCalls = 0;
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      if (init?.method === 'PATCH') return jsonResponse({ status: 'declined' });
      fetchCalls++;
      return jsonResponse({ invitations: fetchCalls === 1 ? MOCK_INVITATIONS : [] });
    }) as jest.MockedFunction<typeof fetch>;

    render(<InvitationsPage />);
    await waitFor(() => expect(screen.getByText('Dragon Heist')).toBeInTheDocument());

    const declineButtons = screen.getAllByRole('button', { name: /decline/i });
    await user.click(declineButtons[0]);

    await waitFor(() => {
      const patchCall = (global.fetch as jest.MockedFunction<typeof fetch>).mock.calls.find(
        ([, init]) => (init as RequestInit)?.method === 'PATCH'
      );
      expect(patchCall).toBeDefined();
      expect(JSON.parse((patchCall![1] as RequestInit).body as string)).toEqual({ action: 'decline' });
    });

    await waitFor(() => expect(screen.queryByText('Dragon Heist')).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Declined "Dragon Heist"'));
  });

  it('Accept failure renders error banner and keeps invite in list', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime.bind(jest) });
    global.fetch = jest.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'PATCH') return jsonResponse({ error: 'Failed' }, 500);
      return jsonResponse({ invitations: MOCK_INVITATIONS });
    }) as jest.MockedFunction<typeof fetch>;

    render(<InvitationsPage />);
    await waitFor(() => expect(screen.getByText('Dragon Heist')).toBeInTheDocument());

    const acceptButtons = screen.getAllByRole('button', { name: /accept/i });
    await user.click(acceptButtons[0]);

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByText('Dragon Heist')).toBeInTheDocument();
  });

  it('Decline failure renders error banner and keeps invite in list', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime.bind(jest) });
    global.fetch = jest.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'PATCH') return jsonResponse({ error: 'Failed' }, 500);
      return jsonResponse({ invitations: MOCK_INVITATIONS });
    }) as jest.MockedFunction<typeof fetch>;

    render(<InvitationsPage />);
    await waitFor(() => expect(screen.getByText('Dragon Heist')).toBeInTheDocument());

    const declineButtons = screen.getAllByRole('button', { name: /decline/i });
    await user.click(declineButtons[0]);

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByText('Dragon Heist')).toBeInTheDocument();
  });
});
