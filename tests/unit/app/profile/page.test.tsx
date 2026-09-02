jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/preferences/usePreferences', () => ({
  usePreferences: jest.fn(),
}));

// We must mock ProtectedRoute if it does complex things, but usually it just returns children when authenticated.
jest.mock('@/lib/components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => {
    const { useAuth } = require('@/lib/hooks/useAuth');
    const { isAuthenticated, loading } = useAuth();
    if (loading || !isAuthenticated) return null;
    return <>{children}</>;
  }
}));

jest.mock('@/lib/components/NavBar', () => ({
  NavBar: () => <div data-testid="navbar">Mock NavBar</div>
}));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfilePage from '@/app/profile/page';
import { useAuth } from '@/lib/hooks/useAuth';
import { usePreferences } from '@/lib/preferences/usePreferences';
import { DEFAULT_PREFERENCES } from '@/lib/preferences/schema';

const mockedUseAuth = jest.mocked(useAuth);
const mockedUsePreferences = jest.mocked(usePreferences);

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>>) {
  mockedUseAuth.mockReturnValue({
    isAuthenticated: true,
    loading: false,
    logout: jest.fn() as never,
    user: { userId: 'u1', email: 'u@test.com', username: 'douglas' },
    login: jest.fn() as never,
    register: jest.fn() as never,
    error: null,
    ...overrides,
  });
}

function mockPreferences(overrides: any = {}) {
  mockedUsePreferences.mockReturnValue({
    preferences: {
      ...DEFAULT_PREFERENCES,
      ...overrides.preferences,
    },
    setPreference: jest.fn(),
    ready: true,
    ...overrides,
  });
}

describe('ProfilePage', () => {
  beforeEach(() => {
    mockAuth({});
    mockPreferences({});
  });

  it('renders without crashing for authenticated user', () => {
    render(<ProfilePage />);
    expect(screen.getByRole('heading', { name: 'Profile & Settings' })).toBeInTheDocument();
  });

  it('redirects unauthenticated user via ProtectedRoute', () => {
    mockAuth({ isAuthenticated: false, loading: false });
    render(<ProfilePage />);
    expect(screen.queryByRole('heading', { name: 'Profile & Settings' })).not.toBeInTheDocument();
  });

  it('binds input changes to setPreference', async () => {
    const user = userEvent.setup();
    const setPreference = jest.fn();
    mockPreferences({ setPreference });

    render(<ProfilePage />);

    const sendToChatCheckbox = screen.getByLabelText(/Auto-send rolls to session chat/i);
    await user.click(sendToChatCheckbox);

    expect(setPreference).toHaveBeenCalledWith('dice.sendToChat', true);
  });
});
