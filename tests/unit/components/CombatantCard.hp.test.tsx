/**
 * @jest-environment jsdom
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

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

import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CombatantState } from '@/lib/types';
import { BASE, renderCard } from './CombatantCard.test-helpers';

const ENEMY: CombatantState = { ...BASE, id: 'e1', name: 'Goblin', type: 'monster' };

async function applyDamageHelper(
  amount: string,
  overrides: Partial<CombatantState> = {},
  damageType?: string,
): Promise<jest.Mock> {
  const user = userEvent.setup();
  const onUpdate = renderCard({ hp: 30, maxHp: 30, ...overrides });
  const input = screen.getByRole('spinbutton');
  await user.clear(input);
  await user.type(input, amount);
  if (damageType) {
    await user.selectOptions(
      screen.getByLabelText('Damage type (for resistance/immunity/vulnerability)'),
      damageType,
    );
  }
  await user.click(screen.getByRole('button', { name: 'Damage' }));
  return onUpdate as jest.Mock;
}

beforeEach(() => {
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// T1 — HP display
// ---------------------------------------------------------------------------

describe('CombatantCard.hp — HP display', () => {
  test('health-bar width is 100% when hp equals maxHp', () => {
    renderCard({ hp: 30, maxHp: 30 });
    expect(screen.getByTestId('health-bar')).toHaveStyle({ width: '100%' });
  });

  test('health-bar width is ~50% when hp is half maxHp', () => {
    renderCard({ hp: 15, maxHp: 30 });
    expect(screen.getByTestId('health-bar')).toHaveStyle({ width: '50%' });
  });

  test('health-bar width is <25% when hp is near zero', () => {
    renderCard({ hp: 5, maxHp: 30 });
    const width = parseFloat(screen.getByTestId('health-bar').style.width);
    expect(width).toBeLessThan(25);
  });

  test('skull emoji appears in heading when hp is 0', () => {
    renderCard({ hp: 0 });
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('☠️');
  });

  test('skull emoji absent from heading when hp is positive', () => {
    renderCard({ hp: 1 });
    expect(screen.getByRole('heading', { level: 3 })).not.toHaveTextContent('☠️');
  });

  test('temp-hp-bar is present when tempHp > 0', () => {
    renderCard({ tempHp: 5 });
    expect(screen.getByTestId('temp-hp-bar')).toBeInTheDocument();
  });

  test('temp-hp-bar is absent when tempHp is undefined', () => {
    renderCard();
    expect(screen.queryByTestId('temp-hp-bar')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// T2 — Damage application
// ---------------------------------------------------------------------------

describe('CombatantCard.hp — damage application', () => {
  test('normal damage reduces hp by full amount', async () => {
    const onUpdate = await applyDamageHelper('10');
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ hp: 20 }));
  });

  test('fire resistance halves damage (rounded down)', async () => {
    const onUpdate = await applyDamageHelper('10', { damageResistances: ['fire'] }, 'fire');
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ hp: 25 }));
  });

  test('fire resistance — 1 damage becomes 0 (floor)', async () => {
    const onUpdate = await applyDamageHelper('1', { damageResistances: ['fire'] }, 'fire');
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ hp: 30 }));
  });

  test('fire immunity — hp unchanged', async () => {
    const onUpdate = await applyDamageHelper('20', { damageImmunities: ['fire'] }, 'fire');
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ hp: 30 }));
  });

  test('fire vulnerability — damage doubled', async () => {
    const onUpdate = await applyDamageHelper('5', { damageVulnerabilities: ['fire'] }, 'fire');
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ hp: 20 }));
  });

  test('vulnerability floors HP at 0, not negative', async () => {
    const onUpdate = await applyDamageHelper('10', { hp: 5, damageVulnerabilities: ['fire'] }, 'fire');
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ hp: 0 }));
  });
});

// ---------------------------------------------------------------------------
// T3 — Temp HP drain
// ---------------------------------------------------------------------------

describe('CombatantCard.hp — temp HP drain', () => {
  test('damage ≤ tempHp — real hp unchanged, tempHp reduced', async () => {
    const onUpdate = await applyDamageHelper('3', { tempHp: 5 });
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ hp: 30, tempHp: 2 }));
  });

  test('damage > tempHp — temp HP zeroed, excess hits real HP', async () => {
    const onUpdate = await applyDamageHelper('8', { tempHp: 5 });
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ hp: 27, tempHp: 0 }));
  });

  test('tempHp: 0 — all damage hits real HP', async () => {
    const onUpdate = await applyDamageHelper('10', { tempHp: 0 });
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ hp: 20, tempHp: 0 }));
  });
});

// ---------------------------------------------------------------------------
// T4 — Conditions
// ---------------------------------------------------------------------------

describe('CombatantCard.hp — conditions', () => {
  test('"Conditions (1)" button present when combatant has one condition', () => {
    renderCard({ conditions: [{ id: 'c1', name: 'Poisoned', description: '' }] });
    expect(screen.getByRole('button', { name: /Conditions \(1\)/ })).toBeInTheDocument();
  });

  test('no Conditions button when combatant has no conditions', () => {
    renderCard({ conditions: [] });
    expect(screen.queryByRole('button', { name: /Conditions/ })).not.toBeInTheDocument();
  });

  test('clicking Conditions button expands condition list', async () => {
    const user = userEvent.setup();
    renderCard({ conditions: [{ id: 'c1', name: 'Poisoned', description: '' }] });
    await user.click(screen.getByRole('button', { name: /Conditions \(1\)/ }));
    expect(screen.getByText('Poisoned')).toBeInTheDocument();
  });

  test('clicking Remove on only condition calls onUpdate with empty array', async () => {
    const user = userEvent.setup();
    const onUpdate = renderCard({ conditions: [{ id: 'c1', name: 'Poisoned', description: '' }] });
    await user.click(screen.getByRole('button', { name: /Conditions \(1\)/ }));
    await user.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ conditions: [] }));
  });

  test('two conditions — remove first — onUpdate called with only second', async () => {
    const user = userEvent.setup();
    const conditions = [
      { id: 'c1', name: 'Poisoned', description: '' },
      { id: 'c2', name: 'Blinded', description: '' },
    ];
    const onUpdate = renderCard({ conditions });
    await user.click(screen.getByRole('button', { name: /Conditions \(2\)/ }));
    const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
    await user.click(removeButtons[0]);
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({
      conditions: [{ id: 'c2', name: 'Blinded', description: '' }],
    }));
  });
});

// ---------------------------------------------------------------------------
// T5 — Additional branch coverage
// ---------------------------------------------------------------------------

describe('CombatantCard.hp — healing', () => {
  test('Heal button calls onUpdate with increased hp', async () => {
    const user = userEvent.setup();
    const onUpdate = renderCard({ hp: 20, maxHp: 30 });
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '5');
    await user.click(screen.getByRole('button', { name: 'Heal' }));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ hp: 25 }));
  });

  test('Heal button caps hp at maxHp', async () => {
    const user = userEvent.setup();
    const onUpdate = renderCard({ hp: 28, maxHp: 30 });
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '10');
    await user.click(screen.getByRole('button', { name: 'Heal' }));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ hp: 30 }));
  });
});

describe('CombatantCard.hp — set temp HP', () => {
  test('Temp checkbox toggles button label to Set Temp', async () => {
    const user = userEvent.setup();
    renderCard();
    await user.click(screen.getByRole('checkbox', { name: /Temp/ }));
    expect(screen.getByRole('button', { name: 'Set Temp' })).toBeInTheDocument();
  });

  test('Set Temp button calls onUpdate with tempHp', async () => {
    const user = userEvent.setup();
    const onUpdate = renderCard({ hp: 30, maxHp: 30 });
    await user.click(screen.getByRole('checkbox', { name: /Temp/ }));
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '10');
    await user.click(screen.getByRole('button', { name: 'Set Temp' }));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ tempHp: 10 }));
  });
});

describe('CombatantCard.hp — active combatant', () => {
  test('isActive combatant shows Current Turn button', () => {
    renderCard({}, jest.fn(), { isActive: true, onNextTurn: jest.fn() });
    expect(screen.getByRole('button', { name: /Current Turn/ })).toBeInTheDocument();
  });

  test('clicking Current Turn calls onNextTurn', async () => {
    const user = userEvent.setup();
    const onNextTurn = jest.fn();
    renderCard({}, jest.fn(), { isActive: true, onNextTurn });
    await user.click(screen.getByRole('button', { name: /Current Turn/ }));
    expect(onNextTurn).toHaveBeenCalledTimes(1);
  });
});

describe('CombatantCard.hp — misc display', () => {
  test('notes text is rendered when provided', () => {
    renderCard({ notes: 'Flanking bonus active' });
    expect(screen.getByText('Flanking bonus active')).toBeInTheDocument();
  });

  test('tempHp amount shown in hp text when tempHp > 0', () => {
    renderCard({ tempHp: 5 });
    expect(screen.getByText(/\+5 tmp/)).toBeInTheDocument();
  });

  test('legendary action badge shown when legendaryActionCount > 0', () => {
    renderCard({ legendaryActionCount: 3, legendaryActionsRemaining: 2 });
    expect(screen.getByTestId('legendary-action-badge')).toBeInTheDocument();
    expect(screen.getByTestId('legendary-action-badge')).toHaveTextContent('2/3');
  });

  test('health-bar width is between 25% and 50% when hp is in yellow range', () => {
    renderCard({ hp: 10, maxHp: 30 });
    const width = parseFloat(screen.getByTestId('health-bar').style.width);
    expect(width).toBeGreaterThan(25);
    expect(width).toBeLessThan(50);
  });

  test('hpPercent is 0 when maxHp and tempHp are both 0', () => {
    renderCard({ hp: 0, maxHp: 0 });
    expect(screen.getByTestId('health-bar')).toHaveStyle({ width: '0%' });
  });
});

describe('CombatantCard.hp — initiative roll display', () => {
  test('shows rolled initiative details when method is rolled', () => {
    renderCard({
      initiative: 15,
      initiativeRoll: { method: 'rolled', roll: 12, bonus: 3, total: 15 },
    });
    expect(screen.getByText(/d20:12\+3/)).toBeInTheDocument();
  });

  test('shows rolled initiative with advantage indicator', () => {
    renderCard({
      initiative: 18,
      initiativeRoll: { method: 'rolled', roll: 15, bonus: 3, total: 18, advantage: true },
    });
    expect(screen.getByText(/d20:15↑\+3/)).toBeInTheDocument();
  });

  test('shows manual initiative with roll and flatBonus', () => {
    renderCard({
      initiative: 15,
      initiativeRoll: { method: 'manual', roll: 13, bonus: 0, total: 15, flatBonus: 2 },
    });
    expect(screen.getByText(/13\+2/)).toBeInTheDocument();
  });

  test('shows manual initiative bonus when non-zero', () => {
    renderCard({
      initiative: 14,
      initiativeRoll: { method: 'manual', roll: 12, bonus: 2, total: 14 },
    });
    expect(screen.getByText(/12\+2/)).toBeInTheDocument();
  });
});

describe('CombatantCard.hp — targeting UI', () => {
  function renderWithAllCombatants(overrides: Partial<CombatantState> = {}, onUpdate = jest.fn()) {
    const combatant = { ...BASE, ...overrides };
    return renderCard(overrides, onUpdate, {
      allCombatants: [combatant, ENEMY],
      onUpdateCombatant: jest.fn(),
    });
  }

  test('Add Target(s) button opens targeting panel', async () => {
    const user = userEvent.setup();
    renderWithAllCombatants();
    await user.click(screen.getByRole('button', { name: /Add Target/ }));
    expect(screen.getByText(/Select targets for Test Fighter/)).toBeInTheDocument();
  });

  test('targeting panel shows Enemies and Party sections', async () => {
    const user = userEvent.setup();
    renderWithAllCombatants();
    await user.click(screen.getByRole('button', { name: /Add Target/ }));
    expect(screen.getByText('Enemies')).toBeInTheDocument();
    expect(screen.getByText('Party')).toBeInTheDocument();
  });

  test('clicking Add Target(s) again collapses the panel', async () => {
    const user = userEvent.setup();
    renderWithAllCombatants();
    await user.click(screen.getByRole('button', { name: /Add Target/ }));
    await user.click(screen.getByRole('button', { name: /Add Target/ }));
    expect(screen.queryByText(/Select targets for Test Fighter/)).not.toBeInTheDocument();
  });

  test('checking enemy in targeting panel calls onUpdate with targetIds', async () => {
    const user = userEvent.setup();
    const onUpdate = renderWithAllCombatants();
    await user.click(screen.getByRole('button', { name: /Add Target/ }));
    await user.click(screen.getByRole('checkbox', { name: 'Goblin' }));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ targetIds: ['e1'] }));
  });

  test('target chips rendered when combatant has targetIds', () => {
    renderWithAllCombatants({ targetIds: ['e1'] });
    expect(screen.getByText('Targets:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Goblin' })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Undo HP button
// ---------------------------------------------------------------------------

describe('CombatantCard – Undo HP button', () => {
  test('Undo HP button is disabled when history is empty', () => {
    renderCard();
    expect(screen.getByTestId('undo-hp-change')).toBeDisabled();
  });

  test('Undo HP button is enabled after applying damage', async () => {
    const user = userEvent.setup();
    renderCard({ hp: 30 });
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '5');
    await user.click(screen.getByRole('button', { name: 'Damage' }));
    expect(screen.getByTestId('undo-hp-change')).not.toBeDisabled();
  });

  test('Undo HP button stays disabled when immune combatant receives typed damage', async () => {
    const user = userEvent.setup();
    renderCard({ hp: 30, damageImmunities: ['fire'] });
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '10');
    await user.selectOptions(
      screen.getByLabelText('Damage type (for resistance/immunity/vulnerability)'),
      'fire',
    );
    await user.click(screen.getByRole('button', { name: 'Damage' }));
    expect(screen.getByTestId('undo-hp-change')).toBeDisabled();
  });

  test('clicking Undo HP calls onUpdate with the previous hp/tempHp snapshot', async () => {
    const user = userEvent.setup();
    const onUpdate = renderCard({ hp: 30 });
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '10');
    await user.click(screen.getByRole('button', { name: 'Damage' }));
    await user.click(screen.getByTestId('undo-hp-change'));
    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ hp: 30, tempHp: 0 }));
  });

  test('Undo HP button becomes disabled again after undo exhausts history', async () => {
    const user = userEvent.setup();
    renderCard({ hp: 30 });
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '5');
    await user.click(screen.getByRole('button', { name: 'Damage' }));
    await user.click(screen.getByTestId('undo-hp-change'));
    expect(screen.getByTestId('undo-hp-change')).toBeDisabled();
  });

  test('Undo HP does not push a new history entry (undo is not itself undoable)', async () => {
    const user = userEvent.setup();
    renderCard({ hp: 30 });
    const input = screen.getByRole('spinbutton');
    // Apply damage twice — two history entries, button enabled
    await user.clear(input);
    await user.type(input, '5');
    await user.click(screen.getByRole('button', { name: 'Damage' }));
    await user.clear(input);
    await user.type(input, '3');
    await user.click(screen.getByRole('button', { name: 'Damage' }));
    // Undo first time — one entry remains, button still enabled
    await user.click(screen.getByTestId('undo-hp-change'));
    expect(screen.getByTestId('undo-hp-change')).not.toBeDisabled();
    // Undo second time — history empty, button disabled
    await user.click(screen.getByTestId('undo-hp-change'));
    expect(screen.getByTestId('undo-hp-change')).toBeDisabled();
  });
});
