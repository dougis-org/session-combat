import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
  const mockRouter = { push: jest.fn() };
  
  beforeEach(() => {
    (useParams as jest.Mock).mockReturnValue({ id: 'char-1' });
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    global.confirm = jest.fn(() => true);
    global.alert = jest.fn();
    
    global.fetch = jest.fn((url) => {
      if (url === '/api/characters/char-1') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'char-1',
            name: 'Hero',
            characterType: 'character',
            hp: 10,
            maxHp: 10,
            ac: 10,
            abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
            externalSync: {
              provider: 'dndbeyond',
              url: 'https://ddb.ac/characters/12345'
            }
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    }) as jest.Mock;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders loading state initially', () => {
    render(<CharacterDetailPage />);
    expect(screen.getByText('Loading character...')).toBeInTheDocument();
  });

  it('loads and displays the character', async () => {
    render(<CharacterDetailPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Hero')).toBeInTheDocument();
    });
    
    expect(global.fetch).toHaveBeenCalledWith('/api/characters/char-1');
  });

  it('handles delete character', async () => {
    render(<CharacterDetailPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Hero')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteBtn);

    expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this character?');
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/characters/char-1', expect.objectContaining({
        method: 'DELETE'
      }));
    });
    
    expect(mockRouter.push).toHaveBeenCalledWith('/characters');
  });

  it('handles sync character from D&D Beyond', async () => {
    (global.fetch as jest.Mock).mockImplementation((url, options) => {
      if (url === '/api/characters/char-1') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'char-1',
            name: 'Hero',
            characterType: 'character',
            hp: 10,
            maxHp: 10,
            ac: 10,
            abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
            externalSync: {
              provider: 'dndbeyond',
              url: 'https://ddb.ac/characters/12345'
            }
          })
        });
      }
      if (url === '/api/characters/import') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            character: {
              id: 'char-1',
              name: 'Hero Synced',
              hp: 12,
              maxHp: 12,
              ac: 10,
              abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
            }
          })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<CharacterDetailPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Hero')).toBeInTheDocument();
    });

    const syncBtn = screen.getByRole('button', { name: /sync from d&d beyond/i });
    fireEvent.click(syncBtn);

    expect(screen.getByText('Warning: Full Replacement')).toBeInTheDocument();

    const confirmSyncBtn = screen.getByRole('button', { name: /confirm sync/i });
    fireEvent.click(confirmSyncBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/characters/import', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ url: 'https://ddb.ac/characters/12345', overwrite: true })
      }));
    });

    await waitFor(() => {
      expect(screen.getByText('Hero Synced')).toBeInTheDocument();
    });
  });
  it('shows sync button when viewing a character', async () => {
    render(<CharacterDetailPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Hero')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /sync from d&d beyond/i })).toBeInTheDocument();
  });

  it('shows sync button when editing a character', async () => {
    render(<CharacterDetailPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Hero')).toBeInTheDocument();
    });

    const editBtn = screen.getByRole('button', { name: /edit character/i });
    fireEvent.click(editBtn);

    expect(screen.getByRole('button', { name: /sync from d&d beyond/i })).toBeInTheDocument();
  });

  it('handles sync character from D&D Beyond while editing', async () => {
    (global.fetch as jest.Mock).mockImplementation((url, options) => {
      if (url === '/api/characters/char-1') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'char-1',
            name: 'Hero',
            characterType: 'character',
            hp: 10,
            maxHp: 10,
            ac: 10,
            abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
            externalSync: {
              provider: 'dndbeyond',
              url: 'https://ddb.ac/characters/12345'
            }
          })
        });
      }
      if (url === '/api/characters/import') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            character: {
              id: 'char-1',
              name: 'Hero Synced',
              hp: 12,
              maxHp: 12,
              ac: 10,
              abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
            }
          })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<CharacterDetailPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Hero')).toBeInTheDocument();
    });

    const editBtn = screen.getByRole('button', { name: /edit character/i });
    fireEvent.click(editBtn);

    const syncBtn = screen.getByRole('button', { name: /sync from d&d beyond/i });
    fireEvent.click(syncBtn);

    expect(screen.getByText('Warning: Full Replacement')).toBeInTheDocument();

    const confirmSyncBtn = screen.getByRole('button', { name: /confirm sync/i });
    fireEvent.click(confirmSyncBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/characters/import', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ url: 'https://ddb.ac/characters/12345', overwrite: true })
      }));
    });

    await waitFor(() => {
      expect(screen.getByText('Hero Synced')).toBeInTheDocument();
    });
  });
});
