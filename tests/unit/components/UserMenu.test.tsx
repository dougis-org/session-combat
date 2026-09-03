jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserMenu } from '@/lib/components/UserMenu';
import { useAuth } from '@/lib/hooks/useAuth';

const mockedUseAuth = jest.mocked(useAuth);

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

describe('UserMenu', () => {
  it('renders nothing when unauthenticated', () => {
    mockAuth({ isAuthenticated: false, user: null });
    const { container } = render(<UserMenu />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId('user-menu-trigger')).not.toBeInTheDocument();
  });

  it('renders nothing while auth is loading', () => {
    mockAuth({ loading: true });
    const { container } = render(<UserMenu />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a short username in full with a matching accessible name', () => {
    mockAuth({ user: { userId: 'u1', email: 'u@test.com', username: 'douglas' } });
    render(<UserMenu />);
    const trigger = screen.getByTestId('user-menu-trigger');
    expect(trigger.textContent?.trim()).toBe('douglas');
    expect(trigger).toHaveAttribute('aria-label', 'douglas');
    expect(trigger).toHaveAttribute('title', 'douglas');
  });

  it('shows initials for a long username, full name as accessible name', () => {
    mockAuth({ user: { userId: 'u1', email: 'u@test.com', username: 'Douglas Adams' } });
    render(<UserMenu />);
    const trigger = screen.getByTestId('user-menu-trigger');
    expect(trigger.textContent?.trim()).toBe('DA');
    expect(trigger).toHaveAttribute('aria-label', 'Douglas Adams');
    expect(trigger).toHaveAttribute('title', 'Douglas Adams');
  });

  it('shows a single initial for a long single-token username', () => {
    mockAuth({ user: { userId: 'u1', email: 'u@test.com', username: 'stridertheranger' } });
    render(<UserMenu />);
    const trigger = screen.getByTestId('user-menu-trigger');
    expect(trigger.textContent?.trim()).toBe('S');
    expect(trigger).toHaveAttribute('aria-label', 'stridertheranger');
  });

  it('falls back to Account when username is missing', () => {
    mockAuth({ user: { userId: 'u1', email: 'u@test.com', username: undefined } });
    render(<UserMenu />);
    const trigger = screen.getByTestId('user-menu-trigger');
    expect(trigger).toHaveAttribute('aria-label', 'Account');
    expect(trigger.textContent?.trim()).toBe('Account');
  });

  it('renders markup in the username as inert text', () => {
    mockAuth({ user: { userId: 'u1', email: 'u@test.com', username: '<b>x</b>' } });
    const { container } = render(<UserMenu />);
    expect(screen.getByTestId('user-menu-trigger')).toHaveTextContent('<b>x</b>');
    expect(container.querySelector('b')).toBeNull();
  });

  it('opens on click with correct roles and aria-expanded', async () => {
    const user = userEvent.setup();
    mockAuth({});
    render(<UserMenu />);
    const trigger = screen.getByTestId('user-menu-trigger');
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).not.toHaveAttribute('aria-expanded', 'true');
    await user.click(trigger);
    const menu = await screen.findByRole('menu');
    expect(menu).toBeInTheDocument();
    const item = screen.getByRole('menuitem', { name: 'Logout' });
    expect(item).toHaveAttribute('data-testid', 'logout-button');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
  });

  it.each(['{ArrowDown}', '{Enter}', '{ }'])(
    'opens via keyboard (%s) on the focused trigger and moves focus into the menu',
    async (key) => {
      const user = userEvent.setup();
      mockAuth({});
      render(<UserMenu />);
      const trigger = screen.getByTestId('user-menu-trigger');
      trigger.focus();
      await user.keyboard(key);
      expect(await screen.findByRole('menu')).toBeInTheDocument();
      await waitFor(() =>
        expect(screen.getByRole('menuitem', { name: 'Profile & Settings' })).toHaveFocus(),
      );
    },
  );

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    mockAuth({});
    render(<UserMenu />);
    const trigger = screen.getByTestId('user-menu-trigger');
    await user.click(trigger);
    await screen.findByRole('menu');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('closes on outside click without activating logout', async () => {
    // Radix sets `pointer-events: none` on the body while the menu is open;
    // an outside dismissal still needs to reach the sibling element.
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const logout = jest.fn() as never;
    mockAuth({ logout });
    render(
      <div>
        <UserMenu />
        <button type="button">outside</button>
      </div>,
    );
    const outside = screen.getByRole('button', { name: 'outside' });
    await user.click(screen.getByTestId('user-menu-trigger'));
    await screen.findByRole('menu');
    await user.click(outside);
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(logout).not.toHaveBeenCalled();
  });

  it('renders Profile & Settings link', async () => {
    const user = userEvent.setup();
    mockAuth({});
    render(<UserMenu />);
    await user.click(screen.getByTestId('user-menu-trigger'));
    const link = await screen.findByRole('menuitem', { name: 'Profile & Settings' });
    expect(link).toHaveAttribute('href', '/profile');
  });

  it('calls logout exactly once when the Logout item is activated', async () => {
    const user = userEvent.setup();
    const logout = jest.fn().mockResolvedValue(undefined) as never;
    mockAuth({ logout });
    render(<UserMenu />);
    await user.click(screen.getByTestId('user-menu-trigger'));
    await user.click(await screen.findByTestId('logout-button'));
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('still calls logout once when the logout flow rejects, without surfacing an error', async () => {
    const user = userEvent.setup();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const logout = jest.fn().mockRejectedValue(new Error('network down')) as never;
    mockAuth({ logout });
    render(<UserMenu />);
    await user.click(screen.getByTestId('user-menu-trigger'));
    await user.click(await screen.findByTestId('logout-button'));
    expect(logout).toHaveBeenCalledTimes(1);
    // the rejection is owned/swallowed by useAuth().logout(); the menu must not throw it
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('unmounts cleanly when auth flips to unauthenticated during logout', async () => {
    const user = userEvent.setup();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const logout = jest.fn().mockResolvedValue(undefined) as never;
    mockAuth({ logout });
    const { rerender } = render(<UserMenu />);
    await user.click(screen.getByTestId('user-menu-trigger'));
    await user.click(await screen.findByTestId('logout-button'));
    mockAuth({ isAuthenticated: false, user: null });
    expect(() => rerender(<UserMenu />)).not.toThrow();
    expect(screen.queryByTestId('user-menu-trigger')).not.toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
