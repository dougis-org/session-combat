'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { AuthUser } from '@/lib/hooks/useAuth';
import { CombatInfoIcon } from '@/lib/components/CombatInfoIcon';
import { CombatantCard } from '@/lib/components/CombatantCard';
import { CombatantDetailPanel } from '@/lib/components/CombatantDetailPanel';
import { InitiativeEntry } from '@/lib/components/InitiativeEntry';
import { LairActionsSlot } from '@/lib/components/LairActionsSlot';
import { CombatSetupAndActiveModals } from '@/lib/components/CombatSetupAndActiveModals';
import { CombatantState, InitiativeRoll } from '@/lib/types';
import { UseCombatReturn } from '@/lib/hooks/useCombat';
import { rectToPosition, sortCombatants } from '@/lib/utils/combat';
import { Toast } from '@/lib/components/Toast';

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

export interface ActiveCombatViewProps {
  combat: UseCombatReturn;
  user: AuthUser | null;
}

// Must stay in sync with the InitiativeModal's `w-80` Tailwind class below.
const INITIATIVE_MODAL_WIDTH = 320;

export function ActiveCombatView({ combat, user }: ActiveCombatViewProps) {
  const {
    combatState,
    error,
    toast,
    showCombatantModal,
    showLairForm,
    lairFormName,
    lairFormSeedMonster,
    showEncounterDescription,
    removeConfirmId,
    removeConfirmPosition,
    selectedDetailCombatantId,
    detailPosition,
    detailFocusSection,
    loadingTemplates,
    monsterTemplates,
    characters,
    setShowCombatantModal,
    setShowLairForm,
    setLairFormName,
    setLairFormSeedMonster,
    setShowEncounterDescription,
    setDetailPosition,
    setDetailFocusSection,
    setRemoveConfirmId,
    setRemoveConfirmPosition,
    setSelectedDetailCombatantId,
    addCombatantFromLibrary,
    restartRound,
    endCombat,
    nextTurn,
    updateCombatant,
    updateCombatantInitiativeSettings,
    removeCombatant,
    setInitiativeRoll,
    getDisplayCombatants,
    confirmAddLair,
    cancelLairForm,
  } = combat;

  const [initiativeEditId, setInitiativeEditId] = useState<string | null>(null);
  const [initiativeEditPosition, setInitiativeEditPosition] = useState<{top: number, left: number} | null>(null);

  const handleSetInitiative = (id: string, roll: InitiativeRoll) => {
    setInitiativeRoll(id, roll);
    if (!combatState) return;

    // React state updates aren't visible until the next render, so simulate the
    // post-update list locally instead of reading combatState after the call above.
    const updatedCombatants = combatState.combatants.map(c => c.id === id ? { ...c, initiative: roll.total, initiativeRoll: roll } : c);
    const sorted = sortCombatants(updatedCombatants);

    // Using the same list as getDisplayCombatants to find the next one
    const nextUnrolled = sorted.find(c => !c.initiativeRoll);

    if (nextUnrolled) {
      const el = document.querySelector(`[data-combatant-id="${nextUnrolled.id}"] [data-card-section="initiative"] button`);
      setInitiativeEditId(nextUnrolled.id);
      setInitiativeEditPosition(el ? rectToPosition(el.getBoundingClientRect()) : null);
    } else {
      setInitiativeEditId(null);
      setInitiativeEditPosition(null);
    }
  };


  const characterMap = useMemo(
    () => new Map((characters ?? []).map(c => [c.id, c])),
    [characters],
  );

  if (!combatState) return null;

  const activeCombatantId = combatState.combatants[combatState.currentTurnIndex]?.id;

  const handleConSaveRequired = (combatant: CombatantState, dc: number) => {
    const campaignId = combatState.campaignId;
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

  const renderCard = (combatant: CombatantState) => (
    <CombatantCard
      key={combatant.id}
      combatId={combatState.id}
      combatant={combatant}
      isActive={combatant.id === activeCombatantId}
      onUpdate={(updates) => updateCombatant(combatant.id, updates)}
      onRemove={() => removeCombatant(combatant.id)}
      onNextTurn={nextTurn}
      onShowDetails={(id, pos, options) => {
        setSelectedDetailCombatantId(id);
        setDetailPosition(pos);
        setDetailFocusSection(options?.focusSection);
      }}
      onSetInitiative={(id, pos) => {
        setInitiativeEditId(id);
        setInitiativeEditPosition(pos);
      }}
      onShowRemoveConfirm={(id, pos) => {
        setRemoveConfirmId(id);
        setRemoveConfirmPosition(pos);
      }}
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
              className="absolute z-50 p-4 bg-gray-800 rounded-lg shadow-2xl border border-gray-600 w-80 max-w-[calc(100vw-2rem)]"
              style={{
                top: initiativeEditPosition.top,
                left: Math.max(16, initiativeEditPosition.left - INITIATIVE_MODAL_WIDTH)
              }}
              data-testid="initiative-modal"
            >
              <InitiativeEntry
                key={initiativeEditId}
                combatant={combatant}
                onSet={(initiativeRoll) => handleSetInitiative(initiativeEditId, initiativeRoll)}
                onClose={() => setInitiativeEditId(null)}
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
                    onNextTurn={nextTurn}
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

        {selectedDetailCombatantId && detailPosition && (() => {
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
        })()}

        {showEncounterDescription && combatState.encounterDescription && (
          <EncounterDescriptionModal
            description={combatState.encounterDescription}
            onClose={() => setShowEncounterDescription(false)}
          />
        )}

        {removeConfirmId && removeConfirmPosition && (() => {
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
        })()}
      </div>

      <Toast toast={toast} />
    </div>
  );
}