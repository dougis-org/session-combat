jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href }, children),
}));

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActiveCombatView } from '@/lib/components/ActiveCombatView';
import { makeUseCombat } from '@/tests/unit/fixtures/useCombat';
import { makeCombatant, makeCombatState } from '@/tests/unit/fixtures/combatHelpers';
import type { UseCombatReturn } from '@/lib/hooks/useCombat';
import type { CombatantState, Character } from '@/lib/types';

// Fixture default for tests unrelated to the initiative-entry feature — keeps the
// auto-open effect from targeting these combatants and interfering with assertions.
const ROLLED = { method: 'manual' as const, roll: 10, bonus: 0, total: 10 };

const mockFetch = jest.fn().mockResolvedValue({ ok: true } as Response);
const originalFetch = global.fetch;
beforeEach(() => {
  global.fetch = mockFetch;
  mockFetch.mockClear();
});
afterAll(() => {
  global.fetch = originalFetch;
});

function makeCombat(
  overrides: Partial<UseCombatReturn> = {},
  displayed: CombatantState[] = [],
) {
  return makeUseCombat({
    getDisplayCombatants: jest.fn().mockReturnValue(displayed),
    ...overrides,
  });
}

describe('ActiveCombatView', () => {
  it('renders nothing when combatState is null', () => {
    const { container } = render(<ActiveCombatView combat={makeUseCombat({ combatState: null })} user={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('displays error message when error is set', () => {
    const combat = makeCombat({ combatState: makeCombatState(), error: 'Something went wrong' });
    render(<ActiveCombatView combat={combat} user={null} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('displays toast message when toast is set', () => {
    const combat = makeCombat({ combatState: makeCombatState(), toast: { type: 'success', message: 'Combat saved!' } });
    render(<ActiveCombatView combat={combat} user={null} />);
    expect(screen.getByText('Combat saved!')).toBeInTheDocument();
  });

  it('renders player combatants in the Party section', () => {
    const fighter = makeCombatant({ id: 'p1', name: 'Aria', type: 'player', initiativeRoll: ROLLED });
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [fighter] }) }, [fighter]);
    render(<ActiveCombatView combat={combat} user={null} />);
    expect(screen.getByText('Aria')).toBeInTheDocument();
  });

  it('clicking "Add Party Member" calls setShowCombatantModal with true', async () => {
    const user = userEvent.setup();
    const setShowCombatantModal = jest.fn();
    const combat = makeCombat({ combatState: makeCombatState(), setShowCombatantModal });
    render(<ActiveCombatView combat={combat} user={null} />);
    await user.click(screen.getByRole('button', { name: /add party member/i }));
    expect(setShowCombatantModal).toHaveBeenCalledWith(true);
  });

  it('clicking "Add Enemy" calls setShowCombatantModal with true', async () => {
    const user = userEvent.setup();
    const setShowCombatantModal = jest.fn();
    const combat = makeCombat({ combatState: makeCombatState(), setShowCombatantModal });
    render(<ActiveCombatView combat={combat} user={null} />);
    await user.click(screen.getByRole('button', { name: /add enemy/i }));
    expect(setShowCombatantModal).toHaveBeenCalledWith(true);
  });

  it('clicking "Add Lair" calls setShowLairForm with true', async () => {
    const user = userEvent.setup();
    const setShowLairForm = jest.fn();
    const combat = makeCombat({ combatState: makeCombatState(), setShowLairForm });
    render(<ActiveCombatView combat={combat} user={null} />);
    await user.click(screen.getByRole('button', { name: /add lair/i }));
    expect(setShowLairForm).toHaveBeenCalledWith(true);
  });

  it('shows combatant detail panel when selectedDetailCombatantId and detailPosition are set', () => {
    const goblin = makeCombatant({ initiativeRoll: ROLLED });
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [goblin] }), selectedDetailCombatantId: 'c1', detailPosition: { top: 100, left: 200 } });
    render(<ActiveCombatView combat={combat} user={null} />);
    expect(screen.getByText('Goblin')).toBeInTheDocument();
  });

  it('renders combatant names from getDisplayCombatants', () => {
    const goblin = makeCombatant({ id: 'c1', name: 'Goblin', type: 'monster', initiativeRoll: ROLLED });
    const orc = makeCombatant({ id: 'c2', name: 'Orc', type: 'monster', initiativeRoll: ROLLED });
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [goblin, orc] }) }, [goblin, orc]);
    render(<ActiveCombatView combat={combat} user={null} />);
    expect(screen.getByText('Goblin')).toBeInTheDocument();
    expect(screen.getByText('Orc')).toBeInTheDocument();
  });

  it('renders no combatant elements when getDisplayCombatants returns []', () => {
    const goblin = makeCombatant({ id: 'c1', name: 'Goblin', type: 'monster', initiativeRoll: ROLLED });
    const orc = makeCombatant({ id: 'c2', name: 'Orc', type: 'monster', initiativeRoll: ROLLED });
    // combatState has combatants, but getDisplayCombatants filters them all out
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [goblin, orc] }) }, []);
    render(<ActiveCombatView combat={combat} user={null} />);
    expect(screen.queryByText('Goblin')).not.toBeInTheDocument();
    expect(screen.queryByText('Orc')).not.toBeInTheDocument();
  });

  it('clicking "Current Turn (done)" calls nextTurn once', async () => {
    const user = userEvent.setup();
    const goblin = makeCombatant({ initiativeRoll: ROLLED });
    const nextTurn = jest.fn();
    const combat = makeCombat(
      { combatState: makeCombatState({ combatants: [goblin], currentTurnIndex: 0 }), nextTurn },
      [goblin],
    );
    render(<ActiveCombatView combat={combat} user={null} />);
    await user.click(screen.getByRole('button', { name: /current turn/i }));
    expect(nextTurn).toHaveBeenCalledTimes(1);
  });

  it('active combatant card has aria-current="step"', () => {
    const goblin = makeCombatant({ initiativeRoll: ROLLED });
    const combat = makeCombat(
      { combatState: makeCombatState({ combatants: [goblin], currentTurnIndex: 0 }), },
      [goblin],
    );
    render(<ActiveCombatView combat={combat} user={null} />);
    expect(document.querySelector('[aria-current="step"]')).toBeInTheDocument();
  });

  it('renders lair slot in initiative order when lair combatant is active', () => {
    const lairCombatant = makeCombatant({ id: 'lair-1', name: 'Dragon Lair', type: 'lair' });
    const combat = makeCombat(
      { combatState: makeCombatState({ combatants: [lairCombatant], currentTurnIndex: 0 }), },
      [lairCombatant],
    );
    render(<ActiveCombatView combat={combat} user={null} />);
    expect(screen.getByTestId('lair-active')).toBeInTheDocument();
  });

  it('renders lair slot remove button when lair combatant is not active', () => {
    const goblin = makeCombatant({ initiativeRoll: ROLLED });
    const lairCombatant = makeCombatant({ id: 'lair-1', name: 'Dragon Lair', type: 'lair' });
    const combat = makeCombat(
      { combatState: makeCombatState({ combatants: [goblin, lairCombatant], currentTurnIndex: 0 }), },
      [goblin, lairCombatant],
    );
    render(<ActiveCombatView combat={combat} user={null} />);
    expect(screen.getByTestId('lair-slot-remove')).toBeInTheDocument();
  });

  it('encounter description modal is visible when showEncounterDescription is true', () => {
    const combat = makeCombat({ combatState: makeCombatState({ encounterDescription: 'A dark cave' }), showEncounterDescription: true });
    render(<ActiveCombatView combat={combat} user={null} />);
    expect(screen.getByText('Encounter Description')).toBeInTheDocument();
  });

  it('encounter description modal is absent when showEncounterDescription is false', () => {
    const combat = makeCombat({ combatState: makeCombatState({ encounterDescription: 'A dark cave' }), showEncounterDescription: false });
    render(<ActiveCombatView combat={combat} user={null} />);
    expect(screen.queryByText('Encounter Description')).not.toBeInTheDocument();
  });

  it('confirming remove calls removeCombatant with correct ID', async () => {
    const user = userEvent.setup();
    const goblin = makeCombatant({ initiativeRoll: ROLLED });
    const removeCombatant = jest.fn();
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [goblin] }), removeConfirmId: 'c1', removeConfirmPosition: { top: 0, left: 0 }, removeCombatant });
    render(<ActiveCombatView combat={combat} user={null} />);
    await user.click(screen.getByTestId('remove-confirm-button'));
    expect(removeCombatant).toHaveBeenCalledWith('c1');
  });

  it('clicking cancel in remove confirm popup does not call removeCombatant', async () => {
    const user = userEvent.setup();
    const goblin = makeCombatant({ initiativeRoll: ROLLED });
    const removeCombatant = jest.fn();
    const setRemoveConfirmId = jest.fn();
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [goblin] }), removeConfirmId: 'c1', removeConfirmPosition: { top: 0, left: 0 }, removeCombatant, setRemoveConfirmId });
    render(<ActiveCombatView combat={combat} user={null} />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(removeCombatant).not.toHaveBeenCalled();
    expect(setRemoveConfirmId).toHaveBeenCalledWith(null);
  });

  it('saving initiative auto-advances the modal to the next unrolled combatant', async () => {
    const user = userEvent.setup();
    const goblin = makeCombatant({ id: 'c1', name: 'Goblin' });
    const orc = makeCombatant({ id: 'c2', name: 'Orc' });
    const setInitiativeRoll = jest.fn();
    const combat = makeCombat(
      { combatState: makeCombatState({ combatants: [goblin, orc] }), setInitiativeRoll },
      [goblin, orc],
    );
    render(<ActiveCombatView combat={combat} user={null} />);

    const goblinInitiativeButton = document.querySelector(
      '[data-combatant-id="c1"] [data-card-section="initiative"] button',
    ) as HTMLElement;
    await user.click(goblinInitiativeButton);
    const modal = screen.getByTestId('initiative-modal');
    expect(within(modal).getByRole('heading', { name: 'Goblin' })).toBeInTheDocument();

    await user.click(within(modal).getByRole('button', { name: 'Roll d20' }));

    expect(setInitiativeRoll).toHaveBeenCalledWith('c1', expect.any(Object));
    expect(within(screen.getByTestId('initiative-modal')).getByRole('heading', { name: 'Orc' })).toBeInTheDocument();
  });

  it('saving the last unrolled combatant closes the initiative modal', async () => {
    const user = userEvent.setup();
    const goblin = makeCombatant({ id: 'c1', name: 'Goblin' });
    const setInitiativeRoll = jest.fn();
    const combat = makeCombat(
      { combatState: makeCombatState({ combatants: [goblin] }), setInitiativeRoll },
      [goblin],
    );
    render(<ActiveCombatView combat={combat} user={null} />);

    const goblinInitiativeButton = document.querySelector(
      '[data-combatant-id="c1"] [data-card-section="initiative"] button',
    ) as HTMLElement;
    await user.click(goblinInitiativeButton);
    const modal = screen.getByTestId('initiative-modal');
    expect(within(modal).getByRole('heading', { name: 'Goblin' })).toBeInTheDocument();

    await user.click(within(modal).getByRole('button', { name: 'Roll d20' }));

    expect(setInitiativeRoll).toHaveBeenCalledWith('c1', expect.any(Object));
    expect(screen.queryByTestId('initiative-modal')).not.toBeInTheDocument();
  });
});

describe('ActiveCombatView — initiative auto-open, dismiss, and backdrop', () => {
  it('auto-opens the initiative modal on mount for the first unrolled combatant, no click required', () => {
    const goblin = makeCombatant({ id: 'c1', name: 'Goblin' });
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [goblin] }) }, [goblin]);
    render(<ActiveCombatView combat={combat} user={null} />);
    const modal = screen.getByTestId('initiative-modal');
    expect(within(modal).getByRole('heading', { name: 'Goblin' })).toBeInTheDocument();
  });

  it('does not auto-open when every combatant already has an initiativeRoll', () => {
    const goblin = makeCombatant({ id: 'c1', name: 'Goblin', initiativeRoll: ROLLED });
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [goblin] }) }, [goblin]);
    render(<ActiveCombatView combat={combat} user={null} />);
    expect(screen.queryByTestId('initiative-modal')).not.toBeInTheDocument();
  });

  it('auto-opens for a newly added unrolled combatant', () => {
    const goblin = makeCombatant({ id: 'c1', name: 'Goblin', initiativeRoll: ROLLED });
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [goblin] }) }, [goblin]);
    const { rerender } = render(<ActiveCombatView combat={combat} user={null} />);
    expect(screen.queryByTestId('initiative-modal')).not.toBeInTheDocument();

    const orc = makeCombatant({ id: 'c2', name: 'Orc' });
    const combat2 = makeCombat({ combatState: makeCombatState({ combatants: [goblin, orc] }) }, [goblin, orc]);
    rerender(<ActiveCombatView combat={combat2} user={null} />);

    const modal = screen.getByTestId('initiative-modal');
    expect(within(modal).getByRole('heading', { name: 'Orc' })).toBeInTheDocument();
  });

  it('dismissing the auto-opened modal via Escape does not reopen it for that combatant', async () => {
    const user = userEvent.setup();
    const goblin = makeCombatant({ id: 'c1', name: 'Goblin' });
    const orc = makeCombatant({ id: 'c2', name: 'Orc', initiativeRoll: ROLLED });
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [goblin, orc] }) }, [goblin, orc]);
    const { rerender } = render(<ActiveCombatView combat={combat} user={null} />);

    expect(within(screen.getByTestId('initiative-modal')).getByRole('heading', { name: 'Goblin' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByTestId('initiative-modal')).not.toBeInTheDocument();

    // Re-render triggered by unrelated state (e.g. adding a different combatant); goblin must stay closed.
    const orc2 = makeCombatant({ id: 'c3', name: 'Orc2', initiativeRoll: ROLLED });
    const combat2 = makeCombat({ combatState: makeCombatState({ combatants: [goblin, orc, orc2] }) }, [goblin, orc, orc2]);
    rerender(<ActiveCombatView combat={combat2} user={null} />);
    expect(screen.queryByTestId('initiative-modal')).not.toBeInTheDocument();
  });

  it('a combatant dismissed from auto-open remains manually openable via the Initiative control', async () => {
    const user = userEvent.setup();
    const goblin = makeCombatant({ id: 'c1', name: 'Goblin' });
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [goblin] }) }, [goblin]);
    render(<ActiveCombatView combat={combat} user={null} />);

    expect(screen.getByTestId('initiative-modal')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByTestId('initiative-modal')).not.toBeInTheDocument();

    const initiativeButton = document.querySelector(
      '[data-combatant-id="c1"] [data-card-section="initiative"] button',
    ) as HTMLElement;
    await user.click(initiativeButton);
    expect(within(screen.getByTestId('initiative-modal')).getByRole('heading', { name: 'Goblin' })).toBeInTheDocument();
  });

  it('dismissal tracking does not suppress the post-save auto-advance to another unrolled combatant', async () => {
    const user = userEvent.setup();
    const goblin = makeCombatant({ id: 'c1', name: 'Goblin' });
    const orc = makeCombatant({ id: 'c2', name: 'Orc' });
    const setInitiativeRoll = jest.fn();
    const combat = makeCombat(
      { combatState: makeCombatState({ combatants: [goblin, orc] }), setInitiativeRoll },
      [goblin, orc],
    );
    render(<ActiveCombatView combat={combat} user={null} />);

    // Dismiss goblin (auto-opened first); orc is also unrolled and eligible so the
    // auto-open effect advances to it — that's expected and separate from what's
    // under test here.
    await user.keyboard('{Escape}');

    // Manually reopen goblin (still allowed post-dismissal) and save it.
    const goblinInitiativeButton = document.querySelector(
      '[data-combatant-id="c1"] [data-card-section="initiative"] button',
    ) as HTMLElement;
    await user.click(goblinInitiativeButton);
    expect(within(screen.getByTestId('initiative-modal')).getByRole('heading', { name: 'Goblin' })).toBeInTheDocument();
    await user.click(within(screen.getByTestId('initiative-modal')).getByRole('button', { name: 'Roll d20' }));

    // Dismissal tracking must not suppress the post-save auto-advance to orc.
    expect(setInitiativeRoll).toHaveBeenCalledWith('c1', expect.any(Object));
    expect(within(screen.getByTestId('initiative-modal')).getByRole('heading', { name: 'Orc' })).toBeInTheDocument();
  });

  it('advances the initiative modal to the first unrolled player after batch rolling monsters', async () => {
    const user = userEvent.setup();
    const goblin = makeCombatant({ id: 'c1', name: 'Goblin', type: 'monster' });
    const orc = makeCombatant({ id: 'c2', name: 'Orc', type: 'monster' });
    const player = makeCombatant({ id: 'p1', name: 'Aria', type: 'player' });
    const rollUnrolledMonsters = jest.fn();

    // Holds combatants in real React state and updates them immutably, so the
    // batch roll only becomes visible on the next render, like the real hook.
    function Harness() {
      const [combatants, setCombatants] = React.useState([goblin, orc, player]);
      const combat = makeCombat(
        {
          combatState: makeCombatState({ combatants }),
          rollUnrolledMonsters: (...args: [boolean?, number?]) => {
            rollUnrolledMonsters(...args);
            setCombatants((prev) =>
              prev.map((c) =>
                c.type === 'monster' ? { ...c, initiative: ROLLED.total, initiativeRoll: ROLLED } : c,
              ),
            );
          },
        },
        combatants,
      );
      return <ActiveCombatView combat={combat} user={null} />;
    }

    render(<Harness />);

    await user.click(
      within(screen.getByTestId('initiative-modal')).getByRole('button', {
        name: /roll d20 for all 2 unrolled monsters/i,
      }),
    );

    expect(rollUnrolledMonsters).toHaveBeenCalledWith(false, 0);
    expect(
      within(screen.getByTestId('initiative-modal')).getByRole('heading', {
        name: 'Aria',
      }),
    ).toBeInTheDocument();
  });

  it('renders a fixed, faint, flex-centered backdrop with a content-sized dialog and no inline position', () => {
    const goblin = makeCombatant({ id: 'c1', name: 'Goblin' });
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [goblin] }) }, [goblin]);
    render(<ActiveCombatView combat={combat} user={null} />);

    const backdrop = screen.getByTestId('initiative-modal-backdrop');
    expect(backdrop.className.split(/\s+/)).toEqual(
      expect.arrayContaining(['fixed', 'inset-0', 'bg-black/40', 'flex', 'p-4', 'overflow-y-auto']),
    );

    const dialog = screen.getByTestId('initiative-modal');
    expect(backdrop).toContainElement(dialog);
    expect(dialog.className.split(/\s+/)).toEqual(expect.arrayContaining(['m-auto', 'w-max', 'max-w-full']));
    for (const prop of ['top', 'left', 'width', 'transform']) {
      expect(dialog.style.getPropertyValue(prop)).toBe('');
    }
  });

  it('has no backdrop when every combatant has rolled', () => {
    const goblin = makeCombatant({ id: 'c1', name: 'Goblin', initiativeRoll: ROLLED });
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [goblin] }) }, [goblin]);
    render(<ActiveCombatView combat={combat} user={null} />);
    expect(screen.queryByTestId('initiative-modal-backdrop')).not.toBeInTheDocument();
  });

  it('opens even when no card is rendered for the target (no anchor needed)', () => {
    const goblin = makeCombatant({ id: 'c1', name: 'Goblin' });
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [goblin] }) }, []);
    render(<ActiveCombatView combat={combat} user={null} />);
    expect(screen.getByTestId('initiative-modal')).toBeInTheDocument();
  });

  it('clicking the backdrop closes the modal; clicking inside the dialog does not', async () => {
    const user = userEvent.setup();
    const goblin = makeCombatant({ id: 'c1', name: 'Goblin' });
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [goblin] }) }, [goblin]);
    render(<ActiveCombatView combat={combat} user={null} />);

    await user.click(within(screen.getByTestId('initiative-modal')).getByRole('heading', { name: 'Goblin' }));
    expect(screen.getByTestId('initiative-modal')).toBeInTheDocument();

    await user.click(screen.getByTestId('initiative-modal-backdrop'));
    expect(screen.queryByTestId('initiative-modal-backdrop')).not.toBeInTheDocument();
  });

  it('keeps the same backdrop node across auto-advance and removes it after the last combatant', async () => {
    const user = userEvent.setup();
    const goblin = makeCombatant({ id: 'c1', name: 'Goblin' });
    const orc = makeCombatant({ id: 'c2', name: 'Orc' });
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [goblin, orc] }) }, [goblin, orc]);
    render(<ActiveCombatView combat={combat} user={null} />);

    const backdrop = screen.getByTestId('initiative-modal-backdrop');
    await user.click(within(screen.getByTestId('initiative-modal')).getByRole('button', { name: 'Roll d20' }));

    expect(screen.getByTestId('initiative-modal-backdrop')).toBe(backdrop);
    expect(within(screen.getByTestId('initiative-modal')).getByRole('heading', { name: 'Orc' })).toBeInTheDocument();
  });

  it('removes the backdrop after the last unrolled combatant is saved', async () => {
    const user = userEvent.setup();
    const goblin = makeCombatant({ id: 'c1', name: 'Goblin' });
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [goblin] }) }, [goblin]);
    render(<ActiveCombatView combat={combat} user={null} />);
    await user.click(within(screen.getByTestId('initiative-modal')).getByRole('button', { name: 'Roll d20' }));
    expect(screen.queryByTestId('initiative-modal-backdrop')).not.toBeInTheDocument();
  });

  it('locks page scroll while open and restores the previous overflow on close and unmount', async () => {
    const user = userEvent.setup();
    document.body.style.overflow = 'scroll';
    const goblin = makeCombatant({ id: 'c1', name: 'Goblin' });
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [goblin] }) }, [goblin]);
    const { unmount } = render(<ActiveCombatView combat={combat} user={null} />);
    expect(document.body.style.overflow).toBe('hidden');

    await user.keyboard('{Escape}');
    expect(document.body.style.overflow).toBe('scroll');

    await user.click(
      document.querySelector('[data-combatant-id="c1"] [data-card-section="initiative"] button') as HTMLElement,
    );
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('scroll');
    document.body.style.overflow = '';
  });

  it('exposes an accessible modal dialog named by its headings', () => {
    const goblin = makeCombatant({ id: 'c1', name: 'Goblin' });
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [goblin] }) }, [goblin]);
    render(<ActiveCombatView combat={combat} user={null} />);

    const dialog = screen.getByRole('dialog', { name: /set\s*initiative goblin/i });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('moves focus into the dialog on open, keeps it inside after auto-advance, and restores it on close', async () => {
    const user = userEvent.setup();
    const goblin = makeCombatant({ id: 'c1', name: 'Goblin', initiativeRoll: ROLLED });
    const orc = makeCombatant({ id: 'c2', name: 'Orc' });
    const rolled = makeCombat({ combatState: makeCombatState({ combatants: [goblin] }) }, [goblin]);
    const { rerender } = render(<ActiveCombatView combat={rolled} user={null} />);

    const opener = document.querySelector(
      '[data-combatant-id="c1"] [data-card-section="initiative"] button',
    ) as HTMLElement;
    opener.focus();
    await user.click(opener);
    expect(screen.getByTestId('initiative-modal')).toContainElement(document.activeElement as HTMLElement);

    await user.keyboard('{Escape}');
    expect(opener).toHaveFocus();

    const two = makeCombat({ combatState: makeCombatState({ combatants: [goblin, orc] }) }, [goblin, orc]);
    rerender(<ActiveCombatView combat={two} user={null} />);
    expect(screen.getByTestId('initiative-modal')).toContainElement(document.activeElement as HTMLElement);
  });

  it('closes gracefully without throwing when the open modal target combatant is removed mid-session', () => {
    const goblin = makeCombatant({ id: 'c1', name: 'Goblin' });
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [goblin] }) }, [goblin]);
    const { rerender } = render(<ActiveCombatView combat={combat} user={null} />);
    expect(screen.getByTestId('initiative-modal')).toBeInTheDocument();

    const combat2 = makeCombat({ combatState: makeCombatState({ combatants: [] }) }, []);
    expect(() => rerender(<ActiveCombatView combat={combat2} user={null} />)).not.toThrow();
    expect(screen.queryByTestId('initiative-modal')).not.toBeInTheDocument();
  });

  it('recovers auto-open for a remaining unrolled combatant after the open combatant is removed mid-session', () => {
    const goblin = makeCombatant({ id: 'c1', name: 'Goblin' });
    const orc = makeCombatant({ id: 'c2', name: 'Orc' });
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [goblin, orc] }) }, [goblin, orc]);
    const { rerender } = render(<ActiveCombatView combat={combat} user={null} />);
    expect(within(screen.getByTestId('initiative-modal')).getByRole('heading', { name: 'Goblin' })).toBeInTheDocument();

    // Goblin (the combatant the modal is currently anchored to) is removed, but Orc
    // is still unrolled and still present. Without clearing the stale
    // initiativeEditId, auto-open would stay permanently blocked for Orc too.
    const combat2 = makeCombat({ combatState: makeCombatState({ combatants: [orc] }) }, [orc]);
    rerender(<ActiveCombatView combat={combat2} user={null} />);

    expect(within(screen.getByTestId('initiative-modal')).getByRole('heading', { name: 'Orc' })).toBeInTheDocument();
  });

  it('clicking outside the modal closes it and marks the combatant dismissed', async () => {
    const user = userEvent.setup();
    const goblin = makeCombatant({ id: 'c1', name: 'Goblin' });
    const orc = makeCombatant({ id: 'c2', name: 'Orc', initiativeRoll: ROLLED });
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [goblin, orc] }) }, [goblin, orc]);
    const { rerender } = render(<ActiveCombatView combat={combat} user={null} />);
    expect(screen.getByTestId('initiative-modal')).toBeInTheDocument();

    await user.click(document.body);
    expect(screen.queryByTestId('initiative-modal')).not.toBeInTheDocument();

    // Re-render triggered by unrelated state; goblin must stay closed (same
    // dismissal tracking as the Escape-key path).
    const orc2 = makeCombatant({ id: 'c3', name: 'Orc2', initiativeRoll: ROLLED });
    const combat2 = makeCombat({ combatState: makeCombatState({ combatants: [goblin, orc, orc2] }) }, [goblin, orc, orc2]);
    rerender(<ActiveCombatView combat={combat2} user={null} />);
    expect(screen.queryByTestId('initiative-modal')).not.toBeInTheDocument();
  });
});

describe('ActiveCombatView — CON save notification', () => {
  const CHARACTER_ID = 'char-abc';
  const CHARACTER_USER_ID = 'user-xyz';
  const CAMPAIGN_ID = 'campaign-1';

  const playerCharacter: Character = {
    id: CHARACTER_ID,
    userId: CHARACTER_USER_ID,
    name: 'Aria',
    hp: 30,
    maxHp: 30,
    ac: 15,
    classes: [],
    abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
  } as unknown as Character;

  function makeConcentratingPlayer(overrides: Partial<CombatantState> = {}): CombatantState {
    return makeCombatant({
      id: `character-${CHARACTER_ID}`,
      name: 'Aria',
      type: 'player',
      hp: 30,
      maxHp: 30,
      concentratingOn: 'Bless',
      initiativeRoll: ROLLED,
      ...overrides,
    });
  }

  it('player-type concentrating combatant: posts direct message with toUserId on damage', async () => {
    const user = userEvent.setup();
    const combatant = makeConcentratingPlayer();
    const combat = makeCombat(
      {
        combatState: makeCombatState({ combatants: [combatant], campaignId: CAMPAIGN_ID }),
        characters: [playerCharacter],
        getDisplayCombatants: jest.fn().mockReturnValue([combatant]),
      },
    );
    render(<ActiveCombatView combat={combat} user={null} />);
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '10');
    await user.click(screen.getByRole('button', { name: 'Damage' }));
    expect(mockFetch).toHaveBeenCalledWith(
      `/api/campaigns/${CAMPAIGN_ID}/messages`,
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining(`"toUserId":"${CHARACTER_USER_ID}"`),
      }),
    );
  });

  it('monster-type concentrating combatant: does NOT post direct message on damage', async () => {
    const user = userEvent.setup();
    const combatant = makeCombatant({
      id: 'monster-goblin-uuid',
      name: 'Goblin',
      type: 'monster',
      hp: 30,
      maxHp: 30,
      concentratingOn: 'Hold Person',
      initiativeRoll: ROLLED,
    });
    const combat = makeCombat(
      {
        combatState: makeCombatState({ combatants: [combatant], campaignId: CAMPAIGN_ID }),
        characters: [playerCharacter],
        getDisplayCombatants: jest.fn().mockReturnValue([combatant]),
      },
    );
    render(<ActiveCombatView combat={combat} user={null} />);
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '10');
    await user.click(screen.getByRole('button', { name: 'Damage' }));
    const directMessageCall = mockFetch.mock.calls.find(
      ([, opts]) => typeof opts?.body === 'string' && opts.body.includes('toUserId'),
    );
    expect(directMessageCall).toBeUndefined();
  });

  describe('End Combat confirmation', () => {
    function setup() {
      const endCombat = jest.fn();
      const combat = makeCombat({ combatState: makeCombatState(), endCombat });
      render(<ActiveCombatView combat={combat} user={null} />);
      return { endCombat };
    }
    const openDialog = () => userEvent.click(screen.getByRole('button', { name: 'End Combat' }));

    it('opens the dialog without ending combat', async () => {
      const { endCombat } = setup();
      await openDialog();
      expect(screen.getByRole('dialog', { name: 'End Combat?' })).toHaveAttribute('aria-labelledby', 'end-combat-confirm-title');
      expect(endCombat).not.toHaveBeenCalled();
    });

    it('confirm closes the dialog and calls endCombat exactly once, even on double-click', async () => {
      const { endCombat } = setup();
      await openDialog();
      await userEvent.dblClick(screen.getByTestId('confirm-dialog-confirm'));
      expect(endCombat).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('dialog', { name: 'End Combat?' })).not.toBeInTheDocument();
    });

    it('Return to Combat and × close the dialog without ending combat', async () => {
      const { endCombat } = setup();
      await openDialog();
      await userEvent.click(screen.getByRole('button', { name: 'Return to Combat' }));
      expect(screen.queryByRole('dialog', { name: 'End Combat?' })).not.toBeInTheDocument();
      await openDialog();
      await userEvent.click(within(screen.getByRole('dialog', { name: 'End Combat?' })).getByRole('button', { name: /close modal/i }));
      expect(screen.queryByRole('dialog', { name: 'End Combat?' })).not.toBeInTheDocument();
      expect(endCombat).not.toHaveBeenCalled();
    });

    it('Escape closes the dialog without ending combat', async () => {
      const { endCombat } = setup();
      await openDialog();
      await userEvent.keyboard('{Escape}');
      expect(screen.queryByRole('dialog', { name: 'End Combat?' })).not.toBeInTheDocument();
      expect(endCombat).not.toHaveBeenCalled();
    });
  });
});
