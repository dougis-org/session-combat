'use client';

import { useState } from 'react';
import type { DeathSaveKind, DeathSaveSlotIndex } from '@/lib/combat/deathSaves';

export interface DeathSaveTrackerProps {
  successes: number;
  failures: number;
  onToggle: (kind: DeathSaveKind, index: DeathSaveSlotIndex) => void;
  /** Performs the roll + application and returns the rolled d20 value for display. */
  onRoll: () => number;
}

const SLOT_INDICES: DeathSaveSlotIndex[] = [0, 1, 2];

function SlotRow({
  kind,
  count,
  onToggle,
}: {
  kind: DeathSaveKind;
  count: number;
  onToggle: (kind: DeathSaveKind, index: DeathSaveSlotIndex) => void;
}) {
  const label = kind === 'success' ? 'Successes' : 'Failures';
  const filledClass = kind === 'success' ? 'bg-green-500 border-green-400' : 'bg-red-500 border-red-400';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 w-16">{label}</span>
      <div className="flex gap-1">
        {SLOT_INDICES.map((index) => {
          const filled = count > index;
          return (
            <button
              key={index}
              type="button"
              onClick={() => onToggle(kind, index)}
              aria-pressed={filled}
              aria-label={`${kind} ${index + 1}`}
              data-testid={`death-save-${kind}-${index}`}
              className={`w-4 h-4 rounded-full border transition-colors ${
                filled ? filledClass : 'bg-gray-800 border-gray-600'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

export function DeathSaveTracker({ successes, failures, onToggle, onRoll }: DeathSaveTrackerProps) {
  const [lastRoll, setLastRoll] = useState<number | null>(null);

  return (
    <div
      className="mt-2 rounded border border-gray-700 bg-gray-900/60 px-3 py-2"
      data-testid="death-save-tracker"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-300">Death Saves</span>
        <button
          type="button"
          onClick={() => setLastRoll(onRoll())}
          className="text-xs bg-gray-700 hover:bg-gray-600 rounded px-2 py-0.5"
        >
          Roll death save
        </button>
      </div>
      <div className="space-y-1">
        <SlotRow kind="success" count={successes} onToggle={onToggle} />
        <SlotRow kind="failure" count={failures} onToggle={onToggle} />
      </div>
      {lastRoll !== null && (
        <div className="mt-1 text-xs text-gray-400" data-testid="death-save-last-roll">
          d20:{lastRoll}
        </div>
      )}
    </div>
  );
}
