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
import { screen } from '@testing-library/react';
import { renderCard } from './CombatantCard.test-helpers';

const banished = { id: 'ban', name: 'Banished', description: 'gone', removedFromPlay: true };

beforeEach(() => {
  localStorage.clear();
});

describe('CombatantCard – removed from play', () => {
  test('a flagged condition greys the card and shows the Banished badge', () => {
    renderCard({ conditions: [banished] });
    expect(screen.getByTestId('combatant-card')).toHaveClass('opacity-50');
    expect(screen.getByTestId('removed-from-play-badge')).toHaveTextContent('Banished');
  });

  test('no flag: neither greying nor badge', () => {
    renderCard({ conditions: [{ id: 'p', name: 'Prone', description: '' }] });
    expect(screen.getByTestId('combatant-card')).not.toHaveClass('opacity-50');
    expect(screen.queryByTestId('removed-from-play-badge')).not.toBeInTheDocument();
  });

  test('a hand-typed custom "Banished" without the flag is not greyed', () => {
    renderCard({ conditions: [{ id: 'c', name: 'Banished', description: '' }] });
    expect(screen.getByTestId('combatant-card')).not.toHaveClass('opacity-50');
    expect(screen.queryByTestId('removed-from-play-badge')).not.toBeInTheDocument();
  });

  test('dead-state greying is unchanged', () => {
    renderCard({ hp: 0, lifeState: 'dead' });
    expect(screen.getByTestId('combatant-card')).toHaveClass('opacity-50');
    expect(screen.queryByTestId('removed-from-play-badge')).not.toBeInTheDocument();
  });
});
