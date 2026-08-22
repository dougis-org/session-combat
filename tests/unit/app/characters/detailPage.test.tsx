import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import CharacterDetailPage from '@/app/characters/[id]/page';
import { useParams, useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('@/lib/components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('CharacterDetailPage', () => {
  beforeEach(() => {
    (useParams as jest.Mock).mockReturnValue({ id: 'char-1' });
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
    
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          id: 'char-1',
          name: 'Hero',
          classes: [{ class: 'Fighter', level: 1 }],
          hp: 10,
          maxHp: 10,
          ac: 10,
          abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
        })
      })
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders loading state initially', () => {
    render(<CharacterDetailPage />);
    expect(screen.getByText('Loading character...')).toBeInTheDocument();
  });

  it('loads and displays character', async () => {
    render(<CharacterDetailPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Hero')).toBeInTheDocument();
    });
    
    expect(global.fetch).toHaveBeenCalledWith('/api/characters/char-1');
  });

  it('handles error state', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
      })
    ) as jest.Mock;

    render(<CharacterDetailPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Character not found')).toBeInTheDocument();
    });
  });
});
