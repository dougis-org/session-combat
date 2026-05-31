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

const defaultAuth: ReturnType<typeof useAuth> = {
  isAuthenticated: false,
  loading: false,
  register: jest.fn().mockResolvedValue(true),
  login: jest.fn() as any,
  logout: jest.fn() as any,
  user: null,
  error: null,
};

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  mockedUseAuth.mockReturnValue({ ...defaultAuth, ...overrides });
}

async function renderAndSubmit(fields: {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}) {
  render(<RegisterPage />);
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

async function expectFormError(pattern: RegExp) {
  await waitFor(() => expect(document.body.textContent).toMatch(pattern));
}

describe('RegisterPage — username validation', () => {
  beforeEach(() => { mockAuth(); });

  it('blocks submission when username is too short (< 4 chars)', async () => {
    const register = jest.fn();
    mockAuth({ register });
    await renderAndSubmit({ username: 'ab', email: 'user@example.com', password: 'ValidPass1!', confirmPassword: 'ValidPass1!' });
    await expectFormError(/username/i);
    expect(register).not.toHaveBeenCalled();
  });

  it('blocks submission when username is a reserved word', async () => {
    const register = jest.fn();
    mockAuth({ register });
    await renderAndSubmit({ username: 'admin', email: 'user@example.com', password: 'ValidPass1!', confirmPassword: 'ValidPass1!' });
    await expectFormError(/username/i);
    expect(register).not.toHaveBeenCalled();
  });

  it('calls register with a valid username', async () => {
    const register = jest.fn().mockResolvedValue(true);
    mockAuth({ register });
    await renderAndSubmit({ username: 'validuser', email: 'user@example.com', password: 'ValidPass1!', confirmPassword: 'ValidPass1!' });
    await waitFor(() => expect(register).toHaveBeenCalledWith('user@example.com', 'ValidPass1!', 'validuser'));
  });

  it('blocks submission when email is missing', async () => {
    await renderAndSubmit({ username: 'validuser', password: 'ValidPass1!', confirmPassword: 'ValidPass1!' });
    await expectFormError(/email.*required/i);
  });

  it('blocks submission when email format is invalid', async () => {
    await renderAndSubmit({ username: 'validuser', email: 'notanemail', password: 'ValidPass1!', confirmPassword: 'ValidPass1!' });
    await expectFormError(/valid email/i);
  });

  it('blocks submission when passwords do not match', async () => {
    await renderAndSubmit({ username: 'validuser', email: 'user@example.com', password: 'ValidPass1!', confirmPassword: 'Different1!' });
    await expectFormError(/passwords do not match/i);
  });
});
