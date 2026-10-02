import { renderHook, act } from '@testing-library/react';
import { useInitiativeModal } from '@/lib/hooks/useInitiativeModal';
import { makeCombatant, makeCombatState } from '@/tests/unit/fixtures/combatHelpers';

const ROLLED = { method: 'manual' as const, roll: 10, bonus: 0, total: 10 };

function setup(combatants = [makeCombatant({ id: 'c1', name: 'Goblin', initiativeRoll: ROLLED })]) {
  const setInitiativeRoll = jest.fn();
  const hook = renderHook(
    ({ state }) => useInitiativeModal({ combatState: state, setInitiativeRoll }),
    { initialProps: { state: makeCombatState({ combatants }) } },
  );
  return { ...hook, setInitiativeRoll };
}

describe('useInitiativeModal', () => {
  test('openInitiativeModal(id) opens with no card element in the DOM', () => {
    const { result } = setup();
    expect(document.querySelector('[data-combatant-id]')).toBeNull();
    act(() => { result.current.openInitiativeModal('c1'); });
    expect(result.current.initiativeEditId).toBe('c1');
  });

  test('auto-opens for the first unrolled combatant without a card lookup or warning', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = setup([makeCombatant({ id: 'c1', name: 'Goblin' })]);
    expect(result.current.initiativeEditId).toBe('c1');
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  test('a dismissed combatant does not auto-reopen, but others still do', () => {
    const goblin = makeCombatant({ id: 'c1', name: 'Goblin' });
    const { result, rerender } = setup([goblin]);
    act(() => { result.current.closeInitiativeModal(true); });
    expect(result.current.initiativeEditId).toBeNull();

    const orc = makeCombatant({ id: 'c2', name: 'Orc' });
    rerender({ state: makeCombatState({ combatants: [goblin, orc] }) });
    expect(result.current.initiativeEditId).toBe('c2');
  });

  test('removing the open combatant clears initiativeEditId', () => {
    const goblin = makeCombatant({ id: 'c1', name: 'Goblin' });
    const orc = makeCombatant({ id: 'c2', name: 'Orc', initiativeRoll: ROLLED });
    const { result, rerender } = setup([goblin, orc]);
    expect(result.current.initiativeEditId).toBe('c1');
    rerender({ state: makeCombatState({ combatants: [orc] }) });
    expect(result.current.initiativeEditId).toBeNull();
  });

  test('registers no resize/scroll listener or ResizeObserver while open', () => {
    const addSpy = jest.spyOn(window, 'addEventListener');
    const ro = jest.fn();
    const original = (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = ro;

    const { result } = setup();
    act(() => { result.current.openInitiativeModal('c1'); });

    const layoutEvents = addSpy.mock.calls.filter(([type]) => type === 'resize' || type === 'scroll');
    expect(layoutEvents).toHaveLength(0);
    expect(ro).not.toHaveBeenCalled();

    addSpy.mockRestore();
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = original;
  });

  test('no longer exposes positioning plumbing', () => {
    const { result } = setup();
    for (const key of [
      'initiativeEditPosition',
      'initiativeModalRef',
      'getCardAnchorPosition',
      'remeasureInitiativeModal',
    ]) {
      expect(result.current).not.toHaveProperty(key);
    }
  });

  describe('removed-from-play combatants', () => {
    const banished = { id: 'ban', name: 'Banished', description: 'gone', removedFromPlay: true };

    test('a banished unrolled combatant does not auto-open the modal', () => {
      const { result } = setup([makeCombatant({ id: 'c1', name: 'Goblin', conditions: [banished] })]);
      expect(result.current.initiativeEditId).toBeNull();
    });

    test('skips a banished combatant and opens the next unrolled one', () => {
      const { result } = setup([
        makeCombatant({ id: 'c1', name: 'Goblin', conditions: [banished] }),
        makeCombatant({ id: 'c2', name: 'Orc' }),
      ]);
      expect(result.current.initiativeEditId).toBe('c2');
    });

    test('handleSetInitiative does not advance to a banished unrolled combatant', () => {
      const { result } = setup([
        makeCombatant({ id: 'c1', name: 'Goblin' }),
        makeCombatant({ id: 'c2', name: 'Orc', conditions: [banished] }),
      ]);
      expect(result.current.initiativeEditId).toBe('c1');
      act(() => { result.current.handleSetInitiative('c1', ROLLED); });
      expect(result.current.initiativeEditId).toBeNull();
    });

    test('prompts again once the banished condition is removed', () => {
      const goblin = makeCombatant({ id: 'c1', name: 'Goblin', conditions: [banished] });
      const { result, rerender } = setup([goblin]);
      expect(result.current.initiativeEditId).toBeNull();
      rerender({ state: makeCombatState({ combatants: [{ ...goblin, conditions: [] }] }) });
      expect(result.current.initiativeEditId).toBe('c1');
    });
  });
});
