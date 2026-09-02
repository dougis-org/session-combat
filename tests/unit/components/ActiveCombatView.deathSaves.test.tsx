jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href }, children),
}));

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { ActiveCombatView } from '@/lib/components/ActiveCombatView';
import { makeUseCombat } from '@/tests/unit/fixtures/useCombat';
import { makeCombatant, makeCombatState } from '@/tests/unit/fixtures/combatHelpers';
import type { CombatantState } from '@/lib/types';

const mockFetch = jest.fn().mockResolvedValue({ ok: true } as Response);
const originalFetch = global.fetch;
beforeEach(() => {
  global.fetch = mockFetch;
  mockFetch.mockClear();
});
afterAll(() => {
  global.fetch = originalFetch;
});

function renderView(combatants: CombatantState[]) {
  const combat = makeUseCombat({
    combatState: makeCombatState({ combatants }),
    getDisplayCombatants: jest.fn().mockReturnValue(combatants),
  });
  render(<ActiveCombatView combat={combat} user={null} />);
}

const cardFor = (name: string) =>
  screen.getByText(name).closest('[data-testid="combatant-card"]') as HTMLElement;

describe('ActiveCombatView — life-state styling', () => {
  const active = makeCombatant({ id: 'p1', name: 'Active One', type: 'player', hp: 10, maxHp: 10 });
  const dying = makeCombatant({
    id: 'p2', name: 'Dying One', type: 'player', hp: 0, maxHp: 10,
    lifeState: 'dying', deathSaves: { successes: 0, failures: 0 },
  });
  const stable = makeCombatant({
    id: 'p3', name: 'Stable One', type: 'player', hp: 0, maxHp: 10, lifeState: 'stable',
  });
  const dead = makeCombatant({
    id: 'p4', name: 'Dead One', type: 'player', hp: 0, maxHp: 10, lifeState: 'dead',
  });

  test('active player renders with no life-state badge and not greyed', () => {
    renderView([active, dying, stable, dead]);
    const card = cardFor('Active One');
    expect(card).toHaveAttribute('data-life-state', 'active');
    expect(within(card).queryByTestId('life-state-badge')).toBeNull();
    expect(card.className).not.toContain('opacity-50');
  });

  test('dying player renders normally with a Dying badge and the tracker', () => {
    renderView([active, dying, stable, dead]);
    const card = cardFor('Dying One');
    expect(within(card).getByTestId('life-state-badge')).toHaveTextContent('Dying');
    expect(within(card).getByTestId('death-save-tracker')).toBeInTheDocument();
    expect(card.className).not.toContain('opacity-50');
  });

  test('stable player renders greyed with a Stable badge and no tracker', () => {
    renderView([active, dying, stable, dead]);
    const card = cardFor('Stable One');
    expect(within(card).getByTestId('life-state-badge')).toHaveTextContent('Stable');
    expect(within(card).queryByTestId('death-save-tracker')).toBeNull();
    expect(card.className).toContain('opacity-50');
  });

  test('dead player renders greyed with a Dead badge and no tracker', () => {
    renderView([active, dying, stable, dead]);
    const card = cardFor('Dead One');
    expect(within(card).getByTestId('life-state-badge')).toHaveTextContent('Dead');
    expect(within(card).queryByTestId('death-save-tracker')).toBeNull();
    expect(card.className).toContain('opacity-50');
  });
});
