import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConditionFormModal } from '@/lib/components/combatant-card/ConditionFormModal';

function setup() {
  const onSubmit = jest.fn();
  const onClose = jest.fn();
  render(<ConditionFormModal combatantName="Aria" onSubmit={onSubmit} onClose={onClose} />);
  return { onSubmit, onClose, user: userEvent.setup() };
}

describe('ConditionFormModal', () => {
  test('submitting a name with empty duration adds a validated condition and closes', async () => {
    const { onSubmit, onClose, user } = setup();
    await user.type(screen.getByTestId('condition-name-input'), 'Prone');
    await user.click(screen.getByTestId('condition-form-add'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Prone', duration: undefined, id: expect.any(String) })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('empty name is rejected', async () => {
    const { onSubmit, onClose, user } = setup();
    await user.click(screen.getByTestId('condition-form-add'));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  test('a name longer than 100 characters is rejected', async () => {
    const { onSubmit, user } = setup();
    await user.type(screen.getByTestId('condition-name-input'), 'x'.repeat(101));
    await user.click(screen.getByTestId('condition-form-add'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test.each(['abc', '0', '20000'])('duration %s is rejected', async (bad) => {
    const { onSubmit, user } = setup();
    await user.type(screen.getByTestId('condition-name-input'), 'Prone');
    await user.type(screen.getByTestId('condition-duration-input'), bad);
    await user.click(screen.getByTestId('condition-form-add'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('a valid duration is passed through', async () => {
    const { onSubmit, user } = setup();
    await user.type(screen.getByTestId('condition-name-input'), 'Blessed');
    await user.type(screen.getByTestId('condition-duration-input'), '3');
    await user.click(screen.getByTestId('condition-form-add'));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Blessed', duration: 3 }));
  });

  test('cancelling with a typed name adds nothing and closes', async () => {
    const { onSubmit, onClose, user } = setup();
    await user.type(screen.getByTestId('condition-name-input'), 'Prone');
    await user.click(screen.getByTestId('condition-form-cancel'));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
