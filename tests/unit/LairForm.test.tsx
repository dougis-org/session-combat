import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LairForm } from '@/lib/components/LairForm';

describe('LairForm', () => {
  const renderLairForm = (props: Partial<Parameters<typeof LairForm>[0]> = {}) => {
    const defaults = {
      seedOptions: [] as string[],
      lairName: '',
      seedMonster: '',
      onNameChange: jest.fn() as jest.MockedFunction<(v: string) => void>,
      onSeedChange: jest.fn() as jest.MockedFunction<(v: string) => void>,
      onConfirm: jest.fn() as jest.MockedFunction<() => void>,
      onCancel: jest.fn() as jest.MockedFunction<() => void>,
    };
    const merged = { ...defaults, ...props };
    const { container } = render(<LairForm {...merged} />);
    return { container, ...merged };
  };

  test('renders lair name input', () => {
    renderLairForm();
    expect(screen.getByTestId('lair-name-input')).toBeInTheDocument();
  });

  test('Add Lair button disabled when name is empty', () => {
    renderLairForm({ lairName: '' });
    expect(screen.getByRole('button', { name: /Add Lair/i })).toBeDisabled();
  });

  test('Add Lair button enabled when name has content', () => {
    renderLairForm({ lairName: "Dragon's Lair" });
    expect(screen.getByRole('button', { name: /Add Lair/i })).not.toBeDisabled();
  });

  test('calls onConfirm when Add Lair clicked', async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderLairForm({ lairName: 'Test Lair' });
    await user.click(screen.getByRole('button', { name: /Add Lair/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test('calls onCancel when Cancel clicked', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderLairForm();
    await user.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('seed select hidden when seedOptions is empty', () => {
    renderLairForm({ seedOptions: [] });
    expect(screen.queryByTestId('lair-seed-select')).not.toBeInTheDocument();
  });

  test('seed select shown when seedOptions has entries', () => {
    renderLairForm({ seedOptions: ['Dragon', 'Lich'] });
    const select = screen.getByTestId('lair-seed-select') as HTMLSelectElement;
    expect(select.options.length).toBe(3); // "None" + 2 monsters
  });

  test('input reflects lairName prop', () => {
    renderLairForm({ lairName: 'Test Lair' });
    expect(screen.getByTestId('lair-name-input')).toHaveValue('Test Lair');
  });

  test('Escape key calls onCancel', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderLairForm();
    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('clicking the overlay calls onCancel', () => {
    const { container, onCancel } = renderLairForm();
    // fireEvent is intentional: userEvent.click targets the visual center (the dialog),
    // which stops propagation. We need to fire directly on the overlay element.
    fireEvent.click(container.firstElementChild as HTMLDivElement);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('clicking inside the dialog does not call onCancel', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderLairForm();
    await user.click(screen.getByRole('dialog'));
    expect(onCancel).not.toHaveBeenCalled();
  });

  test('dialog has correct ARIA attributes', () => {
    renderLairForm();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
  });

  test('body scroll is locked while mounted', () => {
    renderLairForm();
    expect(document.body.style.overflow).toBe('hidden');
  });

  test('input onChange fires onNameChange with new value', () => {
    const { onNameChange } = renderLairForm();
    fireEvent.change(screen.getByTestId('lair-name-input'), { target: { value: 'New Lair' } });
    expect(onNameChange).toHaveBeenCalledWith('New Lair');
  });

  test('select onChange fires onSeedChange with selected value', () => {
    const { onSeedChange } = renderLairForm({ seedOptions: ['Dragon', 'Lich'] });
    fireEvent.change(screen.getByTestId('lair-seed-select'), { target: { value: 'Dragon' } });
    expect(onSeedChange).toHaveBeenCalledWith('Dragon');
  });
});
