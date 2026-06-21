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
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CombatantDetailPanel } from '@/lib/components/CombatantDetailPanel';
import type { CombatantState } from '@/lib/types';

const BASE: CombatantState = {
  id: 'c1',
  name: 'Test Fighter',
  type: 'player',
  initiative: 10,
  conditions: [],
  hp: 30,
  maxHp: 30,
  ac: 15,
  abilityScores: {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  },
};

function renderPanel(
  overrides: Partial<CombatantState> = {},
  onUpdate = jest.fn(),
) {
  const combatant = { ...BASE, ...overrides };
  render(
    <CombatantDetailPanel
      combatant={combatant}
      detailPosition={{ top: 0, left: 0 }}
      onClose={jest.fn()}
      onUpdate={onUpdate}
    />,
  );
  return onUpdate as jest.Mock;
}

describe('CombatantDetailPanel — concentration', () => {
  test('input is pre-filled with current spell name', () => {
    renderPanel({ concentratingOn: 'Bless' });
    const input = screen.getByLabelText(/concentrating on spell/i) as HTMLInputElement;
    expect(input.value).toBe('Bless');
  });

  test('input is empty when concentratingOn is undefined', () => {
    renderPanel({ concentratingOn: undefined });
    const input = screen.getByLabelText(/concentrating on spell/i) as HTMLInputElement;
    expect(input.value).toBe('');
  });

  test('submitting a new spell name calls onUpdate with concentratingOn', async () => {
    const user = userEvent.setup();
    const onUpdate = renderPanel({ concentratingOn: undefined });
    const input = screen.getByLabelText(/concentrating on spell/i);
    await user.clear(input);
    await user.type(input, 'Hold Person');
    await user.keyboard('{Enter}');
    expect(onUpdate).toHaveBeenCalledWith('c1', { concentratingOn: 'Hold Person' });
  });

  test('blurring input with value calls onUpdate with concentratingOn', async () => {
    const user = userEvent.setup();
    const onUpdate = renderPanel({ concentratingOn: undefined });
    const input = screen.getByLabelText(/concentrating on spell/i);
    await user.clear(input);
    await user.type(input, 'Web');
    await user.tab();
    expect(onUpdate).toHaveBeenCalledWith('c1', { concentratingOn: 'Web' });
  });

  test('"End Concentration" button is visible when concentrating', () => {
    renderPanel({ concentratingOn: 'Bless' });
    expect(screen.getByRole('button', { name: /end concentration/i })).toBeInTheDocument();
  });

  test('"End Concentration" button is absent when not concentrating', () => {
    renderPanel({ concentratingOn: undefined });
    expect(screen.queryByRole('button', { name: /end concentration/i })).not.toBeInTheDocument();
  });

  test('clicking "End Concentration" calls onUpdate with both fields cleared', async () => {
    const user = userEvent.setup();
    const onUpdate = renderPanel({ concentratingOn: 'Bless', pendingConSaveDC: 12 });
    await user.click(screen.getByRole('button', { name: /end concentration/i }));
    expect(onUpdate).toHaveBeenCalledWith('c1', { concentratingOn: undefined, pendingConSaveDC: undefined });
  });

  test('setting a second spell name overwrites the first', async () => {
    const user = userEvent.setup();
    const onUpdate = renderPanel({ concentratingOn: 'Bless' });
    const input = screen.getByLabelText(/concentrating on spell/i);
    await user.clear(input);
    await user.type(input, 'Hold Person');
    await user.keyboard('{Enter}');
    expect(onUpdate).toHaveBeenCalledWith('c1', { concentratingOn: 'Hold Person' });
  });
});
