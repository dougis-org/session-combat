'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { clientStorage } from '@/lib/clientStorage';
import { CombatState, CombatantState, Encounter, Player, StatusCondition } from '@/lib/types';

export default function CombatPage() {
  const [combatState, setCombatState] = useState<CombatState | null>(null);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedEncounterId, setSelectedEncounterId] = useState<string>('');

  useEffect(() => {
    const data = clientStorage.load();
    setEncounters(data.encounters);
    setPlayers(data.players);
    if (data.combatState) {
      setCombatState(data.combatState);
    }
  }, []);

  const saveCombatState = (state: CombatState | null) => {
    setCombatState(state);
    clientStorage.saveCombatState(state || undefined);
  };

  const startCombat = () => {
    const combatants: CombatantState[] = [];

    // Add players
    players.forEach(player => {
      combatants.push({
        id: `player-${player.id}`,
        name: player.name,
        type: 'player',
        initiative: 0,
        hp: player.hp,
        maxHp: player.maxHp,
        ac: player.ac,
        conditions: [],
      });
    });

    // Add monsters from selected encounter if any
    if (selectedEncounterId) {
      const encounter = encounters.find(e => e.id === selectedEncounterId);
      if (encounter) {
        encounter.monsters.forEach((monster, idx) => {
          combatants.push({
            id: `monster-${monster.id}-${idx}`,
            name: `${monster.name} ${idx + 1}`,
            type: 'monster',
            initiative: 0,
            hp: monster.hp,
            maxHp: monster.maxHp,
            ac: monster.ac,
            conditions: [],
          });
        });
      }
    }

    const newState: CombatState = {
      id: Date.now().toString(),
      userId: 'default-user',
      encounterId: selectedEncounterId || undefined,
      combatants,
      currentRound: 1,
      currentTurnIndex: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    saveCombatState(newState);
  };

  const endCombat = () => {
    if (confirm('Are you sure you want to end combat?')) {
      saveCombatState(null);
    }
  };

  const rollInitiative = () => {
    if (!combatState) return;

    // Roll initiative for all combatants
    const updatedCombatants = combatState.combatants.map(c => {
      const roll = Math.floor(Math.random() * 20) + 1;
      const initiative = roll + getInitiativeBonus(c);
      return { ...c, initiative };
    });

    // Sort by initiative (descending)
    updatedCombatants.sort((a, b) => b.initiative - a.initiative);

    saveCombatState({
      ...combatState,
      combatants: updatedCombatants,
      currentTurnIndex: 0,
    });
  };

  const getInitiativeBonus = (combatant: CombatantState): number => {
    if (combatant.type === 'player') {
      const player = players.find(p => `player-${p.id}` === combatant.id);
      return player?.initiativeBonus || 0;
    } else {
      // Extract initiative bonus from encounter monster
      if (combatState?.encounterId) {
        const encounter = encounters.find(e => e.id === combatState.encounterId);
        if (encounter) {
          const monster = encounter.monsters.find(m => combatant.id.includes(m.id));
          return monster?.initiativeBonus || 0;
        }
      }
    }
    return 0;
  };

  const nextTurn = () => {
    if (!combatState) return;

    let nextIndex = combatState.currentTurnIndex + 1;
    let nextRound = combatState.currentRound;

    if (nextIndex >= combatState.combatants.length) {
      nextIndex = 0;
      nextRound += 1;

      // Reduce duration of conditions
      const updatedCombatants = combatState.combatants.map(c => ({
        ...c,
        conditions: c.conditions.map(cond => ({
          ...cond,
          duration: cond.duration ? Math.max(0, cond.duration - 1) : cond.duration,
        })).filter(cond => !cond.duration || cond.duration > 0),
      }));

      saveCombatState({
        ...combatState,
        combatants: updatedCombatants,
        currentTurnIndex: nextIndex,
        currentRound: nextRound,
      });
    } else {
      saveCombatState({
        ...combatState,
        currentTurnIndex: nextIndex,
      });
    }
  };

  const updateCombatant = (id: string, updates: Partial<CombatantState>) => {
    if (!combatState) return;

    const updatedCombatants = combatState.combatants.map(c =>
      c.id === id ? { ...c, ...updates } : c
    );

    saveCombatState({
      ...combatState,
      combatants: updatedCombatants,
    });
  };

  const removeCombatant = (id: string) => {
    if (!combatState) return;

    const updatedCombatants = combatState.combatants.filter(c => c.id !== id);
    saveCombatState({
      ...combatState,
      combatants: updatedCombatants,
    });
  };

  if (!combatState) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Combat Tracker</h1>
            <Link href="/" className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded">
              Back to Home
            </Link>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Start New Combat</h2>
            
            <div className="mb-4">
              <label className="block mb-2">Select Encounter (Optional)</label>
              <select
                value={selectedEncounterId}
                onChange={(e) => setSelectedEncounterId(e.target.value)}
                className="w-full bg-gray-700 rounded px-3 py-2"
              >
                <option value="">No encounter</option>
                {encounters.map(encounter => (
                  <option key={encounter.id} value={encounter.id}>
                    {encounter.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <p className="text-gray-400 text-sm">
                Players: {players.length} | 
                Monsters: {selectedEncounterId ? encounters.find(e => e.id === selectedEncounterId)?.monsters.length || 0 : 0}
              </p>
            </div>

            <button
              onClick={startCombat}
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded text-lg font-semibold"
            >
              Start Combat
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentCombatant = combatState.combatants[combatState.currentTurnIndex];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Combat Tracker</h1>
            <p className="text-gray-400">Round {combatState.currentRound}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={rollInitiative}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            >
              Roll Initiative
            </button>
            <button
              onClick={nextTurn}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
            >
              Next Turn
            </button>
            <button
              onClick={endCombat}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
            >
              End Combat
            </button>
            <Link href="/" className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded">
              Back to Home
            </Link>
          </div>
        </div>

        <div className="space-y-2">
          {combatState.combatants.map((combatant, idx) => (
            <CombatantCard
              key={combatant.id}
              combatant={combatant}
              isActive={idx === combatState.currentTurnIndex}
              onUpdate={(updates) => updateCombatant(combatant.id, updates)}
              onRemove={() => removeCombatant(combatant.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CombatantCard({
  combatant,
  isActive,
  onUpdate,
  onRemove,
}: {
  combatant: CombatantState;
  isActive: boolean;
  onUpdate: (updates: Partial<CombatantState>) => void;
  onRemove: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showConditions, setShowConditions] = useState(false);
  const [hpAdjustment, setHpAdjustment] = useState('');

  const adjustHp = (amount: number) => {
    const newHp = Math.max(0, Math.min(combatant.maxHp, combatant.hp + amount));
    onUpdate({ hp: newHp });
  };

  const handleHpAdjustmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHpAdjustment(value);
  };

  const applyDamage = () => {
    const amount = parseInt(hpAdjustment) || 0;
    if (amount > 0) {
      adjustHp(-amount);
      setHpAdjustment('');
    }
  };

  const applyHeal = () => {
    const amount = parseInt(hpAdjustment) || 0;
    if (amount > 0) {
      adjustHp(amount);
      setHpAdjustment('');
    }
  };

  const addCondition = () => {
    const name = prompt('Condition name:');
    if (!name) return;

    const durationStr = prompt('Duration in rounds (leave empty for permanent):');
    const duration = durationStr ? parseInt(durationStr) : undefined;

    const newCondition: StatusCondition = {
      id: Date.now().toString(),
      name,
      description: '',
      duration,
    };

    onUpdate({
      conditions: [...combatant.conditions, newCondition],
    });
  };

  const removeCondition = (conditionId: string) => {
    onUpdate({
      conditions: combatant.conditions.filter(c => c.id !== conditionId),
    });
  };

  const hpPercent = (combatant.hp / combatant.maxHp) * 100;
  const hpColor = hpPercent > 50 ? 'bg-green-500' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${isActive ? 'border-2 border-yellow-500' : ''}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-semibold">{combatant.name}</h3>
            <span className={`px-2 py-1 rounded text-xs ${combatant.type === 'player' ? 'bg-blue-600' : 'bg-red-600'}`}>
              {combatant.type}
            </span>
            {isActive && (
              <span className="px-2 py-1 rounded text-xs bg-yellow-600 animate-pulse">
                Current Turn
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-2">
            <div>
              <p className="text-xs text-gray-400">Initiative</p>
              <p className="text-lg font-bold">{combatant.initiative}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">AC</p>
              <p className="text-lg font-bold">{combatant.ac}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">HP</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="0"
                  value={hpAdjustment}
                  onChange={handleHpAdjustmentChange}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      if (e.shiftKey) {
                        applyHeal();
                      } else {
                        applyDamage();
                      }
                    }
                  }}
                  className="w-14 bg-gray-700 rounded px-2 py-1 text-xs text-center"
                />
                <button
                  onClick={applyDamage}
                  title="Apply damage (Enter)"
                  className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
                >
                  Damage
                </button>
                <button
                  onClick={applyHeal}
                  title="Apply healing (Shift+Enter)"
                  className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
                >
                  Heal
                </button>
                <span className="text-lg font-bold">
                  {combatant.hp}/{combatant.maxHp}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-2">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className={`${hpColor} h-2 rounded-full transition-all`} style={{ width: `${hpPercent}%` }} />
            </div>
          </div>

          {combatant.conditions.length > 0 && (
            <div className="mb-2">
              <button
                onClick={() => setShowConditions(!showConditions)}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Conditions ({combatant.conditions.length})
              </button>
              {showConditions && (
                <div className="mt-2 space-y-1">
                  {combatant.conditions.map(condition => (
                    <div key={condition.id} className="bg-gray-700 rounded px-2 py-1 text-sm flex justify-between items-center">
                      <span>
                        {condition.name}
                        {condition.duration && ` (${condition.duration} rounds)`}
                      </span>
                      <button
                        onClick={() => removeCondition(condition.id)}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {combatant.notes && (
            <p className="text-sm text-gray-400 italic">{combatant.notes}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={addCondition}
            className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm"
          >
            Add Condition
          </button>
          <button
            onClick={onRemove}
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
