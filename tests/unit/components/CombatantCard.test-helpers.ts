import React from 'react';
import { render } from '@testing-library/react';
import { CombatantCard } from '@/lib/components/CombatantCard';
import type { CombatantState } from '@/lib/types';

export const BASE: CombatantState = {
  id: 'c1',
  name: 'Test Fighter',
  type: 'player',
  initiative: 10,
  conditions: [],
  hp: 30,
  maxHp: 30,
  ac: 15,
  abilityScores: {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  },
};

export function renderCard(
  overrides: Partial<CombatantState> = {},
  onUpdate = jest.fn(),
  extra: Record<string, unknown> = {},
) {
  const combatant = { ...BASE, ...overrides };
  render(
    React.createElement(CombatantCard, {
      combatId: 'test-combat',
      combatant,
      isActive: false,
      onUpdate: onUpdate as any,
      onRemove: jest.fn() as any,
      ...(extra as any),
    }),
  );
  return onUpdate;
}
