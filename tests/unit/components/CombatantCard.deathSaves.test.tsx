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
import { renderCard } from './CombatantCard.test-helpers';
import * as dice from '@/lib/utils/dice';

beforeEach(() => {
  localStorage.clear();
});

async function adjust(
  kind: 'Damage' | 'Heal',
  amount: string,
  overrides: Partial<CombatantState> = {},
): Promise<jest.Mock> {
  const user = userEvent.setup();
  const onUpdate = renderCard(overrides, jest.fn());
  const input = screen.getByRole('spinbutton');
  await user.clear(input);
  await user.type(input, amount);
  await user.click(screen.getByRole('button', { name: kind }));
  return onUpdate as jest.Mock;
}

describe('CombatantCard — death-save HP wiring', () => {
  test('player dropped to 0 HP enters dying with an empty tracker', async () => {
    const onUpdate = await adjust('Damage', '4', { type: 'player', hp: 4, maxHp: 20 });
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        hp: 0,
        lifeState: 'dying',
        deathSaves: { successes: 0, failures: 0 },
      }),
    );
  });

  test('monster dropped to 0 HP does not get death-save fields', async () => {
    const onUpdate = await adjust('Damage', '3', { type: 'monster', hp: 3, maxHp: 3 });
    const call = onUpdate.mock.calls[0][0];
    expect(call.hp).toBe(0);
    expect(call).not.toHaveProperty('lifeState');
    expect(call).not.toHaveProperty('deathSaves');
  });

  test('damage to a dying player adds a failure and stays dying', async () => {
    const onUpdate = await adjust('Damage', '5', {
      type: 'player',
      hp: 0,
      maxHp: 20,
      lifeState: 'dying',
      deathSaves: { successes: 0, failures: 0 },
    });
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        lifeState: 'dying',
        deathSaves: { successes: 0, failures: 1 },
      }),
    );
  });

  test('damage >= maxHp to a dying player is instant death', async () => {
    const onUpdate = await adjust('Damage', '20', {
      type: 'player',
      hp: 0,
      maxHp: 20,
      lifeState: 'dying',
      deathSaves: { successes: 0, failures: 0 },
    });
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ lifeState: 'dead', deathSaves: undefined }),
    );
  });

  test('rolling a natural 20 revives at 1 HP and surfaces the inline note', async () => {
    const rollSpy = jest.spyOn(dice, 'rollDie').mockReturnValue([20]);
    try {
      const user = userEvent.setup();
      const onUpdate = renderCard(
        {
          type: 'player',
          hp: 0,
          maxHp: 20,
          lifeState: 'dying',
          deathSaves: { successes: 1, failures: 2 },
        },
        jest.fn(),
      );
      await user.click(screen.getByRole('button', { name: 'Roll death save' }));
      expect(rollSpy).toHaveBeenCalledWith(20);
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ hp: 1, lifeState: undefined, deathSaves: undefined }),
      );
      expect(screen.getByTestId('death-save-note')).toHaveTextContent('Nat 20 — revived at 1 HP');
    } finally {
      rollSpy.mockRestore();
    }
  });

  test('healing a dying player above 0 clears death-save state', async () => {
    const onUpdate = await adjust('Heal', '6', {
      type: 'player',
      hp: 0,
      maxHp: 20,
      lifeState: 'dying',
      deathSaves: { successes: 1, failures: 2 },
    });
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ hp: 6, lifeState: undefined, deathSaves: undefined }),
    );
  });
});
