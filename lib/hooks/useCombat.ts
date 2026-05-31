'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { CombatState, CombatantState, Encounter, Character, Party, InitiativeRoll, Monster, MonsterTemplate } from '@/lib/types';
import { resetIncomingLegendaryPool, sortCombatants, buildLairCombatant, buildCombatantFromSource, buildInitiativeRoll } from '@/lib/utils/combat';
import { resolveCharactersForCombat } from '@/lib/utils/partySelection';
import { processRoundEnd } from '@/lib/combat/conditionExpiry';
import { pushHpHistory, popHpHistory, getHpHistoryStack, clearCombatHistory } from '@/lib/utils/hpHistory';

export interface UseCombatOptions {
  campaignId?: string;
}

export function useCombat(options: UseCombatOptions = {}) {
  const { campaignId } = options;
  const [combatState, setCombatState] = useState<CombatState | null>(null);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [monsterTemplates, setMonsterTemplates] = useState<MonsterTemplate[]>([]);
  const [selectedEncounterId, setSelectedEncounterId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initiativeMode, setInitiativeMode] = useState(false);
  const [initiativeFilter, setInitiativeFilter] = useState<'all' | 'player' | 'monster'>('all');
  const [showCombatantModal, setShowCombatantModal] = useState(false);
  const [setupCombatants, setSetupCombatants] = useState<CombatantState[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedDetailCombatantId, setSelectedDetailCombatantId] = useState<string | null>(null);
  const [detailPosition, setDetailPosition] = useState<{top: number, left: number} | null>(null);
  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null);
  const [removeConfirmPosition, setRemoveConfirmPosition] = useState<{top: number, left: number} | null>(null);
  const [showEncounterDescription, setShowEncounterDescription] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [showLairForm, setShowLairForm] = useState(false);
  const [lairFormName, setLairFormName] = useState('');
  const [lairFormSeedMonster, setLairFormSeedMonster] = useState('');
  const setupCombatantsRef = useRef<CombatantState[]>([]);
  const serverCombatIdRef = useRef<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setLoadingTemplates(true);
        setError(null);
        const [encountersRes, charactersRes, combatRes, monstersRes, partiesRes] = await Promise.all([
          fetch('/api/encounters'),
          fetch('/api/characters'),
          fetch('/api/combat'),
          fetch('/api/monsters'),
          fetch('/api/parties'),
        ]);

        if (!encountersRes.ok || !charactersRes.ok || !combatRes.ok || !monstersRes.ok || !partiesRes.ok) {
          throw new Error('Failed to load data');
        }

        const encountersData = await encountersRes.json();
        const charactersData = await charactersRes.json();
        const combatData = await combatRes.json();
        const monstersData = await monstersRes.json();
        const partiesData = await partiesRes.json();

        setEncounters(encountersData || []);
        setCharacters(charactersData || []);
        setMonsterTemplates(monstersData || []);
        setCombatState(combatData || null);
        serverCombatIdRef.current = combatData?.id ?? null;
        setParties(partiesData || []);
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

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Keep ref in sync with setupCombatants state for duplicate detection
  useEffect(() => {
    setupCombatantsRef.current = setupCombatants;
  }, [setupCombatants]);

  const combatFetch = async (method: 'POST' | 'PUT', url: string, body: unknown): Promise<CombatState> => {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errBody = await response.json().catch(() => null);
      const message = errBody?.error ?? (method === 'POST' ? 'Failed to create combat state' : 'Failed to update combat state');
      throw new Error(message);
    }
    return response.json();
  };

  const saveCombatState = async (state: CombatState | null) => {
    const prev = combatState;
    try {
      setError(null);
      setCombatState(state);
      if (state) {
        if (!serverCombatIdRef.current) {
          const saved = await combatFetch('POST', '/api/combat', state);
          serverCombatIdRef.current = saved.id;
          setCombatState(saved);
        } else {
          const updated = await combatFetch('PUT', `/api/combat/${serverCombatIdRef.current}`, state);
          setCombatState(updated);
        }
      }
    } catch (err) {
      setCombatState(prev);
      setError(err instanceof Error ? err.message : 'Failed to save combat state');
    }
  };

  const addCombatantToSetup = (combatant: CombatantState) => {
    setSetupCombatants(prev => [...prev, combatant]);
    setupCombatantsRef.current = [...setupCombatantsRef.current, combatant];
  };

  const removeCombatantFromSetup = (id: string) => {
    const next = setupCombatantsRef.current.filter(c => c.id !== id);
    setSetupCombatants(next);
    setupCombatantsRef.current = next;
  };

  const cancelLairForm = () => { setShowLairForm(false); setLairFormName(''); setLairFormSeedMonster(''); };

  const confirmAddLair = () => {
    const name = lairFormName.trim();
    if (!name) return;
    if (!combatState) {
      // Setup phase
      const lair = buildLairCombatant(name, lairFormSeedMonster, setupCombatants);
      setSetupCombatants(prev => [...prev, lair]);
      setupCombatantsRef.current = [...setupCombatantsRef.current, lair];
    } else {
      // Active combat
      const lair = buildLairCombatant(name, lairFormSeedMonster, combatState.combatants);
      const currentCombatantId = combatState.combatants[combatState.currentTurnIndex]?.id;
      const updatedList = sortCombatants([...combatState.combatants, lair]);
      const newTurnIndex = currentCombatantId
        ? updatedList.findIndex(c => c.id === currentCombatantId)
        : combatState.currentTurnIndex;
      saveCombatState({
        ...combatState,
        combatants: updatedList,
        currentTurnIndex: newTurnIndex !== -1 ? newTurnIndex : 0,
      });
    }
    cancelLairForm();
  };

  const selectParty = (partyId: string | null) => {
    setSelectedPartyId(partyId);
  };

  const renumberCombatants = (list: CombatantState[], newCombatant: CombatantState): CombatantState[] => {
    const cleanName = newCombatant.name.replace(/\s+\d+$/, '');
    const existingWithSameName = list.filter(c => c.name.replace(/\s+\d+$/, '') === cleanName);
    if (existingWithSameName.length === 0) return [...list, newCombatant];
    const renumbered = list.map(c => {
      if (c.name.replace(/\s+\d+$/, '') !== cleanName) return c;
      const idx = existingWithSameName.findIndex(dup => dup.id === c.id);
      return { ...c, name: `${cleanName} ${idx + 1}` };
    });
    return [...renumbered, { ...newCombatant, name: `${cleanName} ${existingWithSameName.length + 1}` }];
  };

  const addCombatantToActiveSession = (combatant: CombatantState) => {
    if (!combatState) return;

    const updatedCombatantsList = renumberCombatants(combatState.combatants, combatant);

    // Track the current combatant's ID to maintain turn pointer
    const currentCombatantId = combatState.combatants[combatState.currentTurnIndex]?.id;
    
    // Only sort if initiative has been rolled; otherwise just append
    const sortedCombatants = hasInitiativeBeenRolled()
      ? sortCombatants(updatedCombatantsList)
      : updatedCombatantsList;

    // Find the index of the current combatant in the new list to preserve turn continuity
    const newTurnIndex = currentCombatantId
      ? sortedCombatants.findIndex(c => c.id === currentCombatantId)
      : combatState.currentTurnIndex;

    saveCombatState({
      ...combatState,
      combatants: sortedCombatants,
      currentTurnIndex: newTurnIndex !== -1 ? newTurnIndex : 0,
    });
    setShowCombatantModal(false);
  };

  const addCombatantFromLibrary = (
    item: Monster | Character,
    type: 'monster' | 'player',
    idPrefix: string
  ) => {
    try {
      const combatant: CombatantState = buildCombatantFromSource(item, type, idPrefix);

      if (!combatState) {
        const finalCombatants = renumberCombatants(setupCombatantsRef.current, combatant);
        setSetupCombatants(finalCombatants);
        setupCombatantsRef.current = finalCombatants;
      } else {
        addCombatantToActiveSession(combatant);
      }

      setShowCombatantModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add combatant');
    }
  };

  const startCombatWithSetupCombatants = () => {
    // Combine setup combatants with characters from library
    const combatants: CombatantState[] = [...setupCombatants];

    // Add characters: only party members if a party is selected, otherwise all characters
    const charactersToAdd = resolveCharactersForCombat(selectedPartyId, parties, characters, setupCombatants);

    charactersToAdd.forEach(character => {
      const c = buildCombatantFromSource(character, 'player', 'character');
      combatants.push({ ...c, id: `character-${character.id}` });
    });

    // Add monsters from selected encounter if any
    if (selectedEncounterId) {
      const encounter = encounters.find(e => e.id === selectedEncounterId);
      if (encounter) {
        encounter.monsters.forEach((monster, idx) => {
          const c = buildCombatantFromSource(monster, 'monster', 'monster');
          combatants.push({ ...c, id: `monster-${monster.id}-${idx}`, name: `${monster.name} ${idx + 1}` });
        });
      }
    }

    const encounter = selectedEncounterId ? encounters.find(e => e.id === selectedEncounterId) : undefined;

    if (!campaignId) {
      setError('Campaign ID is required to start combat');
      return;
    }

    const newState: CombatState = {
      id: crypto.randomUUID(),
      userId: '',
      campaignId,
      encounterId: selectedEncounterId || undefined,
      encounterDescription: encounter?.description,
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

  const endCombat = async () => {
    if (!confirm('Are you sure you want to end combat?')) return;
    if (!combatState || !serverCombatIdRef.current) return;
    try {
      setError(null);
      await combatFetch('PUT', `/api/combat/${serverCombatIdRef.current}`, { isActive: false });
      serverCombatIdRef.current = null;
      clearCombatHistory(combatState.id);
      setCombatState(null);
      setSetupCombatants([]);
      setSelectedPartyId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end combat');
    }
  };

  const restartRound = () => {
    if (!combatState) return;
    saveCombatState({
      ...combatState,
      currentTurnIndex: 0,
    });
  };

  const rollInitiative = () => {
    if (!combatState) return;

    // Roll initiative for all non-lair combatants (lair slots are always initiative 20)
    const updatedCombatants = combatState.combatants.map(c => {
      if (c.type === 'lair') return c;
      const initiativeRoll = buildInitiativeRoll(c);
      return { ...c, initiative: initiativeRoll.total, initiativeRoll };
    });

    saveCombatState({
      ...combatState,
      combatants: sortCombatants(updatedCombatants),
      currentTurnIndex: 0,
    });
    setInitiativeMode(false);
  };

  const nextTurn = () => {
    if (!combatState) return;

    let nextIndex = combatState.currentTurnIndex + 1;
    let nextRound = combatState.currentRound;
    let baseCombatants = combatState.combatants;

    if (nextIndex >= combatState.combatants.length) {
      nextIndex = 0;
      nextRound += 1;

      // Decrement condition durations, collect expiring conditions, and remove expired ones (single pass)
      const { updatedCombatants, expiring } = processRoundEnd(combatState.combatants);
      if (expiring.length > 0) {
        const lines = expiring.map(e => `• ${e.combatantName}: ${e.conditionName}`).join('\n');
        alert(`Conditions expired:\n${lines}`);
      }
      baseCombatants = updatedCombatants;
    }

    // Reset legendary action pool for the incoming combatant (both mid-round and round-end paths)
    const combatants = resetIncomingLegendaryPool(baseCombatants, nextIndex);

    saveCombatState({
      ...combatState,
      combatants,
      currentTurnIndex: nextIndex,
      currentRound: nextRound,
    });
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

  const updateCombatantInitiativeSettings = (id: string, adv: boolean, fb: number) => {
    updateCombatant(id, { initiativeAdvantage: adv, initiativeFlatBonus: fb });
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

    // Track the current combatant's ID to maintain turn pointer
    const currentCombatantId = combatState.combatants[combatState.currentTurnIndex]?.id;

    const updatedCombatants = combatState.combatants.map(c =>
      c.id === combatantId 
        ? { ...c, initiative: initiativeRoll.total, initiativeRoll }
        : c
    );

    const sortedCombatants = sortCombatants(updatedCombatants);

    // Find the index of the current combatant in the new sorted list to preserve turn continuity
    const newTurnIndex = currentCombatantId
      ? sortedCombatants.findIndex(c => c.id === currentCombatantId)
      : 0;

    saveCombatState({
      ...combatState,
      combatants: sortedCombatants,
      currentTurnIndex: newTurnIndex !== -1 ? newTurnIndex : 0,
    });
  };

  const hasInitiativeBeenRolled = () => {
    return !!combatState?.combatants.some(c => c.initiativeRoll);
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

  // Combatants that still need initiative (initiative === 0) sorted alphabetically by name
  const zeroInitiative = useMemo(() => {
    if (!combatState) return [] as CombatantState[];
    return [...combatState.combatants.filter(c => c.initiative === 0)].sort((a, b) => a.name.localeCompare(b.name));
  }, [combatState]);

  // Filtered view for zero-initiative list (all/player/monster)
  const filteredZeroInitiative = zeroInitiative.filter(c => initiativeFilter === 'all' || c.type === initiativeFilter);

  return {
    loading,
    error,
    encounters,
    characters,
    monsterTemplates,
    parties,
    combatState,
    setupCombatants,
    selectedEncounterId,
    selectedPartyId,
    initiativeMode,
    initiativeFilter,
    showCombatantModal,
    loadingTemplates,
    selectedDetailCombatantId,
    detailPosition,
    removeConfirmId,
    removeConfirmPosition,
    showEncounterDescription,
    toast,
    showLairForm,
    lairFormName,
    lairFormSeedMonster,
    zeroInitiative,
    filteredZeroInitiative,

    setSelectedEncounterId,
    selectParty,
    setInitiativeMode,
    setInitiativeFilter,
    setShowCombatantModal,
    setSelectedDetailCombatantId,
    setDetailPosition,
    setRemoveConfirmId,
    setRemoveConfirmPosition,
    setShowEncounterDescription,
    setToast,
    setShowLairForm,
    setLairFormName,
    setLairFormSeedMonster,

    saveCombatState,
    addCombatantToSetup,
    removeCombatantFromSetup,
    cancelLairForm,
    confirmAddLair,
    addCombatantToActiveSession,
    addCombatantFromLibrary,
    startCombatWithSetupCombatants,
    startCombat,
    endCombat,
    restartRound,
    rollInitiative,
    nextTurn,
    updateCombatant,
    updateCombatantInitiativeSettings,
    removeCombatant,
    setInitiativeRoll,
    hasInitiativeBeenRolled,
    getDisplayCombatants
  };
}


export interface UseCombatReturn {
  loading: boolean;
  error: string | null;
  encounters: Encounter[];
  characters: Character[];
  monsterTemplates: MonsterTemplate[];
  parties: Party[];
  combatState: CombatState | null;
  setupCombatants: CombatantState[];
  selectedEncounterId: string;
  selectedPartyId: string | null;
  initiativeMode: boolean;
  initiativeFilter: 'all' | 'player' | 'monster';
  showCombatantModal: boolean;
  loadingTemplates: boolean;
  selectedDetailCombatantId: string | null;
  detailPosition: {top: number, left: number} | null;
  removeConfirmId: string | null;
  removeConfirmPosition: {top: number, left: number} | null;
  showEncounterDescription: boolean;
  toast: {message: string, type: 'success' | 'error'} | null;
  showLairForm: boolean;
  lairFormName: string;
  lairFormSeedMonster: string;
  zeroInitiative: CombatantState[];
  filteredZeroInitiative: CombatantState[];
  
  setSelectedEncounterId: (id: string) => void;
  selectParty: (id: string | null) => void;
  setInitiativeMode: (mode: boolean) => void;
  setInitiativeFilter: (filter: 'all' | 'player' | 'monster') => void;
  setShowCombatantModal: (show: boolean) => void;
  setSelectedDetailCombatantId: (id: string | null) => void;
  setDetailPosition: (pos: {top: number, left: number} | null) => void;
  setRemoveConfirmId: (id: string | null) => void;
  setRemoveConfirmPosition: (pos: {top: number, left: number} | null) => void;
  setShowEncounterDescription: (show: boolean) => void;
  setToast: (toast: {message: string, type: 'success' | 'error'} | null) => void;
  setShowLairForm: (show: boolean) => void;
  setLairFormName: (name: string) => void;
  setLairFormSeedMonster: (name: string) => void;

  saveCombatState: (state: CombatState | null) => Promise<void>;
  addCombatantToSetup: (combatant: CombatantState) => void;
  removeCombatantFromSetup: (id: string) => void;
  cancelLairForm: () => void;
  confirmAddLair: () => void;
  addCombatantToActiveSession: (combatant: CombatantState) => void;
  addCombatantFromLibrary: (item: Monster | Character, type: 'player' | 'monster', idPrefix: 'character' | 'monster') => void;
  startCombatWithSetupCombatants: () => void;
  startCombat: () => void;
  endCombat: () => Promise<void>;
  restartRound: () => void;
  rollInitiative: () => void;
  nextTurn: () => void;
  updateCombatant: (id: string, updates: Partial<CombatantState>) => void;
  updateCombatantInitiativeSettings: (id: string, adv: boolean, fb: number) => void;
  removeCombatant: (id: string) => void;
  setInitiativeRoll: (combatantId: string, initiativeRoll: InitiativeRoll) => void;
  hasInitiativeBeenRolled: () => boolean;
  getDisplayCombatants: () => CombatantState[];
}
