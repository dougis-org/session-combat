'use client';

import { DropdownMenu } from 'radix-ui';
import { useAuth } from '@/lib/hooks/useAuth';
import { deriveUserMenuDisplay } from './userMenuDisplay';

/**
 * Top-right account trigger + menu. Renders nothing unless the user is
 * authenticated and auth state has settled (same gate as the former inline
 * logout button). The single menu item, Logout, runs the existing
 * `useAuth().logout()` flow. See design.md Decisions 1, 2 and 4.
 */
export function UserMenu() {
  const { isAuthenticated, loading, user, logout } = useAuth();

  if (!isAuthenticated || loading) return null;

  const { label } = deriveUserMenuDisplay(user?.username);
  const accessibleName = user?.username?.trim() || 'Account';

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        data-testid="user-menu-trigger"
        aria-label={accessibleName}
        title={accessibleName}
        className="max-w-[8rem] truncate rounded-full border border-gray-700 bg-gray-900 px-3 py-1 text-sm text-gray-300 transition-colors hover:border-gray-500 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        {label}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          collisionPadding={8}
          className="z-50 min-w-[10rem] rounded-md border border-gray-800 bg-gray-950 p-1 text-sm text-gray-300 shadow-lg"
        >
          <DropdownMenu.Item
            data-testid="logout-button"
            onSelect={() => void logout()}
            className="cursor-pointer rounded px-3 py-2 outline-none hover:bg-gray-800 hover:text-white focus:bg-gray-800 focus:text-white data-[highlighted]:bg-gray-800 data-[highlighted]:text-white"
          >
            Logout
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
