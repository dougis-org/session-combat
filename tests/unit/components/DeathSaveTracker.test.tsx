import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeathSaveTracker } from '@/lib/components/DeathSaveTracker';

function setup(props: Partial<React.ComponentProps<typeof DeathSaveTracker>> = {}) {
  const onToggle = jest.fn();
  const onRoll = jest.fn(() => 14);
  render(
    <DeathSaveTracker
      successes={props.successes ?? 0}
      failures={props.failures ?? 0}
      onToggle={props.onToggle ?? onToggle}
      onRoll={props.onRoll ?? onRoll}
    />,
  );
  return { onToggle, onRoll };
}

describe('DeathSaveTracker', () => {
  test('renders 3 success + 3 failure slots reflecting the counts', () => {
    setup({ successes: 1, failures: 2 });
    expect(screen.getByTestId('death-save-success-0')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('death-save-success-1')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('death-save-failure-0')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('death-save-failure-1')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('death-save-failure-2')).toHaveAttribute('aria-pressed', 'false');
  });

  test('clicking a success slot calls onToggle with the kind and index', async () => {
    const user = userEvent.setup();
    const { onToggle } = setup({ successes: 1 });
    await user.click(screen.getByTestId('death-save-success-1'));
    expect(onToggle).toHaveBeenCalledWith('success', 1);
  });

  test('clicking a failure slot calls onToggle with the kind and index', async () => {
    const user = userEvent.setup();
    const { onToggle } = setup();
    await user.click(screen.getByTestId('death-save-failure-0'));
    expect(onToggle).toHaveBeenCalledWith('failure', 0);
  });

  test('"Roll death save" calls the roll handler and shows the returned value', async () => {
    const user = userEvent.setup();
    const onRoll = jest.fn(() => 17);
    setup({ onRoll });
    await user.click(screen.getByRole('button', { name: 'Roll death save' }));
    expect(onRoll).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('death-save-last-roll')).toHaveTextContent('d20:17');
  });
});
