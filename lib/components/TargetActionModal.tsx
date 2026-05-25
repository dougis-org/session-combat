'use client';

import { useState } from 'react';
import { CombatantState } from '@/lib/types';
import { DAMAGE_TYPE_GROUPS, DamageType } from '@/lib/constants';

interface TargetActionModalProps {
  target: CombatantState;
  onClose: () => void;
  onApplyDamage: (damage: number, damageType: DamageType | '') => void;
  onAddCondition: (name: string, duration?: number) => void;
}

export function TargetActionModal({
  target,
  onClose,
  onApplyDamage,
  onAddCondition,
}: TargetActionModalProps) {
  const [targetActionMode, setTargetActionMode] = useState<'damage' | 'condition' | null>(null);
  const [damageInput, setDamageInput] = useState('');
  const [targetDamageType, setTargetDamageType] = useState<DamageType | ''>('');
  const [newCondition, setNewCondition] = useState('');
  const [conditionDuration, setConditionDuration] = useState('');

  const handleApplyDamage = () => {
    const damage = parseInt(damageInput);
    if (isNaN(damage) || damage <= 0) {
      alert('Please enter a valid damage amount');
      return;
    }
    onApplyDamage(damage, targetDamageType);
    setDamageInput('');
    setTargetDamageType('');
    setTargetActionMode(null);
  };

  const handleAddCondition = () => {
    if (!newCondition.trim()) {
      alert('Please enter a condition name');
      return;
    }
    const duration = conditionDuration ? parseInt(conditionDuration) : undefined;
    onAddCondition(newCondition.trim(), duration);
    setNewCondition('');
    setConditionDuration('');
    setTargetActionMode(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-sm mx-auto w-full">
        <h3 className="text-lg font-semibold mb-4 text-white">
          {target.name}
        </h3>

        {!targetActionMode ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-400 mb-4">
              HP: {target.hp}/{target.maxHp} | AC: {target.ac}
            </p>
            <button
              onClick={() => setTargetActionMode('damage')}
              className="w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white font-semibold transition-colors"
            >
              Apply Damage
            </button>
            <button
              onClick={() => setTargetActionMode('condition')}
              className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white font-semibold transition-colors"
            >
              Add Condition
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-white font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : targetActionMode === 'damage' ? (
          <div className="space-y-3">
            <input
              type="number"
              min="0"
              value={damageInput}
              onChange={(e) => setDamageInput(e.target.value)}
              placeholder="Damage amount"
              className="w-full bg-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApplyDamage();
              }}
            />
            <select
              value={targetDamageType}
              onChange={(e) => setTargetDamageType(e.target.value as DamageType | '')}
              className="w-full bg-gray-700 rounded px-3 py-2 text-white border border-gray-600"
              title="Damage type (applies target's resistances, immunities, and vulnerabilities)"
              aria-label="Damage type (applies target's resistances, immunities, and vulnerabilities)"
            >
              <option value="">No damage type</option>
              {Object.entries(DAMAGE_TYPE_GROUPS).map(([group, types]) => (
                <optgroup key={group} label={group}>
                  {types.map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleApplyDamage}
                className={`flex-1 px-3 py-2 rounded text-white font-semibold transition-colors ${
                  targetDamageType ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Apply{targetDamageType ? ` (${targetDamageType})` : ''}
              </button>
              <button
                onClick={() => setTargetActionMode(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-white font-semibold transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              value={newCondition}
              onChange={(e) => setNewCondition(e.target.value)}
              placeholder="Condition name"
              className="w-full bg-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCondition();
              }}
            />
            <input
              type="number"
              min="0"
              value={conditionDuration}
              onChange={(e) => setConditionDuration(e.target.value)}
              placeholder="Duration in rounds (optional)"
              className="w-full bg-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddCondition}
                className="flex-1 bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded text-white font-semibold transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => setTargetActionMode(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-white font-semibold transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
