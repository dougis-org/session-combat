import { Response as FetchResponse } from 'node-fetch';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [k: string]: unknown }) =>
    React.createElement('a', { href, ...rest }, children),
}));

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NavBar } from '@/lib/components/NavBar';
import { useAuth } from '@/lib/hooks/useAuth';

const mockedUseAuth = jest.mocked(useAuth);

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>>) {
  mockedUseAuth.mockReturnValue({
    isAuthenticated: false, loading: false, logout: jest.fn() as any,
    user: null, login: jest.fn() as any, register: jest.fn() as any, error: null,
    ...overrides,
  });
}

describe('NavBar', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = jest.fn(() =>
      Promise.resolve(new FetchResponse(JSON.stringify({ invitations: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }) as unknown as Response)
    ) as unknown as jest.MockedFunction<typeof fetch>;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('renders all navigation links with correct hrefs', () => {
    mockAuth({});
    render(<NavBar />);
    expect(screen.getByRole('link', { name: 'Campaigns' })).toHaveAttribute('href', '/campaigns');
    expect(screen.getByRole('link', { name: 'Encounters' })).toHaveAttribute('href', '/encounters');
    expect(screen.getByRole('link', { name: 'Parties' })).toHaveAttribute('href', '/parties');
    expect(screen.getByRole('link', { name: 'Characters' })).toHaveAttribute('href', '/characters');
    expect(screen.getByRole('link', { name: 'Monsters' })).toHaveAttribute('href', '/monsters');
    expect(screen.getByRole('link', { name: 'Combat' })).toHaveAttribute('href', '/combat');
  });

  it('does not show logout button when not authenticated', () => {
    mockAuth({});
    render(<NavBar />);
    expect(screen.queryByTestId('logout-button')).not.toBeInTheDocument();
  });

  it('does not show logout button while loading', () => {
    mockAuth({ isAuthenticated: true, loading: true });
    render(<NavBar />);
    expect(screen.queryByTestId('logout-button')).not.toBeInTheDocument();
  });

  it('shows logout button when authenticated and not loading', () => {
    mockAuth({ isAuthenticated: true, user: { userId: 'u1', email: 'u@test.com' } });
    render(<NavBar />);
    expect(screen.getByTestId('logout-button')).toBeInTheDocument();
  });

  it('calls logout when logout button clicked', async () => {
    const user = userEvent.setup();
    const logout = jest.fn() as any;
    mockAuth({ isAuthenticated: true, user: { userId: 'u1', email: 'u@test.com' }, logout });
    render(<NavBar />);
    await user.click(screen.getByTestId('logout-button'));
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('shows feedback button when authenticated and not loading', () => {
    mockAuth({ isAuthenticated: true, user: { userId: 'u1', email: 'u@test.com' } });
    render(<NavBar />);
    expect(screen.getByTestId('feedback-button')).toBeInTheDocument();
  });

  it('does not show feedback button when not authenticated', () => {
    mockAuth({ isAuthenticated: false, loading: false });
    render(<NavBar />);
    expect(screen.queryByTestId('feedback-button')).not.toBeInTheDocument();
  });

  it('does not show feedback button while loading', () => {
    mockAuth({ isAuthenticated: true, loading: true });
    render(<NavBar />);
    expect(screen.queryByTestId('feedback-button')).not.toBeInTheDocument();
  });

  it('clicking feedback button opens FeedbackModal', async () => {
    const user = userEvent.setup();
    mockAuth({ isAuthenticated: true, user: { userId: 'u1', email: 'u@test.com' } });
    render(<NavBar />);
    await user.click(screen.getByTestId('feedback-button'));
    expect(screen.getByText('Send Feedback')).toBeInTheDocument();
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new FetchResponse(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  }) as unknown as Response;
}

describe('NavBar — invitations badge', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('renders "Invitations (2)" link when fetch returns 2 invitations', async () => {
    mockAuth({ isAuthenticated: true, loading: false, user: { userId: 'u1', email: 'u@test.com' } });
    global.fetch = jest.fn(() =>
      Promise.resolve(jsonResponse({ invitations: [{ id: '1' }, { id: '2' }] }))
    ) as unknown as jest.MockedFunction<typeof fetch>;
    render(<NavBar />);
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Invitations (2)' })).toHaveAttribute('href', '/invitations');
    });
  });

  it('does not render invitations link when fetch returns empty list', async () => {
    mockAuth({ isAuthenticated: true, loading: false, user: { userId: 'u1', email: 'u@test.com' } });
    global.fetch = jest.fn(() =>
      Promise.resolve(jsonResponse({ invitations: [] }))
    ) as unknown as jest.MockedFunction<typeof fetch>;
    render(<NavBar />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(screen.queryByRole('link', { name: /invitations/i })).not.toBeInTheDocument();
  });

  it('does not render invitations link when unauthenticated', () => {
    mockAuth({ isAuthenticated: false, loading: false });
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
    render(<NavBar />);
    expect(screen.queryByRole('link', { name: /invitations/i })).not.toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('does not render invitations link when fetch throws error', async () => {
    mockAuth({ isAuthenticated: true, loading: false, user: { userId: 'u1', email: 'u@test.com' } });
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error'))) as unknown as jest.MockedFunction<typeof fetch>;
    render(<NavBar />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(screen.queryByRole('link', { name: /invitations/i })).not.toBeInTheDocument();
  });
});
