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
import { renderCard } from './CombatantCard.test-helpers';

beforeEach(() => {
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// Detail/remove callbacks
// ---------------------------------------------------------------------------

describe('CombatantCard – detail/remove callbacks', () => {
  test('detail toggle triggers onShowDetails with id and position', async () => {
    const user = userEvent.setup();
    const onShowDetails = jest.fn();
    renderCard({}, jest.fn(), { onShowDetails });
    await user.click(screen.getByTestId('combatant-detail-toggle'));
    expect(onShowDetails).toHaveBeenCalledTimes(1);
    const [id, pos] = onShowDetails.mock.calls[0] as [string, { top: number; left: number }];
    expect(id).toBe('c1');
    expect(typeof pos.top).toBe('number');
    expect(typeof pos.left).toBe('number');
  });

  test('remove button triggers onShowRemoveConfirm with id and position', async () => {
    const user = userEvent.setup();
    const onShowRemoveConfirm = jest.fn();
    renderCard({}, jest.fn(), { onShowRemoveConfirm });
    await user.click(screen.getByTitle('Remove combatant'));
    expect(onShowRemoveConfirm).toHaveBeenCalledTimes(1);
    const [id, pos] = onShowRemoveConfirm.mock.calls[0] as [string, { top: number; left: number }];
    expect(id).toBe('c1');
    expect(typeof pos.top).toBe('number');
    expect(typeof pos.left).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// Damage type select
// ---------------------------------------------------------------------------

describe('CombatantCard – damage type select', () => {
  test('damage type select renders with grouped options', () => {
    renderCard();
    const select = screen.getByLabelText('Damage type (for resistance/immunity/vulnerability)');
    const optgroups = select.querySelectorAll('optgroup');
    expect(optgroups.length).toBe(4);
  });

  test('damage type select has empty default option', () => {
    renderCard();
    const select = screen.getByLabelText('Damage type (for resistance/immunity/vulnerability)') as HTMLSelectElement;
    expect(select.value).toBe('');
  });

  test('Damage button applies typed damage when type is selected', async () => {
    const user = userEvent.setup();
    const onUpdate = renderCard({ hp: 30, damageImmunities: ['fire'] });
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '10');
    await user.selectOptions(
      screen.getByLabelText('Damage type (for resistance/immunity/vulnerability)'),
      'fire',
    );
    await user.click(screen.getByRole('button', { name: 'Damage' }));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ hp: 30 }));
  });

  test('Damage button applies untyped damage when no type selected', async () => {
    const user = userEvent.setup();
    const onUpdate = renderCard({ hp: 30 });
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '10');
    await user.click(screen.getByRole('button', { name: 'Damage' }));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ hp: 20 }));
  });
});
