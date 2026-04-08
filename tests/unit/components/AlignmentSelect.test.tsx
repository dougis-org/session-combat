/**
 * @jest-environment jsdom
 */
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AlignmentSelect } from '@/lib/components/AlignmentSelect';
import { VALID_ALIGNMENTS } from '@/lib/types';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => { root.unmount(); });
  container.remove();
});

function renderSelect(
  value: string,
  onChange: (v: string) => void,
  disabled = false,
) {
  act(() => {
    root.render(
      <AlignmentSelect value={value} onChange={onChange} disabled={disabled} />,
    );
  });
}

describe('AlignmentSelect', () => {
  test('renders a <label> with text "Alignment"', () => {
    renderSelect('', jest.fn() as (v: string) => void);
    const label = container.querySelector('label');
    expect(label).not.toBeNull();
    expect(label!.textContent).toBe('Alignment');
  });

  test('renders a <select> with aria-label="Alignment"', () => {
    renderSelect('', jest.fn() as (v: string) => void);
    const select = container.querySelector('select');
    expect(select).not.toBeNull();
    expect(select!.getAttribute('aria-label')).toBe('Alignment');
  });

  test('renders exactly 10 options (1 placeholder + 9 standard alignments) by default', () => {
    renderSelect('', jest.fn() as (v: string) => void);
    const options = container.querySelectorAll('option');
    // 9 standard alignments (first 9 of VALID_ALIGNMENTS) + 1 placeholder
    expect(options.length).toBe(10);
  });

  test('renders all VALID_ALIGNMENTS + placeholder when showExtendedAlignments is true', () => {
    act(() => {
      root.render(
        <AlignmentSelect value="" onChange={jest.fn() as (v: string) => void} showExtendedAlignments />,
      );
    });
    const options = container.querySelectorAll('option');
    // All VALID_ALIGNMENTS + 1 placeholder
    expect(options.length).toBe(VALID_ALIGNMENTS.length + 1);
  });

  test('placeholder option has value="" and text "Select Alignment"', () => {
    renderSelect('', jest.fn() as (v: string) => void);
    const firstOption = container.querySelector('option') as HTMLOptionElement;
    expect(firstOption.value).toBe('');
    expect(firstOption.textContent).toBe('Select Alignment');
  });

  test('each of the 9 standard alignment options has the correct value', () => {
    renderSelect('', jest.fn() as (v: string) => void);
    const options = Array.from(container.querySelectorAll('option')) as HTMLOptionElement[];
    // Skip the placeholder (index 0)
    const standardAlignments = VALID_ALIGNMENTS.slice(0, 9);
    standardAlignments.forEach((alignment, i) => {
      expect(options[i + 1].value).toBe(alignment);
    });
  });

  test('controlled value: select shows the provided value as selected', () => {
    renderSelect('Lawful Good', jest.fn() as (v: string) => void);
    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe('Lawful Good');
  });

  test('calls onChange with the selected value when user changes the select', () => {
    const onChange = jest.fn() as jest.MockedFunction<(v: string) => void>;
    renderSelect('', onChange);
    const select = container.querySelector('select') as HTMLSelectElement;
    act(() => {
      select.value = 'Chaotic Evil';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith('Chaotic Evil');
  });

  test('select is disabled when disabled prop is true', () => {
    renderSelect('', jest.fn() as (v: string) => void, true);
    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select.disabled).toBe(true);
  });

  test('select is not disabled when disabled prop is false', () => {
    renderSelect('', jest.fn() as (v: string) => void, false);
    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select.disabled).toBe(false);
  });

  test('select is accessible as combobox role with name "Alignment"', () => {
    renderSelect('', jest.fn() as (v: string) => void);
    // A <select> has implicit role "combobox"; accessible name comes from aria-label
    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select.getAttribute('aria-label')).toBe('Alignment');
    expect(select.tagName.toLowerCase()).toBe('select');
  });
});
