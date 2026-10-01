import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from '@/lib/components/ConfirmDialog';

function renderDialog(overrides: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  render(
    <ConfirmDialog
      isOpen
      title="End Combat?"
      titleId="end-title"
      confirmLabel="End Combat"
      cancelLabel="Return to Combat"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...overrides}
    >
      Are you sure?
    </ConfirmDialog>
  );
  return { onConfirm, onCancel };
}

describe('ConfirmDialog', () => {
  it('renders caller labels with green confirm and red cancel', () => {
    renderDialog();
    expect(screen.getByTestId('confirm-dialog-confirm')).toHaveTextContent('End Combat');
    expect(screen.getByTestId('confirm-dialog-confirm')).toHaveClass('bg-green-600');
    expect(screen.getByTestId('confirm-dialog-cancel')).toHaveTextContent('Return to Combat');
    expect(screen.getByTestId('confirm-dialog-cancel')).toHaveClass('bg-red-600');
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('confirm calls onConfirm once and never onCancel', async () => {
    const { onConfirm, onCancel } = renderDialog();
    await userEvent.click(screen.getByTestId('confirm-dialog-confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it.each([
    ['cancel button', async () => userEvent.click(screen.getByTestId('confirm-dialog-cancel'))],
    ['close ×', async () => userEvent.click(screen.getByRole('button', { name: /close modal/i }))],
    ['Escape', async () => userEvent.keyboard('{Escape}')],
    ['overlay', async () => userEvent.click(screen.getByRole('dialog').parentElement as HTMLElement)],
  ])('%s calls onCancel and never onConfirm', async (_name, act) => {
    const { onConfirm, onCancel } = renderDialog();
    await act();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('renders nothing when closed', () => {
    renderDialog({ isOpen: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('two dialogs keep distinct title ids', () => {
    render(
      <>
        <ConfirmDialog isOpen title="A" titleId="a-title" confirmLabel="y" cancelLabel="n" onConfirm={jest.fn()} onCancel={jest.fn()}>a</ConfirmDialog>
        <ConfirmDialog isOpen title="B" titleId="b-title" confirmLabel="y" cancelLabel="n" onConfirm={jest.fn()} onCancel={jest.fn()}>b</ConfirmDialog>
      </>
    );
    expect(document.querySelectorAll('#a-title')).toHaveLength(1);
    expect(document.querySelectorAll('#b-title')).toHaveLength(1);
    expect(screen.getByRole('dialog', { name: 'A' })).toHaveAttribute('aria-labelledby', 'a-title');
    expect(screen.getByRole('dialog', { name: 'B' })).toHaveAttribute('aria-labelledby', 'b-title');
  });

  it('has aria-modal and an accessible name equal to the title', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog', { name: 'End Combat?' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});
