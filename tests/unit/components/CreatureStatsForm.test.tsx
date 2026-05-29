/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, jest } from '@jest/globals';
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

function renderForm(stats: CreatureStats, onChange: (s: CreatureStats) => void) {
  render(<CreatureStatsForm stats={stats} onChange={onChange} />);
  return { user: userEvent.setup() };
}

async function expandResistances(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /resistances/i }));
}

function getSection(labelText: string) {
  // scoped by section label text — tied to CreatureStatsForm DOM structure
  return screen.getByText(labelText).closest('div')!;
}

// ---------------------------------------------------------------------------
// Resistances section expand/collapse
// ---------------------------------------------------------------------------

describe('CreatureStatsForm – resistances section', () => {
  test('resistances section is collapsed by default', () => {
    renderForm(BASE_STATS, jest.fn() as any);
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  test('expanding section renders checkboxes for all 13 damage types per field (39 total)', async () => {
    const { user } = renderForm(BASE_STATS, jest.fn() as any);
    await expandResistances(user);
    expect(screen.getAllByRole('checkbox')).toHaveLength(39);
  });

  test('checkboxes are unchecked when no resistances set', async () => {
    const { user } = renderForm(BASE_STATS, jest.fn() as any);
    await expandResistances(user);
    screen.getAllByRole('checkbox').forEach(cb => {
      expect((cb as HTMLInputElement).checked).toBe(false);
    });
  });

  test('pre-selected resistances render as checked', async () => {
    const stats = { ...BASE_STATS, damageResistances: ['fire' as const, 'cold' as const] };
    const { user } = renderForm(stats, jest.fn() as any);
    await expandResistances(user);
    const checked = screen.getAllByRole('checkbox').filter(cb => (cb as HTMLInputElement).checked);
    expect(checked).toHaveLength(2);
    const resistancesSection = getSection('Damage Resistances');
    expect(within(resistancesSection).getAllByRole('checkbox', { checked: true })).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Checkbox toggle behavior
// ---------------------------------------------------------------------------

describe('CreatureStatsForm – checkbox toggle calls onChange', () => {
  test('checking an unchecked resistance calls onChange with the type added', async () => {
    const onChange = jest.fn();
    const { user } = renderForm(BASE_STATS, onChange as any);
    await expandResistances(user);

    const fireCheckbox = within(getSection('Damage Resistances')).getByRole('checkbox', { name: /fire/i });
    await user.click(fireCheckbox);

    expect(onChange).toHaveBeenCalled();
    const callArg = (onChange as jest.Mock).mock.calls[0][0] as CreatureStats;
    expect(callArg.damageResistances).toContain('fire');
  });

  test('unchecking a checked resistance calls onChange with the type removed', async () => {
    const stats = { ...BASE_STATS, damageResistances: ['fire' as const] };
    const onChange = jest.fn();
    const { user } = renderForm(stats, onChange as any);
    await expandResistances(user);

    const fireCheckbox = within(getSection('Damage Resistances')).getByRole('checkbox', { name: /fire/i });
    expect((fireCheckbox as HTMLInputElement).checked).toBe(true);
    await user.click(fireCheckbox);

    expect(onChange).toHaveBeenCalled();
    const callArg = (onChange as jest.Mock).mock.calls[0][0] as CreatureStats;
    expect(callArg.damageResistances).toBeUndefined();
  });

  test('checking immunity type calls onChange with damageImmunities containing the type', async () => {
    const onChange = jest.fn();
    const { user } = renderForm(BASE_STATS, onChange as any);
    await expandResistances(user);

    const poisonCheckbox = within(getSection('Damage Immunities')).getByRole('checkbox', { name: /poison/i });
    await user.click(poisonCheckbox);

    expect(onChange).toHaveBeenCalled();
    const callArg = (onChange as jest.Mock).mock.calls[0][0] as CreatureStats;
    expect(callArg.damageImmunities).toContain('poison');
  });

  test('removing last type from a field sets field to undefined', async () => {
    const stats = { ...BASE_STATS, damageVulnerabilities: ['cold' as const] };
    const onChange = jest.fn();
    const { user } = renderForm(stats, onChange as any);
    await expandResistances(user);

    const coldCheckbox = within(getSection('Damage Vulnerabilities')).getByRole('checkbox', { name: /cold/i });
    expect((coldCheckbox as HTMLInputElement).checked).toBe(true);
    await user.click(coldCheckbox);

    const callArg = (onChange as jest.Mock).mock.calls[0][0] as CreatureStats;
    expect(callArg.damageVulnerabilities).toBeUndefined();
  });
});
