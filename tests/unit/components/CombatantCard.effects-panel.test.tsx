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
import type { ActiveDamageEffect, CombatantState } from '@/lib/types';
import { renderCard } from './CombatantCard.test-helpers';

beforeEach(() => {
  localStorage.clear();
});

function renderWithModifiers(
  overrides: Partial<CombatantState> = {},
  onUpdate = jest.fn(),
) {
  return renderCard({ damageResistances: ['fire'], ...overrides }, onUpdate);
}

async function openPanel(
  overrides: Partial<CombatantState> = {},
  onUpdate = jest.fn(),
) {
  const user = userEvent.setup();
  renderWithModifiers(overrides, onUpdate);
  await user.click(screen.getByRole('button', { name: /\+ Add effect/i }));
  return { user, onUpdate };
}

// ---------------------------------------------------------------------------
// Effects panel toggle
// ---------------------------------------------------------------------------

describe('CombatantCard – effects panel toggle', () => {
  test('effects panel is collapsed by default', () => {
    renderCard();
    expect(screen.queryByText(/Apply a combat damage effect/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+ Add effect/i })).toBeInTheDocument();
  });

  test('+ Add effect button visible when stat modifiers present', () => {
    renderWithModifiers();
    expect(screen.getByRole('button', { name: /\+ Add effect/i })).toBeInTheDocument();
  });

  test('clicking + Add effect shows preset panel', async () => {
    await openPanel();
    expect(screen.getByText(/Apply a combat damage effect/)).toBeInTheDocument();
  });

  test('clicking Hide effects collapses panel', async () => {
    const { user } = await openPanel();
    await user.click(screen.getByRole('button', { name: /Hide effects/i }));
    expect(screen.queryByText(/Apply a combat damage effect/)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Preset application
// ---------------------------------------------------------------------------

describe('CombatantCard – preset application', () => {
  test('preset panel lists Rage preset', async () => {
    await openPanel();
    expect(screen.getByRole('button', { name: /^Rage$/i })).toBeInTheDocument();
  });

  test('clicking Rage preset calls onUpdate with B/P/S resistances', async () => {
    const { user, onUpdate } = await openPanel();
    await user.click(screen.getByRole('button', { name: /^Rage$/i }));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({
      activeDamageEffects: expect.arrayContaining([
        expect.objectContaining({ type: 'bludgeoning' }),
        expect.objectContaining({ type: 'piercing' }),
        expect.objectContaining({ type: 'slashing' }),
      ]),
    }));
  });

  test('clicking Rage preset closes the effects panel', async () => {
    const { user } = await openPanel();
    await user.click(screen.getByRole('button', { name: /^Rage$/i }));
    expect(screen.queryByText(/Apply a combat damage effect/)).not.toBeInTheDocument();
  });

  test('clicking Protection from Energy opens type picker', async () => {
    const { user } = await openPanel();
    await user.click(screen.getByRole('button', { name: /Protection from Energy/i }));
    expect(screen.getByText(/Protection from Energy: choose a damage type/i)).toBeInTheDocument();
  });

  test('type picker only shows elemental choices', async () => {
    const { user } = await openPanel();
    await user.click(screen.getByRole('button', { name: /Protection from Energy/i }));
    expect(screen.getByRole('button', { name: /^fire$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^acid$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^bludgeoning$/i })).not.toBeInTheDocument();
  });

  test('selecting a type calls onUpdate with the chosen effect', async () => {
    const { user, onUpdate } = await openPanel();
    await user.click(screen.getByRole('button', { name: /Protection from Energy/i }));
    await user.click(screen.getByRole('button', { name: /^cold$/i }));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({
      activeDamageEffects: expect.arrayContaining([
        expect.objectContaining({ type: 'cold', kind: 'resistance' }),
      ]),
    }));
  });

  test('selecting a type closes both picker and panel', async () => {
    const { user } = await openPanel();
    await user.click(screen.getByRole('button', { name: /Protection from Energy/i }));
    await user.click(screen.getByRole('button', { name: /^fire$/i }));
    expect(screen.queryByText(/choose a damage type/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Apply a combat damage effect/)).not.toBeInTheDocument();
  });

  test('clicking Back returns to preset list', async () => {
    const { user } = await openPanel();
    await user.click(screen.getByRole('button', { name: /Protection from Energy/i }));
    await user.click(screen.getByRole('button', { name: /← Back/i }));
    expect(screen.getByText(/Apply a combat damage effect/)).toBeInTheDocument();
    expect(screen.queryByText(/choose a damage type/i)).not.toBeInTheDocument();
  });

  test('Absorb Elements offers all 13 damage types', async () => {
    const { user } = await openPanel();
    await user.click(screen.getByRole('button', { name: /Absorb Elements/i }));
    const allTypes = ['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder'];
    for (const t of allTypes) {
      expect(screen.getByRole('button', { name: new RegExp(`^${t}$`, 'i') })).toBeInTheDocument();
    }
  });
});
