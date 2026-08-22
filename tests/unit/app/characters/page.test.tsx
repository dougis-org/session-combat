import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import CharactersPage from '@/app/characters/page';

jest.mock('@/lib/components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('CharactersPage', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          {
            id: 'char-1',
            name: 'Hero',
            classes: [{ class: 'Fighter', level: 1 }],
            hp: 10,
            maxHp: 10,
            ac: 10,
            characterType: 'character',
            abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
          }
        ])
      })
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders loading state initially', () => {
    render(<CharactersPage />);
    expect(screen.getByText('Loading characters...')).toBeInTheDocument();
  });

  it('loads and displays characters', async () => {
    render(<CharactersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Hero')).toBeInTheDocument();
    });
    
    expect(global.fetch).toHaveBeenCalledWith('/api/characters');
  });
});
