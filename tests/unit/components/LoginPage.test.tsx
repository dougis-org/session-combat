jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ replace: jest.fn() })),
  usePathname: jest.fn(() => '/login'),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [k: string]: unknown }) =>
    React.createElement('a', { href, ...rest }, children),
}));

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import LoginPage from '@/app/login/page';
import { useAuth } from '@/lib/hooks/useAuth';

const mockedUseAuth = jest.mocked(useAuth);
const mockedUseRouter = jest.mocked(useRouter);

const defaultAuth: ReturnType<typeof useAuth> = {
  isAuthenticated: false,
  loading: false,
  login: jest.fn().mockResolvedValue(true),
  logout: jest.fn<Promise<void>, []>(),
  register: jest.fn<Promise<boolean>, [string, string, string]>(),
  user: null,
  error: null,
};

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  mockedUseAuth.mockReturnValue({ ...defaultAuth, ...overrides });
}

function mockRouter() {
  const replace = jest.fn();
  mockedUseRouter.mockReturnValue({ replace } as unknown as ReturnType<typeof useRouter>);
  return replace;
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('LoginPage — rendering', () => {
  beforeEach(() => {
    mockAuth();
    mockRouter();
  });

  it('renders an email input', () => {
    render(<LoginPage />);
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
  });

  it('renders a password input', () => {
    render(<LoginPage />);
    expect(document.querySelector('input[type="password"]')).toBeInTheDocument();
  });

  it('renders a submit button', () => {
    render(<LoginPage />);
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });
});

describe('LoginPage — client-side validation', () => {
  beforeEach(() => {
    mockAuth();
    mockRouter();
  });

  it('blocks submit and shows "Email is required" when email is empty', async () => {
    const login = jest.fn();
    mockAuth({ login });
    render(<LoginPage />);
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => expect(screen.getByText('Email is required')).toBeInTheDocument());
    expect(login).not.toHaveBeenCalled();
  });

  it('blocks submit and shows "Password is required" when password is empty', async () => {
    const user = userEvent.setup();
    const login = jest.fn();
    mockAuth({ login });
    render(<LoginPage />);
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com');
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => expect(screen.getByText('Password is required')).toBeInTheDocument());
    expect(login).not.toHaveBeenCalled();
  });

  it('blocks submit and shows "valid email" error when email format is invalid', async () => {
    const user = userEvent.setup();
    const login = jest.fn();
    mockAuth({ login });
    render(<LoginPage />);
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'notanemail');
    await user.type(document.querySelector('input[type="password"]')!, 'somepassword');
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() =>
      expect(screen.getByText(/valid email/i)).toBeInTheDocument()
    );
    expect(login).not.toHaveBeenCalled();
  });
});

describe('LoginPage — submit behavior', () => {
  it('calls login(email, password) on valid submit', async () => {
    const user = userEvent.setup();
    const login = jest.fn().mockResolvedValue(true);
    mockAuth({ login });
    mockRouter();
    render(<LoginPage />);
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com');
    await user.type(document.querySelector('input[type="password"]')!, 'password123');
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => expect(login).toHaveBeenCalledWith('test@example.com', 'password123'));
    expect(login).toHaveBeenCalledTimes(1);
  });

  it('calls router.replace("/campaigns") on successful login', async () => {
    const user = userEvent.setup();
    const login = jest.fn().mockResolvedValue(true);
    const replace = mockRouter();
    mockAuth({ login });
    render(<LoginPage />);
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com');
    await user.type(document.querySelector('input[type="password"]')!, 'password123');
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/campaigns'));
  });

  it('shows useAuth error string on failed login', async () => {
    const user = userEvent.setup();
    const login = jest.fn().mockResolvedValue(false);
    mockAuth({ login, error: 'Invalid credentials' });
    mockRouter();
    render(<LoginPage />);
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com');
    await user.type(document.querySelector('input[type="password"]')!, 'wrongpassword');
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => expect(screen.getByText('Invalid credentials')).toBeInTheDocument());
  });
});

describe('LoginPage — authenticated redirect', () => {
  it('calls router.replace("/campaigns") on mount when isAuthenticated is true', async () => {
    const replace = mockRouter();
    mockAuth({ isAuthenticated: true });
    render(<LoginPage />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/campaigns'));
  });
});
