/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { CombatStatsRow } from '@/lib/components/CombatStatsRow';

describe('CombatStatsRow (RTL)', () => {
  test('renders AC and HP values', () => {
    render(<CombatStatsRow ac={18} hp={45} maxHp={58} />);
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('AC')).toBeInTheDocument();
    expect(screen.getByText('45/58')).toBeInTheDocument();
    expect(screen.getByText('HP')).toBeInTheDocument();
  });

  test('renders acNote when provided', () => {
    render(<CombatStatsRow ac={14} acNote="leather armor" hp={20} maxHp={20} />);
    expect(screen.getByText(/leather armor/)).toBeInTheDocument();
  });

  test('does not render acNote when omitted', () => {
    render(<CombatStatsRow ac={10} hp={8} maxHp={8} />);
    expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
  });
});
