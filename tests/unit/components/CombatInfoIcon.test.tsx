/**
 * @jest-environment jsdom
 */

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
import { CombatInfoIcon } from '@/lib/components/CombatInfoIcon';
import type { CombatantState } from '@/lib/types';

const ALIVE_PLAYER: Partial<CombatantState> = {
  id: 'p1',
  name: 'Elara',
  type: 'player',
  hp: 20,
  maxHp: 20,
  ac: 14,
  initiative: 15,
  conditions: [],
  abilityScores: {
    strength: 10,
    dexterity: 14,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  },
};

const DEAD_MONSTER: Partial<CombatantState> = {
  id: 'm1',
  name: 'Goblin',
  type: 'monster',
  hp: 0,
  maxHp: 15,
  ac: 12,
  initiative: 8,
  conditions: [],
  abilityScores: {
    strength: 8,
    dexterity: 14,
    constitution: 10,
    intelligence: 6,
    wisdom: 8,
    charisma: 8,
  },
};

function renderIcon(combatants: Partial<CombatantState>[]) {
  render(<CombatInfoIcon combatants={combatants as CombatantState[]} />);
}

beforeEach(() => localStorage.clear());

describe('CombatInfoIcon', () => {
  it('icon/button element is present on mount', () => {
    renderIcon([ALIVE_PLAYER]);
    expect(screen.getByRole('button', { name: /combat information/i })).toBeInTheDocument();
  });

  it('tooltip panel is NOT in DOM before any interaction', () => {
    renderIcon([ALIVE_PLAYER]);
    expect(screen.queryByText('Elara')).not.toBeInTheDocument();
  });

  it('hovering icon shows tooltip panel', async () => {
    const user = userEvent.setup();
    renderIcon([ALIVE_PLAYER]);
    await user.hover(screen.getByRole('button', { name: /combat information/i }));
    expect(screen.getByText('Elara')).toBeInTheDocument();
  });

  it('unhovering icon hides tooltip panel', async () => {
    const user = userEvent.setup();
    renderIcon([ALIVE_PLAYER]);
    const btn = screen.getByRole('button', { name: /combat information/i });
    await user.hover(btn);
    expect(screen.getByText('Elara')).toBeInTheDocument();
    await user.unhover(btn);
    expect(screen.queryByText('Elara')).not.toBeInTheDocument();
  });

  it('monster name visible after hover', async () => {
    const user = userEvent.setup();
    const ALIVE_MONSTER = { ...DEAD_MONSTER, id: 'm2', hp: 5 };
    renderIcon([ALIVE_MONSTER]);
    await user.hover(screen.getByRole('button', { name: /combat information/i }));
    expect(screen.getByText('Goblin')).toBeInTheDocument();
  });

  it('dead combatant (hp: 0) appears in DEFEATED section after hover', async () => {
    const user = userEvent.setup();
    renderIcon([DEAD_MONSTER]);
    await user.hover(screen.getByRole('button', { name: /combat information/i }));
    expect(screen.getByText(/DEFEATED/i)).toBeInTheDocument();
    expect(screen.getByText('Goblin')).toBeInTheDocument();
  });
});
