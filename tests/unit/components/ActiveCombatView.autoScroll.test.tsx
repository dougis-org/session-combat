jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href }, children),
}));

jest.mock('@/lib/preferences/usePreferences', () => ({
  usePreferences: jest.fn(),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActiveCombatView } from '@/lib/components/ActiveCombatView';
import { usePreferences } from '@/lib/preferences/usePreferences';
import { DEFAULT_PREFERENCES } from '@/lib/preferences/schema';
import { makeUseCombat } from '@/tests/unit/fixtures/useCombat';
import { makeCombatant, makeCombatState } from '@/tests/unit/fixtures/combatHelpers';
import type { UseCombatReturn } from '@/lib/hooks/useCombat';
import type { CombatantState } from '@/lib/types';

const mockedUsePreferences = jest.mocked(usePreferences);

function mockAutoScrollPreference(autoScrollToNextCombatant: boolean) {
  mockedUsePreferences.mockReturnValue({
    preferences: {
      ...DEFAULT_PREFERENCES,
      combat: { autoScrollToNextCombatant },
    },
    setPreference: jest.fn(),
    ready: true,
  });
}

function makeCombat(overrides: Partial<UseCombatReturn> = {}, displayed: CombatantState[] = []) {
  return makeUseCombat({
    getDisplayCombatants: jest.fn().mockReturnValue(displayed),
    ...overrides,
  });
}

describe('ActiveCombatView — auto-scroll to next combatant', () => {
  let scrollIntoViewSpy: jest.Mock;

  beforeEach(() => {
    scrollIntoViewSpy = jest.fn();
    Element.prototype.scrollIntoView = scrollIntoViewSpy;
    mockAutoScrollPreference(true);
  });

  afterEach(() => {
    // @ts-expect-error - cleaning up the jsdom polyfill
    delete Element.prototype.scrollIntoView;
  });

  it('scrolls the new active combatant into view when the preference is enabled', async () => {
    const user = userEvent.setup();
    const a = makeCombatant({ id: 'a', name: 'Aria', type: 'player' });
    const b = makeCombatant({ id: 'b', name: 'Bram', type: 'player' });
    // nextTurn() advances currentTurnIndex; simulate that by re-rendering with the
    // updated combatState, same as the real useCombat hook would trigger.
    const nextTurn = jest.fn();
    const { rerender } = render(
      <ActiveCombatView
        combat={makeCombat({ combatState: makeCombatState({ combatants: [a, b], currentTurnIndex: 0 }), nextTurn }, [a, b])}
        user={null}
      />,
    );
    await user.click(screen.getByRole('button', { name: /current turn/i }));
    expect(nextTurn).toHaveBeenCalledTimes(1);

    rerender(
      <ActiveCombatView
        combat={makeCombat({ combatState: makeCombatState({ combatants: [a, b], currentTurnIndex: 1 }), nextTurn }, [a, b])}
        user={null}
      />,
    );

    expect(scrollIntoViewSpy).toHaveBeenCalledTimes(1);
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'nearest' });
    const target = scrollIntoViewSpy.mock.instances[0] as unknown as Element;
    expect(target.getAttribute('data-combatant-id')).toBe('b');
  });

  it('does not scroll when the preference is disabled', async () => {
    mockAutoScrollPreference(false);
    const user = userEvent.setup();
    const a = makeCombatant({ id: 'a', name: 'Aria', type: 'player' });
    const b = makeCombatant({ id: 'b', name: 'Bram', type: 'player' });
    const nextTurn = jest.fn();
    const { rerender } = render(
      <ActiveCombatView
        combat={makeCombat({ combatState: makeCombatState({ combatants: [a, b], currentTurnIndex: 0 }), nextTurn }, [a, b])}
        user={null}
      />,
    );
    await user.click(screen.getByRole('button', { name: /current turn/i }));

    rerender(
      <ActiveCombatView
        combat={makeCombat({ combatState: makeCombatState({ combatants: [a, b], currentTurnIndex: 1 }), nextTurn }, [a, b])}
        user={null}
      />,
    );

    expect(scrollIntoViewSpy).not.toHaveBeenCalled();
  });

  it('scrolls to the next-eligible combatant, skipping a downed combatant interposed between', async () => {
    const user = userEvent.setup();
    const a = makeCombatant({ id: 'a', name: 'Aria', type: 'player' });
    const downedMonster = makeCombatant({ id: 'm', name: 'Downed Goblin', type: 'monster', hp: 0 });
    const c = makeCombatant({ id: 'c', name: 'Cora', type: 'player' });
    const nextTurn = jest.fn();
    const combatants = [a, downedMonster, c];
    const { rerender } = render(
      <ActiveCombatView
        combat={makeCombat({ combatState: makeCombatState({ combatants, currentTurnIndex: 0 }), nextTurn }, combatants)}
        user={null}
      />,
    );
    await user.click(screen.getByRole('button', { name: /current turn/i }));

    // nextTurn's own skip logic would land on index 2 ('c'), never on the downed
    // monster at index 1 — simulate that resulting state.
    rerender(
      <ActiveCombatView
        combat={makeCombat({ combatState: makeCombatState({ combatants, currentTurnIndex: 2 }), nextTurn }, combatants)}
        user={null}
      />,
    );

    expect(scrollIntoViewSpy).toHaveBeenCalledTimes(1);
    const target = scrollIntoViewSpy.mock.instances[0] as unknown as Element;
    expect(target.getAttribute('data-combatant-id')).toBe('c');
  });

  it('scrolls to the first eligible combatant of the new round on wrap', async () => {
    const user = userEvent.setup();
    const a = makeCombatant({ id: 'a', name: 'Aria', type: 'player' });
    const b = makeCombatant({ id: 'b', name: 'Bram', type: 'player' });
    const nextTurn = jest.fn();
    const combatants = [a, b];
    const { rerender } = render(
      <ActiveCombatView
        combat={makeCombat({ combatState: makeCombatState({ combatants, currentTurnIndex: 1, currentRound: 1 }), nextTurn }, combatants)}
        user={null}
      />,
    );
    await user.click(screen.getByRole('button', { name: /current turn/i }));

    rerender(
      <ActiveCombatView
        combat={makeCombat({ combatState: makeCombatState({ combatants, currentTurnIndex: 0, currentRound: 2 }), nextTurn }, combatants)}
        user={null}
      />,
    );

    expect(scrollIntoViewSpy).toHaveBeenCalledTimes(1);
    const target = scrollIntoViewSpy.mock.instances[0] as unknown as Element;
    expect(target.getAttribute('data-combatant-id')).toBe('a');
  });

  it('does not scroll when Restart Round changes the active combatant', async () => {
    const user = userEvent.setup();
    const a = makeCombatant({ id: 'a', name: 'Aria', type: 'player' });
    const b = makeCombatant({ id: 'b', name: 'Bram', type: 'player' });
    const restartRound = jest.fn();
    const combatants = [a, b];
    const { rerender } = render(
      <ActiveCombatView
        combat={makeCombat({ combatState: makeCombatState({ combatants, currentTurnIndex: 1 }), restartRound }, combatants)}
        user={null}
      />,
    );
    await user.click(screen.getByRole('button', { name: /restart round/i }));
    expect(restartRound).toHaveBeenCalledTimes(1);

    rerender(
      <ActiveCombatView
        combat={makeCombat({ combatState: makeCombatState({ combatants, currentTurnIndex: 0 }), restartRound }, combatants)}
        user={null}
      />,
    );

    expect(scrollIntoViewSpy).not.toHaveBeenCalled();
  });

  it('does not scroll when a combatant is removed, shifting the active index', () => {
    const a = makeCombatant({ id: 'a', name: 'Aria', type: 'player' });
    const b = makeCombatant({ id: 'b', name: 'Bram', type: 'player' });
    const c = makeCombatant({ id: 'c', name: 'Cora', type: 'player' });
    const combat1 = makeCombat({ combatState: makeCombatState({ combatants: [a, b, c], currentTurnIndex: 1 }) }, [a, b, c]);
    const { rerender } = render(<ActiveCombatView combat={combat1} user={null} />);

    // Removing 'a' shifts 'c' into index 1 without any "done" click.
    const combat2 = makeCombat({ combatState: makeCombatState({ combatants: [b, c], currentTurnIndex: 1 }) }, [b, c]);
    rerender(<ActiveCombatView combat={combat2} user={null} />);

    expect(scrollIntoViewSpy).not.toHaveBeenCalled();
  });
});
