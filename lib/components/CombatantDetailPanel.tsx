'use client';

import { useState, useEffect } from 'react';
import { CombatantState } from '@/lib/types';
import { LegendaryActionsPanel } from '@/lib/components/LegendaryActionsPanel';

export interface CombatantDetailPanelProps {
  combatant: CombatantState;
  detailPosition: { top: number; left: number };
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<CombatantState>) => void;
}

function ActionList({ label, actions }: { label: string; actions: { name: string; description: string }[] }) {
  return (
    <div>
      <p className="text-gray-400 text-sm mb-2 font-semibold">{label}</p>
      <div className="space-y-2">
        {actions.map((action) => (
          <div key={action.name} className="text-xs">
            <p className="font-bold text-white">{action.name}</p>
            <p className="text-gray-300">{action.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CombatantDetailPanel({
  combatant,
  detailPosition,
  onClose,
  onUpdate
}: CombatantDetailPanelProps) {
  const [spellInput, setSpellInput] = useState(combatant.concentratingOn ?? '');

  useEffect(() => {
    setSpellInput(combatant.concentratingOn ?? '');
  }, [combatant.concentratingOn]);

  const saveConcentration = () => {
    const value = spellInput.trim();
    onUpdate(combatant.id, { concentratingOn: value || undefined });
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-transparent z-40"
        onClick={onClose}
      />
      <div
        className="absolute bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-xl border border-gray-700 z-50"
        style={{ top: `${detailPosition.top}px`, left: `${detailPosition.left}px` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start gap-4 mb-4">
          <div className="flex items-center gap-2 flex-1">
            <h2 className="text-2xl font-bold">{combatant.name}</h2>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                combatant.type === 'player'
                  ? 'bg-blue-600 text-blue-100'
                  : 'bg-red-600 text-red-100'
              }`}
            >
              {combatant.type === 'player' ? 'Character' : 'Monster'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-2xl flex-shrink-0"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-gray-400 text-sm">HP</p>
              <p className="text-lg font-bold">
                {combatant.hp} / {combatant.maxHp}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">AC</p>
              <p className="text-lg font-bold">{combatant.ac}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Initiative</p>
              <p className="text-lg font-bold">{combatant.initiative}</p>
            </div>
          </div>

          {combatant.actions && combatant.actions.length > 0 && (
            <ActionList label="Actions" actions={combatant.actions} />
          )}
          {combatant.bonusActions && combatant.bonusActions.length > 0 && (
            <ActionList label="Bonus Actions" actions={combatant.bonusActions} />
          )}
          {combatant.reactions && combatant.reactions.length > 0 && (
            <ActionList label="Reactions" actions={combatant.reactions} />
          )}

          <LegendaryActionsPanel
            combatant={combatant}
            onUpdate={(updates) => onUpdate(combatant.id, updates)}
          />

          {combatant.lairActions && combatant.lairActions.length > 0 && (
            <ActionList label="Lair Actions" actions={combatant.lairActions} />
          )}

          <div>
            <p className="text-gray-400 text-sm mb-1 font-semibold">Concentration</p>
            <div className="flex items-center gap-2">
              <label htmlFor="concentration-spell-input" className="text-xs text-gray-300 whitespace-nowrap">
                Concentrating on spell
              </label>
              <input
                id="concentration-spell-input"
                type="text"
                value={spellInput}
                onChange={(e) => setSpellInput(e.target.value)}
                onBlur={saveConcentration}
                onKeyDown={(e) => { if (e.key === 'Enter') saveConcentration(); }}
                className="flex-1 bg-gray-700 rounded px-2 py-1 text-xs text-white border border-gray-600"
                placeholder="Spell name"
              />
            </div>
            {combatant.concentratingOn && (
              <button
                onClick={() => onUpdate(combatant.id, { concentratingOn: undefined, pendingConSaveDC: undefined })}
                className="mt-1 text-xs bg-red-700 hover:bg-red-600 text-red-100 px-2 py-1 rounded"
              >
                End Concentration
              </button>
            )}
          </div>

          {combatant.abilityScores && (
            <div>
              <p className="text-gray-400 text-sm mb-2">Ability Scores</p>
              <div className="grid grid-cols-6 gap-2">
                <div className="bg-gray-700 p-2 rounded text-center">
                  <p className="text-xs text-gray-400">STR</p>
                  <p className="font-bold">
                    {combatant.abilityScores?.strength || 10}
                  </p>
                </div>
                <div className="bg-gray-700 p-2 rounded text-center">
                  <p className="text-xs text-gray-400">DEX</p>
                  <p className="font-bold">
                    {combatant.abilityScores?.dexterity || 10}
                  </p>
                </div>
                <div className="bg-gray-700 p-2 rounded text-center">
                  <p className="text-xs text-gray-400">CON</p>
                  <p className="font-bold">
                    {combatant.abilityScores?.constitution || 10}
                  </p>
                </div>
                <div className="bg-gray-700 p-2 rounded text-center">
                  <p className="text-xs text-gray-400">INT</p>
                  <p className="font-bold">
                    {combatant.abilityScores?.intelligence || 10}
                  </p>
                </div>
                <div className="bg-gray-700 p-2 rounded text-center">
                  <p className="text-xs text-gray-400">WIS</p>
                  <p className="font-bold">
                    {combatant.abilityScores?.wisdom || 10}
                  </p>
                </div>
                <div className="bg-gray-700 p-2 rounded text-center">
                  <p className="text-xs text-gray-400">CHA</p>
                  <p className="font-bold">
                    {combatant.abilityScores?.charisma || 10}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
