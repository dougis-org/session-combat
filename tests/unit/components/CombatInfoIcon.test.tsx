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

const BASE_ABILITY_SCORES = {
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
};

const ALIVE_PLAYER: Partial<CombatantState> = {
  id: 'p1',
  name: 'Elara',
  type: 'player',
  hp: 20,
  maxHp: 20,
  ac: 14,
  initiative: 15,
  conditions: [],
  abilityScores: BASE_ABILITY_SCORES,
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
  abilityScores: BASE_ABILITY_SCORES,
};

const ALIVE_MONSTER: Partial<CombatantState> = {
  id: 'm2',
  name: 'Dragon',
  type: 'monster',
  hp: 30,
  maxHp: 30,
  ac: 15,
  initiative: 10,
  conditions: [],
  abilityScores: BASE_ABILITY_SCORES,
};

const ALIVE_PLAYER_WITH_CONDITION: Partial<CombatantState> = {
  id: 'p2',
  name: 'Theron',
  type: 'player',
  hp: 15,
  maxHp: 15,
  ac: 13,
  initiative: 12,
  conditions: [{ id: 'c1', name: 'Poisoned', description: '', duration: 3 }],
  abilityScores: BASE_ABILITY_SCORES,
};

const ALIVE_PLAYER_CONDITION_NO_DURATION: Partial<CombatantState> = {
  id: 'p3',
  name: 'Kira',
  type: 'player',
  hp: 10,
  maxHp: 10,
  ac: 12,
  initiative: 9,
  conditions: [{ id: 'c2', name: 'Blinded', description: '' }],
  abilityScores: BASE_ABILITY_SCORES,
};

const GOBLIN_1: Partial<CombatantState> = {
  id: 'g1',
  name: 'Goblin',
  type: 'monster',
  hp: 7,
  maxHp: 7,
  ac: 12,
  initiative: 6,
  conditions: [],
  abilityScores: BASE_ABILITY_SCORES,
};

const GOBLIN_2: Partial<CombatantState> = {
  id: 'g2',
  name: 'Goblin',
  type: 'monster',
  hp: 7,
  maxHp: 7,
  ac: 12,
  initiative: 4,
  conditions: [],
  abilityScores: BASE_ABILITY_SCORES,
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

async function hoverIcon(user: ReturnType<typeof userEvent.setup>) {
  await user.hover(screen.getByRole('button', { name: /combat information/i }));
}

describe('Column layout and headings', () => {
  it('shows PLAYERS (1) and MONSTERS (1) after hover with one alive of each', async () => {
    const user = userEvent.setup();
    renderIcon([ALIVE_PLAYER, ALIVE_MONSTER]);
    await hoverIcon(user);
    expect(screen.getByText(/PLAYERS \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/MONSTERS \(1\)/)).toBeInTheDocument();
  });

  it('excludes dead combatants from header count', async () => {
    const user = userEvent.setup();
    renderIcon([ALIVE_PLAYER, DEAD_MONSTER]);
    await hoverIcon(user);
    expect(screen.getByText(/PLAYERS \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/MONSTERS \(0\)/)).toBeInTheDocument();
  });
});

describe('×N grouping', () => {
  it('groups two same-name monsters with ×2 multiplier', async () => {
    const user = userEvent.setup();
    renderIcon([GOBLIN_1, GOBLIN_2]);
    await hoverIcon(user);
    expect(screen.getByText('Goblin')).toBeInTheDocument();
    expect(screen.getByText('×2')).toBeInTheDocument();
  });

  it('single combatant renders without multiplier', async () => {
    const user = userEvent.setup();
    renderIcon([ALIVE_MONSTER]);
    await hoverIcon(user);
    expect(screen.getByText('Dragon')).toBeInTheDocument();
    expect(screen.queryByText(/×/)).not.toBeInTheDocument();
  });
});

describe('Status conditions', () => {
  it('renders condition with duration as "• Poisoned (3)"', async () => {
    const user = userEvent.setup();
    renderIcon([ALIVE_PLAYER_WITH_CONDITION]);
    await hoverIcon(user);
    expect(screen.getByText('• Poisoned (3)')).toBeInTheDocument();
  });

  it('renders condition without duration without trailing parenthesis', async () => {
    const user = userEvent.setup();
    renderIcon([ALIVE_PLAYER_CONDITION_NO_DURATION]);
    await hoverIcon(user);
    expect(screen.getByText('• Blinded')).toBeInTheDocument();
    expect(screen.queryByText(/Blinded \(/)).not.toBeInTheDocument();
  });
});

describe('DEFEATED section', () => {
  it('shows DEFEATED label when a dead combatant exists', async () => {
    const user = userEvent.setup();
    renderIcon([DEAD_MONSTER]);
    await hoverIcon(user);
    expect(screen.getByText(/DEFEATED/i)).toBeInTheDocument();
  });

  it('omits DEFEATED label when all combatants are alive', async () => {
    const user = userEvent.setup();
    renderIcon([ALIVE_PLAYER, ALIVE_MONSTER]);
    await hoverIcon(user);
    expect(screen.queryByText(/DEFEATED/i)).not.toBeInTheDocument();
  });
});

describe('Strikethrough on dead combatants', () => {
  it('dead combatant name has an ancestor with class line-through', async () => {
    const user = userEvent.setup();
    renderIcon([DEAD_MONSTER]);
    await hoverIcon(user);
    const nameEl = screen.getByText('Goblin');
    expect(nameEl.closest('.line-through')).not.toBeNull();
  });
});

describe('"None" fallback text', () => {
  it('shows "None" in Players column when only monsters are present', async () => {
    const user = userEvent.setup();
    renderIcon([ALIVE_MONSTER]);
    await hoverIcon(user);
    expect(screen.getByText('None')).toBeInTheDocument();
  });

  it('shows "None" in Monsters column when only players are present', async () => {
    const user = userEvent.setup();
    renderIcon([ALIVE_PLAYER]);
    await hoverIcon(user);
    expect(screen.getByText('None')).toBeInTheDocument();
  });
});

describe('Independent column sections', () => {
  it('one alive player + one dead monster: Players has no DEFEATED, Monsters does', async () => {
    const user = userEvent.setup();
    renderIcon([ALIVE_PLAYER, DEAD_MONSTER]);
    await hoverIcon(user);
    expect(screen.getByText(/DEFEATED/i)).toBeInTheDocument();
    expect(screen.getByText('Elara')).toBeInTheDocument();
    expect(screen.getByText('Elara').closest('.line-through')).toBeNull();
  });
});

describe('Empty state', () => {
  it('shows "No combatants" when combatant array is empty', async () => {
    const user = userEvent.setup();
    renderIcon([]);
    await hoverIcon(user);
    expect(screen.getByText(/No combatants/i)).toBeInTheDocument();
  });
});
