import React from 'react';
import { render, screen } from '@testing-library/react';
import { CharacterDescription } from '@/lib/components/CharacterDescription';
import { Character } from '@/lib/types';

describe('CharacterDescription', () => {
  const getBaseMock = (): Character => ({
    id: 'char-2',
    userId: 'user-1',
    name: 'Test Character',
    classes: [],
    hp: 10,
    maxHp: 10,
    ac: 10,
    abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  });

  it('renders nothing when no classes, race, or gender', () => {
    const { container } = render(<CharacterDescription character={getBaseMock()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders classes and total level correctly', () => {
    const mock = getBaseMock();
    mock.classes = [
      { class: 'Fighter', level: 3 },
      { class: 'Rogue', level: 2 }
    ];
    render(<CharacterDescription character={mock} />);

    expect(screen.getByText(/Fighter Level 3/)).toBeInTheDocument();
    expect(screen.getByText(/Rogue Level 2/)).toBeInTheDocument();
    expect(screen.getByText(/\(Total Level 5\)/)).toBeInTheDocument();
  });

  it('renders race and gender', () => {
    const mock = getBaseMock();
    mock.race = 'Elf';
    mock.gender = 'Female';
    render(<CharacterDescription character={mock} />);

    expect(screen.getByText('Female Elf')).toBeInTheDocument();
  });

  it('renders only race', () => {
    const mock = getBaseMock();
    mock.race = 'Dwarf';
    render(<CharacterDescription character={mock} />);

    expect(screen.getByText('Dwarf')).toBeInTheDocument();
  });

  it('renders only gender', () => {
    const mock = getBaseMock();
    mock.gender = 'Male';
    render(<CharacterDescription character={mock} />);

    expect(screen.getByText('Male')).toBeInTheDocument();
  });
});
