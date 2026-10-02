import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useConfirmDialog, ConfirmOptions } from '@/lib/hooks/useConfirmDialog';

function Harness({ options, label = 'open' }: { options: ConfirmOptions; label?: string }) {
  const { confirm, dialog } = useConfirmDialog();
  return (
    <>
      <button onClick={() => confirm(options)}>{label}</button>
      {dialog}
    </>
  );
}

function makeOptions(overrides: Partial<ConfirmOptions> = {}): ConfirmOptions {
  return {
    title: 'Delete it?',
    message: 'This cannot be undone.',
    confirmLabel: 'Delete',
    cancelLabel: 'Keep',
    onConfirm: jest.fn(),
    ...overrides,
  };
}

describe('useConfirmDialog', () => {
  it('renders no dialog before confirm() is called', () => {
    render(<Harness options={makeOptions()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('confirm() opens the dialog with title, message, labels and variant', async () => {
    render(<Harness options={makeOptions({ variant: 'danger' })} />);
    await userEvent.click(screen.getByText('open'));
    expect(screen.getByRole('dialog', { name: 'Delete it?' })).toBeInTheDocument();
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-dialog-confirm')).toHaveTextContent('Delete');
    expect(screen.getByTestId('confirm-dialog-confirm')).toHaveClass('bg-red-600');
    expect(screen.getByTestId('confirm-dialog-cancel')).toHaveTextContent('Keep');
  });

  it('confirm click closes the dialog and calls onConfirm exactly once', async () => {
    const options = makeOptions();
    render(<Harness options={options} />);
    await userEvent.click(screen.getByText('open'));
    // Second click lands on nothing: the dialog unmounts after the first.
    await userEvent.dblClick(screen.getByTestId('confirm-dialog-confirm'));
    expect(options.onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it.each([
    ['cancel button', async () => userEvent.click(screen.getByTestId('confirm-dialog-cancel'))],
    ['close ×', async () => userEvent.click(screen.getByRole('button', { name: /close modal/i }))],
    ['Escape', async () => userEvent.keyboard('{Escape}')],
    ['overlay', async () => userEvent.click(screen.getByRole('dialog').parentElement as HTMLElement)],
  ])('%s closes without calling onConfirm', async (_name, act) => {
    const options = makeOptions();
    render(<Harness options={options} />);
    await userEvent.click(screen.getByText('open'));
    await act();
    expect(options.onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('two instances open together have distinct aria-labelledby ids, each resolving to one element', async () => {
    render(
      <>
        <Harness options={makeOptions({ title: 'A' })} label="open-a" />
        <Harness options={makeOptions({ title: 'B' })} label="open-b" />
      </>
    );
    await userEvent.click(screen.getByText('open-a'));
    await userEvent.click(screen.getByText('open-b'));
    const idA = screen.getByRole('dialog', { name: 'A' }).getAttribute('aria-labelledby') as string;
    const idB = screen.getByRole('dialog', { name: 'B' }).getAttribute('aria-labelledby') as string;
    expect(idA).not.toEqual(idB);
    expect(document.querySelectorAll(`[id="${idA}"]`)).toHaveLength(1);
    expect(document.querySelectorAll(`[id="${idB}"]`)).toHaveLength(1);
  });
});
