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
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';
import { NavBar } from '@/lib/components/NavBar';
import { useAuth } from '@/lib/hooks/useAuth';

const mockedUseAuth = jest.mocked(useAuth);

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  act(() => { root?.unmount(); });
  container.remove();
});

function render() {
  act(() => {
    root = createRoot(container);
    root.render(<NavBar />);
  });
}

describe('NavBar', () => {
  it('renders navigation links', () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: false, loading: false, logout: jest.fn() as any, user: null, login: jest.fn() as any, register: jest.fn() as any, error: null });
    render();
    const links = container.querySelectorAll('a');
    const hrefs = Array.from(links).map(a => a.getAttribute('href'));
    expect(hrefs).toContain('/campaigns');
    expect(hrefs).toContain('/encounters');
    expect(hrefs).toContain('/parties');
    expect(hrefs).toContain('/characters');
  });

  it('does not show logout button when not authenticated', () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: false, loading: false, logout: jest.fn() as any, user: null, login: jest.fn() as any, register: jest.fn() as any, error: null });
    render();
    expect(container.querySelector('[data-testid="logout-button"]')).toBeNull();
  });

  it('does not show logout button while loading', () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: true, loading: true, logout: jest.fn() as any, user: null, login: jest.fn() as any, register: jest.fn() as any, error: null });
    render();
    expect(container.querySelector('[data-testid="logout-button"]')).toBeNull();
  });

  it('shows logout button when authenticated and not loading', () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: true, loading: false, logout: jest.fn() as any, user: { userId: 'u1', email: 'u@test.com' }, login: jest.fn() as any, register: jest.fn() as any, error: null });
    render();
    expect(container.querySelector('[data-testid="logout-button"]')).not.toBeNull();
  });

  it('calls logout when logout button clicked', () => {
    const logout = jest.fn() as any;
    mockedUseAuth.mockReturnValue({ isAuthenticated: true, loading: false, logout, user: { userId: 'u1', email: 'u@test.com' }, login: jest.fn() as any, register: jest.fn() as any, error: null });
    render();
    act(() => {
      (container.querySelector('[data-testid="logout-button"]') as HTMLButtonElement).click();
    });
    expect(logout).toHaveBeenCalledTimes(1);
  });
});
