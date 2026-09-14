import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  const user = userEvent.setup();
  render(<CreatureStatsForm stats={stats} onChange={onChange} />);
  return { user };
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
    renderForm(BASE_STATS, jest.fn<void, [CreatureStats]>());
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  test('expanding section renders checkboxes for all 13 damage types per field (39 total)', async () => {
    const { user } = renderForm(BASE_STATS, jest.fn<void, [CreatureStats]>());
    await expandResistances(user);
    expect(screen.getAllByRole('checkbox')).toHaveLength(39);
  });

  test('checkboxes are unchecked when no resistances set', async () => {
    const { user } = renderForm(BASE_STATS, jest.fn<void, [CreatureStats]>());
    await expandResistances(user);
    screen.getAllByRole('checkbox').forEach(cb => {
      expect((cb as HTMLInputElement).checked).toBe(false);
    });
  });

  test('pre-selected resistances render as checked', async () => {
    const stats = { ...BASE_STATS, damageResistances: ['fire' as const, 'cold' as const] };
    const { user } = renderForm(stats, jest.fn<void, [CreatureStats]>());
    await expandResistances(user);
    const checked = screen.getAllByRole('checkbox', { checked: true });
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
    const onChange = jest.fn<void, [CreatureStats]>();
    const { user } = renderForm(BASE_STATS, onChange);
    await expandResistances(user);

    const fireCheckbox = within(getSection('Damage Resistances')).getByRole('checkbox', { name: /fire/i });
    await user.click(fireCheckbox);

    expect(onChange).toHaveBeenCalled();
    const callArg = (onChange as jest.Mock).mock.calls[0][0] as CreatureStats;
    expect(callArg.damageResistances).toContain('fire');
  });

  test('unchecking a checked resistance calls onChange with the type removed', async () => {
    const stats = { ...BASE_STATS, damageResistances: ['fire' as const] };
    const onChange = jest.fn<void, [CreatureStats]>();
    const { user } = renderForm(stats, onChange);
    await expandResistances(user);

    const fireCheckbox = within(getSection('Damage Resistances')).getByRole('checkbox', { name: /fire/i });
    expect((fireCheckbox as HTMLInputElement).checked).toBe(true);
    await user.click(fireCheckbox);

    expect(onChange).toHaveBeenCalled();
    const callArg = (onChange as jest.Mock).mock.calls[0][0] as CreatureStats;
    expect(callArg.damageResistances).toBeUndefined();
  });

  test('checking immunity type calls onChange with damageImmunities containing the type', async () => {
    const onChange = jest.fn<void, [CreatureStats]>();
    const { user } = renderForm(BASE_STATS, onChange);
    await expandResistances(user);

    const poisonCheckbox = within(getSection('Damage Immunities')).getByRole('checkbox', { name: /poison/i });
    await user.click(poisonCheckbox);

    expect(onChange).toHaveBeenCalled();
    const callArg = (onChange as jest.Mock).mock.calls[0][0] as CreatureStats;
    expect(callArg.damageImmunities).toContain('poison');
  });

  test('removing last type from a field sets field to undefined', async () => {
    const stats = { ...BASE_STATS, damageVulnerabilities: ['cold' as const] };
    const onChange = jest.fn<void, [CreatureStats]>();
    const { user } = renderForm(stats, onChange);
    await expandResistances(user);

    const coldCheckbox = within(getSection('Damage Vulnerabilities')).getByRole('checkbox', { name: /cold/i });
    expect((coldCheckbox as HTMLInputElement).checked).toBe(true);
    await user.click(coldCheckbox);

    const callArg = (onChange as jest.Mock).mock.calls[0][0] as CreatureStats;
    expect(callArg.damageVulnerabilities).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Shared disclosure chevron per section
// ---------------------------------------------------------------------------

describe('CreatureStatsForm – disclosure chevron per section', () => {
  test('each section shows a chevron reflecting its own independent state', async () => {
    const { user } = renderForm(BASE_STATS, jest.fn<void, [CreatureStats]>());

    const abilitiesBtn = screen.getByRole('button', { name: /ability scores/i });
    const skillsBtn = screen.getByRole('button', { name: /^skills$/i });

    // Abilities starts expanded (default), skills starts collapsed
    expect(abilitiesBtn).toHaveAttribute('aria-expanded', 'true');
    expect(abilitiesBtn.querySelector('svg')).toHaveClass('rotate-90');
    expect(skillsBtn).toHaveAttribute('aria-expanded', 'false');
    expect(skillsBtn.querySelector('svg')).not.toHaveClass('rotate-90');

    await user.click(skillsBtn);
    expect(skillsBtn).toHaveAttribute('aria-expanded', 'true');
    expect(skillsBtn.querySelector('svg')).toHaveClass('rotate-90');
    // Abilities unaffected
    expect(abilitiesBtn).toHaveAttribute('aria-expanded', 'true');
  });

  test('toggling the Skills section does not affect the other sections', async () => {
    const { user } = renderForm(BASE_STATS, jest.fn<void, [CreatureStats]>());

    const abilitiesBtn = screen.getByRole('button', { name: /ability scores/i });
    const skillsBtn = screen.getByRole('button', { name: /^skills$/i });
    const resistancesBtn = screen.getByRole('button', { name: /resistances/i });
    const sensesBtn = screen.getByRole('button', { name: /senses/i });

    await user.click(skillsBtn);

    expect(skillsBtn).toHaveAttribute('aria-expanded', 'true');
    expect(abilitiesBtn).toHaveAttribute('aria-expanded', 'true'); // unchanged default
    expect(resistancesBtn).toHaveAttribute('aria-expanded', 'false');
    expect(sensesBtn).toHaveAttribute('aria-expanded', 'false');
  });

  test('Resistances section toggles through expand and collapse', async () => {
    const { user } = renderForm(BASE_STATS, jest.fn<void, [CreatureStats]>());
    const resistancesBtn = screen.getByRole('button', { name: /resistances/i });

    expect(resistancesBtn).toHaveAttribute('aria-expanded', 'false');
    expect(resistancesBtn.querySelector('svg')).not.toHaveClass('rotate-90');

    await user.click(resistancesBtn);
    expect(resistancesBtn).toHaveAttribute('aria-expanded', 'true');
    expect(resistancesBtn.querySelector('svg')).toHaveClass('rotate-90');

    await user.click(resistancesBtn);
    expect(resistancesBtn).toHaveAttribute('aria-expanded', 'false');
    expect(resistancesBtn.querySelector('svg')).not.toHaveClass('rotate-90');
  });

  test('Senses section toggles through expand and collapse', async () => {
    const { user } = renderForm(BASE_STATS, jest.fn<void, [CreatureStats]>());
    const sensesBtn = screen.getByRole('button', { name: /senses/i });

    expect(sensesBtn).toHaveAttribute('aria-expanded', 'false');
    expect(sensesBtn.querySelector('svg')).not.toHaveClass('rotate-90');

    await user.click(sensesBtn);
    expect(sensesBtn).toHaveAttribute('aria-expanded', 'true');
    expect(sensesBtn.querySelector('svg')).toHaveClass('rotate-90');

    await user.click(sensesBtn);
    expect(sensesBtn).toHaveAttribute('aria-expanded', 'false');
    expect(sensesBtn.querySelector('svg')).not.toHaveClass('rotate-90');
  });
});

// ---------------------------------------------------------------------------
// AbilityEditorSection chevron (Traits / Actions / Bonus Actions / Reactions)
// ---------------------------------------------------------------------------

describe('CreatureStatsForm – ability editor section chevrons', () => {
  test.each(['Traits', 'Actions', 'Bonus Actions', 'Reactions'])(
    '%s section toggles through expand and collapse',
    async title => {
      const { user } = renderForm(BASE_STATS, jest.fn<void, [CreatureStats]>());
      const btn = screen.getByRole('button', { name: new RegExp(`^${title}$`, 'i') });

      expect(btn).toHaveAttribute('aria-expanded', 'false');
      expect(btn.querySelector('svg')).not.toHaveClass('rotate-90');

      await user.click(btn);
      expect(btn).toHaveAttribute('aria-expanded', 'true');
      expect(btn.querySelector('svg')).toHaveClass('rotate-90');

      await user.click(btn);
      expect(btn).toHaveAttribute('aria-expanded', 'false');
      expect(btn.querySelector('svg')).not.toHaveClass('rotate-90');
    }
  );

  test('expanding one ability editor section does not affect the others', async () => {
    const { user } = renderForm(BASE_STATS, jest.fn<void, [CreatureStats]>());
    const traitsBtn = screen.getByRole('button', { name: /^Traits$/i });
    const actionsBtn = screen.getByRole('button', { name: /^Actions$/i });
    const bonusActionsBtn = screen.getByRole('button', { name: /^Bonus Actions$/i });
    const reactionsBtn = screen.getByRole('button', { name: /^Reactions$/i });

    await user.click(actionsBtn);

    expect(actionsBtn).toHaveAttribute('aria-expanded', 'true');
    expect(traitsBtn).toHaveAttribute('aria-expanded', 'false');
    expect(bonusActionsBtn).toHaveAttribute('aria-expanded', 'false');
    expect(reactionsBtn).toHaveAttribute('aria-expanded', 'false');
  });
});
