/**
 * @jest-environment jsdom
 */
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import React from 'react';
import { act } from 'react';
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { LairForm } from '@/lib/components/LairForm';
import { createReactRoot, unmountReactRoot } from '@/tests/unit/helpers/reactRoot';
import type { Root } from 'react-dom/client';

describe('LairForm', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    ({ container, root } = createReactRoot());
  });

  afterEach(async () => {
    await unmountReactRoot(container, root);
  });

  const render = async (props: Partial<Parameters<typeof LairForm>[0]> = {}) => {
    const defaults = {
      seedOptions: [],
      lairName: '',
      seedMonster: '',
      onNameChange: jest.fn() as jest.MockedFunction<(v: string) => void>,
      onSeedChange: jest.fn() as jest.MockedFunction<(v: string) => void>,
      onConfirm: jest.fn() as jest.MockedFunction<() => void>,
      onCancel: jest.fn() as jest.MockedFunction<() => void>,
    };
    const merged = { ...defaults, ...props };
    await act(async () => {
      root.render(<LairForm {...merged} />);
    });
    return merged;
  };

  test('renders lair name input', async () => {
    await render();
    const input = container.querySelector('[data-testid="lair-name-input"]') as HTMLInputElement;
    expect(input).not.toBeNull();
  });

  test('Add Lair button disabled when name is empty', async () => {
    await render({ lairName: '' });
    const btn = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('Add Lair')) as HTMLButtonElement;
    expect(btn?.disabled).toBe(true);
  });

  test('Add Lair button enabled when name has content', async () => {
    await render({ lairName: "Dragon's Lair" });
    const btn = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('Add Lair')) as HTMLButtonElement;
    expect(btn?.disabled).toBe(false);
  });

  test('calls onConfirm when Add Lair clicked', async () => {
    const { onConfirm } = await render({ lairName: 'Test Lair' });
    const btn = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('Add Lair')) as HTMLButtonElement;
    await act(async () => { btn.click(); });
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test('calls onCancel when Cancel clicked', async () => {
    const { onCancel } = await render();
    const btn = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('Cancel')) as HTMLButtonElement;
    await act(async () => { btn.click(); });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('seed select hidden when seedOptions is empty', async () => {
    await render({ seedOptions: [] });
    expect(container.querySelector('[data-testid="lair-seed-select"]')).toBeNull();
  });

  test('seed select shown when seedOptions has entries', async () => {
    await render({ seedOptions: ['Dragon', 'Lich'] });
    const select = container.querySelector('[data-testid="lair-seed-select"]') as HTMLSelectElement;
    expect(select).not.toBeNull();
    expect(select.options.length).toBe(3); // "None" + 2 monsters
  });

  test('input reflects lairName prop', async () => {
    await render({ lairName: 'Test Lair' });
    const input = container.querySelector('[data-testid="lair-name-input"]') as HTMLInputElement;
    expect(input.value).toBe('Test Lair');
  });

  test('Escape key calls onCancel', async () => {
    const { onCancel } = await render();
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('clicking the overlay calls onCancel', async () => {
    const { onCancel } = await render();
    const overlay = container.firstElementChild as HTMLDivElement;
    await act(async () => {
      overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('clicking inside the dialog does not call onCancel', async () => {
    const { onCancel } = await render();
    const dialog = container.querySelector('[role="dialog"]') as HTMLDivElement;
    await act(async () => {
      dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onCancel).not.toHaveBeenCalled();
  });

  test('dialog has correct ARIA attributes', async () => {
    await render();
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.getAttribute('aria-labelledby')).toBeTruthy();
  });

  test('body scroll is locked while mounted', async () => {
    await render();
    expect(document.body.style.overflow).toBe('hidden');
  });

  test('input onChange fires onNameChange with new value', async () => {
    const { onNameChange } = await render();
    const input = container.querySelector('[data-testid="lair-name-input"]') as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    await act(async () => {
      nativeSetter?.call(input, 'New Lair');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(onNameChange).toHaveBeenCalled();
  });

  test('select onChange fires onSeedChange with selected value', async () => {
    const { onSeedChange } = await render({ seedOptions: ['Dragon', 'Lich'] });
    const select = container.querySelector('[data-testid="lair-seed-select"]') as HTMLSelectElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set;
    await act(async () => {
      nativeSetter?.call(select, 'Dragon');
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(onSeedChange).toHaveBeenCalled();
  });
});
