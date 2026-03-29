import React from 'react';

interface LairFormProps {
  seedOptions: string[];
  lairName: string;
  seedMonster: string;
  onNameChange: (v: string) => void;
  onSeedChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LairForm({
  seedOptions,
  lairName,
  seedMonster,
  onNameChange,
  onSeedChange,
  onConfirm,
  onCancel,
}: LairFormProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm border border-gray-700 shadow-xl">
        <h3 className="text-lg font-bold text-purple-300 mb-4">🏰 Add Lair Slot</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Lair name</label>
            <input
              type="text"
              data-testid="lair-name-input"
              className="w-full bg-gray-700 rounded px-3 py-2 text-white text-sm"
              placeholder="e.g. Dragon's Lair"
              value={lairName}
              onChange={e => onNameChange(e.target.value)}
              autoFocus
            />
          </div>
          {seedOptions.length > 0 && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Seed from monster (optional)</label>
              <select
                data-testid="lair-seed-select"
                className="w-full bg-gray-700 rounded px-3 py-2 text-white text-sm"
                value={seedMonster}
                onChange={e => onSeedChange(e.target.value)}
              >
                <option value="">— None (empty lair) —</option>
                {seedOptions.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              className="flex-1 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-sm font-semibold disabled:opacity-40"
              disabled={!lairName.trim()}
              onClick={onConfirm}
            >
              Add Lair
            </button>
            <button
              type="button"
              className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm font-semibold"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
