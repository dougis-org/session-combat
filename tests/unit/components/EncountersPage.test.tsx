import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Response as FetchResponse } from 'node-fetch';
import { EncountersContent } from '@/app/encounters/page';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [k: string]: unknown }) =>
    React.createElement('a', { href, ...rest }, children),
}));

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    user: { userId: 'user-1' },
    isAuthenticated: true,
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    error: null,
  })),
}));

jest.mock('@/lib/components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

jest.mock('@/app/encounters/EncounterEditor', () => ({
  EncounterEditor: () => null,
}));

function jsonResponse(body: unknown, status = 200): Response {
  return new FetchResponse(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  }) as unknown as Response;
}

const MOCK_ENCOUNTER = {
  id: 'enc-1',
  userId: 'user-1',
  name: 'Goblin Ambush',
  description: 'Roadside attack',
  monsters: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const MOCK_ENCOUNTER_2 = {
  id: 'enc-2',
  userId: 'user-1',
  name: 'Dragon Lair',
  description: 'A dangerous lair',
  monsters: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

let originalFetch: typeof global.fetch;

beforeEach(() => {
  originalFetch = global.fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

function setupFetch(encounters: unknown[] = []): jest.MockedFunction<typeof fetch> {
  const mockFetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = input.toString();
    if (url === '/api/encounters') return jsonResponse(encounters);
    return jsonResponse({ error: 'not found' }, 404);
  }) as typeof fetch;
  global.fetch = mockFetch;
  return mockFetch as jest.MockedFunction<typeof fetch>;
}

describe('EncountersContent — list rendering', () => {
  it('renders encounter names after successful fetch', async () => {
    setupFetch([MOCK_ENCOUNTER, MOCK_ENCOUNTER_2]);
    render(<EncountersContent />);
    expect(await screen.findByText('Goblin Ambush')).toBeInTheDocument();
    expect(screen.getByText('Dragon Lair')).toBeInTheDocument();
  });

  it('shows empty state message when fetch returns []', async () => {
    setupFetch([]);
    render(<EncountersContent />);
    expect(await screen.findByText(/no encounters yet/i)).toBeInTheDocument();
  });

  it('renders "Add New Encounter" button after fetch resolves', async () => {
    setupFetch([]);
    render(<EncountersContent />);
    await screen.findByText(/no encounters yet/i);
    expect(screen.getByRole('button', { name: /add new encounter/i })).toBeInTheDocument();
  });

  it('handles non-OK fetch response gracefully', async () => {
    global.fetch = jest.fn(async () => jsonResponse({ error: 'Server error' }, 500)) as typeof fetch;
    render(<EncountersContent />);
    expect(await screen.findByText(/failed to fetch encounters/i)).toBeInTheDocument();
  });

  it('handles fetch throw gracefully', async () => {
    global.fetch = jest.fn(async () => { throw new Error('Network failure'); }) as typeof fetch;
    render(<EncountersContent />);
    expect(await screen.findByText(/network failure/i)).toBeInTheDocument();
  });
});

describe('EncountersContent — delete flow', () => {
  it('sends DELETE request when confirm returns true', async () => {
    const user = userEvent.setup();
    const mockFetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      if (url === '/api/encounters' && !init?.method) return jsonResponse([MOCK_ENCOUNTER]);
      if (url === `/api/encounters/${MOCK_ENCOUNTER.id}` && init?.method === 'DELETE')
        return jsonResponse({});
      return jsonResponse({ error: 'not found' }, 404);
    }) as typeof fetch;
    global.fetch = mockFetch;

    jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(<EncountersContent />);
    await screen.findByText('Goblin Ambush');

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      const calls = (mockFetch as jest.MockedFunction<typeof fetch>).mock.calls;
      const deleteCall = calls.find(
        ([url, init]) =>
          url.toString() === `/api/encounters/${MOCK_ENCOUNTER.id}` &&
          (init as RequestInit)?.method === 'DELETE'
      );
      expect(deleteCall).toBeTruthy();
    });
  });

  it('re-fetches encounter list after DELETE', async () => {
    const user = userEvent.setup();
    let getCallCount = 0;
    const mockFetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      if (url === '/api/encounters' && !init?.method) {
        getCallCount += 1;
        return jsonResponse([MOCK_ENCOUNTER]);
      }
      if (url === `/api/encounters/${MOCK_ENCOUNTER.id}` && init?.method === 'DELETE')
        return jsonResponse({});
      return jsonResponse({ error: 'not found' }, 404);
    }) as typeof fetch;
    global.fetch = mockFetch;

    jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(<EncountersContent />);
    await screen.findByText('Goblin Ambush');

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    await waitFor(() => expect(getCallCount).toBeGreaterThanOrEqual(2));
  });

  it('does not send DELETE request when confirm returns false', async () => {
    const user = userEvent.setup();
    const mockFetch = setupFetch([MOCK_ENCOUNTER]);

    jest.spyOn(window, 'confirm').mockReturnValue(false);

    render(<EncountersContent />);
    await screen.findByText('Goblin Ambush');

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    const calls = mockFetch.mock.calls;
    const deleteCall = calls.find(
      ([, init]) => (init as RequestInit)?.method === 'DELETE'
    );
    expect(deleteCall).toBeUndefined();
  });
});
