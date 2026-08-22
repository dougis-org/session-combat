import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterCard } from '@/lib/components/CharacterCard';
import { Character } from '@/lib/types';

const mockCharacter: Character = {
  id: 'char-1',
  ownerId: 'user-1',
  name: 'Test Character',
  level: 5,
  hp: 40,
  maxHp: 40,
  ac: 16,
  acNote: 'Chain Mail',
  abilityScores: {
    str: 15, dex: 12, con: 14, int: 10, wis: 13, cha: 8
  },
  classes: [
    { class: 'Fighter', level: 5 }
  ],
  type: 'humanoid',
  size: 'Medium',
  alignment: 'Neutral Good',
  speed: '30 ft.',
  senses: '',
  languages: ['Common'],
  traits: [],
  actions: [],
  bonusActions: [],
  reactions: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('CharacterCard', () => {
  it('renders character name and basic info', () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    render(<CharacterCard character={mockCharacter} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByText('Test Character')).toBeInTheDocument();
    expect(screen.getByText(/HP: 40 \/ 40/)).toBeInTheDocument();
    expect(screen.getByText(/AC: 16 \(Chain Mail\)/)).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    render(<CharacterCard character={mockCharacter} onEdit={onEdit} onDelete={onDelete} />);

    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when delete button is clicked', () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    render(<CharacterCard character={mockCharacter} onEdit={onEdit} onDelete={onDelete} />);

    fireEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('expands and collapses stat block', () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    render(<CharacterCard character={mockCharacter} onEdit={onEdit} onDelete={onDelete} />);

    // Initially collapsed
    expect(screen.queryByText(/STR/)).not.toBeInTheDocument();

    // Expand
    fireEvent.click(screen.getByText('Expand'));
    expect(screen.getByText('Collapse')).toBeInTheDocument();
    expect(screen.getByText(/STR/)).toBeInTheDocument();

    // Collapse
    fireEvent.click(screen.getByText('Collapse'));
    expect(screen.getByText('Expand')).toBeInTheDocument();
  });
});
