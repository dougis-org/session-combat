'use client';

import { useState, useRef, useEffect } from 'react';
import { CombatantState, InitiativeRoll } from '@/lib/types';
import { buildInitiativeRoll, getDexInitiativeBonus } from '@/lib/utils/combat';

interface InitiativeEntryProps {
  combatant: CombatantState;
  onSet: (initiativeRoll: InitiativeRoll) => void;
  onClose?: () => void; // optional: close the edit form (only valid when initiative exists)
  onSettingsChange?: (advantage: boolean, flatBonus: number) => void;
}

export function InitiativeEntry({ combatant, onSet, onClose, onSettingsChange }: InitiativeEntryProps) {
  const [entryMode, setEntryMode] = useState<'roll' | 'dice' | 'total'>('roll');
  const [diceRoll, setDiceRoll] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [advantage, setAdvantage] = useState(combatant.initiativeAdvantage ?? false);
  const [flatBonus, setFlatBonus] = useState(combatant.initiativeFlatBonus ?? 0);

  // Close with Escape only when there is an existing initiative and an onClose handler
  useEffect(() => {
    if (!combatant.initiativeRoll || !onClose) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [combatant.initiativeRoll, onClose]);

  const handleRoll = () => {
    onSet(buildInitiativeRoll({ ...combatant, initiativeAdvantage: advantage, initiativeFlatBonus: flatBonus }));
  };

  const handleDiceEntry = () => {
    const roll = parseInt(diceRoll) || 0;
    if (roll < 1 || roll > 20) {
      alert('Dice roll must be between 1 and 20');
      return;
    }

    const bonus = getDexInitiativeBonus(combatant);
    const effectiveFlatBonus = flatBonus !== 0 ? flatBonus : undefined;
    const total = roll + bonus + (flatBonus ?? 0);

    onSet({
      roll,
      bonus,
      total,
      method: 'manual',
      ...(effectiveFlatBonus !== undefined && { flatBonus: effectiveFlatBonus }),
    });
  };

  const handleTotalEntry = () => {
    const total = parseInt(totalValue) || 0;
    if (total < 0) {
      alert('Initiative must be 0 or greater');
      return;
    }

    const effectiveFlatBonus = flatBonus !== 0 ? flatBonus : undefined;

    onSet({
      roll: total,
      bonus: 0,
      total: total + (flatBonus ?? 0),
      method: 'manual',
      ...(effectiveFlatBonus !== undefined && { flatBonus: effectiveFlatBonus }),
    });
  };

  return (
    <div className="relative bg-gray-800 rounded-lg p-4 border border-gray-700">
      {/* Close button only for entries that already have an initiative and when parent provided onClose */}
      {combatant.initiativeRoll && onClose && (
        <button
          onClick={onClose}
          aria-label={`Close initiative editor for ${combatant.name}`}
          className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-gray-800 border border-gray-700 text-gray-400 hover:text-gray-200 flex items-center justify-center text-lg"
          type="button"
        >
          ×
        </button>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col md:flex-row items-start gap-4">
              <div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Set Initiative:</span>
              <h3 className="text-lg font-semibold">{combatant.name}</h3>
            </div>
            <div className="flex justify-end mt-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                combatant.type === "player"
                  ? "bg-blue-600 text-blue-100"
                  : "bg-red-600 text-red-100"
                }`}
              >
                {combatant.type === "player" ? "Character" : "Monster"}
              </span>
            </div>
            </div>

          {/* Buttons: stacked on mobile (full width), horizontal on md+ */}
          <div className="flex flex-col md:flex-row gap-2 md:pl-3 w-full md:w-auto">
            <button
              onClick={() => {
                setEntryMode("roll");
                handleRoll();
              }}
              className={`w-full md:w-28 px-2 py-2 rounded text-sm flex-none ${
                entryMode === "roll"
                  ? "bg-blue-600"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              Roll d20
            </button>
            <button
              onClick={() => setEntryMode("dice")}
              className={`w-full md:w-40 px-2 py-2 rounded text-sm flex-none ${
                entryMode === "dice"
                  ? "bg-purple-600"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              Enter Dice Roll
            </button>
            <button
              onClick={() => setEntryMode("total")}
              className={`w-full md:w-28 px-2 py-2 rounded text-sm flex-none ${
                entryMode === "total"
                  ? "bg-green-600"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              Enter Total
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-2">
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={advantage}
              onChange={(e) => {
                const next = e.target.checked;
                setAdvantage(next);
                onSettingsChange?.(next, flatBonus);
              }}
              className="w-4 h-4 accent-blue-500"
            />
            Advantage
          </label>
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-400">Flat bonus:</span>
            <input
              type="number"
              step={1}
              value={flatBonus}
              onChange={(e) => {
                const next = e.target.value === '' || !Number.isFinite(e.target.valueAsNumber)
                  ? 0
                  : Math.trunc(e.target.valueAsNumber);
                setFlatBonus(next);
                onSettingsChange?.(advantage, next);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              className="w-16 bg-gray-700 rounded px-2 py-1 text-sm text-white"
              aria-label="Flat initiative bonus"
            />
            {flatBonus !== 0 && (
              <button
                type="button"
                onClick={() => {
                  setFlatBonus(0);
                  onSettingsChange?.(advantage, 0);
                }}
                className="text-gray-400 hover:text-gray-200 text-sm px-1"
                aria-label="Clear flat bonus"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2">
          {entryMode === "dice" && (
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="20"
                value={diceRoll}
                onChange={(e) => setDiceRoll(e.target.value)}
                placeholder="1-20"
                className="flex-1 bg-gray-700 rounded px-3 py-2 text-white"
              />
              <button
                onClick={handleDiceEntry}
                className="bg-purple-600 hover:bg-purple-700 w-20 px-2 py-2 rounded"
              >
                Set
              </button>
            </div>
          )}

          {entryMode === "total" && (
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                value={totalValue}
                onChange={(e) => setTotalValue(e.target.value)}
                placeholder={flatBonus !== 0 ? `Value (${flatBonus > 0 ? '+' : ''}${flatBonus} bonus applied)` : "Total initiative"}
                className="flex-1 bg-gray-700 rounded px-3 py-2 text-white"
              />
              <button
                onClick={handleTotalEntry}
                className="bg-green-600 hover:bg-green-700 w-20 px-2 py-2 rounded"
              >
                Set
              </button>
            </div>
          )}

          {combatant.initiativeRoll && (
            <div className="bg-gray-700 rounded px-3 py-2 text-sm">
              <p className="text-gray-400">
                Initiative:{" "}
                <span className="text-white font-bold">
                  {combatant.initiativeRoll.total}
                </span>
              </p>
              {combatant.initiativeRoll.method === "rolled" && (
                <p className="text-gray-500 text-xs">
                  {combatant.initiativeRoll.advantage ? (
                    <>d20: {combatant.initiativeRoll.roll}↑{combatant.initiativeRoll.altRoll != null ? ` (dropped: ${combatant.initiativeRoll.altRoll})` : ''}</>
                  ) : (
                    <>d20: {combatant.initiativeRoll.roll}</>
                  )}{" "}
                  + {combatant.initiativeRoll.bonus}
                  {combatant.initiativeRoll.flatBonus ? ` ${combatant.initiativeRoll.flatBonus > 0 ? '+' : ''}${combatant.initiativeRoll.flatBonus}` : ""}{" "}
                  = {combatant.initiativeRoll.total}
                </p>
              )}
              {combatant.initiativeRoll.method === "manual" && (combatant.initiativeRoll.bonus !== 0 || combatant.initiativeRoll.flatBonus) ? (
                <p className="text-gray-500 text-xs">
                  {combatant.initiativeRoll.roll}
                  {combatant.initiativeRoll.bonus !== 0 && ` + ${combatant.initiativeRoll.bonus}`}
                  {combatant.initiativeRoll.flatBonus ? ` ${combatant.initiativeRoll.flatBonus > 0 ? '+' : ''}${combatant.initiativeRoll.flatBonus}` : ""}
                  {" "}= {combatant.initiativeRoll.total}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

