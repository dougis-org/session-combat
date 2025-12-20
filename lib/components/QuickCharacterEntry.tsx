'use client';

import { useState } from 'react';
import { CombatantState } from '@/lib/types';

interface QuickCharacterEntryProps {
  onAdd: (combatant: CombatantState) => void;
  onCancel: () => void;
  combatantType: 'player' | 'monster';
}

export function QuickCharacterEntry({
  onAdd,
  onCancel,
  combatantType,
}: QuickCharacterEntryProps) {
  const [formData, setFormData] = useState({
    name: '',
    dexterity: 10,
    maxHp: 10,
    currentHp: 10,
    initiativeRoll: '',
  });

  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (formData.dexterity < 1 || formData.dexterity > 30) {
      setError('Dexterity must be between 1 and 30');
      return;
    }

    if (formData.maxHp < 1) {
      setError('Max HP must be at least 1');
      return;
    }

    if (formData.currentHp < 0 || formData.currentHp > formData.maxHp) {
      setError('Current HP must be between 0 and Max HP');
      return;
    }

    // Parse optional initiative roll
    let initiativeValue = 0;
    if (formData.initiativeRoll.trim()) {
      const parsed = parseInt(formData.initiativeRoll);
      if (isNaN(parsed)) {
        setError('Initiative must be a valid number');
        return;
      }
      initiativeValue = parsed;
    }

    // Calculate ability scores - set dexterity and default others to 10
    const dexModifier = Math.floor((formData.dexterity - 10) / 2);
    const hasInitiative = formData.initiativeRoll.trim().length > 0;

    const newCombatant: CombatantState = {
      id: crypto.randomUUID(),
      name: formData.name.trim(),
      type: combatantType,
      initiative: initiativeValue,
      hp: formData.currentHp,
      maxHp: formData.maxHp,
      ac: 10, // Default AC
      abilityScores: {
        strength: 10,
        dexterity: formData.dexterity,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      conditions: [],
      ...(hasInitiative && {
        initiativeRoll: {
          roll: 0,
          bonus: 0,
          total: initiativeValue,
          method: 'manual' as const,
        },
      }),
    };

    onAdd(newCombatant);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quickEntryHeading"
    >
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 id="quickEntryHeading" className="text-2xl font-bold mb-4 text-white">
          Add {combatantType === 'player' ? 'Party Member' : 'Enemy'}
        </h2>

        {error && (
          <div className="p-3 bg-red-900 border border-red-700 rounded text-red-200 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold mb-2 text-gray-200">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="Character/Monster name"
              className="w-full bg-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="dexterity" className="block text-sm font-semibold mb-2 text-gray-200">
              Dexterity <span className="text-red-500">*</span>
            </label>
            <input
              id="dexterity"
              type="number"
              min="1"
              max="30"
              value={formData.dexterity}
              onChange={e => handleChange('dexterity', parseInt(e.target.value) || 10)}
              className="w-full bg-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Initiative modifier: {Math.floor((formData.dexterity - 10) / 2) >= 0 ? '+' : ''}{Math.floor((formData.dexterity - 10) / 2)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="maxHp" className="block text-sm font-semibold mb-2 text-gray-200">
                Max HP <span className="text-red-500">*</span>
              </label>
              <input
                id="maxHp"
                type="number"
                min="1"
                value={formData.maxHp}
                onChange={e => handleChange('maxHp', parseInt(e.target.value) || 1)}
                className="w-full bg-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="currentHp" className="block text-sm font-semibold mb-2 text-gray-200">
                Current HP <span className="text-red-500">*</span>
              </label>
              <input
                id="currentHp"
                type="number"
                min="0"
                value={formData.currentHp}
                onChange={e => handleChange('currentHp', parseInt(e.target.value) || 0)}
                className="w-full bg-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="initiativeRoll" className="block text-sm font-semibold mb-2 text-gray-200">
              Initiative Roll <span className="text-gray-400">(Optional)</span>
            </label>
            <input
              id="initiativeRoll"
              type="number"
              value={formData.initiativeRoll}
              onChange={e => handleChange('initiativeRoll', e.target.value)}
              placeholder="Leave blank to roll later"
              className="w-full bg-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              If provided, this will be used as the initiative value
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded transition-colors"
            >
              Add {combatantType === 'player' ? 'Party Member' : 'Enemy'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-400 mt-4 text-center">
          <span className="text-red-500">*</span> Required fields
        </p>
      </div>
    </div>
  );
}
