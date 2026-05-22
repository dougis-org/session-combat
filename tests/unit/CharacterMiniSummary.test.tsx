/**
 * @jest-environment jsdom
 */
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import React from 'react';
import { act } from 'react';
import { describe, test, expect } from '@jest/globals';
import { createRoot } from 'react-dom/client';
import { CharacterMiniSummary } from '@/lib/components/CharacterMiniSummary';

function renderComponent(element: React.ReactElement): HTMLDivElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  act(() => {
    createRoot(container).render(element);
  });
  return container;
}

describe('CharacterMiniSummary', () => {
  test('renders full character identity and stats', () => {
    const container = renderComponent(
      React.createElement(CharacterMiniSummary, {
        name: 'Aragorn',
        race: 'Human',
        characterType: 'character',
        classes: [{ class: 'Fighter', level: 5 }],
        ac: 18,
        hp: 45,
        maxHp: 58,
      })
    );
    expect(container.textContent).toContain('Aragorn');
    expect(container.textContent).toContain('Human');
    expect(container.textContent).toContain('Fighter');
    expect(container.textContent).toContain('Lv 5');
    expect(container.textContent).toContain('18');
    expect(container.textContent).toContain('45/58');
  });

  test('renders NPC badge for characterType npc', () => {
    const container = renderComponent(
      React.createElement(CharacterMiniSummary, {
        name: 'Innkeeper',
        characterType: 'npc',
        classes: [],
        ac: 10,
        hp: 10,
        maxHp: 10,
      })
    );
    expect(container.textContent).toContain('NPC');
  });

  test('renders Companion badge for characterType companion', () => {
    const container = renderComponent(
      React.createElement(CharacterMiniSummary, {
        name: 'Wolf',
        characterType: 'companion',
        classes: [],
        ac: 13,
        hp: 11,
        maxHp: 11,
      })
    );
    expect(container.textContent).toContain('Companion');
  });

  test('renders no badge for characterType character', () => {
    const container = renderComponent(
      React.createElement(CharacterMiniSummary, {
        name: 'Thorin',
        characterType: 'character',
        classes: [{ class: 'Fighter', level: 5 }],
        ac: 16,
        hp: 40,
        maxHp: 40,
      })
    );
    expect(container.textContent).not.toContain('NPC');
    expect(container.textContent).not.toContain('Companion');
  });

  test('sums multiclass levels', () => {
    const container = renderComponent(
      React.createElement(CharacterMiniSummary, {
        name: 'Robin',
        classes: [{ class: 'Fighter', level: 3 }, { class: 'Rogue', level: 2 }],
        ac: 15,
        hp: 35,
        maxHp: 35,
      })
    );
    expect(container.textContent).toContain('Lv 5');
  });

  test('renders with race undefined', () => {
    const container = renderComponent(
      React.createElement(CharacterMiniSummary, {
        name: 'Mystery',
        race: undefined,
        classes: [{ class: 'Wizard', level: 3 }],
        ac: 12,
        hp: 18,
        maxHp: 18,
      })
    );
    expect(container.textContent).toContain('—');
  });

  test('renders without class/level line when classes is empty', () => {
    const container = renderComponent(
      React.createElement(CharacterMiniSummary, {
        name: 'Commoner',
        classes: [],
        ac: 10,
        hp: 8,
        maxHp: 8,
      })
    );
    expect(container.textContent).not.toContain('Lv');
  });
});
