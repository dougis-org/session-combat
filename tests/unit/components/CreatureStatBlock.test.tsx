/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect } from '@jest/globals';
import { CreatureStatBlock } from '@/lib/components/CreatureStatBlock';

const BASE_ABILITY_SCORES = {
  strength: 10, dexterity: 10, constitution: 10,
  intelligence: 10, wisdom: 10, charisma: 10,
};

function renderBlock(props: Partial<Parameters<typeof CreatureStatBlock>[0]> = {}) {
  return render(
    <CreatureStatBlock
      abilityScores={BASE_ABILITY_SCORES}
      ac={16}
      hp={30}
      maxHp={30}
      {...props}
    />,
  );
}

describe('CreatureStatBlock — CombatStatsRow integration', () => {
  test('renders AC value under AC label', () => {
    renderBlock({ ac: 16 });
    expect(screen.getByText('AC')).toBeInTheDocument();
    expect(screen.getByText('16')).toBeInTheDocument();
  });

  test('renders HP/maxHp values under HP label', () => {
    renderBlock({ hp: 30, maxHp: 30 });
    expect(screen.getByText('HP')).toBeInTheDocument();
    expect(screen.getByText('30/30')).toBeInTheDocument();
  });

  test('renders acNote when provided', () => {
    renderBlock({ ac: 14, acNote: 'chain mail' });
    expect(screen.getByText(/chain mail/)).toBeInTheDocument();
  });

  test('renders without acNote when omitted', () => {
    renderBlock({ ac: 10 });
    expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
  });

  test('renders ability scores in full mode', () => {
    renderBlock({ isCompact: false });
    expect(screen.getByText('STR')).toBeInTheDocument();
    expect(screen.getByText('DEX')).toBeInTheDocument();
  });

  test('hides ability scores in compact mode', () => {
    renderBlock({ isCompact: true });
    expect(screen.queryByText('STR')).not.toBeInTheDocument();
    expect(screen.queryByText('DEX')).not.toBeInTheDocument();
  });
});
