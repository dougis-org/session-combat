/**
 * @jest-environment jsdom
 */
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { LairForm } from '@/lib/components/LairForm';

describe('LairForm', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => { root.unmount(); });
    document.body.removeChild(container);
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
});
