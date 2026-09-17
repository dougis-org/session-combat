'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef } from 'react';
import { AuthUser } from '@/lib/hooks/useAuth';
import { CombatInfoIcon } from '@/lib/components/CombatInfoIcon';
import { CombatantCard } from '@/lib/components/CombatantCard';
import { InitiativeEntry } from '@/lib/components/InitiativeEntry';
import { LairActionsSlot } from '@/lib/components/LairActionsSlot';
import { CombatSetupAndActiveModals } from '@/lib/components/CombatSetupAndActiveModals';
import { CombatantState } from '@/lib/types';
import { UseCombatReturn } from '@/lib/hooks/useCombat';
import { useInitiativeModal } from '@/lib/hooks/useInitiativeModal';
import { useCombatantPopups } from '@/lib/hooks/useCombatantPopups';
import { Toast } from '@/lib/components/Toast';
import { usePreferences } from '@/lib/preferences/usePreferences';

function EncounterDescriptionModal({ description, onClose }: { description: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto shadow-xl border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start gap-4 mb-4">
          <h2 className="text-2xl font-bold">Encounter Description</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-2xl flex-shrink-0">
            ×
          </button>
        </div>
        <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">{description}</div>
      </div>
    </div>
  );
}

export interface ActiveCombatViewProps {
  combat: UseCombatReturn;
  user: AuthUser | null;
}

export function ActiveCombatView({ combat, user }: ActiveCombatViewProps) {
  const {
    combatState,
    error,
    toast,
    showEncounterDescription,
    removeConfirmId,
    removeConfirmPosition,
    selectedDetailCombatantId,
    detailPosition,
    detailFocusSection,
    characters,
    setShowCombatantModal,
    setShowLairForm,
    setShowEncounterDescription,
    setDetailPosition,
    setDetailFocusSection,
    setRemoveConfirmId,
    setRemoveConfirmPosition,
    setSelectedDetailCombatantId,
    restartRound,
    endCombat,
    nextTurn,
    updateCombatant,
    updateCombatantInitiativeSettings,
    removeCombatant,
    setInitiativeRoll,
    getDisplayCombatants,
  } = combat;

  const {
    initiativeEditId,
    initiativeEditPosition,
    initiativeModalRef,
    openInitiativeModal,
    handleSetInitiative,
    closeInitiativeModal,
    getCardAnchorPosition,
  } = useInitiativeModal({ combatState, setInitiativeRoll, updateCombatantInitiativeSettings });

  const characterMap = useMemo(
    () => new Map((characters ?? []).map(c => [c.id, c])),
    [characters],
  );

  const {
    handleConSaveRequired,
    onShowDetails,
    onShowRemoveConfirm,
    detailPanel,
    removeConfirmPopup,
  } = useCombatantPopups({
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
  });

  const activeCombatantId = combatState?.combatants[combatState.currentTurnIndex]?.id;
  // Round is part of the key (not just turn index) so a single-combatant combat —
  // where nextTurn() wraps back to the same combatant every click, advancing only
  // the round — still produces a fresh key per click instead of leaving the
  // effect below un-fired and pendingAutoScrollRef stuck armed for a later,
  // unrelated activeCombatantId change (e.g. a combatant removal).
  const turnKey = combatState ? `${combatState.currentRound}-${combatState.currentTurnIndex}` : null;

  const { preferences } = usePreferences();
  // Armed only by handleNextTurn, immediately before calling nextTurn(); the effect
  // below then fires exactly once for that click and never for restartRound or
  // combatant-removal-driven turnKey changes.
  const pendingAutoScrollRef = useRef(false);

  useEffect(() => {
    if (!pendingAutoScrollRef.current) return;
    pendingAutoScrollRef.current = false;
    if (!activeCombatantId) return;
    document
      .querySelector(`[data-combatant-id="${activeCombatantId}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [turnKey, activeCombatantId]);

  const handleNextTurn = () => {
    if (combatState && preferences.combat.autoScrollToNextCombatant) {
      pendingAutoScrollRef.current = true;
    }
    nextTurn();
  };

  if (!combatState) return null;

  const renderCard = (combatant: CombatantState) => (
    <CombatantCard
      key={combatant.id}
      combatId={combatState.id}
      combatant={combatant}
      isActive={combatant.id === activeCombatantId}
      onUpdate={(updates) => updateCombatant(combatant.id, updates)}
      onRemove={() => removeCombatant(combatant.id)}
      onNextTurn={handleNextTurn}
      onShowDetails={onShowDetails}
      onSetInitiative={(id) => {
        const position = getCardAnchorPosition(id);
        if (position) openInitiativeModal(id, position);
      }}
      onShowRemoveConfirm={onShowRemoveConfirm}
      allCombatants={combatState.combatants}
      onUpdateCombatant={(id, updates) => updateCombatant(id, updates)}
      onConSaveRequired={(dc) => handleConSaveRequired(combatant, dc)}
    />
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white" data-testid="combat-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">Combat Tracker</h1>
              {combatState.encounterDescription && (
                <button
                  onClick={() => setShowEncounterDescription(true)}
                  className="hover:opacity-80 transition-opacity"
                  title="See Encounter Description"
                  type="button"
                >
                  <svg
                    className="w-6 h-6 text-gray-400 hover:text-gray-300 cursor-pointer"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-gray-400">Round {combatState.currentRound}</p>
              <CombatInfoIcon combatants={combatState.combatants} />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowCombatantModal(true)}
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-sm"
              title="Add a party member mid-combat"
            >
              + Add Party Member
            </button>
            <button
              onClick={() => setShowCombatantModal(true)}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-sm"
              title="Add an enemy mid-combat"
            >
              + Add Enemy
            </button>
            <button
              onClick={() => setShowLairForm(true)}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-sm"
              title="Add a lair actions slot"
            >
              + Add Lair
            </button>
            <button
              onClick={restartRound}
              className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded text-sm"
              title="Reset turn order to the first combatant"
            >
              Restart Round
            </button>
            <button onClick={endCombat} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">
              End Combat
            </button>
            <Link href="/" className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded">
              Back to Home
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-900 border border-red-700 rounded text-red-200 mb-6">{error}</div>
        )}

        {initiativeEditId && initiativeEditPosition && (() => {
          const combatant = combatState.combatants.find(c => c.id === initiativeEditId);
          return combatant ? (
            <div
              ref={initiativeModalRef}
              className="absolute z-50 p-4 bg-gray-800 rounded-lg shadow-2xl border border-gray-600"
              style={{
                top: initiativeEditPosition.top,
                left: initiativeEditPosition.left,
                width: initiativeEditPosition.width,
              }}
              data-testid="initiative-modal"
            >
              <InitiativeEntry
                key={initiativeEditId}
                combatant={combatant}
                onSet={(initiativeRoll) => handleSetInitiative(initiativeEditId, initiativeRoll)}
                onClose={() => closeInitiativeModal(!combatant.initiativeRoll)}
                onSettingsChange={(adv, fb) => updateCombatantInitiativeSettings(initiativeEditId, adv, fb)}
              />
            </div>
          ) : null;
        })()}

        <div className="space-y-2" data-testid="initiative-order">
          <h2 className="text-xl font-semibold text-yellow-400 mb-4">Initiative Order</h2>
          {getDisplayCombatants().map((combatant) => {
            const actualIdx = combatState.combatants.findIndex(c => c.id === combatant.id);
            const isActive = actualIdx === combatState.currentTurnIndex;

            if (combatant.type === 'lair') {
              return (
                <div key={combatant.id} data-testid={isActive ? 'lair-active' : 'lair-slot-badge'}>
                  <LairActionsSlot
                    combatant={combatant}
                    isActive={isActive}
                    onUpdate={(updates) => updateCombatant(combatant.id, updates)}
                    onNextTurn={handleNextTurn}
                  />
                  {!isActive && (
                    <button
                      type="button"
                      data-testid="lair-slot-remove"
                      className="text-xs text-red-400 hover:text-red-300 mt-1 ml-2"
                      onClick={(e) => {
                        const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                        setRemoveConfirmId(combatant.id);
                        setRemoveConfirmPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              );
            }

            return renderCard(combatant);
          })}
        </div>

        <CombatSetupAndActiveModals
          combat={combat}
          user={user}
          seedOptions={combatState.combatants.filter(c => c.type !== 'lair' && (c.lairActions ?? []).length > 0).map(c => c.name)}
        />

        {detailPanel}

        {showEncounterDescription && combatState.encounterDescription && (
          <EncounterDescriptionModal
            description={combatState.encounterDescription}
            onClose={() => setShowEncounterDescription(false)}
          />
        )}

        {removeConfirmPopup}
      </div>

      <Toast toast={toast} />
    </div>
  );
}