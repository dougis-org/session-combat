/**
 * @jest-environment jsdom
 */

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ replace: jest.fn() })),
  usePathname: jest.fn(() => '/register'),
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
import RegisterPage from '@/app/register/page';
import { useAuth } from '@/lib/hooks/useAuth';

const mockedUseAuth = jest.mocked(useAuth);

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  mockedUseAuth.mockReturnValue({
    isAuthenticated: false,
    loading: false,
    register: jest.fn().mockResolvedValue(true),
    login: jest.fn() as any,
    logout: jest.fn() as any,
    user: null,
    error: null,
    ...overrides,
  });
}

async function fillAndSubmit(fields: {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}) {
  if (fields.username !== undefined) {
    await userEvent.type(screen.getByLabelText(/username/i), fields.username);
  }
  if (fields.email !== undefined) {
    await userEvent.type(screen.getByLabelText(/email address/i), fields.email);
  }
  if (fields.password !== undefined) {
    await userEvent.type(screen.getByLabelText(/^password$/i), fields.password);
  }
  if (fields.confirmPassword !== undefined) {
    await userEvent.type(screen.getByLabelText(/confirm password/i), fields.confirmPassword);
  }
  fireEvent.submit(document.querySelector('form')!);
}

describe('RegisterPage — username validation', () => {
  beforeEach(() => { mockAuth(); });

  it('shows error when username is too short (< 4 chars)', async () => {
    render(<RegisterPage />);
    await fillAndSubmit({ username: 'ab', email: 'user@example.com', password: 'ValidPass1!', confirmPassword: 'ValidPass1!' });
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/username/i);
    });
    expect(mockedUseAuth().register).not.toHaveBeenCalled();
  });

  it('shows error when username is a reserved word (admin)', async () => {
    render(<RegisterPage />);
    await fillAndSubmit({ username: 'admin', email: 'user@example.com', password: 'ValidPass1!', confirmPassword: 'ValidPass1!' });
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/username/i);
    });
    expect(mockedUseAuth().register).not.toHaveBeenCalled();
  });

  it('calls register with valid username', async () => {
    const register = jest.fn().mockResolvedValue(true);
    mockAuth({ register });
    render(<RegisterPage />);
    await fillAndSubmit({ username: 'validuser', email: 'user@example.com', password: 'ValidPass1!', confirmPassword: 'ValidPass1!' });
    await waitFor(() => {
      expect(register).toHaveBeenCalledWith('user@example.com', 'ValidPass1!', 'validuser');
    });
  });

  it('shows error for missing email', async () => {
    render(<RegisterPage />);
    await fillAndSubmit({ username: 'validuser', password: 'ValidPass1!', confirmPassword: 'ValidPass1!' });
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/email.*required/i);
    });
  });

  it('shows error for invalid email format', async () => {
    render(<RegisterPage />);
    await fillAndSubmit({ username: 'validuser', email: 'notanemail', password: 'ValidPass1!', confirmPassword: 'ValidPass1!' });
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/valid email/i);
    });
  });

  it('shows error when passwords do not match', async () => {
    render(<RegisterPage />);
    await fillAndSubmit({ username: 'validuser', email: 'user@example.com', password: 'ValidPass1!', confirmPassword: 'Different1!' });
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/passwords do not match/i);
    });
  });
});
