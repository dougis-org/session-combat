/**
 * @jest-environment jsdom
 */
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import React from 'react';
import { act } from 'react';
import { CombatStatsRow } from '@/lib/components/CombatStatsRow';
import { createReactRoot, unmountReactRoot } from '@/tests/unit/helpers/reactRoot';
import type { Root } from 'react-dom/client';

let container: HTMLDivElement;
let root: Root;

afterEach(() => {
  unmountReactRoot(container, root);
});

function renderComponent(element: React.ReactElement): HTMLDivElement {
  ({ container, root } = createReactRoot());
  act(() => { root.render(element); });
  return container;
}

describe('CombatStatsRow', () => {
  test('renders AC and HP values', () => {
    const container = renderComponent(
      React.createElement(CombatStatsRow, { ac: 18, hp: 45, maxHp: 58 })
    );
    expect(container.textContent).toContain('18');
    expect(container.textContent).toContain('AC');
    expect(container.textContent).toContain('45/58');
    expect(container.textContent).toContain('HP');
  });

  test('renders acNote when provided', () => {
    const container = renderComponent(
      React.createElement(CombatStatsRow, { ac: 14, acNote: 'leather armor', hp: 20, maxHp: 20 })
    );
    expect(container.textContent).toContain('(leather armor)');
  });

  test('renders without acNote when omitted', () => {
    const container = renderComponent(
      React.createElement(CombatStatsRow, { ac: 10, hp: 8, maxHp: 8 })
    );
    expect(container.textContent).not.toContain('(');
  });
});
