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
    const goblin = makeCombatant({ id: 'c1', name: 'Goblin', type: 'monster' });
    const orc = makeCombatant({ id: 'c2', name: 'Orc', type: 'monster' });
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

describe('ActiveCombatView — initiative auto-open, dismiss, and anchoring', () => {
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

  it('anchors the modal to the combatant card rect, not the Initiative button rect', () => {
    const goblin = makeCombatant({ id: 'c1', name: 'Goblin' });
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [goblin] }) }, [goblin]);

    const cardRect = { top: 40, left: 40, bottom: 400, right: 300, width: 260, height: 360, x: 40, y: 40, toJSON() {} } as DOMRect;
    const buttonRect = { top: 60, left: 250, bottom: 80, right: 300, width: 50, height: 20, x: 250, y: 60, toJSON() {} } as DOMRect;
    const originalGBCR = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = jest.fn(function (this: Element) {
      if (this.getAttribute('data-combatant-id') === 'c1') return cardRect;
      if (this.matches('[data-card-section="initiative"] button')) return buttonRect;
      return originalGBCR.call(this);
    });

    try {
      render(<ActiveCombatView combat={combat} user={null} />);
      const modal = screen.getByTestId('initiative-modal');
      expect(modal.style.top).toBe(`${cardRect.top}px`);
      expect(modal.style.left).toBe(`${cardRect.left}px`);
    } finally {
      Element.prototype.getBoundingClientRect = originalGBCR;
    }
  });

  it('sizes the modal to exactly the width of its target card, not a fixed width', () => {
    const goblin = makeCombatant({ id: 'c1', name: 'Goblin' });
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [goblin] }) }, [goblin]);

    const cardRect = { top: 40, left: 16, bottom: 400, right: 1264, width: 1248, height: 360, x: 16, y: 40, toJSON() {} } as DOMRect;
    const originalGBCR = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = jest.fn(function (this: Element) {
      if (this.getAttribute('data-combatant-id') === 'c1') return cardRect;
      return originalGBCR.call(this);
    });

    try {
      render(<ActiveCombatView combat={combat} user={null} />);
      const modal = screen.getByTestId('initiative-modal');
      expect(modal.style.width).toBe(`${cardRect.width}px`);
      expect(modal.className).not.toMatch(/\bw-80\b/);
    } finally {
      Element.prototype.getBoundingClientRect = originalGBCR;
    }
  });

  it('clamps the modal position so it never overflows the viewport', () => {
    const goblin = makeCombatant({ id: 'c1', name: 'Goblin' });
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [goblin] }) }, [goblin]);

    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;
    Object.defineProperty(window, 'innerWidth', { value: 400, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 300, configurable: true });

    const cardRect = { top: 250, left: 380, bottom: 260, right: 400, width: 20, height: 10, x: 380, y: 250, toJSON() {} } as DOMRect;
    const modalRect = { top: 260, left: 380, bottom: 460, right: 700, width: 320, height: 200, x: 380, y: 260, toJSON() {} } as DOMRect;

    const originalGBCR = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = jest.fn(function (this: Element) {
      if (this.getAttribute('data-testid') === 'initiative-modal') return modalRect;
      if (this.getAttribute('data-combatant-id') === 'c1') return cardRect;
      return originalGBCR.call(this);
    });

    try {
      render(<ActiveCombatView combat={combat} user={null} />);
      const modal = screen.getByTestId('initiative-modal');
      const left = parseFloat(modal.style.left);
      const top = parseFloat(modal.style.top);
      expect(left + modalRect.width).toBeLessThanOrEqual(400 - 16);
      expect(top + modalRect.height).toBeLessThanOrEqual(300 - 16);
      expect(left).toBeGreaterThanOrEqual(16);
      expect(top).toBeGreaterThanOrEqual(16);
    } finally {
      Element.prototype.getBoundingClientRect = originalGBCR;
      Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, configurable: true });
    }
  });

  it('clamps the minimum position to the visible viewport edge, not the document origin, when the page is scrolled', () => {
    const goblin = makeCombatant({ id: 'c1', name: 'Goblin' });
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [goblin] }) }, [goblin]);

    const originalScrollX = window.scrollX;
    const originalScrollY = window.scrollY;
    Object.defineProperty(window, 'scrollX', { value: 500, configurable: true });
    Object.defineProperty(window, 'scrollY', { value: 1000, configurable: true });

    // Card rect is in page coordinates that land above/left of the current visible
    // viewport (e.g. the DM scrolled down after the card was anchored).
    const cardRect = { top: -900, left: -450, bottom: -880, right: -400, width: 50, height: 20, x: -450, y: -900, toJSON() {} } as DOMRect;
    const modalRect = { top: -880, left: -450, bottom: -680, right: -130, width: 320, height: 200, x: -450, y: -880, toJSON() {} } as DOMRect;

    const originalGBCR = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = jest.fn(function (this: Element) {
      if (this.getAttribute('data-testid') === 'initiative-modal') return modalRect;
      if (this.getAttribute('data-combatant-id') === 'c1') return cardRect;
      return originalGBCR.call(this);
    });

    try {
      render(<ActiveCombatView combat={combat} user={null} />);
      const modal = screen.getByTestId('initiative-modal');
      const left = parseFloat(modal.style.left);
      const top = parseFloat(modal.style.top);
      // Must clamp to the scrolled viewport's edge (scrollX/scrollY + margin), not
      // the bare 16px margin from the document origin.
      expect(left).toBe(500 + 16);
      expect(top).toBe(1000 + 16);
    } finally {
      Element.prototype.getBoundingClientRect = originalGBCR;
      Object.defineProperty(window, 'scrollX', { value: originalScrollX, configurable: true });
      Object.defineProperty(window, 'scrollY', { value: originalScrollY, configurable: true });
    }
  });

  it('does not clamp when the card is comfortably within the viewport', () => {
    const goblin = makeCombatant({ id: 'c1', name: 'Goblin' });
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [goblin] }) }, [goblin]);

    const cardRect = { top: 40, left: 20, bottom: 100, right: 320, width: 300, height: 60, x: 20, y: 40, toJSON() {} } as DOMRect;
    const modalRect = { top: 40, left: 20, bottom: 240, right: 340, width: 320, height: 200, x: 20, y: 40, toJSON() {} } as DOMRect;

    const originalGBCR = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = jest.fn(function (this: Element) {
      if (this.getAttribute('data-testid') === 'initiative-modal') return modalRect;
      if (this.getAttribute('data-combatant-id') === 'c1') return cardRect;
      return originalGBCR.call(this);
    });

    try {
      render(<ActiveCombatView combat={combat} user={null} />);
      const modal = screen.getByTestId('initiative-modal');
      expect(modal.style.top).toBe(`${cardRect.top}px`);
      expect(modal.style.left).toBe(`${cardRect.left}px`);
    } finally {
      Element.prototype.getBoundingClientRect = originalGBCR;
    }
  });

  it('the INITIATIVE_MODAL_WIDTH constant and its left-offset subtraction no longer exist', () => {
    const source = require('fs').readFileSync(
      require.resolve('@/lib/components/ActiveCombatView'),
      'utf8',
    );
    expect(source).not.toMatch(/INITIATIVE_MODAL_WIDTH/);
  });

  it('does not throw and shows no modal when the auto-open target has no rendered card', () => {
    const goblin = makeCombatant({ id: 'c1', name: 'Goblin' });
    // combatState has an unrolled combatant, but getDisplayCombatants filters it out
    // so no card (and no [data-combatant-id]) is ever rendered for it.
    const combat = makeCombat({ combatState: makeCombatState({ combatants: [goblin] }) }, []);
    expect(() => render(<ActiveCombatView combat={combat} user={null} />)).not.toThrow();
    expect(screen.queryByTestId('initiative-modal')).not.toBeInTheDocument();
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
});
