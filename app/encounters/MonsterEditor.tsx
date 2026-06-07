'use client';

import { useState } from 'react';
import type { Monster } from '@/lib/types';

export function MonsterEditor({
  monster,
  onSave,
  onCancel,
  hideCancel = false,
}: {
  monster: Monster;
  onSave: (monster: Monster) => void;
  onCancel: () => void;
  hideCancel?: boolean;
}) {
  const [name, setName] = useState(monster.name);
  const [hp, setHp] = useState(monster.hp);
  const [maxHp, setMaxHp] = useState(monster.maxHp);
  const [ac, setAc] = useState(monster.ac);
  const [dexterity, setDexterity] = useState(monster.abilityScores.dexterity);

  const handleSave = () => {
    onSave({
      ...monster,
      name,
      hp,
      maxHp,
      ac,
      abilityScores: {
        ...monster.abilityScores,
        dexterity,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="monster-name" className="block mb-1 text-sm font-medium">Name</label>
          <input
            id="monster-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
          />
        </div>
        <div>
          <label htmlFor="monster-ac" className="block mb-1 text-sm font-medium">AC</label>
          <input
            id="monster-ac"
            type="number"
            value={ac}
            onChange={(e) => setAc(parseInt(e.target.value) || 0)}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
          />
        </div>
        <div>
          <label htmlFor="monster-hp" className="block mb-1 text-sm font-medium">HP</label>
          <input
            id="monster-hp"
            type="number"
            value={hp}
            onChange={(e) => {
              const newHp = parseInt(e.target.value) || 0;
              setHp(Math.min(newHp, maxHp));
            }}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
          />
        </div>
        <div>
          <label htmlFor="monster-maxhp" className="block mb-1 text-sm font-medium">Max HP</label>
          <input
            id="monster-maxhp"
            type="number"
            value={maxHp}
            onChange={(e) => {
              const newMaxHp = parseInt(e.target.value) || 0;
              setMaxHp(newMaxHp);
              setHp((prevHp) => Math.min(prevHp, newMaxHp));
            }}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
          />
        </div>
        <div className="col-span-2">
          <label htmlFor="monster-dex" className="block mb-1 text-sm font-medium">Dexterity</label>
          <input
            id="monster-dex"
            type="number"
            value={dexterity}
            onChange={(e) => setDexterity(parseInt(e.target.value) || 0)}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
          />
        </div>
      </div>
      <div className="flex gap-2 pt-4">
        <button
          onClick={handleSave}
          className="flex-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm font-medium"
        >
          Save Monster
        </button>
        {!hideCancel && (
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-sm font-medium"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
