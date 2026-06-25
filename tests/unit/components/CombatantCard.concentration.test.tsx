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
import type { CombatantState } from '@/lib/types';
import { BASE, renderCard } from './CombatantCard.test-helpers';

beforeEach(() => {
  localStorage.clear();
});

async function applyDamage(
  amount: string,
  overrides: Partial<CombatantState> = {},
  extra: Record<string, unknown> = {},
): Promise<jest.Mock> {
  const user = userEvent.setup();
  const onUpdate = renderCard({ hp: 30, maxHp: 30, ...overrides }, jest.fn(), extra);
  const input = screen.getByRole('spinbutton');
  await user.clear(input);
  await user.type(input, amount);
  await user.click(screen.getByRole('button', { name: 'Damage' }));
  return onUpdate as jest.Mock;
}

// ---------------------------------------------------------------------------
// Damage handler — concentration checks
// ---------------------------------------------------------------------------

describe('CombatantCard.concentration — damage handler', () => {
  test('damage to concentrating combatant sets pendingConSaveDC via onUpdate', async () => {
    const onUpdate = await applyDamage('20', { concentratingOn: 'Bless' });
    // effectiveDamage=20 → DC=max(10, floor(20/2))=10
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ pendingConSaveDC: 10 }),
    );
  });

  test('damage > 20 sets DC above 10', async () => {
    const onUpdate = await applyDamage('50', { hp: 100, maxHp: 100, concentratingOn: 'Hold Person' });
    // effectiveDamage=50 → DC=max(10, floor(50/2))=25
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ pendingConSaveDC: 25 }),
    );
  });

  test('lethal damage clears concentratingOn and pendingConSaveDC', async () => {
    const onUpdate = await applyDamage('30', {
      hp: 30,
      maxHp: 30,
      concentratingOn: 'Bless',
      pendingConSaveDC: 15,
    });
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        concentratingOn: undefined,
        pendingConSaveDC: undefined,
      }),
    );
  });

  test('non-lethal damage preserves concentratingOn', async () => {
    const onUpdate = await applyDamage('10', { concentratingOn: 'Bless' });
    const call = onUpdate.mock.calls[0][0];
    expect(call.concentratingOn).toBeUndefined(); // not cleared (only set when 0 hp)
    expect(call.pendingConSaveDC).toBe(10);
  });

  test('damage to non-concentrating combatant does not set pendingConSaveDC', async () => {
    const onUpdate = await applyDamage('20', { concentratingOn: undefined });
    const call = onUpdate.mock.calls[0][0];
    expect(call.pendingConSaveDC).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// onConSaveRequired callback
// ---------------------------------------------------------------------------

describe('CombatantCard.concentration — onConSaveRequired callback', () => {
  test('onConSaveRequired is called with correct DC when concentrating combatant takes effective damage', async () => {
    const onConSaveRequired = jest.fn();
    await applyDamage('20', { concentratingOn: 'Bless' }, { onConSaveRequired });
    expect(onConSaveRequired).toHaveBeenCalledWith(10);
  });

  test('onConSaveRequired is NOT called when concentratingOn is undefined', async () => {
    const onConSaveRequired = jest.fn();
    await applyDamage('20', { concentratingOn: undefined }, { onConSaveRequired });
    expect(onConSaveRequired).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Card UI — concentration badge and DC prompt
// ---------------------------------------------------------------------------

describe('CombatantCard.concentration — badge', () => {
  test('badge renders with spell name when concentratingOn is set', () => {
    renderCard({ concentratingOn: 'Bless' });
    expect(screen.getByTestId('concentration-badge')).toHaveTextContent('Bless');
  });

  test('badge absent when concentratingOn is undefined', () => {
    renderCard({ concentratingOn: undefined });
    expect(screen.queryByTestId('concentration-badge')).not.toBeInTheDocument();
  });
});

describe('CombatantCard.concentration — DC prompt', () => {
  test('DC prompt renders with correct DC value when pendingConSaveDC is set', () => {
    renderCard({ pendingConSaveDC: 15 });
    expect(screen.getByText(/CON Save DC 15/)).toBeInTheDocument();
  });

  test('DC prompt absent when pendingConSaveDC is undefined', () => {
    renderCard({ pendingConSaveDC: undefined });
    expect(screen.queryByText(/CON Save DC/)).not.toBeInTheDocument();
  });

  test('dismiss button clears pendingConSaveDC via onUpdate', async () => {
    const user = userEvent.setup();
    const onUpdate = renderCard({ pendingConSaveDC: 15 });
    await user.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(onUpdate).toHaveBeenCalledWith({ pendingConSaveDC: undefined });
  });
});
