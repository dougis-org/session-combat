/**
 * @jest-environment jsdom
 */
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { CreatureStatsForm } from '@/lib/components/CreatureStatsForm';
import type { CreatureStats } from '@/lib/types';

const BASE_STATS: CreatureStats = {
  hp: 20,
  maxHp: 20,
  ac: 13,
  abilityScores: {
    strength: 10, dexterity: 10, constitution: 10,
    intelligence: 10, wisdom: 10, charisma: 10,
  },
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  act(() => { root?.unmount(); });
  container.remove();
});

function render(stats: CreatureStats, onChange: (s: CreatureStats) => void) {
  act(() => {
    root = createRoot(container);
    root.render(<CreatureStatsForm stats={stats} onChange={onChange} />);
  });
}

function clickResistancesHeader() {
  const resistancesBtn = Array.from(container.querySelectorAll('button')).find(
    b => b.textContent?.includes('Resistances'),
  );
  act(() => { (resistancesBtn as HTMLButtonElement).click(); });
}

function renderExpanded(stats: CreatureStats, onChange: (s: CreatureStats) => void) {
  render(stats, onChange);
  clickResistancesHeader();
}

// ---------------------------------------------------------------------------
// Resistances section expand/collapse
// ---------------------------------------------------------------------------

describe('CreatureStatsForm – resistances section', () => {
  test('resistances section is collapsed by default', () => {
    const onChange = jest.fn();
    render(BASE_STATS, onChange as any);
    // When collapsed, checkboxes for damage types should not be present
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBe(0);
  });

  test('expanding section renders checkboxes for all 13 damage types per field (39 total)', () => {
    renderExpanded(BASE_STATS, jest.fn() as any);
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    // 3 fields × 13 types = 39 checkboxes
    expect(checkboxes.length).toBe(39);
  });

  test('checkboxes are unchecked when no resistances set', () => {
    renderExpanded(BASE_STATS, jest.fn() as any);
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => expect((cb as HTMLInputElement).checked).toBe(false));
  });

  test('pre-selected resistances render as checked', () => {
    const stats = { ...BASE_STATS, damageResistances: ['fire' as const, 'cold' as const] };
    renderExpanded(stats, jest.fn() as any);
    // Find the fire resistance checkbox (first field group = vulnerabilities, second = resistances)
    const labels = container.querySelectorAll('label');
    const fireLabel = Array.from(labels).find(l => {
      const span = l.querySelector('span');
      return span?.textContent === 'fire' && l.closest('div[data-field]') === null;
    });
    // Simpler: check that exactly 2 checkboxes in the form are checked (one for fire, one for cold in the resistance section)
    const checked = Array.from(container.querySelectorAll('input[type="checkbox"]')).filter(
      cb => (cb as HTMLInputElement).checked
    );
    expect(checked.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Checkbox toggle behavior
// ---------------------------------------------------------------------------

describe('CreatureStatsForm – checkbox toggle calls onChange', () => {
  test('checking an unchecked resistance calls onChange with the type added', () => {
    const onChange = jest.fn();
    renderExpanded(BASE_STATS, onChange as any);

    // Find the resistance section — it's the second group of 13 checkboxes
    // We look for an unchecked checkbox adjacent to a span saying "fire"
    const allLabels = Array.from(container.querySelectorAll('label'));
    // The component renders: vulnerabilities (1st), resistances (2nd), immunities (3rd)
    // Each group has 13 checkboxes. Find the fire checkbox in the resistance group (index 13..25).
    const allCheckboxes = Array.from(container.querySelectorAll('input[type="checkbox"]'));
    // resistance group starts at index 13 (after 13 vulnerabilities)
    const fireInResistances = allCheckboxes[13]; // first type 'bludgeoning' in resistance group...
    // Actually we want 'fire' which is the 4th type in Physical+Elemental order
    // Physical: bludgeoning(0), piercing(1), slashing(2) → indices 13, 14, 15 in resistance
    // Elemental: acid(3), cold(4), fire(5) → indices 16, 17, 18 in resistance
    const fireResistanceCheckbox = allCheckboxes[18]; // fire in the resistance section

    act(() => {
      (fireResistanceCheckbox as HTMLInputElement).click();
    });

    expect(onChange).toHaveBeenCalled();
    const callArg = (onChange as jest.Mock).mock.calls[0][0] as CreatureStats;
    expect(callArg.damageResistances).toContain('fire');
  });

  test('unchecking a checked resistance calls onChange with the type removed', () => {
    const stats = { ...BASE_STATS, damageResistances: ['fire' as const] };
    const onChange = jest.fn();
    renderExpanded(stats, onChange as any);

    // Find the checked fire checkbox in the resistance group
    const checkedBoxes = Array.from(container.querySelectorAll('input[type="checkbox"]')).filter(
      cb => (cb as HTMLInputElement).checked
    );
    expect(checkedBoxes.length).toBe(1);

    act(() => {
      (checkedBoxes[0] as HTMLInputElement).click();
    });

    expect(onChange).toHaveBeenCalled();
    const callArg = (onChange as jest.Mock).mock.calls[0][0] as CreatureStats;
    // When last type is removed, field should be undefined (falsy)
    expect(callArg.damageResistances).toBeFalsy();
  });

  test('checking immunity type calls onChange with damageImmunities containing the type', () => {
    const onChange = jest.fn();
    renderExpanded(BASE_STATS, onChange as any);

    // Immunity group is the third set of 13 (indices 26-38)
    // DAMAGE_TYPE_GROUPS order: Physical (bludgeoning,piercing,slashing), Elemental (acid,cold,fire,lightning,thunder), Energy & Planar (force,necrotic,radiant), Other (poison,psychic)
    // poison is index 11 within each group, so in immunity group: 26 + 11 = 37
    const allCheckboxes = Array.from(container.querySelectorAll('input[type="checkbox"]'));
    const poisonImmunityCheckbox = allCheckboxes[37]; // poison in immunities

    act(() => {
      (poisonImmunityCheckbox as HTMLInputElement).click();
    });

    expect(onChange).toHaveBeenCalled();
    const callArg = (onChange as jest.Mock).mock.calls[0][0] as CreatureStats;
    expect(callArg.damageImmunities).toContain('poison');
  });

  test('removing last type from a field sets field to undefined', () => {
    const stats = { ...BASE_STATS, damageVulnerabilities: ['cold' as const] };
    const onChange = jest.fn();
    renderExpanded(stats, onChange as any);

    const checkedBoxes = Array.from(container.querySelectorAll('input[type="checkbox"]')).filter(
      cb => (cb as HTMLInputElement).checked
    );
    expect(checkedBoxes.length).toBe(1);

    act(() => {
      (checkedBoxes[0] as HTMLInputElement).click();
    });

    const callArg = (onChange as jest.Mock).mock.calls[0][0] as CreatureStats;
    expect(callArg.damageVulnerabilities).toBeUndefined();
  });
});
