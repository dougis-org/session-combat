import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlignmentSelect } from '@/lib/components/AlignmentSelect';
import { VALID_ALIGNMENTS } from '@/lib/types';

function renderSelect(props: Partial<Parameters<typeof AlignmentSelect>[0]> = {}) {
  return render(
    <AlignmentSelect value="" onChange={jest.fn() as (v: string) => void} {...props} />,
  );
}

describe('AlignmentSelect', () => {
  test('renders a label with text "Alignment"', () => {
    renderSelect();
    expect(screen.getByText('Alignment')).toBeInTheDocument();
  });

  test('renders a select with aria-label "Alignment"', () => {
    renderSelect();
    expect(screen.getByRole('combobox', { name: 'Alignment' })).toBeInTheDocument();
  });

  test('renders exactly 10 options (1 placeholder + 9 standard alignments) by default', () => {
    renderSelect();
    expect(screen.getAllByRole('option')).toHaveLength(10);
  });

  test('renders all VALID_ALIGNMENTS + placeholder when showExtendedAlignments is true', () => {
    renderSelect({ showExtendedAlignments: true });
    expect(screen.getAllByRole('option')).toHaveLength(VALID_ALIGNMENTS.length + 1);
  });

  test('placeholder option has value "" and text "Select Alignment"', () => {
    renderSelect();
    const placeholder = screen.getByRole('option', { name: 'Select Alignment' }) as HTMLOptionElement;
    expect(placeholder.value).toBe('');
  });

  test('each of the 9 standard alignment options has the correct value', () => {
    renderSelect();
    VALID_ALIGNMENTS.slice(0, 9).forEach((alignment) => {
      const option = screen.getByRole('option', { name: alignment }) as HTMLOptionElement;
      expect(option.value).toBe(alignment);
    });
  });

  test('controlled value: select shows the provided value as selected', () => {
    renderSelect({ value: 'Lawful Good' });
    const select = screen.getByRole('combobox', { name: 'Alignment' }) as HTMLSelectElement;
    expect(select.value).toBe('Lawful Good');
  });

  test('calls onChange with the selected value when user changes the select', async () => {
    const onChange = jest.fn() as jest.MockedFunction<(v: string) => void>;
    const user = userEvent.setup();
    renderSelect({ onChange });
    await user.selectOptions(screen.getByRole('combobox', { name: 'Alignment' }), 'Chaotic Evil');
    expect(onChange).toHaveBeenCalledWith('Chaotic Evil');
  });

  test('select is disabled when disabled prop is true', () => {
    renderSelect({ disabled: true });
    expect(screen.getByRole('combobox', { name: 'Alignment' })).toBeDisabled();
  });

  test('select is not disabled when disabled prop is false', () => {
    renderSelect({ disabled: false });
    expect(screen.getByRole('combobox', { name: 'Alignment' })).not.toBeDisabled();
  });
});
