import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CombatantState } from '@/lib/types';
import { TargetingPanel } from '@/lib/components/combatant-card/TargetingPanel';

const mk = (o: Partial<CombatantState> & Pick<CombatantState, 'id' | 'name'>): CombatantState => ({
  type: 'monster',
  initiative: 10,
  conditions: [],
  hp: 10,
  maxHp: 10,
  ac: 12,
  abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
  ...o,
});

const SELF = mk({ id: 's1', name: 'Fighter', type: 'player' });
const ENEMY = mk({ id: 'e1', name: 'Goblin' });

const BANISHED = { id: 'ban', name: 'Banished', description: 'gone', removedFromPlay: true };
const CATALOG = [
  { name: 'Banished', description: 'gone', removedFromPlay: true },
  { name: 'Prone', description: 'down' },
];

function setup(
  selfOverrides: Partial<CombatantState> = {},
  showTargeting = false,
  others: CombatantState[] = [ENEMY],
) {
  const onUpdate = jest.fn();
  const onUpdateCombatant = jest.fn();
  const onCloseTargeting = jest.fn();
  render(
    <TargetingPanel
      combatId="combat-1"
      combatant={{ ...SELF, ...selfOverrides }}
      allCombatants={[{ ...SELF, ...selfOverrides }, ...others]}
      onUpdate={onUpdate}
      onUpdateCombatant={onUpdateCombatant}
      showTargeting={showTargeting}
      onCloseTargeting={onCloseTargeting}
    />
  );
  return { onUpdate, onUpdateCombatant, onCloseTargeting, user: userEvent.setup() };
}

beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => CATALOG }) as never;
});

describe('TargetingPanel', () => {
  test('checking an enemy updates targetIds', async () => {
    const { onUpdate, user } = setup({}, true);
    await user.click(screen.getByRole('checkbox', { name: 'Goblin' }));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ targetIds: ['e1'] }));
  });

  test('unchecking an enemy removes it from targetIds', async () => {
    const { onUpdate, user } = setup({ targetIds: ['e1'] }, true);
    await user.click(screen.getByRole('checkbox', { name: 'Goblin' }));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ targetIds: [] }));
  });

  test('clicking a target chip opens the target action modal', async () => {
    const { user } = setup({ targetIds: ['e1'] });
    await user.click(screen.getByRole('button', { name: 'Goblin' }));
    expect(screen.getByRole('button', { name: 'Apply Damage' })).toBeInTheDocument();
  });

  test('Add Condition opens the shared condition modal for the target', async () => {
    const { user } = setup({ targetIds: ['e1'] });
    await user.click(screen.getByRole('button', { name: 'Goblin' }));
    await user.click(screen.getByRole('button', { name: 'Add Condition' }));
    expect(screen.getByTestId('condition-form-modal')).toHaveTextContent('Goblin');
    expect(screen.queryByRole('button', { name: 'Apply Damage' })).not.toBeInTheDocument();
  });

  test('selecting Banished adds a flagged condition with its description to the target only', async () => {
    const { onUpdateCombatant, user } = setup({ targetIds: ['e1'] });
    await user.click(screen.getByRole('button', { name: 'Goblin' }));
    await user.click(screen.getByRole('button', { name: 'Add Condition' }));
    await waitFor(() => expect(screen.getByTestId('condition-catalog-select')).toBeInTheDocument());
    await user.selectOptions(screen.getByTestId('condition-catalog-select'), 'Banished');
    await user.click(screen.getByTestId('condition-form-add'));
    expect(onUpdateCombatant).toHaveBeenCalledTimes(1);
    expect(onUpdateCombatant).toHaveBeenCalledWith('e1', {
      conditions: [expect.objectContaining({ name: 'Banished', description: 'gone', removedFromPlay: true })],
    });
    expect(screen.queryByTestId('condition-form-modal')).not.toBeInTheDocument();
  });

  test('a custom timed condition is added unflagged with its duration', async () => {
    const { onUpdateCombatant, user } = setup({ targetIds: ['e1'] });
    await user.click(screen.getByRole('button', { name: 'Goblin' }));
    await user.click(screen.getByRole('button', { name: 'Add Condition' }));
    await waitFor(() => expect(screen.getByTestId('condition-catalog-select')).toBeInTheDocument());
    await user.selectOptions(screen.getByTestId('condition-catalog-select'), 'custom');
    await user.type(screen.getByTestId('condition-name-input'), 'Blinded');
    await user.type(screen.getByTestId('condition-duration-input'), '3');
    await user.click(screen.getByTestId('condition-form-add'));
    const [, updates] = onUpdateCombatant.mock.calls[0];
    expect(updates.conditions).toHaveLength(1);
    expect(updates.conditions[0]).toEqual(expect.objectContaining({ name: 'Blinded', duration: 3 }));
    expect(updates.conditions[0]).not.toHaveProperty('removedFromPlay');
  });

  test('an empty name or out-of-range duration adds nothing', async () => {
    const { onUpdateCombatant, user } = setup({ targetIds: ['e1'] });
    await user.click(screen.getByRole('button', { name: 'Goblin' }));
    await user.click(screen.getByRole('button', { name: 'Add Condition' }));
    await waitFor(() => expect(screen.getByTestId('condition-catalog-select')).toBeInTheDocument());
    await user.selectOptions(screen.getByTestId('condition-catalog-select'), 'custom');
    await user.click(screen.getByTestId('condition-form-add'));
    await user.type(screen.getByTestId('condition-name-input'), 'Blinded');
    await user.type(screen.getByTestId('condition-duration-input'), '20000');
    await user.click(screen.getByTestId('condition-form-add'));
    expect(onUpdateCombatant).not.toHaveBeenCalled();
  });

  test('cancelling the shared condition modal adds nothing', async () => {
    const { onUpdateCombatant, user } = setup({ targetIds: ['e1'] });
    await user.click(screen.getByRole('button', { name: 'Goblin' }));
    await user.click(screen.getByRole('button', { name: 'Add Condition' }));
    await user.click(screen.getByTestId('condition-form-cancel'));
    expect(onUpdateCombatant).not.toHaveBeenCalled();
    expect(screen.queryByTestId('condition-form-modal')).not.toBeInTheDocument();
  });

  describe('removed-from-play combatants', () => {
    const bannedEnemy = mk({ id: 'e2', name: 'Orc', conditions: [BANISHED] });
    const bannedPlayer = mk({ id: 'p2', name: 'Rogue', type: 'player', conditions: [BANISHED] });
    const cleric = mk({ id: 'p3', name: 'Cleric', type: 'player' });

    test('banished enemies and players have no checkbox in either list', () => {
      setup({}, true, [ENEMY, bannedEnemy, bannedPlayer, cleric]);
      expect(screen.getByRole('checkbox', { name: 'Goblin' })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Cleric' })).toBeInTheDocument();
      expect(screen.queryByRole('checkbox', { name: 'Orc' })).not.toBeInTheDocument();
      expect(screen.queryByRole('checkbox', { name: 'Rogue' })).not.toBeInTheDocument();
    });

    test('an existing target that is banished has its chip hidden without pruning targetIds', () => {
      const { onUpdate } = setup({ targetIds: ['e1', 'e2'] }, false, [ENEMY, bannedEnemy]);
      expect(screen.getByRole('button', { name: 'Goblin' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Orc' })).not.toBeInTheDocument();
      expect(onUpdate).not.toHaveBeenCalled();
    });

    test('the chip returns once the banished condition is removed', () => {
      const props = {
        combatId: 'combat-1',
        combatant: { ...SELF, targetIds: ['e2'] },
        onUpdate: jest.fn(),
        showTargeting: false,
        onCloseTargeting: jest.fn(),
      };
      const { rerender } = render(<TargetingPanel {...props} allCombatants={[props.combatant, bannedEnemy]} />);
      expect(screen.queryByRole('button', { name: 'Orc' })).not.toBeInTheDocument();
      rerender(<TargetingPanel {...props} allCombatants={[props.combatant, { ...bannedEnemy, conditions: [] }]} />);
      expect(screen.getByRole('button', { name: 'Orc' })).toBeInTheDocument();
      expect(props.onUpdate).not.toHaveBeenCalled();
    });
  });
});
