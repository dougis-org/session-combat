'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';
import { CreatureStatBlock } from '@/lib/components/CreatureStatBlock';
import { QuickCombatantModal } from '@/lib/components/QuickCombatantModal';
import { useAuth } from '@/lib/hooks/useAuth';
import { CombatState, CombatantState, Encounter, Character, StatusCondition, InitiativeRoll, Monster, MonsterTemplate } from '@/lib/types';
import { rollD20 } from '@/lib/utils/dice';

function CombatContent() {
  const { user } = useAuth();
  const [combatState, setCombatState] = useState<CombatState | null>(null);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [monsterTemplates, setMonsterTemplates] = useState<MonsterTemplate[]>([]);
  const [selectedEncounterId, setSelectedEncounterId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initiativeMode, setInitiativeMode] = useState(false);
  const [showQuickEntryType, setShowQuickEntryType] = useState<'player' | 'monster' | null>(null);
  const [showCombatantModal, setShowCombatantModal] = useState(false);
  const [setupCombatants, setSetupCombatants] = useState<CombatantState[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedDetailCombatantId, setSelectedDetailCombatantId] = useState<string | null>(null);
  const [detailPosition, setDetailPosition] = useState<{top: number, left: number} | null>(null);
  const [initiativeEditId, setInitiativeEditId] = useState<string | null>(null);
  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null);
  const [removeConfirmPosition, setRemoveConfirmPosition] = useState<{top: number, left: number} | null>(null);
  const initiativePanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setLoadingTemplates(true);
        setError(null);
        const [encountersRes, charactersRes, combatRes, monstersRes] = await Promise.all([
          fetch('/api/encounters'),
          fetch('/api/characters'),
          fetch('/api/combat'),
          fetch('/api/monsters'),
        ]);

        if (!encountersRes.ok || !charactersRes.ok || !combatRes.ok || !monstersRes.ok) {
          throw new Error('Failed to load data');
        }

        const encountersData = await encountersRes.json();
        const charactersData = await charactersRes.json();
        const combatData = await combatRes.json();
        const monstersData = await monstersRes.json();

        setEncounters(encountersData || []);
        setCharacters(charactersData || []);
        setMonsterTemplates(monstersData || []);
        setCombatState(combatData || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
        setLoadingTemplates(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedDetailCombatantId(null);
      }
    };
    if (selectedDetailCombatantId) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [selectedDetailCombatantId]);

  // Scroll to initiative panel when it opens
  useEffect(() => {
    if (initiativeEditId && initiativePanelRef.current) {
      // Use scrollIntoView for more reliable scrolling
      initiativePanelRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [initiativeEditId]);

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
    // Add to setupCombatants instead of starting combat
    setSetupCombatants(prev => [...prev, combatant]);
    setShowQuickEntryType(null);
  };

  const removeCombatantFromSetup = (id: string) => {
    setSetupCombatants(prev => prev.filter(c => c.id !== id));
  };

  const addCombatantToActiveSession = (combatant: CombatantState) => {
    // Add combatant directly to active combat, re-sorting if initiative has been rolled.
    // Note: New combatants are added with initiative: 0. If initiative has been rolled,
    // they will appear at the bottom of the turn order. Users can manually adjust
    // initiative via the Manual Entry option if needed.
    if (!combatState) return;

    // Track the current combatant's ID to maintain turn pointer
    const currentCombatantId = combatState.combatants[combatState.currentTurnIndex]?.id;
    
    // Only sort if initiative has been rolled; otherwise just append
    const updatedCombatants = hasInitiativeBeenRolled()
      ? sortCombatants([...combatState.combatants, combatant])
      : [...combatState.combatants, combatant];

    // Find the index of the current combatant in the new list to preserve turn continuity
    const newTurnIndex = currentCombatantId
      ? updatedCombatants.findIndex(c => c.id === currentCombatantId)
      : combatState.currentTurnIndex;

    saveCombatState({
      ...combatState,
      combatants: updatedCombatants,
      currentTurnIndex: newTurnIndex !== -1 ? newTurnIndex : 0,
    });
    setShowQuickEntryType(null);
    setShowCombatantModal(false);
  };

  const addCombatantFromLibrary = (
    item: Monster | Character,
    type: 'monster' | 'player',
    idPrefix: string
  ) => {
    const combatant: CombatantState = {
      id: `${idPrefix}-${item.id}-${crypto.randomUUID()}`,
      name: item.name,
      type,
      initiative: 0,
      abilityScores: item.abilityScores || { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
      hp: item.hp,
      maxHp: item.maxHp,
      ac: item.ac,
      conditions: [],
      traits: item.traits,
      actions: item.actions,
      bonusActions: item.bonusActions,
      reactions: item.reactions,
      legendaryActions: 'legendaryActions' in item ? item.legendaryActions : undefined,
      lairActions: 'lairActions' in item ? item.lairActions : undefined,
    };

    if (!combatState) {
      // During setup phase
      addCombatantToSetup(combatant);
    } else {
      // During active combat
      addCombatantToActiveSession(combatant);
    }
  };

  const startCombatWithSetupCombatants = () => {
    // Combine setup combatants with characters from library
    const combatants: CombatantState[] = [...setupCombatants];

    // Add characters
    characters.forEach(character => {
      const dexterity = character.abilityScores?.dexterity || 10;
      const dexModifier = Math.floor((dexterity - 10) / 2);
      combatants.push({
        id: `character-${character.id}`,
        name: character.name,
        type: 'player',
        initiative: 0,
        abilityScores: character.abilityScores || { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
        hp: character.hp,
        maxHp: character.maxHp,
        ac: character.ac,
        conditions: [],
        traits: character.traits,
        actions: character.actions,
        bonusActions: character.bonusActions,
        reactions: character.reactions,
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
            abilityScores: monster.abilityScores || { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
            hp: monster.hp,
            maxHp: monster.maxHp,
            ac: monster.ac,
            conditions: [],
            traits: monster.traits,
            actions: monster.actions,
            bonusActions: monster.bonusActions,
            reactions: monster.reactions,
            legendaryActions: monster.legendaryActions,
            lairActions: monster.lairActions,
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
    setSetupCombatants([]);
  };

  const startCombat = () => {
    // Starts combat including both library encounter combatants and any accumulated setup combatants.
    startCombatWithSetupCombatants();
  };

  const endCombat = () => {
    if (confirm('Are you sure you want to end combat?')) {
      saveCombatState(null);
      setSetupCombatants([]);
    }
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
    // Setup phase: show option to start new combat with library combatants or quick entry
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

                {setupCombatants.length > 0 && (
                  <div className="mb-4 bg-gray-800 rounded p-3">
                    <p className="text-xs text-gray-400 mb-2">Quick Entry Combatants:</p>
                    <div className="space-y-2">
                      {setupCombatants.map(combatant => (
                        <div key={combatant.id} className="flex justify-between items-center bg-gray-700 rounded px-2 py-1 text-sm">
                          <span className="text-white">
                            {combatant.name} 
                            <span className={`ml-2 px-2 py-0.5 rounded text-xs ${combatant.type === 'player' ? 'bg-blue-600' : 'bg-red-600'}`}>
                              {combatant.type}
                            </span>
                          </span>
                          <button
                            onClick={() => removeCombatantFromSetup(combatant.id)}
                            className="text-red-400 hover:text-red-300 text-xs"
                            aria-label={`Remove ${combatant.name}`}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <button
                    onClick={() => setShowCombatantModal(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-semibold transition-colors"
                  >
                    + Add Party Member
                  </button>
                  <button
                    onClick={() => setShowCombatantModal(true)}
                    className="w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-semibold transition-colors"
                  >
                    + Add Enemy
                  </button>
                  {setupCombatants.length > 0 && (
                    <button
                      onClick={startCombatWithSetupCombatants}
                      className="w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm font-semibold transition-colors mt-2"
                    >
                      Start Combat
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {showCombatantModal && (
            <QuickCombatantModal
              onAddMonster={(monster) => addCombatantFromLibrary(monster, 'monster', 'monster')}
              onAddCharacter={(character) => addCombatantFromLibrary(character, 'player', 'character')}
              onClose={() => setShowCombatantModal(false)}
              monsterTemplates={monsterTemplates}
              characterTemplates={characters}
              loadingTemplates={loadingTemplates}
              userId={user?.userId}
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
          <div className="flex gap-2 flex-wrap">
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
              onClick={() => setShowCombatantModal(true)}
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-sm"
              title="Add a party member mid-combat"
            >
              + Add Party Member
            </button>
            <button
              onClick={() => setShowCombatantModal(true)}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-sm"
              title="Add an enemy mid-combat"
            >
              + Add Enemy
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

        {/* Initiative Entry Panel */}
        {initiativeEditId && combatState && (
          <div ref={initiativePanelRef} className="mb-6 bg-gray-800 rounded-lg p-6 border border-gray-700">
            <InitiativeEntry
              combatant={combatState.combatants.find(c => c.id === initiativeEditId)!}
              onSet={(initiativeRoll) => {
                updateCombatant(initiativeEditId, {
                  initiative: initiativeRoll.total,
                  initiativeRoll,
                });
                setInitiativeEditId(null);
              }}
            />
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
                  onNextTurn={nextTurn}
                  onShowDetails={(id, pos) => {
                    setSelectedDetailCombatantId(id);
                    setDetailPosition(pos);
                  }}
                  onSetInitiative={setInitiativeEditId}
                  onShowRemoveConfirm={(id, pos) => {
                    setRemoveConfirmId(id);
                    setRemoveConfirmPosition(pos);
                  }}
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
                        onNextTurn={nextTurn}
                        onShowDetails={(id, pos) => {
                    setSelectedDetailCombatantId(id);
                    setDetailPosition(pos);
                  }}
                        onSetInitiative={setInitiativeEditId}
                        onShowRemoveConfirm={(id, pos) => {
                          setRemoveConfirmId(id);
                          setRemoveConfirmPosition(pos);
                        }}
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
                        onNextTurn={nextTurn}
                        onShowDetails={(id, pos) => {
                    setSelectedDetailCombatantId(id);
                    setDetailPosition(pos);
                  }}
                        onSetInitiative={setInitiativeEditId}
                        onShowRemoveConfirm={(id, pos) => {
                          setRemoveConfirmId(id);
                          setRemoveConfirmPosition(pos);
                        }}
                      />
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Combatant Modal for both library and custom */}
        {showCombatantModal && (
          <QuickCombatantModal
            onAddMonster={(monster) => addCombatantFromLibrary(monster, 'monster', 'monster')}
            onAddCharacter={(character) => addCombatantFromLibrary(character, 'player', 'character')}
            onClose={() => setShowCombatantModal(false)}
            monsterTemplates={monsterTemplates}
            characterTemplates={characters}
            loadingTemplates={loadingTemplates}
            userId={user?.userId}
          />
        )}

        {/* Detail Popup */}
        {selectedDetailCombatantId && combatState && detailPosition && (
          <div 
            className="absolute bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-xl border border-gray-700 z-50"
            style={{
              top: '10px',
              left: `${detailPosition.left}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const combatant = combatState.combatants.find(c => c.id === selectedDetailCombatantId);
              if (!combatant) return <div>Combatant not found</div>;
              
              return (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">
                      {combatant.name}
                    </h2>
                    <button
                      onClick={() => setSelectedDetailCombatantId(null)}
                      className="text-gray-400 hover:text-gray-200 text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm">HP</p>
                        <p className="text-lg font-bold">{combatant.hp} / {combatant.maxHp}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">AC</p>
                        <p className="text-lg font-bold">{combatant.ac}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Initiative</p>
                        <p className="text-lg font-bold">{combatant.initiative}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Type</p>
                        <p className="text-lg font-bold">{combatant.type === 'player' ? 'Character' : 'Monster'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-gray-400 text-sm mb-2">Ability Scores</p>
                      <div className="grid grid-cols-6 gap-2">
                        <div className="bg-gray-700 p-2 rounded text-center">
                          <p className="text-xs text-gray-400">STR</p>
                          <p className="font-bold">{combatant.abilityScores?.strength || 10}</p>
                        </div>
                        <div className="bg-gray-700 p-2 rounded text-center">
                          <p className="text-xs text-gray-400">DEX</p>
                          <p className="font-bold">{combatant.abilityScores?.dexterity || 10}</p>
                        </div>
                        <div className="bg-gray-700 p-2 rounded text-center">
                          <p className="text-xs text-gray-400">CON</p>
                          <p className="font-bold">{combatant.abilityScores?.constitution || 10}</p>
                        </div>
                        <div className="bg-gray-700 p-2 rounded text-center">
                          <p className="text-xs text-gray-400">INT</p>
                          <p className="font-bold">{combatant.abilityScores?.intelligence || 10}</p>
                        </div>
                        <div className="bg-gray-700 p-2 rounded text-center">
                          <p className="text-xs text-gray-400">WIS</p>
                          <p className="font-bold">{combatant.abilityScores?.wisdom || 10}</p>
                        </div>
                        <div className="bg-gray-700 p-2 rounded text-center">
                          <p className="text-xs text-gray-400">CHA</p>
                          <p className="font-bold">{combatant.abilityScores?.charisma || 10}</p>
                        </div>
                      </div>
                    </div>

                    {combatant.actions && combatant.actions.length > 0 && (
                      <div>
                        <p className="text-gray-400 text-sm mb-2 font-semibold">Actions</p>
                        <div className="space-y-2">
                          {combatant.actions.map((action) => (
                            <div key={action.name} className="text-xs">
                              <p className="font-bold text-white">{action.name}</p>
                              <p className="text-gray-300">{action.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {combatant.bonusActions && combatant.bonusActions.length > 0 && (
                      <div>
                        <p className="text-gray-400 text-sm mb-2 font-semibold">Bonus Actions</p>
                        <div className="space-y-2">
                          {combatant.bonusActions.map((action) => (
                            <div key={action.name} className="text-xs">
                              <p className="font-bold text-white">{action.name}</p>
                              <p className="text-gray-300">{action.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {combatant.reactions && combatant.reactions.length > 0 && (
                      <div>
                        <p className="text-gray-400 text-sm mb-2 font-semibold">Reactions</p>
                        <div className="space-y-2">
                          {combatant.reactions.map((action) => (
                            <div key={action.name} className="text-xs">
                              <p className="font-bold text-white">{action.name}</p>
                              <p className="text-gray-300">{action.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {combatant.legendaryActions && combatant.legendaryActions.length > 0 && (
                      <div>
                        <p className="text-gray-400 text-sm mb-2 font-semibold">Legendary Actions</p>
                        <div className="space-y-2">
                          {combatant.legendaryActions.map((action) => (
                            <div key={action.name} className="text-xs">
                              <p className="font-bold text-white">{action.name}</p>
                              <p className="text-gray-300">{action.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {combatant.lairActions && combatant.lairActions.length > 0 && (
                      <div>
                        <p className="text-gray-400 text-sm mb-2 font-semibold">Lair Actions</p>
                        <div className="space-y-2">
                          {combatant.lairActions.map((action) => (
                            <div key={action.name} className="text-xs">
                              <p className="font-bold text-white">{action.name}</p>
                              <p className="text-gray-300">{action.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Remove Confirmation Modal */}
        {removeConfirmId && combatState && removeConfirmPosition && (
          <div 
            className="absolute bg-gray-800 rounded-lg p-6 max-w-sm w-80 shadow-xl border border-gray-700 z-50"
            style={{
              top: `${removeConfirmPosition.top}px`,
              left: `${removeConfirmPosition.left}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const combatant = combatState.combatants.find(c => c.id === removeConfirmId);
              if (!combatant) return null;
              
              return (
                <>
                  <p className="text-lg font-semibold mb-4">
                    Remove <span className="text-red-400">{combatant.name}</span> from combat?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        removeCombatant(removeConfirmId);
                        setRemoveConfirmId(null);
                        setRemoveConfirmPosition(null);
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-semibold"
                    >
                      Remove
                    </button>
                    <button
                      onClick={() => {
                        setRemoveConfirmId(null);
                        setRemoveConfirmPosition(null);
                      }}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              );
            })()}
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
  onNextTurn,
  onShowDetails,
  onSetInitiative,
  onShowRemoveConfirm,
}: {
  combatant: CombatantState;
  isActive: boolean;
  onUpdate: (updates: Partial<CombatantState>) => void;
  onRemove: () => void;
  onNextTurn?: () => void;
  onShowDetails?: (combatantId: string, position: {top: number, left: number}) => void;
  onSetInitiative?: (combatantId: string) => void;
  onShowRemoveConfirm?: (combatantId: string, position: {top: number, left: number}) => void;
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

  // Background gradient based on combatant type - stronger fade from left to right
  const bgStyle = combatant.type === 'player'
    ? { backgroundImage: 'linear-gradient(to right, rgba(96, 165, 250, 0.18), rgba(96, 165, 250, 0.02))' }
    : { backgroundImage: 'linear-gradient(to right, rgba(239, 68, 68, 0.18), rgba(239, 68, 68, 0.02))' };

  return (
    <div style={bgStyle} className={`rounded-lg px-4 py-6 ${isActive ? 'border-2 border-yellow-500' : 'border border-gray-700'}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                  onShowDetails?.(combatant.id, {
                    top: rect.bottom,
                    left: rect.left,
                  });
                }}
                className="hover:opacity-80 transition-opacity"
                title={`See full ${combatant.type === 'player' ? 'Character' : 'Monster'} information`}
                type="button"
              >
                <svg
                  className="w-5 h-5 text-gray-400 hover:text-gray-300 cursor-pointer"
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
              <h3 className="text-xl font-semibold">{combatant.name}</h3>
              <button
                onClick={(e) => {
                  const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                  onShowRemoveConfirm?.(combatant.id, {
                    top: rect.bottom,
                    left: rect.left,
                  });
                }}
                className="text-red-500 hover:text-red-400 text-xl leading-none"
                title="Remove combatant"
              >
                ✕
              </button>
              {isActive && onNextTurn && (
                <button
                  onClick={onNextTurn}
                  className="px-2 py-1 rounded text-xs bg-yellow-600 hover:bg-yellow-700 animate-pulse font-semibold"
                >
                  Current Turn (done)
                </button>
              )}
            </div>
            {!isActive && <div className="w-40"></div>}
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-400">AC</p>
              <p className="text-lg font-bold">{combatant.ac}</p>
            </div>
            <span className="text-sm text-gray-400 whitespace-nowrap">Hit Points:</span>
            <span className="text-lg font-bold">
              Current: {combatant.hp} Total: {combatant.maxHp}
            </span>
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
            <div className="flex items-center gap-2 ml-auto pr-4">
              <button
                onClick={() => onSetInitiative?.(combatant.id)}
                className="flex items-center gap-1 hover:opacity-80 cursor-pointer transition-opacity"
              >
                <p className="text-xs text-gray-400">Initiative</p>
                <p className="text-lg font-bold">{combatant.initiative}</p>
                {combatant.initiativeRoll && (
                  <p className="text-xs text-gray-500 whitespace-nowrap">
                    {combatant.initiativeRoll.method === 'rolled' 
                      ? `d20:${combatant.initiativeRoll.roll}+${combatant.initiativeRoll.bonus}`
                      : 'Manual'}
                  </p>
                )}
              </button>
            </div>
          </div>

          <div className="w-4/5 bg-gray-700 rounded-full h-2">
            <div className={`${hpColor} h-2 rounded-full transition-all`} style={{ width: `${hpPercent}%` }} />
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
            className="bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-xs"
          >
            Add Condition
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
    const roll = rollD20();
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
