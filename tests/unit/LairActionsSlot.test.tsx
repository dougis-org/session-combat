import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LairActionsSlot } from '@/lib/components/LairActionsSlot';
import type { CombatantState } from '@/lib/types';

const DEFAULT_LAIR_ACTIONS = [
  { name: 'Earthquake', description: 'The ground shakes violently.', usesRemaining: 2 },
  { name: 'Rockfall', description: 'Rocks fall from the ceiling.', usesRemaining: 0 },
  { name: 'Volcanic Gas', description: 'Toxic fumes fill the area.' },
];

function makeLairCombatant(overrides: Partial<CombatantState> = {}): CombatantState {
  return {
    id: 'lair-1',
    name: "Dragon's Lair",
    type: 'lair',
    initiative: 20,
    conditions: [],
    hp: 0,
    maxHp: 0,
    ac: 0,
    abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
    lairActions: DEFAULT_LAIR_ACTIONS,
    ...overrides,
  };
}

function getUpdatedLairActions(mock: jest.MockedFunction<(u: Partial<CombatantState>) => void>): typeof DEFAULT_LAIR_ACTIONS {
  return (mock.mock.calls[0][0] as { lairActions: typeof DEFAULT_LAIR_ACTIONS }).lairActions;
}

describe('LairActionsSlot', () => {
  const renderSlot = (
    overrides: Partial<CombatantState> = {},
    isActive = false,
    onUpdate: (u: Partial<CombatantState>) => void = () => {},
    onNextTurn: () => void = () => {},
  ) => {
    const user = userEvent.setup();
    const combatant = makeLairCombatant(overrides);
    const { container } = render(
      <LairActionsSlot
        combatant={combatant}
        isActive={isActive}
        onUpdate={onUpdate}
        onNextTurn={onNextTurn}
      />
    );
    return { combatant, user, container };
  };

  const clickEl = async (testid: string, user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByTestId(testid));
  };

  test('renders compact badge with lair name when inactive', () => {
    renderSlot({}, false);
    expect(screen.getByText(/Dragon's Lair/)).toBeInTheDocument();
    expect(screen.queryByText('Earthquake')).not.toBeInTheDocument();
  });

  test('renders full action list when active', () => {
    renderSlot({}, true);
    expect(screen.getByText('Earthquake')).toBeInTheDocument();
    expect(screen.getByText('The ground shakes violently.')).toBeInTheDocument();
    expect(screen.getByText('Rockfall')).toBeInTheDocument();
    expect(screen.getByText('Volcanic Gas')).toBeInTheDocument();
  });

  test('Skip button calls onNextTurn', async () => {
    const onNextTurn = jest.fn();
    const { user } = renderSlot({}, true, () => {}, onNextTurn);
    await clickEl('lair-action-skip', user);
    expect(onNextTurn).toHaveBeenCalledTimes(1);
  });

  test('Use button decrements charge via onUpdate', async () => {
    const onUpdate = jest.fn() as jest.MockedFunction<(u: Partial<CombatantState>) => void>;
    const { user } = renderSlot({}, true, onUpdate);
    await clickEl('lair-action-use-0', user);
    expect(onUpdate).toHaveBeenCalled();
    expect(getUpdatedLairActions(onUpdate)[0].usesRemaining).toBe(1);
  });

  test('[−] button decrements usesRemaining via onUpdate', async () => {
    const onUpdate = jest.fn() as jest.MockedFunction<(u: Partial<CombatantState>) => void>;
    const { user } = renderSlot({}, true, onUpdate);
    await clickEl('lair-action-decrement-0', user);
    expect(onUpdate).toHaveBeenCalled();
    expect(getUpdatedLairActions(onUpdate)[0].usesRemaining).toBe(1);
  });

  test('[+] button increments usesRemaining via onUpdate', async () => {
    const onUpdate = jest.fn() as jest.MockedFunction<(u: Partial<CombatantState>) => void>;
    const { user } = renderSlot({}, true, onUpdate);
    await clickEl('lair-action-increment-0', user);
    expect(onUpdate).toHaveBeenCalled();
    expect(getUpdatedLairActions(onUpdate)[0].usesRemaining).toBe(3);
  });

  test('Restore All calls onUpdate with all charges incremented', async () => {
    const onUpdate = jest.fn() as jest.MockedFunction<(u: Partial<CombatantState>) => void>;
    const { user } = renderSlot({}, true, onUpdate);
    await clickEl('lair-action-restore-all', user);
    expect(onUpdate).toHaveBeenCalled();
    const updatedActions = getUpdatedLairActions(onUpdate);
    // limited: 2→3, 0→1; unlimited: unchanged
    expect(updatedActions[0].usesRemaining).toBe(3);
    expect(updatedActions[1].usesRemaining).toBe(1);
    expect(updatedActions[2].usesRemaining).toBeUndefined();
  });

  test('Use button disabled when usesRemaining is 0', () => {
    renderSlot({}, true);
    expect(screen.getByTestId('lair-action-use-1')).toBeDisabled();
  });

  test('Use button enabled when usesRemaining > 0', () => {
    renderSlot({}, true);
    expect(screen.getByTestId('lair-action-use-0')).not.toBeDisabled();
  });

  test('charge controls hidden for actions without usesRemaining', () => {
    renderSlot({}, true);
    expect(screen.queryByTestId('lair-action-decrement-2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('lair-action-increment-2')).not.toBeInTheDocument();
  });

  test('no HP, AC, or conditions rendered', () => {
    const { container } = renderSlot({}, true);
    expect(container).not.toHaveTextContent(/\bHP\b/);
    expect(container).not.toHaveTextContent(/\bAC\b/);
    expect(screen.queryByTestId('conditions')).not.toBeInTheDocument();
  });

  test('exhausted visual indicator shown when usesRemaining is 0', () => {
    renderSlot({}, true);
    const actionEl = screen.getByTestId('lair-action-1');
    expect(actionEl.className).toMatch(/exhausted|opacity|line-through/);
  });
});
