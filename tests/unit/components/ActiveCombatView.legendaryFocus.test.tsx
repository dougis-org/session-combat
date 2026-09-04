jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href }, children),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActiveCombatView } from '@/lib/components/ActiveCombatView';
import { makeUseCombat } from '@/tests/unit/fixtures/useCombat';
import { makeCombatant, makeCombatState } from '@/tests/unit/fixtures/combatHelpers';
import type { UseCombatReturn } from '@/lib/hooks/useCombat';
import type { CombatantState } from '@/lib/types';

function makeCombat(overrides: Partial<UseCombatReturn> = {}, displayed: CombatantState[] = []) {
  return makeUseCombat({
    getDisplayCombatants: jest.fn().mockReturnValue(displayed),
    ...overrides,
  });
}

const dragon = makeCombatant({
  id: 'dragon-1',
  name: 'Ancient Red Dragon',
  type: 'monster',
  legendaryActionCount: 3,
  legendaryActionsRemaining: 3,
  legendaryActions: [{ name: 'Tail Attack', description: 'The dragon attacks with its tail.' }],
});

describe('ActiveCombatView — legendary badge wiring', () => {
  let scrollIntoViewSpy: jest.Mock;

  beforeEach(() => {
    scrollIntoViewSpy = jest.fn();
    Element.prototype.scrollIntoView = scrollIntoViewSpy;
  });

  afterEach(() => {
    // @ts-expect-error - cleaning up the jsdom polyfill
    delete Element.prototype.scrollIntoView;
  });

  it('clicking the legendary badge requests the detail panel with a legendary focus section', async () => {
    const user = userEvent.setup();
    const setSelectedDetailCombatantId = jest.fn();
    const setDetailPosition = jest.fn();
    const setDetailFocusSection = jest.fn();
    const combat = makeCombat(
      {
        combatState: makeCombatState({ combatants: [dragon] }),
        setSelectedDetailCombatantId,
        setDetailPosition,
        setDetailFocusSection,
      },
      [dragon],
    );
    render(<ActiveCombatView combat={combat} user={null} />);
    await user.click(screen.getByTestId('legendary-action-badge'));
    expect(setSelectedDetailCombatantId).toHaveBeenCalledWith('dragon-1');
    expect(setDetailPosition).toHaveBeenCalled();
    expect(setDetailFocusSection).toHaveBeenCalledWith('legendary');
  });

  it('opening the panel via the badge (focusSection set) scrolls to the legendary section', () => {
    const combat = makeCombat(
      {
        combatState: makeCombatState({ combatants: [dragon] }),
        selectedDetailCombatantId: 'dragon-1',
        detailPosition: { top: 10, left: 20 },
        detailFocusSection: 'legendary',
      },
      [dragon],
    );
    render(<ActiveCombatView combat={combat} user={null} />);
    expect(screen.getAllByText('Ancient Red Dragon').length).toBeGreaterThan(0);
    expect(scrollIntoViewSpy).toHaveBeenCalled();
  });

  it('opening the panel via the name control (no focusSection) does not scroll to the legendary section', async () => {
    const user = userEvent.setup();
    const setDetailFocusSection = jest.fn();
    const combat = makeCombat(
      {
        combatState: makeCombatState({ combatants: [dragon] }),
        setDetailFocusSection,
      },
      [dragon],
    );
    render(<ActiveCombatView combat={combat} user={null} />);
    await user.click(screen.getByTestId('combatant-detail-toggle'));
    expect(setDetailFocusSection).toHaveBeenCalledWith(undefined);
    expect(scrollIntoViewSpy).not.toHaveBeenCalled();
  });
});
