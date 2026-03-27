/**
 * @jest-environment jsdom
 */
// Tell React's act() that this is a test environment
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { LegendaryActionsPanel } from '@/lib/components/LegendaryActionsPanel';
import { CombatantState } from '@/lib/types';

const DEFAULT_LEGENDARY_ACTIONS = [
  { name: 'Tail Attack', description: 'Attacks with tail.', cost: 1 },
  { name: 'Psychic Drain', description: 'Drains psychic energy.', cost: 2 },
];

function makeMinimalCombatant(overrides: Partial<CombatantState> = {}): CombatantState {
  return {
    id: 'test-id',
    name: 'Test Monster',
    type: 'monster',
    initiative: 20,
    conditions: [],
    hp: 100,
    maxHp: 100,
    ac: 15,
    abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
    legendaryActions: DEFAULT_LEGENDARY_ACTIONS,
    legendaryActionCount: 3,
    legendaryActionsRemaining: 3,
    ...overrides,
  };
}

describe('LegendaryActionsPanel', () => {
  let container: HTMLDivElement;
  let root: Root;

  const renderPanel = async (
    overrides: Partial<CombatantState> = {},
    onUpdate: (u: Partial<CombatantState>) => void = () => {},
  ) => {
    const combatant = makeMinimalCombatant(overrides);
    await act(async () => {
      root.render(<LegendaryActionsPanel combatant={combatant} onUpdate={onUpdate} />);
    });
    return { combatant, onUpdate };
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

  test('returns null when combatant has no legendary actions', async () => {
    await renderPanel({ legendaryActions: [] });
    expect(container.innerHTML).toBe('');
  });

  test('renders section header with remaining count when lacCount > 0', async () => {
    await renderPanel({ legendaryActionCount: 3, legendaryActionsRemaining: 2 });
    expect(container.textContent).toContain('LEGENDARY ACTIONS');
    expect(container.textContent).toContain('2 remaining');
  });

  test('does not show remaining count when lacCount is 0', async () => {
    await renderPanel({ legendaryActionCount: 0, legendaryActionsRemaining: 0 });
    expect(container.textContent).not.toContain('remaining');
  });

  test('Restore All button calls onUpdate with full pool', async () => {
    const onUpdate = jest.fn() as jest.MockedFunction<(u: Partial<CombatantState>) => void>;
    await renderPanel({ legendaryActionCount: 3, legendaryActionsRemaining: 1 }, onUpdate);
    const restoreBtn = container.querySelector('[data-testid="legendary-action-restore"]') as HTMLButtonElement;
    await act(async () => { restoreBtn.click(); });
    expect(onUpdate).toHaveBeenCalledWith({ legendaryActionsRemaining: 3 });
  });

  test('decrement pool button calls onUpdate with decremented count and clamped remaining', async () => {
    const onUpdate = jest.fn() as jest.MockedFunction<(u: Partial<CombatantState>) => void>;
    await renderPanel({ legendaryActionCount: 3, legendaryActionsRemaining: 3 }, onUpdate);
    const poolEditor = container.querySelector('[data-testid="legendary-action-pool-editor"]') as HTMLElement;
    await act(async () => { (poolEditor.querySelectorAll('button')[0] as HTMLButtonElement).click(); });
    expect(onUpdate).toHaveBeenCalledWith({ legendaryActionCount: 2, legendaryActionsRemaining: 2 });
  });

  test('increment pool button calls onUpdate with incremented count preserving remaining', async () => {
    const onUpdate = jest.fn() as jest.MockedFunction<(u: Partial<CombatantState>) => void>;
    await renderPanel({ legendaryActionCount: 3, legendaryActionsRemaining: 1 }, onUpdate);
    const poolEditor = container.querySelector('[data-testid="legendary-action-pool-editor"]') as HTMLElement;
    await act(async () => { (poolEditor.querySelectorAll('button')[1] as HTMLButtonElement).click(); });
    expect(onUpdate).toHaveBeenCalledWith({ legendaryActionCount: 4, legendaryActionsRemaining: 1 });
  });

  test('Use buttons enabled/disabled based on remaining vs cost', async () => {
    await renderPanel({ legendaryActionCount: 3, legendaryActionsRemaining: 3 });
    expect((container.querySelector('[data-testid="legendary-action-use-0"]') as HTMLButtonElement).disabled).toBe(false);
    expect((container.querySelector('[data-testid="legendary-action-use-1"]') as HTMLButtonElement).disabled).toBe(false);

    await renderPanel({ legendaryActionCount: 3, legendaryActionsRemaining: 1 });
    expect((container.querySelector('[data-testid="legendary-action-use-1"]') as HTMLButtonElement).disabled).toBe(true);
  });

  test('Use button calls onUpdate with decremented remaining', async () => {
    const onUpdate = jest.fn() as jest.MockedFunction<(u: Partial<CombatantState>) => void>;
    await renderPanel({ legendaryActionCount: 3, legendaryActionsRemaining: 3 }, onUpdate);
    await act(async () => { (container.querySelector('[data-testid="legendary-action-use-0"]') as HTMLButtonElement).click(); });
    expect(onUpdate).toHaveBeenCalledWith({ legendaryActionsRemaining: 2 });
  });

  test('Use buttons and Restore All not rendered when lacCount is 0', async () => {
    await renderPanel({ legendaryActionCount: 0, legendaryActionsRemaining: 0 });
    expect(container.querySelector('[data-testid="legendary-action-use-0"]')).toBeNull();
    expect(container.querySelector('[data-testid="legendary-action-restore"]')).toBeNull();
  });

  test('pool editor always rendered; action names and descriptions shown', async () => {
    await renderPanel();
    expect(container.querySelector('[data-testid="legendary-action-pool-editor"]')).not.toBeNull();
    expect(container.textContent).toContain('Tail Attack');
    expect(container.textContent).toContain('Attacks with tail.');
    expect(container.textContent).toContain('Psychic Drain');
  });
});
