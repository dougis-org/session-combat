'use client';

import React, { useState } from 'react';
import { CombatantState } from '@/lib/types';
import { groupCombatantsForDisplay } from '@/lib/utils/combat';

interface CombatInfoIconProps {
  combatants: CombatantState[];
}

export function CombatInfoIcon({ combatants }: CombatInfoIconProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const { alive, dead, totals } = groupCombatantsForDisplay(combatants);

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="hover:opacity-80 transition-opacity"
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
              <p className="text-xs text-gray-400 font-semibold mb-2">PLAYERS ({totals.players})</p>
              
              {/* Alive Players */}
              {alive.players.size > 0 ? (
                <div className="space-y-1">
                  {Array.from(alive.players.entries()).map(([name, group]) => (
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
              {dead.players.size > 0 && (
                <>
                  <div className="border-t border-gray-600 my-2"></div>
                  <p className="text-xs text-red-400 font-semibold mb-1">DEFEATED</p>
                  <div className="space-y-1">
                    {Array.from(dead.players.entries()).map(([name, group]) => (
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
              <p className="text-xs text-gray-400 font-semibold mb-2">MONSTERS ({totals.monsters})</p>
              
              {/* Alive Monsters */}
              {alive.monsters.size > 0 ? (
                <div className="space-y-1">
                  {Array.from(alive.monsters.entries()).map(([name, group]) => (
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
              {dead.monsters.size > 0 && (
                <>
                  <div className="border-t border-gray-600 my-2"></div>
                  <p className="text-xs text-red-400 font-semibold mb-1">DEFEATED</p>
                  <div className="space-y-1">
                    {Array.from(dead.monsters.entries()).map(([name, group]) => (
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
          {totals.players === 0 && totals.monsters === 0 && dead.players.size === 0 && dead.monsters.size === 0 && (
            <p className="text-xs text-gray-400 col-span-2">No combatants</p>
          )}
        </div>
      )}
    </div>
  );
}
