'use client';

import { CombatantState } from '@/lib/types';
import { LegendaryActionsPanel } from '@/lib/components/LegendaryActionsPanel';

export interface CombatantDetailPanelProps {
  combatant: CombatantState;
  detailPosition: { top: number; left: number };
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<CombatantState>) => void;
}

export function CombatantDetailPanel({
  combatant,
  detailPosition,
  onClose,
  onUpdate
}: CombatantDetailPanelProps) {
  return (
    <>
      <div
        className="fixed inset-0 bg-transparent z-40"
        onClick={onClose}
      />
      <div
        className="absolute bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-xl border border-gray-700 z-50"
        style={{ top: '10px', left: `${detailPosition.left}px` }}
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
            <div>
              <p className="text-gray-400 text-sm mb-2 font-semibold">Actions</p>
              <div className="space-y-2">
                {combatant.actions.map((action) => (
                  <div key={action.name} className="text-xs">
                    <p className="font-bold text-white">{action.name}</p>
                    <p className="text-gray-300">{action.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {combatant.bonusActions && combatant.bonusActions.length > 0 && (
            <div>
              <p className="text-gray-400 text-sm mb-2 font-semibold">
                Bonus Actions
              </p>
              <div className="space-y-2">
                {combatant.bonusActions.map((action) => (
                  <div key={action.name} className="text-xs">
                    <p className="font-bold text-white">{action.name}</p>
                    <p className="text-gray-300">{action.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {combatant.reactions && combatant.reactions.length > 0 && (
            <div>
              <p className="text-gray-400 text-sm mb-2 font-semibold">
                Reactions
              </p>
              <div className="space-y-2">
                {combatant.reactions.map((action) => (
                  <div key={action.name} className="text-xs">
                    <p className="font-bold text-white">{action.name}</p>
                    <p className="text-gray-300">{action.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <LegendaryActionsPanel
            combatant={combatant}
            onUpdate={(updates) => onUpdate(combatant.id, updates)}
          />

          {combatant.lairActions && combatant.lairActions.length > 0 && (
            <div>
              <p className="text-gray-400 text-sm mb-2 font-semibold">
                Lair Actions
              </p>
              <div className="space-y-2">
                {combatant.lairActions.map((action) => (
                  <div key={action.name} className="text-xs">
                    <p className="font-bold text-white">{action.name}</p>
                    <p className="text-gray-300">{action.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

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
