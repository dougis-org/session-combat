import React from 'react';
import { render, screen } from '@testing-library/react';
import { CombatantDetailPanel } from '@/lib/components/CombatantDetailPanel';
import type { CombatantState } from '@/lib/types';

const BASE: CombatantState = {
  id: 'c1',
  name: 'Ancient Red Dragon',
  type: 'monster',
  initiative: 10,
  conditions: [],
  hp: 300,
  maxHp: 300,
  ac: 22,
  abilityScores: {
    strength: 30,
    dexterity: 10,
    constitution: 29,
    intelligence: 18,
    wisdom: 15,
    charisma: 23,
  },
};

function renderPanel(overrides: Partial<CombatantState> = {}, focusSection?: 'legendary') {
  const combatant = { ...BASE, ...overrides };
  render(
    <CombatantDetailPanel
      combatant={combatant}
      detailPosition={{ top: 0, left: 0 }}
      onClose={jest.fn()}
      onUpdate={jest.fn()}
      focusSection={focusSection}
    />,
  );
}

describe('CombatantDetailPanel — focusSection', () => {
  let scrollIntoViewSpy: jest.Mock;

  beforeEach(() => {
    scrollIntoViewSpy = jest.fn();
    Element.prototype.scrollIntoView = scrollIntoViewSpy;
  });

  afterEach(() => {
    // @ts-expect-error - cleaning up the jsdom polyfill
    delete Element.prototype.scrollIntoView;
  });

  test('focusSection="legendary" scrolls the section into view and moves focus inside it', () => {
    renderPanel(
      { legendaryActionCount: 3, legendaryActionsRemaining: 3, legendaryActions: [{ name: 'Bite', description: 'The dragon bites.' }] },
      'legendary',
    );
    expect(scrollIntoViewSpy).toHaveBeenCalled();
    const section = screen.getByTestId('detail-legendary-section');
    expect(section.contains(document.activeElement)).toBe(true);
  });

  test('no focusSection means no scroll and no forced focus', () => {
    renderPanel({
      legendaryActionCount: 3,
      legendaryActionsRemaining: 3,
      legendaryActions: [{ name: 'Bite', description: 'The dragon bites.' }],
    });
    expect(scrollIntoViewSpy).not.toHaveBeenCalled();
    const section = screen.getByTestId('detail-legendary-section');
    expect(section.contains(document.activeElement)).toBe(false);
  });

  test('focusSection="legendary" with empty legendaryActions is a safe no-op (no throw)', () => {
    expect(() =>
      renderPanel({ legendaryActionCount: 2, legendaryActionsRemaining: 2, legendaryActions: [] }, 'legendary'),
    ).not.toThrow();
    expect(screen.getByTestId('detail-legendary-section')).toBeInTheDocument();
  });

  test('gracefully degrades when scrollIntoView is unavailable', () => {
    // @ts-expect-error - simulating an environment without scrollIntoView
    delete Element.prototype.scrollIntoView;
    expect(() =>
      renderPanel(
        { legendaryActionCount: 3, legendaryActionsRemaining: 3, legendaryActions: [{ name: 'Bite', description: 'The dragon bites.' }] },
        'legendary',
      ),
    ).not.toThrow();
  });
});
