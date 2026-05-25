/**
 * @jest-environment jsdom
 */
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';
import { TargetActionModal } from '@/lib/components/TargetActionModal';
import type { CombatantState } from '@/lib/types';

const TARGET: CombatantState = {
  id: 't1',
  name: 'Goblin Target',
  type: 'monster',
  initiative: 12,
  conditions: [],
  hp: 7,
  maxHp: 7,
  ac: 13,
  abilityScores: { strength: 8, dexterity: 14, constitution: 10, intelligence: 10, wisdom: 8, charisma: 8 },
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  jest.spyOn(window, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  act(() => { root?.unmount(); });
  container.remove();
  jest.restoreAllMocks();
});

function render(
  target: CombatantState,
  onClose: ReturnType<typeof jest.fn>,
  onApplyDamage: ReturnType<typeof jest.fn>,
  onAddCondition: ReturnType<typeof jest.fn>
) {
  act(() => {
    root = createRoot(container);
    root.render(
      <TargetActionModal
        target={target}
        onClose={onClose as any}
        onApplyDamage={onApplyDamage as any}
        onAddCondition={onAddCondition as any}
      />
    );
  });
}

function findButton(text: string): HTMLButtonElement {
  const buttons = Array.from(container.querySelectorAll('button'));
  const found = buttons.find(b => b.textContent?.trim() === text);
  if (!found) throw new Error(`Could not find button with text: ${text}`);
  return found;
}

function renderDefault() {
  const onClose = jest.fn();
  const onApplyDamage = jest.fn();
  const onAddCondition = jest.fn();
  render(TARGET, onClose, onApplyDamage, onAddCondition);
  return { onClose, onApplyDamage, onAddCondition };
}

function changeInputValue(element: HTMLInputElement | HTMLSelectElement, value: string) {
  act(() => {
    const proto = element instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLSelectElement.prototype;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')!.set!;
    nativeSetter.call(element, value);
    const eventType = element instanceof HTMLInputElement ? 'input' : 'change';
    element.dispatchEvent(new Event(eventType, { bubbles: true }));
  });
}

describe('TargetActionModal', () => {
  test('renders target info and buttons', () => {
    renderDefault();

    expect(container.textContent).toContain('Goblin Target');
    expect(container.textContent).toContain('HP: 7/7');
    expect(container.textContent).toContain('AC: 13');
    expect(findButton('Apply Damage')).not.toBeNull();
    expect(findButton('Add Condition')).not.toBeNull();
    expect(findButton('Cancel')).not.toBeNull();
  });

  test('calls onClose when Cancel is clicked', () => {
    const { onClose } = renderDefault();

    act(() => {
      findButton('Cancel').click();
    });

    expect(onClose).toHaveBeenCalled();
  });

  test('transitions to damage screen and fires onApplyDamage', () => {
    const { onApplyDamage } = renderDefault();

    act(() => {
      findButton('Apply Damage').click();
    });

    expect(container.textContent).not.toContain('Apply Damage');
    const input = container.querySelector('input[type="number"]') as HTMLInputElement;
    expect(input).not.toBeNull();

    // Fill damage input
    changeInputValue(input, '5');

    // Select damage type
    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select).not.toBeNull();
    changeInputValue(select, 'fire');

    // Click Apply
    act(() => {
      findButton('Apply (fire)').click();
    });

    expect(onApplyDamage).toHaveBeenCalledWith(5, 'fire');
  });

  test('transitions to condition screen and fires onAddCondition', () => {
    const { onAddCondition } = renderDefault();

    act(() => {
      findButton('Add Condition').click();
    });

    expect(container.textContent).not.toContain('Add Condition');
    const nameInput = container.querySelector('input[placeholder="Condition name"]') as HTMLInputElement;
    const durationInput = container.querySelector('input[placeholder="Duration in rounds (optional)"]') as HTMLInputElement;
    expect(nameInput).not.toBeNull();
    expect(durationInput).not.toBeNull();

    // Fill inputs
    changeInputValue(nameInput, 'Stunned');
    changeInputValue(durationInput, '3');

    // Click Add
    act(() => {
      findButton('Add').click();
    });

    expect(onAddCondition).toHaveBeenCalledWith('Stunned', 3);
  });
});
