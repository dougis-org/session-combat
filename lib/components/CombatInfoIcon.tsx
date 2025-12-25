'use client';

import React, { useState } from 'react';
import { CombatantState } from '@/lib/types';

interface CombatInfoIconProps {
  combatants: CombatantState[];
}

export function CombatInfoIcon({ combatants }: CombatInfoIconProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Get alive combatants (hp > 0) and group by type
  const aliveCombatants = combatants.filter((c) => c.hp > 0);
  const playersByName = new Map<string, CombatantState[]>();
  const monstersByName = new Map<string, CombatantState[]>();

  // Group alive combatants by name
  aliveCombatants.forEach((combatant) => {
    if (combatant.type === 'player') {
      const existing = playersByName.get(combatant.name) || [];
      playersByName.set(combatant.name, [...existing, combatant]);
    } else {
      const existing = monstersByName.get(combatant.name) || [];
      monstersByName.set(combatant.name, [...existing, combatant]);
    }
  });

  // Count totals
  const totalPlayers = Array.from(playersByName.values()).reduce(
    (sum, group) => sum + group.length,
    0
  );
  const totalMonsters = Array.from(monstersByName.values()).reduce(
    (sum, group) => sum + group.length,
    0
  );

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="hover:opacity-80 transition-opacity"
        title="View combatants and statuses"
        type="button"
        aria-label="Combat information"
      >
        <svg
          className="w-6 h-6 text-gray-400 hover:text-gray-300"
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

      {showTooltip && (
        <div className="absolute left-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg z-50 min-w-max">
          {/* Summary counts */}
          <div className="mb-3 pb-3 border-b border-gray-700">
            <p className="text-sm text-gray-200 font-semibold">
              Players: {totalPlayers}
            </p>
            <p className="text-sm text-gray-200 font-semibold">
              Monsters: {totalMonsters}
            </p>
          </div>

          {/* Players list */}
          {playersByName.size > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-400 font-semibold mb-1">PLAYERS</p>
              <div className="space-y-1">
                {Array.from(playersByName.entries()).map(([name, group]) => (
                  <div key={name} className="text-xs text-gray-300">
                    <div className="flex items-baseline gap-1">
                      <span className="font-medium">{name}</span>
                      {group.length > 1 && (
                        <span className="text-gray-500">×{group.length}</span>
                      )}
                    </div>
                    {group.some((c) => c.conditions.length > 0) && (
                      <div className="ml-2 text-gray-400 text-xs">
                        {group.flatMap((c) =>
                          c.conditions.map((condition) => (
                            <div key={condition.id} className="text-yellow-400">
                              • {condition.name}
                              {condition.duration && ` (${condition.duration})`}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monsters list */}
          {monstersByName.size > 0 && (
            <div>
              <p className="text-xs text-gray-400 font-semibold mb-1">MONSTERS</p>
              <div className="space-y-1">
                {Array.from(monstersByName.entries()).map(([name, group]) => (
                  <div key={name} className="text-xs text-gray-300">
                    <div className="flex items-baseline gap-1">
                      <span className="font-medium">{name}</span>
                      {group.length > 1 && (
                        <span className="text-gray-500">×{group.length}</span>
                      )}
                    </div>
                    {group.some((c) => c.conditions.length > 0) && (
                      <div className="ml-2 text-gray-400 text-xs">
                        {group.flatMap((c) =>
                          c.conditions.map((condition) => (
                            <div key={condition.id} className="text-yellow-400">
                              • {condition.name}
                              {condition.duration && ` (${condition.duration})`}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {totalPlayers === 0 && totalMonsters === 0 && (
            <p className="text-xs text-gray-400">No active combatants</p>
          )}
        </div>
      )}
    </div>
  );
}
