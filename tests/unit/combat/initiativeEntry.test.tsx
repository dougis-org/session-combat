/**
 * @jest-environment jsdom
 */
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [k: string]: unknown }) =>
    React.createElement('a', { href, ...rest }, children),
}));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock('@/lib/utils/dice');

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';
import { InitiativeEntry } from '@/app/combat/page';
import type { CombatantState, InitiativeRoll } from '@/lib/types';
import * as diceModule from '@/lib/utils/dice';

const mockRollDie = jest.mocked(diceModule.rollDie);

const BASE: CombatantState = {
  id: 'c1',
  name: 'Test Fighter',
  type: 'player',
  initiative: 0,
  conditions: [],
  hp: 30,
  maxHp: 30,
  ac: 15,
  abilityScores: { strength: 10, dexterity: 16, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  mockRollDie.mockReset();
});

afterEach(() => {
  act(() => { root?.unmount(); });
  container.remove();
});

function render(combatant: CombatantState, onSet: ReturnType<typeof jest.fn>) {
  act(() => {
    root = createRoot(container);
    root.render(<InitiativeEntry combatant={combatant} onSet={onSet as any} />);
  });
}

function findButton(text: string): HTMLButtonElement {
  return Array.from(container.querySelectorAll('button')).find(
    b => b.textContent?.trim() === text,
  ) as HTMLButtonElement;
}

function setInputValue(input: HTMLInputElement, value: string) {
  const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  nativeSetter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

// ---------------------------------------------------------------------------
// Section 4: Advantage roll logic
// ---------------------------------------------------------------------------

describe('handleRoll — advantage', () => {
  test('with advantage: takes higher die as roll, stores lower as altRoll, sets advantage: true', () => {
    mockRollDie.mockReturnValue([15, 7]);
    const onSet = jest.fn();
    render({ ...BASE, initiativeAdvantage: true }, onSet);

    act(() => { findButton('Roll d20').click(); });

    expect(mockRollDie).toHaveBeenCalledWith(20, 2);
    const roll = (onSet.mock.calls[0] as [InitiativeRoll])[0];
    expect(roll.roll).toBe(15);
    expect(roll.altRoll).toBe(7);
    expect(roll.advantage).toBe(true);
  });

  test('with advantage: takes higher die even when second roll is higher', () => {
    mockRollDie.mockReturnValue([7, 18]);
    const onSet = jest.fn();
    render({ ...BASE, initiativeAdvantage: true }, onSet);

    act(() => { findButton('Roll d20').click(); });

    const roll = (onSet.mock.calls[0] as [InitiativeRoll])[0];
    expect(roll.roll).toBe(18);
    expect(roll.altRoll).toBe(7);
    expect(roll.advantage).toBe(true);
  });
});

describe('handleRoll — no advantage', () => {
  test('without advantage: uses single die, no altRoll, no advantage flag', () => {
    mockRollDie.mockReturnValue([12]);
    const onSet = jest.fn();
    render({ ...BASE }, onSet);

    act(() => { findButton('Roll d20').click(); });

    expect(mockRollDie).toHaveBeenCalledWith(20);
    const roll = (onSet.mock.calls[0] as [InitiativeRoll])[0];
    expect(roll.roll).toBe(12);
    expect(roll.altRoll).toBeUndefined();
    expect(roll.advantage).toBeFalsy();
  });
});

// ---------------------------------------------------------------------------
// Section 5: Flat bonus application
// ---------------------------------------------------------------------------

describe('handleRoll — flat bonus', () => {
  test('applies flat bonus to total and records it on InitiativeRoll', () => {
    mockRollDie.mockReturnValue([10]);
    const onSet = jest.fn();
    render({ ...BASE, initiativeFlatBonus: 5 }, onSet);

    act(() => { findButton('Roll d20').click(); });

    // DEX 16 = +3, roll 10, flatBonus 5 → total = 18
    const roll = (onSet.mock.calls[0] as [InitiativeRoll])[0];
    expect(roll.flatBonus).toBe(5);
    expect(roll.total).toBe(18); // 10 + 3 + 5
  });

  test('zero flat bonus has no effect and flatBonus is not recorded', () => {
    mockRollDie.mockReturnValue([10]);
    const onSet = jest.fn();
    render({ ...BASE, initiativeFlatBonus: 0 }, onSet);

    act(() => { findButton('Roll d20').click(); });

    // DEX 16 = +3, roll 10, flatBonus 0 → total = 13
    const roll = (onSet.mock.calls[0] as [InitiativeRoll])[0];
    expect(roll.total).toBe(13);
    expect(roll.flatBonus).toBeUndefined();
  });
});

describe('handleDiceEntry — flat bonus', () => {
  test('applies flat bonus to manual dice entry total', () => {
    const onSet = jest.fn();
    render({ ...BASE, initiativeFlatBonus: 2 }, onSet);

    act(() => { findButton('Enter Dice Roll').click(); });

    // Use placeholder to distinguish from flat bonus input
    const input = container.querySelector('input[placeholder="1-20"]') as HTMLInputElement;
    act(() => { setInputValue(input, '12'); });
    act(() => { findButton('Set').click(); });

    // DEX 16 = +3, dice 12, flatBonus 2 → total = 17
    const roll = (onSet.mock.calls[0] as [InitiativeRoll])[0];
    expect(roll.flatBonus).toBe(2);
    expect(roll.total).toBe(17); // 12 + 3 + 2
  });
});

describe('handleTotalEntry — flat bonus', () => {
  test('applies flat bonus on top of entered total', () => {
    const onSet = jest.fn();
    render({ ...BASE, initiativeFlatBonus: 3 }, onSet);

    act(() => { findButton('Enter Total').click(); });

    // Use placeholder to distinguish from flat bonus input
    const input = container.querySelector('input[placeholder="Total initiative"]') as HTMLInputElement;
    act(() => { setInputValue(input, '15'); });
    act(() => { findButton('Set').click(); });

    // Entered 15, flatBonus 3 → total = 18
    const roll = (onSet.mock.calls[0] as [InitiativeRoll])[0];
    expect(roll.flatBonus).toBe(3);
    expect(roll.total).toBe(18); // 15 + 3
  });
});

// ---------------------------------------------------------------------------
// Section 7: onSettingsChange — advantage checkbox
// ---------------------------------------------------------------------------

describe('onSettingsChange — advantage checkbox', () => {
  test('toggling advantage on fires onSettingsChange(true, currentFlatBonus)', () => {
    const onSettingsChange = jest.fn();
    act(() => {
      root = createRoot(container);
      root.render(
        <InitiativeEntry
          combatant={{ ...BASE, initiativeAdvantage: false, initiativeFlatBonus: 4 }}
          onSet={jest.fn() as any}
          onSettingsChange={onSettingsChange as any}
        />
      );
    });

    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    act(() => { checkbox.click(); });

    expect(onSettingsChange).toHaveBeenCalledWith(true, 4);
  });

  test('toggling advantage off fires onSettingsChange(false, currentFlatBonus)', () => {
    const onSettingsChange = jest.fn();
    act(() => {
      root = createRoot(container);
      root.render(
        <InitiativeEntry
          combatant={{ ...BASE, initiativeAdvantage: true, initiativeFlatBonus: 0 }}
          onSet={jest.fn() as any}
          onSettingsChange={onSettingsChange as any}
        />
      );
    });

    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    act(() => { checkbox.click(); });

    expect(onSettingsChange).toHaveBeenCalledWith(false, 0);
  });
});

// ---------------------------------------------------------------------------
// Section 7: onSettingsChange — flat bonus input
// ---------------------------------------------------------------------------

describe('onSettingsChange — flat bonus input', () => {
  test('changing flat bonus input fires onSettingsChange', () => {
    const onSettingsChange = jest.fn();
    act(() => {
      root = createRoot(container);
      root.render(
        <InitiativeEntry
          combatant={{ ...BASE, initiativeAdvantage: false, initiativeFlatBonus: 0 }}
          onSet={jest.fn() as any}
          onSettingsChange={onSettingsChange as any}
        />
      );
    });

    const bonusInput = container.querySelector('input[aria-label="Flat initiative bonus"]') as HTMLInputElement;
    act(() => { setInputValue(bonusInput, '5'); });

    expect(onSettingsChange).toHaveBeenCalledWith(false, 5);
  });

  test('clicking clear button fires onSettingsChange(currentAdvantage, 0)', () => {
    const onSettingsChange = jest.fn();
    act(() => {
      root = createRoot(container);
      root.render(
        <InitiativeEntry
          combatant={{ ...BASE, initiativeAdvantage: true, initiativeFlatBonus: 5 }}
          onSet={jest.fn() as any}
          onSettingsChange={onSettingsChange as any}
        />
      );
    });

    const clearBtn = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.trim() === '✕'
    ) as HTMLButtonElement;
    act(() => { clearBtn.click(); });

    expect(onSettingsChange).toHaveBeenCalledWith(true, 0);
  });
});

// ---------------------------------------------------------------------------
// Section 8: Display — advantage roll detail
// ---------------------------------------------------------------------------

describe('initiative display — advantage roll', () => {
  test('shows winning die with ↑ notation and dropped die when advantage used', () => {
    const combatant: CombatantState = {
      ...BASE,
      initiativeRoll: { roll: 15, altRoll: 7, advantage: true, bonus: 3, total: 18, method: 'rolled' },
    };
    act(() => {
      root = createRoot(container);
      root.render(<InitiativeEntry combatant={combatant} onSet={jest.fn() as any} />);
    });

    const text = container.textContent ?? '';
    expect(text).toContain('15↑');
    expect(text).toContain('7');
  });

  test('shows no dropped die when no advantage', () => {
    const combatant: CombatantState = {
      ...BASE,
      initiativeRoll: { roll: 15, bonus: 3, total: 18, method: 'rolled' },
    };
    act(() => {
      root = createRoot(container);
      root.render(<InitiativeEntry combatant={combatant} onSet={jest.fn() as any} />);
    });

    const text = container.textContent ?? '';
    expect(text).not.toContain('↑');
    expect(text).not.toContain('dropped');
  });
});

describe('initiative display — flat bonus', () => {
  test('shows flat bonus as separate addend when non-zero', () => {
    const combatant: CombatantState = {
      ...BASE,
      initiativeRoll: { roll: 10, bonus: 3, flatBonus: 5, total: 18, method: 'rolled' },
    };
    act(() => {
      root = createRoot(container);
      root.render(<InitiativeEntry combatant={combatant} onSet={jest.fn() as any} />);
    });

    const text = container.textContent ?? '';
    expect(text).toContain('+5');
  });

  test('does not show flat bonus addend when zero or absent', () => {
    const combatant: CombatantState = {
      ...BASE,
      initiativeRoll: { roll: 10, bonus: 3, total: 13, method: 'rolled' },
    };
    act(() => {
      root = createRoot(container);
      root.render(<InitiativeEntry combatant={combatant} onSet={jest.fn() as any} />);
    });

    // The breakdown should show roll + bonus = total only
    const text = container.textContent ?? '';
    expect(text).not.toContain('flatBonus');
  });
});
