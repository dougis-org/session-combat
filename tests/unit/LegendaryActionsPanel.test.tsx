/**
 * @jest-environment jsdom
 */
// Tell React's act() that this is a test environment
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { LegendaryActionsPanel } from '@/lib/components/LegendaryActionsPanel';
import { CombatantState } from '@/lib/types';

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
    legendaryActions: [
      { name: 'Tail Attack', description: 'Attacks with tail.', cost: 1 },
      { name: 'Psychic Drain', description: 'Drains psychic energy.', cost: 2 },
    ],
    legendaryActionCount: 3,
    legendaryActionsRemaining: 3,
    ...overrides,
  };
}

describe('LegendaryActionsPanel', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  test('returns null when combatant has no legendary actions', async () => {
    const combatant = makeMinimalCombatant({ legendaryActions: [] });
    await act(async () => {
      root.render(<LegendaryActionsPanel combatant={combatant} onUpdate={() => {}} />);
    });
    expect(container.innerHTML).toBe('');
  });

  test('renders section header with remaining count when lacCount > 0', async () => {
    const combatant = makeMinimalCombatant({ legendaryActionCount: 3, legendaryActionsRemaining: 2 });
    await act(async () => {
      root.render(<LegendaryActionsPanel combatant={combatant} onUpdate={() => {}} />);
    });
    expect(container.textContent).toContain('LEGENDARY ACTIONS');
    expect(container.textContent).toContain('2 remaining');
  });

  test('does not show remaining count when lacCount is 0', async () => {
    const combatant = makeMinimalCombatant({ legendaryActionCount: 0, legendaryActionsRemaining: 0 });
    await act(async () => {
      root.render(<LegendaryActionsPanel combatant={combatant} onUpdate={() => {}} />);
    });
    expect(container.textContent).not.toContain('remaining');
  });

  test('Restore All button calls onUpdate with full pool', async () => {
    const onUpdate = jest.fn();
    const combatant = makeMinimalCombatant({ legendaryActionCount: 3, legendaryActionsRemaining: 1 });
    await act(async () => {
      root.render(<LegendaryActionsPanel combatant={combatant} onUpdate={onUpdate as (u: Partial<CombatantState>) => void} />);
    });
    const restoreBtn = container.querySelector('[data-testid="legendary-action-restore"]') as HTMLButtonElement;
    await act(async () => { restoreBtn.click(); });
    expect(onUpdate).toHaveBeenCalledWith({ legendaryActionsRemaining: 3 });
  });

  test('decrement pool button calls onUpdate with decremented count and clamped remaining', async () => {
    const onUpdate = jest.fn();
    const combatant = makeMinimalCombatant({ legendaryActionCount: 3, legendaryActionsRemaining: 3 });
    await act(async () => {
      root.render(<LegendaryActionsPanel combatant={combatant} onUpdate={onUpdate as (u: Partial<CombatantState>) => void} />);
    });
    const poolEditor = container.querySelector('[data-testid="legendary-action-pool-editor"]') as HTMLElement;
    const decrementBtn = poolEditor.querySelectorAll('button')[0] as HTMLButtonElement;
    await act(async () => { decrementBtn.click(); });
    expect(onUpdate).toHaveBeenCalledWith({ legendaryActionCount: 2, legendaryActionsRemaining: 2 });
  });

  test('increment pool button calls onUpdate with incremented count preserving remaining', async () => {
    const onUpdate = jest.fn();
    const combatant = makeMinimalCombatant({ legendaryActionCount: 3, legendaryActionsRemaining: 1 });
    await act(async () => {
      root.render(<LegendaryActionsPanel combatant={combatant} onUpdate={onUpdate as (u: Partial<CombatantState>) => void} />);
    });
    const poolEditor = container.querySelector('[data-testid="legendary-action-pool-editor"]') as HTMLElement;
    const incrementBtn = poolEditor.querySelectorAll('button')[1] as HTMLButtonElement;
    await act(async () => { incrementBtn.click(); });
    expect(onUpdate).toHaveBeenCalledWith({ legendaryActionCount: 4, legendaryActionsRemaining: 1 });
  });

  test('Use button is enabled when remaining >= cost', async () => {
    const combatant = makeMinimalCombatant({ legendaryActionCount: 3, legendaryActionsRemaining: 3 });
    await act(async () => {
      root.render(<LegendaryActionsPanel combatant={combatant} onUpdate={() => {}} />);
    });
    const useBtn0 = container.querySelector('[data-testid="legendary-action-use-0"]') as HTMLButtonElement;
    const useBtn1 = container.querySelector('[data-testid="legendary-action-use-1"]') as HTMLButtonElement;
    expect(useBtn0.disabled).toBe(false);
    expect(useBtn1.disabled).toBe(false);
  });

  test('Use button is disabled when remaining < cost', async () => {
    const combatant = makeMinimalCombatant({ legendaryActionCount: 3, legendaryActionsRemaining: 1 });
    await act(async () => {
      root.render(<LegendaryActionsPanel combatant={combatant} onUpdate={() => {}} />);
    });
    // cost 2 action (index 1) should be disabled when remaining is 1
    const useBtn1 = container.querySelector('[data-testid="legendary-action-use-1"]') as HTMLButtonElement;
    expect(useBtn1.disabled).toBe(true);
  });

  test('Use button calls onUpdate with decremented remaining', async () => {
    const onUpdate = jest.fn();
    const combatant = makeMinimalCombatant({ legendaryActionCount: 3, legendaryActionsRemaining: 3 });
    await act(async () => {
      root.render(<LegendaryActionsPanel combatant={combatant} onUpdate={onUpdate as (u: Partial<CombatantState>) => void} />);
    });
    const useBtn0 = container.querySelector('[data-testid="legendary-action-use-0"]') as HTMLButtonElement;
    await act(async () => { useBtn0.click(); });
    expect(onUpdate).toHaveBeenCalledWith({ legendaryActionsRemaining: 2 });
  });

  test('Use buttons not rendered when lacCount is 0', async () => {
    const combatant = makeMinimalCombatant({ legendaryActionCount: 0, legendaryActionsRemaining: 0 });
    await act(async () => {
      root.render(<LegendaryActionsPanel combatant={combatant} onUpdate={() => {}} />);
    });
    expect(container.querySelector('[data-testid="legendary-action-use-0"]')).toBeNull();
    expect(container.querySelector('[data-testid="legendary-action-restore"]')).toBeNull();
  });

  test('pool editor is always rendered for legendary combatants', async () => {
    const combatant = makeMinimalCombatant({ legendaryActionCount: 0, legendaryActionsRemaining: 0 });
    await act(async () => {
      root.render(<LegendaryActionsPanel combatant={combatant} onUpdate={() => {}} />);
    });
    expect(container.querySelector('[data-testid="legendary-action-pool-editor"]')).not.toBeNull();
  });

  test('renders action names and descriptions', async () => {
    const combatant = makeMinimalCombatant();
    await act(async () => {
      root.render(<LegendaryActionsPanel combatant={combatant} onUpdate={() => {}} />);
    });
    expect(container.textContent).toContain('Tail Attack');
    expect(container.textContent).toContain('Attacks with tail.');
    expect(container.textContent).toContain('Psychic Drain');
  });
});
