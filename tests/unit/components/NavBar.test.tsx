jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [k: string]: unknown }) =>
    React.createElement('a', { href, ...rest }, children),
}));

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
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
    const logout = jest.fn() as any;
    mockAuth({ isAuthenticated: true, user: { userId: 'u1', email: 'u@test.com' }, logout });
    render(<NavBar />);
    await userEvent.click(screen.getByTestId('logout-button'));
    expect(logout).toHaveBeenCalledTimes(1);
  });
});
