/**
 * @jest-environment jsdom
 */
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [k: string]: unknown }) =>
    React.createElement('a', { href, ...rest }, children),
}));

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

import React from 'react';
import { Root } from 'react-dom/client';
import { act } from 'react';
import { createReactRoot, unmountReactRoot } from '@/tests/unit/helpers/reactRoot';
import { NavBar } from '@/lib/components/NavBar';
import { useAuth } from '@/lib/hooks/useAuth';

const mockedUseAuth = jest.mocked(useAuth);

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  ({ container, root } = createReactRoot());
});

afterEach(() => {
  unmountReactRoot(container, root);
});

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>>) {
  mockedUseAuth.mockReturnValue({
    isAuthenticated: false, loading: false, logout: jest.fn() as any,
    user: null, login: jest.fn() as any, register: jest.fn() as any, error: null,
    ...overrides,
  });
}

describe('NavBar', () => {
  it('renders navigation links', () => {
    mockAuth({});
    act(() => { root.render(<NavBar />); });
    const hrefs = Array.from(container.querySelectorAll('a')).map(a => a.getAttribute('href'));
    expect(hrefs).toContain('/campaigns');
    expect(hrefs).toContain('/encounters');
    expect(hrefs).toContain('/parties');
    expect(hrefs).toContain('/characters');
  });

  it('does not show logout button when not authenticated', () => {
    mockAuth({});
    act(() => { root.render(<NavBar />); });
    expect(container.querySelector('[data-testid="logout-button"]')).toBeNull();
  });

  it('does not show logout button while loading', () => {
    mockAuth({ isAuthenticated: true, loading: true });
    act(() => { root.render(<NavBar />); });
    expect(container.querySelector('[data-testid="logout-button"]')).toBeNull();
  });

  it('shows logout button when authenticated and not loading', () => {
    mockAuth({ isAuthenticated: true, user: { userId: 'u1', email: 'u@test.com' } });
    act(() => { root.render(<NavBar />); });
    expect(container.querySelector('[data-testid="logout-button"]')).not.toBeNull();
  });

  it('calls logout when logout button clicked', () => {
    const logout = jest.fn() as any;
    mockAuth({ isAuthenticated: true, user: { userId: 'u1', email: 'u@test.com' }, logout });
    act(() => { root.render(<NavBar />); });
    act(() => { (container.querySelector('[data-testid="logout-button"]') as HTMLButtonElement).click(); });
    expect(logout).toHaveBeenCalledTimes(1);
  });
});
