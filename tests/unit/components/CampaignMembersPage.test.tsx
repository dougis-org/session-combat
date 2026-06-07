import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Response as FetchResponse } from 'node-fetch';

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
  textInputClass: () => '',
}));

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

import { useAuth } from '@/lib/hooks/useAuth';
import CampaignMembersPage from '@/app/campaigns/[id]/page';

const mockedUseAuth = jest.mocked(useAuth);

const DM_USER_ID = 'dm-user-id';
const PLAYER_USER_ID = 'player-user-id';

function jsonResponse(body: unknown, status = 200): Response {
  return new FetchResponse(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  }) as unknown as Response;
}

const MOCK_CAMPAIGN = { id: 'camp-1', name: 'Dragon Heist' };

const DM_MEMBER = { id: 'mem-dm', userId: DM_USER_ID, username: 'dmuser', role: 'dm', status: 'active' };
const PLAYER_MEMBER = { id: 'mem-p1', userId: PLAYER_USER_ID, username: 'alice', role: 'player', status: 'active' };
const INVITED_MEMBER = { id: 'mem-p2', userId: 'invited-id', username: 'bob', role: 'player', status: 'invited' };

function mockDmAuth() {
  mockedUseAuth.mockReturnValue({
    user: { userId: DM_USER_ID, email: 'dm@test.com' },
    loading: false,
    error: null,
    login: jest.fn(),
    logout: jest.fn(),
  } as any);
}

function mockPlayerAuth() {
  mockedUseAuth.mockReturnValue({
    user: { userId: PLAYER_USER_ID, email: 'player@test.com' },
    loading: false,
    error: null,
    login: jest.fn(),
    logout: jest.fn(),
  } as any);
}

function setupFetch(members = [DM_MEMBER, PLAYER_MEMBER]) {
  let callCount = 0;
  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = input.toString();
    callCount++;
    if (url.includes('/api/campaigns/camp-1/members')) {
      if (url.includes('/api/campaigns/camp-1/members/')) {
        return jsonResponse({ status: 'removed' });
      }
      return jsonResponse({ members });
    }
    if (url.includes('/api/campaigns/camp-1') && !url.includes('members')) {
      return jsonResponse(MOCK_CAMPAIGN);
    }
    if (url.includes('/api/users/search')) {
      return jsonResponse({ results: [{ id: 'new-user-id', username: 'charlie' }] });
    }
    return jsonResponse({}, 404);
  }) as jest.MockedFunction<typeof fetch>;
}

let originalFetch: typeof global.fetch;
let originalConfirm: typeof global.confirm;

beforeEach(() => {
  originalFetch = global.fetch;
  originalConfirm = global.confirm;
  global.confirm = jest.fn(() => true);
  jest.clearAllMocks();
});

afterEach(() => {
  global.fetch = originalFetch;
  global.confirm = originalConfirm;
});

describe('CampaignMembersPage', () => {
  describe('member list rendering', () => {
    it('renders member list with role and status badges', async () => {
      mockDmAuth();
      setupFetch([DM_MEMBER, PLAYER_MEMBER]);
      render(React.createElement(CampaignMembersPage));
      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument();
        expect(screen.getByText('dmuser')).toBeInTheDocument();
      });
      expect(screen.getByText('DM')).toBeInTheDocument();
      expect(screen.getByText('Player')).toBeInTheDocument();
      expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
    });

    it('shows Invited badge for invited member', async () => {
      mockDmAuth();
      setupFetch([DM_MEMBER, INVITED_MEMBER]);
      render(React.createElement(CampaignMembersPage));
      await waitFor(() => {
        expect(screen.getByText('bob')).toBeInTheDocument();
      });
      expect(screen.getByText('Invited')).toBeInTheDocument();
    });
  });

  describe('DM controls', () => {
    it('DM sees invite section', async () => {
      mockDmAuth();
      setupFetch();
      render(React.createElement(CampaignMembersPage));
      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument();
      });
      expect(screen.getByPlaceholderText(/search username/i)).toBeInTheDocument();
    });

    it('non-DM does not see invite section', async () => {
      mockPlayerAuth();
      setupFetch([DM_MEMBER, PLAYER_MEMBER]);
      render(React.createElement(CampaignMembersPage));
      await waitFor(() => {
        expect(screen.getByText('dmuser')).toBeInTheDocument();
      });
      expect(screen.queryByPlaceholderText(/search username/i)).not.toBeInTheDocument();
    });

    it('DM does not see Remove button on own row', async () => {
      mockDmAuth();
      setupFetch([DM_MEMBER, PLAYER_MEMBER]);
      render(React.createElement(CampaignMembersPage));
      await waitFor(() => {
        expect(screen.getByText('dmuser')).toBeInTheDocument();
      });
      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      expect(removeButtons).toHaveLength(1);
    });

    it('DM sees Remove button on other active members', async () => {
      mockDmAuth();
      setupFetch([DM_MEMBER, PLAYER_MEMBER]);
      render(React.createElement(CampaignMembersPage));
      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument();
      });
      expect(screen.getAllByRole('button', { name: /remove/i })).toHaveLength(1);
    });
  });

  describe('invite flow', () => {
    it('search results appear after typing', async () => {
      mockDmAuth();
      setupFetch();
      const user = userEvent.setup({ delay: null });
      render(React.createElement(CampaignMembersPage));
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search username/i)).toBeInTheDocument();
      });
      await user.type(screen.getByPlaceholderText(/search username/i), 'ch');
      await waitFor(() => {
        expect(screen.getByText('charlie')).toBeInTheDocument();
      });
    });

    it('empty search makes no API call to users/search', async () => {
      mockDmAuth();
      const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
        const url = input.toString();
        if (url.includes('/api/campaigns/camp-1/members')) return jsonResponse({ members: [DM_MEMBER] });
        if (url.includes('/api/campaigns/camp-1')) return jsonResponse(MOCK_CAMPAIGN);
        return jsonResponse({}, 404);
      }) as jest.MockedFunction<typeof fetch>;
      global.fetch = fetchMock;
      render(React.createElement(CampaignMembersPage));
      await waitFor(() => {
        expect(screen.getByText('dmuser')).toBeInTheDocument();
      });
      const callsBefore = fetchMock.mock.calls.length;
      expect(fetchMock.mock.calls.filter(c => c[0].toString().includes('users/search'))).toHaveLength(0);
      expect(callsBefore).toBeGreaterThanOrEqual(2);
    });

    it('clicking Invite calls POST and refreshes list', async () => {
      mockDmAuth();
      let memberListCallCount = 0;
      global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = input.toString();
        if (url.includes('/api/users/search')) return jsonResponse({ results: [{ id: 'new-id', username: 'charlie' }] });
        if (url.includes('/api/campaigns/camp-1/members') && init?.method === 'POST') return jsonResponse({ id: 'new-mem', status: 'invited' }, 201);
        if (url.includes('/api/campaigns/camp-1/members')) { memberListCallCount++; return jsonResponse({ members: [DM_MEMBER] }); }
        if (url.includes('/api/campaigns/camp-1')) return jsonResponse(MOCK_CAMPAIGN);
        return jsonResponse({}, 404);
      }) as jest.MockedFunction<typeof fetch>;

      const user = userEvent.setup({ delay: null });
      render(React.createElement(CampaignMembersPage));
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search username/i)).toBeInTheDocument();
      });
      await user.type(screen.getByPlaceholderText(/search username/i), 'ch');
      await waitFor(() => {
        expect(screen.getByText('charlie')).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /invite/i }));
      await waitFor(() => {
        expect(memberListCallCount).toBeGreaterThan(1);
      });
    });

    it('409 from invite shows inline error', async () => {
      mockDmAuth();
      global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = input.toString();
        if (url.includes('/api/users/search')) return jsonResponse({ results: [{ id: 'existing-id', username: 'alice' }] });
        if (url.includes('/api/campaigns/camp-1/members') && init?.method === 'POST') return jsonResponse({ error: 'Member already exists' }, 409);
        if (url.includes('/api/campaigns/camp-1/members')) return jsonResponse({ members: [DM_MEMBER] });
        if (url.includes('/api/campaigns/camp-1')) return jsonResponse(MOCK_CAMPAIGN);
        return jsonResponse({}, 404);
      }) as jest.MockedFunction<typeof fetch>;

      const user = userEvent.setup({ delay: null });
      render(React.createElement(CampaignMembersPage));
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search username/i)).toBeInTheDocument();
      });
      await user.type(screen.getByPlaceholderText(/search username/i), 'ali');
      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /invite/i }));
      await waitFor(() => {
        expect(screen.getByText(/already|exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('remove flow', () => {
    it('clicking Remove calls DELETE and refreshes list', async () => {
      mockDmAuth();
      let memberListCallCount = 0;
      global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = input.toString();
        if (init?.method === 'DELETE') return jsonResponse({ status: 'removed' });
        if (url.includes('/api/campaigns/camp-1/members')) { memberListCallCount++; return jsonResponse({ members: [DM_MEMBER, PLAYER_MEMBER] }); }
        if (url.includes('/api/campaigns/camp-1')) return jsonResponse(MOCK_CAMPAIGN);
        return jsonResponse({}, 404);
      }) as jest.MockedFunction<typeof fetch>;

      const user = userEvent.setup({ delay: null });
      render(React.createElement(CampaignMembersPage));
      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /remove/i })).toHaveLength(1);
      });
      const callsBefore = memberListCallCount;
      await user.click(screen.getAllByRole('button', { name: /remove/i })[0]);
      await waitFor(() => {
        expect(memberListCallCount).toBeGreaterThan(callsBefore);
      });
    });
  });
});
