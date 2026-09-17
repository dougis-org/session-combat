'use client';

import type { Character, CombatantState } from '@/lib/types';
import type { UseCombatReturn } from '@/lib/hooks/useCombat';
import { CombatantDetailPanel } from '@/lib/components/CombatantDetailPanel';

export interface UseCombatantPopupsArgs {
  combatState: UseCombatReturn['combatState'];
  characterMap: Map<string, Character>;
  removeConfirmId: UseCombatReturn['removeConfirmId'];
  removeConfirmPosition: UseCombatReturn['removeConfirmPosition'];
  selectedDetailCombatantId: UseCombatReturn['selectedDetailCombatantId'];
  detailPosition: UseCombatReturn['detailPosition'];
  detailFocusSection: UseCombatReturn['detailFocusSection'];
  setSelectedDetailCombatantId: UseCombatReturn['setSelectedDetailCombatantId'];
  setDetailPosition: UseCombatReturn['setDetailPosition'];
  setDetailFocusSection: UseCombatReturn['setDetailFocusSection'];
  setRemoveConfirmId: UseCombatReturn['setRemoveConfirmId'];
  setRemoveConfirmPosition: UseCombatReturn['setRemoveConfirmPosition'];
  updateCombatant: UseCombatReturn['updateCombatant'];
  removeCombatant: UseCombatReturn['removeCombatant'];
}

export interface UseCombatantPopupsResult {
  handleConSaveRequired: (combatant: CombatantState, dc: number) => void;
  onShowDetails: (
    id: string,
    pos: { top: number; left: number },
    options?: { focusSection?: 'legendary' },
  ) => void;
  onShowRemoveConfirm: (id: string, pos: { top: number; left: number }) => void;
  detailPanel: React.ReactNode;
  removeConfirmPopup: React.ReactNode;
}

function RemoveConfirmPopup({
  combatant,
  position,
  onConfirm,
  onCancel,
}: {
  combatant: CombatantState;
  position: { top: number; left: number };
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="absolute bg-gray-800 rounded-lg p-6 max-w-sm w-80 shadow-xl border border-gray-700 z-50"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-lg font-semibold mb-4">
        Remove <span className="text-red-400">{combatant.name}</span> from combat?
      </p>
      <div className="flex gap-3">
        <button
          onClick={onConfirm}
          data-testid="remove-confirm-button"
          className="flex-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-semibold"
        >
          Remove
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/**
 * Owns the "remove combatant" confirmation popup and the combatant detail
 * panel: their (id, position) state lives on the `useCombat` hook already, so
 * this hook's job is the derived lookups (finding the target combatant),
 * the concentration-save side effect, and the popup JSX itself — extracted
 * from `ActiveCombatView` to keep that component's render logic focused on
 * layout rather than these two popups' wiring.
 */
export function useCombatantPopups({
  combatState,
  characterMap,
  removeConfirmId,
  removeConfirmPosition,
  selectedDetailCombatantId,
  detailPosition,
  detailFocusSection,
  setSelectedDetailCombatantId,
  setDetailPosition,
  setDetailFocusSection,
  setRemoveConfirmId,
  setRemoveConfirmPosition,
  updateCombatant,
  removeCombatant,
}: UseCombatantPopupsArgs): UseCombatantPopupsResult {
  const handleConSaveRequired = (combatant: CombatantState, dc: number) => {
    const campaignId = combatState?.campaignId;
    if (!campaignId) return;
    if (!combatant.id.startsWith('character-')) return;
    const characterId = combatant.id.slice('character-'.length);
    const character = characterMap.get(characterId);
    if (!character) return;
    fetch(`/api/campaigns/${campaignId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `${combatant.name} must make a CON saving throw (DC ${dc}) to maintain concentration on ${combatant.concentratingOn ?? 'their spell'}.`,
        visibility: { scope: 'direct', toUserId: character.userId },
      }),
    }).catch(() => {});
  };

  const onShowDetails = (
    id: string,
    pos: { top: number; left: number },
    options?: { focusSection?: 'legendary' },
  ) => {
    setSelectedDetailCombatantId(id);
    setDetailPosition(pos);
    setDetailFocusSection(options?.focusSection);
  };

  const onShowRemoveConfirm = (id: string, pos: { top: number; left: number }) => {
    setRemoveConfirmId(id);
    setRemoveConfirmPosition(pos);
  };

  const detailPanel =
    selectedDetailCombatantId && detailPosition && combatState
      ? (() => {
          const combatant = combatState.combatants.find(c => c.id === selectedDetailCombatantId);
          if (!combatant) return null;
          return (
            <CombatantDetailPanel
              combatant={combatant}
              detailPosition={detailPosition}
              onClose={() => {
                setSelectedDetailCombatantId(null);
                setDetailFocusSection(undefined);
              }}
              onUpdate={updateCombatant}
              focusSection={detailFocusSection}
            />
          );
        })()
      : null;

  const removeConfirmPopup =
    removeConfirmId && removeConfirmPosition && combatState
      ? (() => {
          const combatant = combatState.combatants.find(c => c.id === removeConfirmId);
          if (!combatant) return null;
          return (
            <RemoveConfirmPopup
              combatant={combatant}
              position={removeConfirmPosition}
              onConfirm={() => {
                removeCombatant(removeConfirmId);
                setRemoveConfirmId(null);
                setRemoveConfirmPosition(null);
              }}
              onCancel={() => {
                setRemoveConfirmId(null);
                setRemoveConfirmPosition(null);
              }}
            />
          );
        })()
      : null;

  return {
    handleConSaveRequired,
    onShowDetails,
    onShowRemoveConfirm,
    detailPanel,
    removeConfirmPopup,
  };
}
