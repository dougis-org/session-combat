/**
 * @jest-environment jsdom
 */
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { LairActionsSlot } from '@/lib/components/LairActionsSlot';
import { CombatantState } from '@/lib/types';

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
  let container: HTMLDivElement;
  let root: Root;

  const renderSlot = async (
    overrides: Partial<CombatantState> = {},
    isActive = false,
    onUpdate: (u: Partial<CombatantState>) => void = () => {},
    onNextTurn: () => void = () => {},
  ) => {
    const combatant = makeLairCombatant(overrides);
    await act(async () => {
      root.render(
        <LairActionsSlot
          combatant={combatant}
          isActive={isActive}
          onUpdate={onUpdate}
          onNextTurn={onNextTurn}
        />
      );
    });
    return { combatant };
  };

  const clickEl = async (testid: string) => {
    const el = container.querySelector(`[data-testid="${testid}"]`) as HTMLElement;
    expect(el).not.toBeNull();
    await act(async () => { el.click(); });
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => { root.unmount(); });
    document.body.removeChild(container);
  });

  test('renders compact badge with lair name when inactive', async () => {
    await renderSlot({}, false);
    expect(container.textContent).toContain("Dragon's Lair");
    // Should NOT show action list
    expect(container.textContent).not.toContain('Earthquake');
  });

  test('renders full action list when active', async () => {
    await renderSlot({}, true);
    expect(container.textContent).toContain('Earthquake');
    expect(container.textContent).toContain('The ground shakes violently.');
    expect(container.textContent).toContain('Rockfall');
    expect(container.textContent).toContain('Volcanic Gas');
  });

  test('Skip button calls onNextTurn', async () => {
    const onNextTurn = jest.fn() as jest.MockedFunction<() => void>;
    await renderSlot({}, true, () => {}, onNextTurn);
    const skipBtn = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.toLowerCase().includes('skip')
    ) as HTMLButtonElement;
    expect(skipBtn).not.toBeNull();
    await act(async () => { skipBtn.click(); });
    expect(onNextTurn).toHaveBeenCalledTimes(1);
  });

  test('Use button decrements charge via onUpdate', async () => {
    const onUpdate = jest.fn() as jest.MockedFunction<(u: Partial<CombatantState>) => void>;
    await renderSlot({}, true, onUpdate);
    await clickEl('lair-action-use-0');
    expect(onUpdate).toHaveBeenCalled();
    expect(getUpdatedLairActions(onUpdate)[0].usesRemaining).toBe(1);
  });

  test('[−] button decrements usesRemaining via onUpdate', async () => {
    const onUpdate = jest.fn() as jest.MockedFunction<(u: Partial<CombatantState>) => void>;
    await renderSlot({}, true, onUpdate);
    await clickEl('lair-action-decrement-0');
    expect(onUpdate).toHaveBeenCalled();
    expect(getUpdatedLairActions(onUpdate)[0].usesRemaining).toBe(1);
  });

  test('[+] button increments usesRemaining via onUpdate', async () => {
    const onUpdate = jest.fn() as jest.MockedFunction<(u: Partial<CombatantState>) => void>;
    await renderSlot({}, true, onUpdate);
    await clickEl('lair-action-increment-0');
    expect(onUpdate).toHaveBeenCalled();
    expect(getUpdatedLairActions(onUpdate)[0].usesRemaining).toBe(3);
  });

  test('Restore All calls onUpdate with all charges incremented', async () => {
    const onUpdate = jest.fn() as jest.MockedFunction<(u: Partial<CombatantState>) => void>;
    await renderSlot({}, true, onUpdate);
    await clickEl('lair-action-restore-all');
    expect(onUpdate).toHaveBeenCalled();
    const updatedActions = getUpdatedLairActions(onUpdate);
    // limited: 2→3, 0→1; unlimited: unchanged
    expect(updatedActions[0].usesRemaining).toBe(3);
    expect(updatedActions[1].usesRemaining).toBe(1);
    expect(updatedActions[2].usesRemaining).toBeUndefined();
  });

  test('Use button disabled when usesRemaining is 0', async () => {
    await renderSlot({}, true);
    const useBtn = container.querySelector('[data-testid="lair-action-use-1"]') as HTMLButtonElement;
    expect(useBtn).not.toBeNull();
    expect(useBtn.disabled).toBe(true);
  });

  test('Use button enabled when usesRemaining > 0', async () => {
    await renderSlot({}, true);
    const useBtn = container.querySelector('[data-testid="lair-action-use-0"]') as HTMLButtonElement;
    expect(useBtn.disabled).toBe(false);
  });

  test('charge controls hidden for actions without usesRemaining', async () => {
    await renderSlot({}, true);
    // Action at index 2 has no usesRemaining — no charge controls
    expect(container.querySelector('[data-testid="lair-action-decrement-2"]')).toBeNull();
    expect(container.querySelector('[data-testid="lair-action-increment-2"]')).toBeNull();
  });

  test('no HP, AC, or conditions rendered', async () => {
    await renderSlot({}, true);
    expect(container.textContent).not.toMatch(/\bHP\b/);
    expect(container.textContent).not.toMatch(/\bAC\b/);
    // conditions section
    expect(container.querySelector('[data-testid="conditions"]')).toBeNull();
  });

  test('exhausted visual indicator shown when usesRemaining is 0', async () => {
    await renderSlot({}, true);
    // Action at index 1 has usesRemaining: 0 — expect exhausted class or text indicator
    const actionEl = container.querySelector('[data-testid="lair-action-1"]');
    expect(actionEl).not.toBeNull();
    expect(actionEl!.className).toMatch(/exhausted|opacity|line-through/);
  });
});
