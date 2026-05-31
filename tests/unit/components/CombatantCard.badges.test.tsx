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
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ActiveDamageEffect } from '@/lib/types';
import { renderCard } from './CombatantCard.test-helpers';

beforeEach(() => {
  localStorage.clear();
});

describe('CombatantCard – stat damage modifier badges', () => {
  test('renders without crash for base combatant', () => {
    renderCard();
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Test Fighter');
  });

  test('no damage modifier section shown when no resistances/effects', () => {
    renderCard();
    expect(screen.queryByText(/IMM:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/RES:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/VULN:/)).not.toBeInTheDocument();
  });

  test('shows immunity badge for each stat immunity', () => {
    renderCard({ damageImmunities: ['fire', 'poison'] });
    expect(screen.getByText(/IMM: fire/)).toBeInTheDocument();
    expect(screen.getByText(/IMM: poison/)).toBeInTheDocument();
  });

  test('shows resistance badge for each stat resistance', () => {
    renderCard({ damageResistances: ['cold', 'bludgeoning'] });
    expect(screen.getByText(/RES: cold/)).toBeInTheDocument();
    expect(screen.getByText(/RES: bludgeoning/)).toBeInTheDocument();
  });

  test('shows vulnerability badge for each stat vulnerability', () => {
    renderCard({ damageVulnerabilities: ['fire'] });
    expect(screen.getByText(/VULN: fire/)).toBeInTheDocument();
  });

  test('shows active effect badge with label and remove button', () => {
    const activeDamageEffects: ActiveDamageEffect[] = [
      { type: 'slashing', kind: 'resistance', label: 'Rage' },
    ];
    renderCard({ activeDamageEffects });
    expect(screen.getByText(/RES: slashing/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Rage' })).toBeInTheDocument();
  });

  test('active effect badge shows IMM prefix for immunity kind', () => {
    const activeDamageEffects: ActiveDamageEffect[] = [
      { type: 'necrotic', kind: 'immunity', label: 'Undead Immunity' },
    ];
    renderCard({ activeDamageEffects });
    expect(screen.getByText(/IMM: necrotic/)).toBeInTheDocument();
  });

  test('active effect badge shows VULN prefix for vulnerability kind', () => {
    const activeDamageEffects: ActiveDamageEffect[] = [
      { type: 'radiant', kind: 'vulnerability', label: 'Light Sensitivity' },
    ];
    renderCard({ activeDamageEffects });
    expect(screen.getByText(/VULN: radiant/)).toBeInTheDocument();
  });
});

describe('CombatantCard – remove active effect', () => {
  test('clicking remove button calls onUpdate with effect removed', async () => {
    const user = userEvent.setup();
    const activeDamageEffects: ActiveDamageEffect[] = [
      { type: 'cold', kind: 'resistance', label: 'Fire Shield' },
    ];
    const onUpdate = renderCard({ activeDamageEffects });
    await user.click(screen.getByRole('button', { name: 'Remove Fire Shield' }));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ activeDamageEffects: [] }));
  });
});
