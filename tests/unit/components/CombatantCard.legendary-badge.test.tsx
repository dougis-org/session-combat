import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderCard } from './CombatantCard.test-helpers';

describe('CombatantCard — legendary action badge', () => {
  test('badge renders as a native button with type="button"', () => {
    renderCard({ legendaryActionCount: 3, legendaryActionsRemaining: 2 });
    const badge = screen.getByTestId('legendary-action-badge');
    expect(badge.tagName).toBe('BUTTON');
    expect(badge).toHaveAttribute('type', 'button');
  });

  test('badge is queryable by role with an accessible name referencing legendary actions', () => {
    renderCard({ legendaryActionCount: 3, legendaryActionsRemaining: 2 });
    expect(screen.getByRole('button', { name: /legendary actions/i })).toBeInTheDocument();
  });

  test('badge preserves the R/N text content', () => {
    renderCard({ legendaryActionCount: 3, legendaryActionsRemaining: 2 });
    expect(screen.getByTestId('legendary-action-badge')).toHaveTextContent('2/3');
  });

  test('clicking the badge calls onShowDetails with the focusSection option', async () => {
    const user = userEvent.setup();
    const onShowDetails = jest.fn();
    renderCard({ legendaryActionCount: 3, legendaryActionsRemaining: 2 }, jest.fn(), { onShowDetails });
    await user.click(screen.getByTestId('legendary-action-badge'));
    expect(onShowDetails).toHaveBeenCalledTimes(1);
    expect(onShowDetails).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({ top: expect.any(Number), left: expect.any(Number) }),
      { focusSection: 'legendary' },
    );
  });

  test('Enter key activates the badge', async () => {
    const user = userEvent.setup();
    const onShowDetails = jest.fn();
    renderCard({ legendaryActionCount: 3, legendaryActionsRemaining: 2 }, jest.fn(), { onShowDetails });
    screen.getByTestId('legendary-action-badge').focus();
    await user.keyboard('{Enter}');
    expect(onShowDetails).toHaveBeenCalledWith(
      'c1',
      expect.any(Object),
      { focusSection: 'legendary' },
    );
  });

  test('Space key activates the badge', async () => {
    const user = userEvent.setup();
    const onShowDetails = jest.fn();
    renderCard({ legendaryActionCount: 3, legendaryActionsRemaining: 2 }, jest.fn(), { onShowDetails });
    screen.getByTestId('legendary-action-badge').focus();
    await user.keyboard(' ');
    expect(onShowDetails).toHaveBeenCalledWith(
      'c1',
      expect.any(Object),
      { focusSection: 'legendary' },
    );
  });

  test('the name-detail-toggle control still calls onShowDetails with only two args', async () => {
    const user = userEvent.setup();
    const onShowDetails = jest.fn();
    renderCard({ legendaryActionCount: 3, legendaryActionsRemaining: 2 }, jest.fn(), { onShowDetails });
    await user.click(screen.getByTestId('combatant-detail-toggle'));
    expect(onShowDetails).toHaveBeenCalledTimes(1);
    const call = onShowDetails.mock.calls[0];
    expect(call).toHaveLength(2);
  });

  test('activating the badge without an onShowDetails handler does not throw', async () => {
    const user = userEvent.setup();
    renderCard({ legendaryActionCount: 3, legendaryActionsRemaining: 2 });
    await expect(user.click(screen.getByTestId('legendary-action-badge'))).resolves.not.toThrow();
  });

  test('badge absent when legendaryActionCount is 0', () => {
    renderCard({ legendaryActionCount: 0 });
    expect(screen.queryByTestId('legendary-action-badge')).not.toBeInTheDocument();
  });

  test('badge absent when legendaryActionCount is undefined', () => {
    renderCard({ legendaryActionCount: undefined });
    expect(screen.queryByTestId('legendary-action-badge')).not.toBeInTheDocument();
  });

  test('badge absent for lair-only combatants (legendary-only affordance)', () => {
    renderCard({
      legendaryActionCount: undefined,
      lairActions: [{ name: 'Tremor', description: 'The ground shakes.' }],
    });
    expect(screen.queryByTestId('legendary-action-badge')).not.toBeInTheDocument();
  });
});
