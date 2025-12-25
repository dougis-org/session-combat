'use client';

import React, { useState } from 'react';
import { CombatantState } from '@/lib/types';

interface CombatInfoIconProps {
  combatants: CombatantState[];
}

export function CombatInfoIcon({ combatants }: CombatInfoIconProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Separate alive and dead combatants
  const aliveCombatants = combatants.filter((c) => c.hp > 0);
  const deadCombatants = combatants.filter((c) => c.hp <= 0);

  // Group alive combatants by type and name
  const alivePlayersByName = new Map<string, CombatantState[]>();
  const aliveMonstersByName = new Map<string, CombatantState[]>();

  aliveCombatants.forEach((combatant) => {
    if (combatant.type === 'player') {
      const existing = alivePlayersByName.get(combatant.name) || [];
      alivePlayersByName.set(combatant.name, [...existing, combatant]);
    } else {
      const existing = aliveMonstersByName.get(combatant.name) || [];
      aliveMonstersByName.set(combatant.name, [...existing, combatant]);
    }
  });

  // Group dead combatants by type and name
  const deadPlayersByName = new Map<string, CombatantState[]>();
  const deadMonstersByName = new Map<string, CombatantState[]>();

  deadCombatants.forEach((combatant) => {
    if (combatant.type === 'player') {
      const existing = deadPlayersByName.get(combatant.name) || [];
      deadPlayersByName.set(combatant.name, [...existing, combatant]);
    } else {
      const existing = deadMonstersByName.get(combatant.name) || [];
      deadMonstersByName.set(combatant.name, [...existing, combatant]);
    }
  });

  // Count totals
  const totalPlayers = Array.from(alivePlayersByName.values()).reduce(
    (sum, group) => sum + group.length,
    0
  );
  const totalMonsters = Array.from(aliveMonstersByName.values()).reduce(
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
          {/* Two column layout: Players | Monsters */}
          <div className="grid grid-cols-2 gap-4">
            {/* Players Column */}
            <div>
              <p className="text-xs text-gray-400 font-semibold mb-2">PLAYERS ({totalPlayers})</p>
              
              {/* Alive Players */}
              {alivePlayersByName.size > 0 ? (
                <div className="space-y-1">
                  {Array.from(alivePlayersByName.entries()).map(([name, group]) => (
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
              ) : (
                <p className="text-xs text-gray-500 italic">None</p>
              )}

              {/* Dead Players Separator */}
              {deadPlayersByName.size > 0 && (
                <>
                  <div className="border-t border-gray-600 my-2"></div>
                  <p className="text-xs text-red-400 font-semibold mb-1">DEFEATED</p>
                  <div className="space-y-1">
                    {Array.from(deadPlayersByName.entries()).map(([name, group]) => (
                      <div key={`dead-${name}`} className="text-xs text-gray-500 line-through">
                        <div className="flex items-baseline gap-1">
                          <span className="font-medium">{name}</span>
                          {group.length > 1 && (
                            <span className="text-gray-600">×{group.length}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Monsters Column */}
            <div>
              <p className="text-xs text-gray-400 font-semibold mb-2">MONSTERS ({totalMonsters})</p>
              
              {/* Alive Monsters */}
              {aliveMonstersByName.size > 0 ? (
                <div className="space-y-1">
                  {Array.from(aliveMonstersByName.entries()).map(([name, group]) => (
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
              ) : (
                <p className="text-xs text-gray-500 italic">None</p>
              )}

              {/* Dead Monsters Separator */}
              {deadMonstersByName.size > 0 && (
                <>
                  <div className="border-t border-gray-600 my-2"></div>
                  <p className="text-xs text-red-400 font-semibold mb-1">DEFEATED</p>
                  <div className="space-y-1">
                    {Array.from(deadMonstersByName.entries()).map(([name, group]) => (
                      <div key={`dead-${name}`} className="text-xs text-gray-500 line-through">
                        <div className="flex items-baseline gap-1">
                          <span className="font-medium">{name}</span>
                          {group.length > 1 && (
                            <span className="text-gray-600">×{group.length}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Empty state */}
          {totalPlayers === 0 && totalMonsters === 0 && deadPlayersByName.size === 0 && deadMonstersByName.size === 0 && (
            <p className="text-xs text-gray-400 col-span-2">No combatants</p>
          )}
        </div>
      )}
    </div>
  );
}
