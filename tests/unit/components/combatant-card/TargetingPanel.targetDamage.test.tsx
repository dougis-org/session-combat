import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CombatantState } from '@/lib/types';
import { TargetingPanel } from '@/lib/components/combatant-card/TargetingPanel';
import { calcConSaveDC } from '@/lib/utils/combat';
import * as hpHistory from '@/lib/utils/hpHistory';

jest.spyOn(hpHistory, 'pushHpHistory');

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

async function applyDamageToTarget(target: CombatantState, amount: string) {
  const onUpdateCombatant = jest.fn();
  render(
    <TargetingPanel
      combatId="combat-1"
      combatant={{ ...SELF, targetIds: [target.id] }}
      allCombatants={[SELF, target]}
      onUpdate={jest.fn()}
      onUpdateCombatant={onUpdateCombatant}
    />
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: target.name }));
  await user.click(screen.getByRole('button', { name: 'Apply Damage' }));
  await user.type(screen.getByPlaceholderText('Damage amount'), amount);
  await user.click(screen.getByRole('button', { name: /^Apply/ }));
  return onUpdateCombatant;
}

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe('TargetingPanel — cross-combatant damage through applyHpChange', () => {
  test('a downed target accrues a death-save failure', async () => {
    const target = mk({
      id: 't1', name: 'Cleric', type: 'player', hp: 0, maxHp: 20,
      lifeState: 'dying', deathSaves: { successes: 0, failures: 0 },
    });
    const onUpdateCombatant = await applyDamageToTarget(target, '5');
    expect(onUpdateCombatant).toHaveBeenCalledWith('t1', expect.objectContaining({
      lifeState: 'dying',
      deathSaves: { successes: 0, failures: 1 },
    }));
  });

  test('damaging a concentrating target to 0 clears its concentration', async () => {
    const target = mk({ id: 't2', name: 'Wizard', type: 'player', hp: 4, maxHp: 20, concentratingOn: 'Haste' });
    const onUpdateCombatant = await applyDamageToTarget(target, '10');
    expect(onUpdateCombatant).toHaveBeenCalledWith('t2', expect.objectContaining({
      hp: 0,
      concentratingOn: undefined,
      pendingConSaveDC: undefined,
    }));
  });

  test('damaging a concentrating target above 0 records pendingConSaveDC', async () => {
    const target = mk({ id: 't3', name: 'Bard', type: 'player', hp: 30, maxHp: 30, concentratingOn: 'Haste' });
    const onUpdateCombatant = await applyDamageToTarget(target, '12');
    expect(onUpdateCombatant).toHaveBeenCalledWith('t3', expect.objectContaining({
      pendingConSaveDC: calcConSaveDC(12),
    }));
  });

  test('an effective change records target HP history', async () => {
    const target = mk({ id: 't4', name: 'Rogue', hp: 10, maxHp: 10 });
    await applyDamageToTarget(target, '4');
    expect(hpHistory.pushHpHistory).toHaveBeenCalledWith(
      'combat-1',
      't4',
      expect.objectContaining({ type: 'damage', amount: 4, hp: 10 })
    );
  });

  test('an out-of-range damage amount is rejected before persisting', async () => {
    const target = mk({ id: 't6', name: 'Ogre', hp: 40, maxHp: 40 });
    const onUpdateCombatant = await applyDamageToTarget(target, '9999999');
    expect(onUpdateCombatant).not.toHaveBeenCalled();
  });

  test('an immune target takes no damage and records no history', async () => {
    const target = mk({ id: 't5', name: 'Elemental', hp: 10, maxHp: 10, damageImmunities: ['fire'] });
    const onUpdateCombatant = jest.fn();
    render(
      <TargetingPanel
        combatId="combat-1"
        combatant={{ ...SELF, targetIds: ['t5'] }}
        allCombatants={[SELF, target]}
        onUpdate={jest.fn()}
        onUpdateCombatant={onUpdateCombatant}
      />
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Elemental' }));
    await user.click(screen.getByRole('button', { name: 'Apply Damage' }));
    await user.type(screen.getByPlaceholderText('Damage amount'), '9');
    await user.selectOptions(screen.getByLabelText(/Damage type/), 'fire');
    await user.click(screen.getByRole('button', { name: /^Apply/ }));

    expect(onUpdateCombatant).toHaveBeenCalledWith('t5', expect.objectContaining({ hp: 10 }));
    expect(hpHistory.pushHpHistory).not.toHaveBeenCalled();
  });
});
