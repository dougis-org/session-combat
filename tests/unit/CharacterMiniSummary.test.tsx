import React from 'react';
import { render, screen } from '@testing-library/react';
import { CharacterMiniSummary } from '@/lib/components/CharacterMiniSummary';

describe('CharacterMiniSummary', () => {
  test('renders full character identity and stats', () => {
    const { container } = render(
      <CharacterMiniSummary
        name="Aragorn"
        race="Human"
        characterType="character"
        classes={[{ class: 'Fighter', level: 5 }]}
        ac={18}
        hp={45}
        maxHp={58}
      />
    );
    expect(screen.getByText('Aragorn')).toBeInTheDocument();
    expect(container).toHaveTextContent('Human');
    expect(container).toHaveTextContent('Fighter');
    expect(container).toHaveTextContent('Lv 5');
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('45/58')).toBeInTheDocument();
  });

  test('renders NPC badge for characterType npc', () => {
    render(
      <CharacterMiniSummary
        name="Innkeeper"
        characterType="npc"
        classes={[]}
        ac={10}
        hp={10}
        maxHp={10}
      />
    );
    expect(screen.getByText('NPC')).toBeInTheDocument();
  });

  test('renders Companion badge for characterType companion', () => {
    render(
      <CharacterMiniSummary
        name="Wolf"
        characterType="companion"
        classes={[]}
        ac={13}
        hp={11}
        maxHp={11}
      />
    );
    expect(screen.getByText('Companion')).toBeInTheDocument();
  });

  test('renders no badge for characterType character', () => {
    render(
      <CharacterMiniSummary
        name="Thorin"
        characterType="character"
        classes={[{ class: 'Fighter', level: 5 }]}
        ac={16}
        hp={40}
        maxHp={40}
      />
    );
    expect(screen.queryByText('NPC')).not.toBeInTheDocument();
    expect(screen.queryByText('Companion')).not.toBeInTheDocument();
  });

  test('sums multiclass levels', () => {
    const { container } = render(
      <CharacterMiniSummary
        name="Robin"
        classes={[{ class: 'Fighter', level: 3 }, { class: 'Rogue', level: 2 }]}
        ac={15}
        hp={35}
        maxHp={35}
      />
    );
    expect(container).toHaveTextContent('Lv 5');
  });

  test('renders with race undefined', () => {
    const { container } = render(
      <CharacterMiniSummary
        name="Mystery"
        race={undefined}
        classes={[{ class: 'Wizard', level: 3 }]}
        ac={12}
        hp={18}
        maxHp={18}
      />
    );
    expect(container).toHaveTextContent('—');
  });

  test('renders without class/level line when classes is empty', () => {
    const { container } = render(
      <CharacterMiniSummary
        name="Commoner"
        classes={[]}
        ac={10}
        hp={8}
        maxHp={8}
      />
    );
    expect(container).not.toHaveTextContent('Lv');
  });

  test('makes no network requests on mount', () => {
    const fetchSpy = jest.fn();
    const originalFetch = global.fetch;
    global.fetch = fetchSpy as unknown as typeof global.fetch;
    try {
      render(
        <CharacterMiniSummary
          name="No Fetch"
          classes={[]}
          ac={10}
          hp={8}
          maxHp={8}
        />
      );
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      global.fetch = originalFetch;
    }
  });
});
