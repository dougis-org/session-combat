/**
 * @jest-environment jsdom
 */
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import React from 'react';
import { act } from 'react';
import { describe, test, expect, afterEach } from '@jest/globals';
import { CreatureStatBlock } from '@/lib/components/CreatureStatBlock';
import { createReactRoot, unmountReactRoot } from '@/tests/unit/helpers/reactRoot';
import type { Root } from 'react-dom/client';

const BASE_ABILITY_SCORES = {
  strength: 10, dexterity: 10, constitution: 10,
  intelligence: 10, wisdom: 10, charisma: 10,
};

let container: HTMLDivElement;
let root: Root;

afterEach(() => {
  unmountReactRoot(container, root);
});

function renderBlock(props: Partial<Parameters<typeof CreatureStatBlock>[0]> = {}): HTMLDivElement {
  ({ container, root } = createReactRoot());
  act(() => {
    root.render(React.createElement(CreatureStatBlock, {
      abilityScores: BASE_ABILITY_SCORES,
      ac: 16,
      hp: 30,
      maxHp: 30,
      ...props,
    }));
  });
  return container;
}

describe('CreatureStatBlock — CombatStatsRow integration', () => {
  test('renders AC value under AC label', () => {
    renderBlock({ ac: 16 });
    expect(container.textContent).toContain('AC');
    expect(container.textContent).toContain('16');
  });

  test('renders HP/maxHp values under HP label', () => {
    renderBlock({ hp: 30, maxHp: 30 });
    expect(container.textContent).toContain('HP');
    expect(container.textContent).toContain('30/30');
  });

  test('renders acNote when provided', () => {
    renderBlock({ ac: 14, acNote: 'chain mail' });
    expect(container.textContent).toContain('(chain mail)');
  });

  test('renders without acNote when omitted', () => {
    renderBlock({ ac: 10 });
    expect(container.textContent).not.toContain('(');
  });

  test('renders ability scores in compact mode', () => {
    renderBlock({ isCompact: false });
    expect(container.textContent).toContain('STR');
    expect(container.textContent).toContain('DEX');
  });

  test('hides ability scores in compact mode', () => {
    renderBlock({ isCompact: true });
    expect(container.textContent).not.toContain('STR');
    expect(container.textContent).not.toContain('DEX');
  });
});
