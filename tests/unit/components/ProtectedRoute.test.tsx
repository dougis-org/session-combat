jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';

const mockedUseAuth = jest.mocked(useAuth);
const mockedUseRouter = jest.mocked(useRouter);

const defaultAuth: ReturnType<typeof useAuth> = {
  isAuthenticated: false,
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  user: null,
  error: null,
};

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  mockedUseAuth.mockReturnValue({ ...defaultAuth, ...overrides });
}

function mockRouter() {
  const push = jest.fn();
  mockedUseRouter.mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  return push;
}

describe('ProtectedRoute', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading spinner when loading is true', () => {
    mockAuth({ loading: true });
    render(
      <ProtectedRoute>
        <div data-testid="child">Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });

  it('redirects to /login and returns null when not authenticated and not loading', () => {
    const pushMock = mockRouter();
    mockAuth({ isAuthenticated: false, loading: false });

    const { container } = render(
      <ProtectedRoute>
        <div data-testid="child">Protected Content</div>
      </ProtectedRoute>
    );

    expect(pushMock).toHaveBeenCalledWith('/login');
    expect(container.firstChild).toBeNull();
  });

  it('renders children when authenticated, not loading, and no error', () => {
    mockAuth({ isAuthenticated: true, loading: false });

    render(
      <ProtectedRoute>
        <div data-testid="child">Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId('child')).toHaveTextContent('Protected Content');
  });

  it('renders error page when error is present and authenticated', () => {
    const pushMock = mockRouter();
    mockAuth({ isAuthenticated: true, loading: false, error: 'Failed to fetch session' });

    render(
      <ProtectedRoute>
        <div data-testid="child">Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Authentication Error')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch session')).toBeInTheDocument();
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();

    const button = screen.getByRole('button', { name: /go to login/i });
    fireEvent.click(button);
    expect(pushMock).toHaveBeenCalledWith('/login');
  });
});
