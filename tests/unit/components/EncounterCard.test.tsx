import React from 'react';
import { render, screen } from '@testing-library/react';
import { EncounterCard } from '@/lib/components/EncounterCard';
import type { Encounter, Monster } from '@/lib/types';

let monsterSeq = 0;
function makeMonster(overrides: Partial<Monster> = {}): Monster {
  return {
    id: `m-${++monsterSeq}`,
    name: 'Goblin',
    size: 'small',
    type: 'humanoid',
    speed: '30 ft.',
    challengeRating: 0.25,
    ac: 15,
    hp: 7,
    maxHp: 7,
    abilityScores: {
      strength: 8, dexterity: 14, constitution: 10, intelligence: 10, wisdom: 8, charisma: 8,
    },
    ...overrides,
  };
}

function makeEncounter(overrides: Partial<Encounter> = {}): Encounter {
  return {
    id: 'e1',
    userId: 'user-1',
    name: 'Goblin Ambush',
    description: '',
    monsters: [],
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

describe('EncounterCard', () => {
  it('A1 — renders the encounter name and, when present, the description', () => {
    const { rerender } = render(
      <EncounterCard encounter={makeEncounter({ name: 'Goblin Ambush', description: 'Roadside attack' })} />
    );
    expect(screen.getByText('Goblin Ambush')).toBeInTheDocument();
    expect(screen.getByText('Roadside attack')).toBeInTheDocument();

    rerender(<EncounterCard encounter={makeEncounter({ name: 'No Desc', description: '' })} />);
    expect(screen.getByText('No Desc')).toBeInTheDocument();
    expect(screen.queryByText('Roadside attack')).not.toBeInTheDocument();
  });

  it('A2 — renders a "Monsters (N)" heading and one row per monster with name and HP/AC', () => {
    const monsters = [
      makeMonster({ name: 'Goblin A', hp: 7, maxHp: 7, ac: 15 }),
      makeMonster({ name: 'Goblin B', hp: 5, maxHp: 7, ac: 15 }),
      makeMonster({ name: 'Hobgoblin', hp: 11, maxHp: 11, ac: 18 }),
    ];
    render(<EncounterCard encounter={makeEncounter({ monsters })} />);

    expect(screen.getByText('Monsters (3)')).toBeInTheDocument();
    expect(screen.getByText('Goblin A')).toBeInTheDocument();
    expect(screen.getByText('Goblin B')).toBeInTheDocument();
    expect(screen.getByText('Hobgoblin')).toBeInTheDocument();
    expect(screen.getByText(/HP: 7\/7, AC: 15/)).toBeInTheDocument();
    expect(screen.getByText(/HP: 11\/11, AC: 18/)).toBeInTheDocument();
  });

  it('A3 — an encounter with no monsters renders "Monsters (0)" and no rows, no error', () => {
    render(<EncounterCard encounter={makeEncounter({ monsters: [] })} />);
    expect(screen.getByText('Monsters (0)')).toBeInTheDocument();
    expect(screen.queryByText(/HP:/)).not.toBeInTheDocument();
  });

  it('A4 — renders whatever actions the caller passes, and nothing in that slot otherwise', () => {
    const { rerender, container } = render(
      <EncounterCard encounter={makeEncounter()} actions={<button>Edit</button>} />
    );
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();

    rerender(<EncounterCard encounter={makeEncounter()} />);
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });
});
