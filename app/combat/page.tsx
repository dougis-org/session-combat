'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';
import { CreatureStatBlock } from '@/lib/components/CreatureStatBlock';
import { QuickCharacterEntry } from '@/lib/components/QuickCharacterEntry';
import { CombatState, CombatantState, Encounter, Character, StatusCondition, InitiativeRoll } from '@/lib/types';

function CombatContent() {
  const [combatState, setCombatState] = useState<CombatState | null>(null);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedEncounterId, setSelectedEncounterId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initiativeMode, setInitiativeMode] = useState(false);
  const [showQuickEntryType, setShowQuickEntryType] = useState<'player' | 'monster' | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [encountersRes, charactersRes, combatRes] = await Promise.all([
          fetch('/api/encounters'),
          fetch('/api/characters'),
          fetch('/api/combat'),
        ]);

        if (!encountersRes.ok || !charactersRes.ok || !combatRes.ok) {
          throw new Error('Failed to load data');
        }

        const encountersData = await encountersRes.json();
        const charactersData = await charactersRes.json();
        const combatData = await combatRes.json();

        setEncounters(encountersData || []);
        setCharacters(charactersData || []);
        setCombatState(combatData || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const saveCombatState = async (state: CombatState | null) => {
    try {
      setError(null);
      if (state) {
        const response = await fetch('/api/combat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state),
        });
        if (!response.ok) throw new Error('Failed to save combat state');
      }
      setCombatState(state);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save combat state');
    }
  };

  const addCombatantToSetup = (combatant: CombatantState) => {
    // Recreate combatState with the new combatant
    if (!combatState) {
      const newState: CombatState = {
        id: crypto.randomUUID(),
        userId: '',
        combatants: [combatant],
        currentRound: 1,
        currentTurnIndex: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      saveCombatState(newState);
    } else {
      const updatedCombatants = [...combatState.combatants, combatant];
      saveCombatState({
        ...combatState,
        combatants: updatedCombatants,
      });
    }
    setShowQuickEntryType(null);
  };

  const startCombat = () => {
    const combatants: CombatantState[] = [];

    // Add characters
    characters.forEach(character => {
      const dexterity = character.abilityScores?.dexterity || 10;
      const dexModifier = Math.floor((dexterity - 10) / 2);
      combatants.push({
        id: `character-${character.id}`,
        name: character.name,
        type: 'player',
        initiative: 0,
        abilityScores: character.abilityScores || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        hp: character.hp,
        maxHp: character.maxHp,
        ac: character.ac,
        conditions: [],
      });
    });

    // Add monsters from selected encounter if any
    if (selectedEncounterId) {
      const encounter = encounters.find(e => e.id === selectedEncounterId);
      if (encounter) {
        encounter.monsters.forEach((monster, idx) => {
          const dexterity = monster.abilityScores?.dexterity || 10;
          const dexModifier = Math.floor((dexterity - 10) / 2);
          combatants.push({
            id: `monster-${monster.id}-${idx}`,
            name: `${monster.name} ${idx + 1}`,
            type: 'monster',
            initiative: 0,
            abilityScores: monster.abilityScores || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
            hp: monster.hp,
            maxHp: monster.maxHp,
            ac: monster.ac,
            conditions: [],
          });
        });
      }
    }

    const newState: CombatState = {
      id: crypto.randomUUID(),
      userId: '',
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
  const rollD20 = (): number => {
    const randomBytes = new Uint8Array(1);
    crypto.getRandomValues(randomBytes);
    return (randomBytes[0] % 20) + 1;
  };

  const rollInitiative = () => {
    if (!combatState) return;

    // Roll initiative for all combatants
    const updatedCombatants = combatState.combatants.map(c => {
      const roll = rollD20();
      const bonus = getInitiativeBonus(c);
      const total = roll + bonus;
      
      const initiativeRoll: InitiativeRoll = {
        roll,
        bonus,
        total,
        method: 'rolled',
      };
      
      return { ...c, initiative: total, initiativeRoll };
    });

    saveCombatState({
      ...combatState,
      combatants: sortCombatants(updatedCombatants),
      currentTurnIndex: 0,
    });
    setInitiativeMode(false);
  };

  const getInitiativeBonus = (combatant: CombatantState): number => {
    if (combatant.type === 'player') {
      const character = characters.find(c => `character-${c.id}` === combatant.id);
      // Calculate from DEX modifier
      const dexterity = character?.abilityScores?.dexterity || 10;
      return Math.floor((dexterity - 10) / 2);
    } else {
      // Extract initiative bonus from encounter monster
      if (combatState?.encounterId) {
        const encounter = encounters.find(e => e.id === combatState.encounterId);
        if (encounter) {
          const monster = encounter.monsters.find(m => combatant.id.includes(m.id));
          const dexterity = monster?.abilityScores?.dexterity || 10;
          return Math.floor((dexterity - 10) / 2);
        }
      }
    }
    return 0;
  };
  const sortCombatants = (combatants: CombatantState[]): CombatantState[] => {
    return combatants.sort((a, b) => {
      // Primary: Initiative (descending)
      if (a.initiative !== b.initiative) {
        return b.initiative - a.initiative;
      }
      // Secondary: Dexterity (descending)
      const aDex = a.abilityScores?.dexterity || 10;
      const bDex = b.abilityScores?.dexterity || 10;
      if (aDex !== bDex) {
        return bDex - aDex;
      }
      // Tertiary: Player before monster
      if (a.type !== b.type) {
        return a.type === 'player' ? -1 : 1;
      }
      // Quaternary: Alphabetically by name
      return a.name.localeCompare(b.name);
    });
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

  const setInitiativeRoll = (combatantId: string, initiativeRoll: InitiativeRoll) => {
    if (!combatState) return;

    const updatedCombatants = combatState.combatants.map(c =>
      c.id === combatantId 
        ? { ...c, initiative: initiativeRoll.total, initiativeRoll }
        : c
    );

    saveCombatState({
      ...combatState,
      combatants: sortCombatants(updatedCombatants),
      currentTurnIndex: 0,
    });
  };

  const hasInitiativeBeenRolled = () => {
    return combatState?.combatants.some(c => c.initiativeRoll);
  };

  const getDisplayCombatants = () => {
    if (!combatState) return [];

    if (hasInitiativeBeenRolled()) {
      return sortCombatants([...combatState.combatants]);
    } else {
      // Before initiative, group players at top, monsters at bottom
      const players = combatState.combatants.filter(c => c.type === 'player');
      const monsters = combatState.combatants.filter(c => c.type === 'monster');
      return [...players, ...monsters];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Loading combat data...</p>
        </div>
      </div>
    );
  }

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

          {error && (
            <div className="p-4 bg-red-900 border border-red-700 rounded text-red-200 mb-6">
              {error}
            </div>
          )}

          <div className="bg-gray-800 rounded-lg p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Start New Combat</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Option 1: Use existing characters */}
              <div className="border border-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">From Library</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Use your saved characters and encounters
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm mb-2">Select Encounter (Optional)</label>
                  <select
                    value={selectedEncounterId}
                    onChange={(e) => setSelectedEncounterId(e.target.value)}
                    className="w-full bg-gray-700 rounded px-3 py-2 text-white text-sm"
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
                  <p className="text-gray-400 text-xs">
                    Characters: {characters.length} | 
                    Monsters: {selectedEncounterId ? encounters.find(e => e.id === selectedEncounterId)?.monsters.length || 0 : 0}
                  </p>
                </div>

                <button
                  onClick={startCombat}
                  disabled={characters.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded text-sm font-semibold transition-colors"
                >
                  Start Combat
                </button>
                {characters.length === 0 && (
                  <p className="text-red-400 text-xs mt-2">Need at least one character</p>
                )}
              </div>

              {/* Option 2: Quick entry */}
              <div className="border border-blue-700 border-2 rounded-lg p-4 bg-blue-900 bg-opacity-20">
                <h3 className="text-lg font-semibold mb-3 text-blue-300">Quick Entry</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Add combatants on the fly during session
                </p>
                
                <p className="text-xs text-gray-400 mb-4">
                  Enter name, dexterity, HP, and optional initiative. Perfect for DMs managing player characters elsewhere.
                </p>

                <div className="space-y-2">
                  <button
                    onClick={() => setShowQuickEntryType('player')}
                    className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-semibold transition-colors"
                  >
                    + Add Party Member
                  </button>
                  <button
                    onClick={() => setShowQuickEntryType('monster')}
                    className="w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-semibold transition-colors"
                  >
                    + Add Enemy
                  </button>
                </div>
              </div>
            </div>
          </div>

          {showQuickEntryType && (
            <QuickCharacterEntry
              combatantType={showQuickEntryType}
              onAdd={addCombatantToSetup}
              onCancel={() => setShowQuickEntryType(null)}
            />
          )}
        </div>
      </div>
    );
  }

  const currentCombatant = combatState.combatants[combatState.currentTurnIndex];

  // Show initiative entry modal if in initiative mode
  if (initiativeMode && combatState) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Initiative</h1>
            <Link href="/" className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded">
              Back to Home
            </Link>
          </div>

          {error && (
            <div className="p-4 bg-red-900 border border-red-700 rounded text-red-200 mb-6">
              {error}
            </div>
          )}

          <div className="space-y-4 max-w-2xl mx-auto">
            {combatState.combatants.map((combatant) => (
              <InitiativeEntry
                key={combatant.id}
                combatant={combatant}
                onSet={(initiativeRoll) => setInitiativeRoll(combatant.id, initiativeRoll)}
              />
            ))}
          </div>

          <div className="flex gap-2 justify-center mt-8">
            <button
              onClick={() => setInitiativeMode(false)}
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded text-lg font-semibold"
            >
              Start Combat
            </button>
            <button
              onClick={() => setInitiativeMode(false)}
              className="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded text-lg font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              Roll All Initiative
            </button>
            <button
              onClick={() => setInitiativeMode(true)}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
            >
              Manual Entry
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

        {error && (
          <div className="p-4 bg-red-900 border border-red-700 rounded text-red-200 mb-6">
            {error}
          </div>
        )}

        {hasInitiativeBeenRolled() ? (
          // Display sorted by initiative
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-yellow-400 mb-4">Initiative Order</h2>
            {getDisplayCombatants().map((combatant, idx) => {
              // Find the actual index in combatState for isActive check
              const actualIdx = combatState.combatants.findIndex(c => c.id === combatant.id);
              return (
                <CombatantCard
                  key={combatant.id}
                  combatant={combatant}
                  isActive={actualIdx === combatState.currentTurnIndex}
                  onUpdate={(updates) => updateCombatant(combatant.id, updates)}
                  onRemove={() => removeCombatant(combatant.id)}
                />
              );
            })}
          </div>
        ) : (
          // Display grouped by type
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-blue-400 mb-3">Party</h2>
              <div className="space-y-2">
                {getDisplayCombatants()
                  .filter(c => c.type === 'player')
                  .map((combatant, idx) => {
                    const actualIdx = combatState.combatants.findIndex(c => c.id === combatant.id);
                    return (
                      <CombatantCard
                        key={combatant.id}
                        combatant={combatant}
                        isActive={actualIdx === combatState.currentTurnIndex}
                        onUpdate={(updates) => updateCombatant(combatant.id, updates)}
                        onRemove={() => removeCombatant(combatant.id)}
                      />
                    );
                  })}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-red-400 mb-3">Enemies</h2>
              <div className="space-y-2">
                {getDisplayCombatants()
                  .filter(c => c.type === 'monster')
                  .map((combatant, idx) => {
                    const actualIdx = combatState.combatants.findIndex(c => c.id === combatant.id);
                    return (
                      <CombatantCard
                        key={combatant.id}
                        combatant={combatant}
                        isActive={actualIdx === combatState.currentTurnIndex}
                        onUpdate={(updates) => updateCombatant(combatant.id, updates)}
                        onRemove={() => removeCombatant(combatant.id)}
                      />
                    );
                  })}
              </div>
            </div>
          </div>
        )}
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
      id: crypto.randomUUID(),
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
              {combatant.initiativeRoll && (
                <p className="text-xs text-gray-500">
                  {combatant.initiativeRoll.method === 'rolled' 
                    ? `d20: ${combatant.initiativeRoll.roll} + ${combatant.initiativeRoll.bonus}`
                    : 'Manual'}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400">AC</p>
              <p className="text-lg font-bold">{combatant.ac}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">DEX</p>
              <p className="text-lg font-bold">{combatant.abilityScores?.dexterity || 10}</p>
            </div>
          </div>

          <div className="mb-2">
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
                className="w-14 bg-gray-700 rounded px-2 py-1 text-xs text-center text-white"
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

export default function CombatPage() {
  return (
    <ProtectedRoute>
      <CombatContent />
    </ProtectedRoute>
  );
}

interface InitiativeEntryProps {
  combatant: CombatantState;
  onSet: (initiativeRoll: InitiativeRoll) => void;
}

function InitiativeEntry({ combatant, onSet }: InitiativeEntryProps) {
  const [entryMode, setEntryMode] = useState<'roll' | 'dice' | 'total'>('roll');
  const [diceRoll, setDiceRoll] = useState('');
  const [totalValue, setTotalValue] = useState('');

  const getBonus = (): number => {
    // This is a simplified version - in real implementation, you'd need access to player/monster data
    return 0;
  };

  const handleRoll = () => {
    const randomBytes = new Uint8Array(1);
    crypto.getRandomValues(randomBytes);
    const roll = (randomBytes[0] % 20) + 1;
    const bonus = getBonus();
    const total = roll + bonus;
    
    onSet({
      roll,
      bonus,
      total,
      method: 'rolled',
    });
  };

  const handleDiceEntry = () => {
    const roll = parseInt(diceRoll) || 0;
    if (roll < 1 || roll > 20) {
      alert('Dice roll must be between 1 and 20');
      return;
    }
    
    const bonus = getBonus();
    const total = roll + bonus;
    
    onSet({
      roll,
      bonus,
      total,
      method: 'manual',
    });
  };

  const handleTotalEntry = () => {
    const total = parseInt(totalValue) || 0;
    if (total < 0) {
      alert('Initiative must be 0 or greater');
      return;
    }
    
    onSet({
      roll: 0,
      bonus: 0,
      total,
      method: 'manual',
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">{combatant.name}</h3>
          <p className="text-sm text-gray-400">
            {combatant.type === 'player' ? 'Player' : 'Monster'}
          </p>
        </div>
        <span className={`px-2 py-1 rounded text-xs ${combatant.type === 'player' ? 'bg-blue-600' : 'bg-red-600'}`}>
          {combatant.type}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEntryMode('roll');
              handleRoll();
            }}
            className={`flex-1 px-3 py-2 rounded text-sm ${
              entryMode === 'roll' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Roll d20
          </button>
          <button
            onClick={() => setEntryMode('dice')}
            className={`flex-1 px-3 py-2 rounded text-sm ${
              entryMode === 'dice' ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Enter Dice Roll
          </button>
          <button
            onClick={() => setEntryMode('total')}
            className={`flex-1 px-3 py-2 rounded text-sm ${
              entryMode === 'total' ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Enter Total
          </button>
        </div>

        {entryMode === 'dice' && (
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
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
            >
              Set
            </button>
          </div>
        )}

        {entryMode === 'total' && (
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              value={totalValue}
              onChange={(e) => setTotalValue(e.target.value)}
              placeholder="Total initiative"
              className="flex-1 bg-gray-700 rounded px-3 py-2 text-white"
            />
            <button
              onClick={handleTotalEntry}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
            >
              Set
            </button>
          </div>
        )}

        {combatant.initiativeRoll && (
          <div className="bg-gray-700 rounded px-3 py-2 text-sm">
            <p className="text-gray-400">
              Initiative: <span className="text-white font-bold">{combatant.initiativeRoll.total}</span>
            </p>
            {combatant.initiativeRoll.method === 'rolled' && (
              <p className="text-gray-500 text-xs">
                d20: {combatant.initiativeRoll.roll} + {combatant.initiativeRoll.bonus} = {combatant.initiativeRoll.total}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
