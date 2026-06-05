import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';
import { makeUseCombat } from '@/tests/unit/fixtures/useCombat';
import type { CombatState } from '@/lib/types';

jest.mock('@/lib/hooks/useCombat', () => ({
  useCombat: jest.fn(),
}));
jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({ user: null })),
}));
jest.mock('@/lib/components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock('@/lib/components/CombatSetupView', () => ({
  CombatSetupView: () => <div>CombatSetupView</div>,
}));
jest.mock('@/lib/components/ActiveCombatView', () => ({
  ActiveCombatView: () => <div>ActiveCombatView</div>,
}));

import { useCombat } from '@/lib/hooks/useCombat';

const MOCK_COMBAT_STATE: CombatState = {
  id: 'combat-1',
  userId: 'user-1',
  campaignId: 'campaign-1',
  combatants: [],
  currentRound: 1,
  currentTurnIndex: 0,
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

let container: HTMLDivElement;
let root: Root | undefined;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  if (root) {
    act(() => { root!.unmount(); });
    root = undefined;
  }
  container.remove();
  jest.clearAllMocks();
});

async function renderCombatPage() {
  const { default: CombatPage } = await import('@/app/combat/page');
  act(() => {
    root = createRoot(container);
    root.render(<CombatPage />);
  });
}

describe('CombatPage', () => {
  test('loading state renders loading message', async () => {
    (useCombat as jest.Mock).mockReturnValue(makeUseCombat({ loading: true }));
    await renderCombatPage();

    expect(container.textContent).toContain('Loading combat data...');
    expect(container.textContent).not.toContain('CombatSetupView');
    expect(container.textContent).not.toContain('ActiveCombatView');
  });

  test('setup view renders when no active combat', async () => {
    (useCombat as jest.Mock).mockReturnValue(makeUseCombat({ loading: false, combatState: null }));
    await renderCombatPage();

    expect(container.textContent).toContain('CombatSetupView');
    expect(container.textContent).not.toContain('ActiveCombatView');
  });

  test('active view renders when combat state is present', async () => {
    (useCombat as jest.Mock).mockReturnValue(makeUseCombat({ loading: false, combatState: MOCK_COMBAT_STATE }));
    await renderCombatPage();

    expect(container.textContent).toContain('ActiveCombatView');
    expect(container.textContent).not.toContain('CombatSetupView');
  });
});
