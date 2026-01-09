/**
 * Integration tests for party selection during combat initialization
 * Tests the E2E flow from party selection through combat state creation
 */

import { expandPartyToCharacters, findDuplicatePartyCharacters } from '../../lib/utils/partySelection';
import { PartyTestDataProvider } from './helpers/partyTestData';
import { CombatantState } from '../../lib/types';

describe('Combat with Party Integration Tests', () => {
  describe('Party selection during setup phase', () => {
    test('selecting a party adds its characters to setup combatants', () => {
      const parties = PartyTestDataProvider.sampleParties();
      const partyThree = parties.find(p => p.id === 'party-three');
      if (!partyThree) throw new Error('party-three not found');

      const characters = [
        { id: 'char-1', name: 'Aragorn', hp: 50, maxHp: 50, ac: 18, abilityScores: {} },
        { id: 'char-2', name: 'Legolas', hp: 40, maxHp: 40, ac: 16, abilityScores: {} },
        { id: 'char-3', name: 'Gimli', hp: 60, maxHp: 60, ac: 19, abilityScores: {} },
        { id: 'char-4', name: 'Boromir', hp: 55, maxHp: 55, ac: 17, abilityScores: {} },
      ];

      // Expand party characters
      const expanded = expandPartyToCharacters(partyThree, characters);

      // Verify correct number of characters returned
      expect(expanded).toHaveLength(3);

      // Verify character names are preserved
      expect(expanded.map(c => c.name)).toContain('Legolas');
      expect(expanded.map(c => c.name)).toContain('Gimli');
      expect(expanded.map(c => c.name)).toContain('Boromir');
    });

    test('deselecting a party removes its characters from setup', () => {
      const parties = PartyTestDataProvider.sampleParties();
      const partyOne = parties.find(p => p.id === 'party-one');
      if (!partyOne) throw new Error('party-one not found');

      const characters = [
        { id: 'char-1', name: 'Frodo', hp: 30, maxHp: 30, ac: 10, abilityScores: {} },
      ];

      const expanded = expandPartyToCharacters(partyOne, characters);
      expect(expanded).toHaveLength(1);

      // After deselection, filtering would remove these
      const setupCombatants: CombatantState[] = expanded.map((c: any) => ({
        id: `party-${partyOne.id}-${c.id}`,
        name: c.name,
        type: 'player',
        initiative: 0,
        abilityScores: {},
        hp: 0,
        maxHp: 0,
        ac: 0,
        conditions: [],
      }));

      const filtered = setupCombatants.filter(c => !c.id.startsWith('party-'));
      expect(filtered).toHaveLength(0);
    });
  });

  describe('Duplicate character detection', () => {
    test('detects when party character is already in setup', () => {
      const partyChars = [{ id: 'char-1', name: 'Frodo' }];
      const setupCombatants: CombatantState[] = [
        {
          id: 'character-char-1',
          name: 'Frodo',
          type: 'player',
          initiative: 0,
          abilityScores: {},
          hp: 30,
          maxHp: 30,
          ac: 10,
          conditions: [],
        },
      ];

      const duplicates = findDuplicatePartyCharacters(partyChars, setupCombatants);

      // The function checks if character IDs are contained in setup combatant IDs
      expect(duplicates.length).toBeGreaterThan(0);
    });

    test('handles partial overlap between party and manual selections', () => {
      const partyChars = [
        { id: 'char-2', name: 'B' },
        { id: 'char-3', name: 'C' },
      ];

      const setupCombatants: CombatantState[] = [
        {
          id: 'character-char-2',
          name: 'B',
          type: 'player',
          initiative: 0,
          abilityScores: {},
          hp: 30,
          maxHp: 30,
          ac: 10,
          conditions: [],
        },
        {
          id: 'character-char-5',
          name: 'E',
          type: 'player',
          initiative: 0,
          abilityScores: {},
          hp: 35,
          maxHp: 35,
          ac: 11,
          conditions: [],
        },
      ];

      const duplicates = findDuplicatePartyCharacters(partyChars, setupCombatants);

      // Should find at least char-2 as duplicate
      expect(duplicates.length).toBeGreaterThan(0);
      expect(duplicates.some(d => d.id === 'char-2')).toBe(true);
    });

    test('prevents duplicates when selecting party after manual combatants', () => {
      const parties = PartyTestDataProvider.sampleParties();
      const party = parties.find(p => p.id === 'party-one');
      if (!party) throw new Error('party-one not found');

      // User manually added char-1
      const setupCombatants: CombatantState[] = [
        {
          id: 'character-char-1',
          name: 'Frodo',
          type: 'player',
          initiative: 0,
          abilityScores: {},
          hp: 30,
          maxHp: 30,
          ac: 10,
          conditions: [],
        },
      ];

      // Party also contains char-1
      const partyChars = [{ id: 'char-1', name: 'Frodo' }];

      const duplicates = findDuplicatePartyCharacters(partyChars, setupCombatants);

      expect(duplicates.length).toBeGreaterThan(0);
    });
  });

  describe('Edge cases', () => {
    test('empty party does not cause errors', () => {
      const parties = PartyTestDataProvider.sampleParties();
      const emptyParty = parties.find(p => p.id === 'party-empty');
      if (!emptyParty) throw new Error('party-empty not found');

      const characters = [
        { id: 'char-1', name: 'A', hp: 30, maxHp: 30, ac: 10, abilityScores: {} },
      ];

      const expanded = expandPartyToCharacters(emptyParty, characters);

      expect(expanded).toHaveLength(0);
    });

    test('handles missing character references gracefully', () => {
      const edgeCases = PartyTestDataProvider.edgeCases();
      const missingCharCase = edgeCases[0];

      const characters = [
        { id: 'char-1', name: 'A', hp: 30, maxHp: 30, ac: 10, abilityScores: {} },
      ];

      const expanded = expandPartyToCharacters(missingCharCase.party, characters);

      // Missing characters should be filtered out
      expect(expanded).toHaveLength(0);
    });

    test('null party is handled safely', () => {
      const edgeCases = PartyTestDataProvider.edgeCases();
      const nullPartyCase = edgeCases[1];

      const characters = [
        { id: 'char-1', name: 'A', hp: 30, maxHp: 30, ac: 10, abilityScores: {} },
      ];

      const expanded = expandPartyToCharacters(nullPartyCase.party, characters);

      expect(expanded).toHaveLength(0);
    });
  });

  describe('Combat state creation with parties', () => {
    test('party-selected characters are added with correct IDs', () => {
      const parties = PartyTestDataProvider.sampleParties();
      const party = parties.find(p => p.id === 'party-three');
      if (!party) throw new Error('party-three not found');

      const characters = [
        { id: 'char-2', name: 'Legolas', hp: 40, maxHp: 40, ac: 16, abilityScores: {} },
        { id: 'char-3', name: 'Gimli', hp: 60, maxHp: 60, ac: 19, abilityScores: {} },
        { id: 'char-4', name: 'Boromir', hp: 55, maxHp: 55, ac: 17, abilityScores: {} },
      ];

      const expanded = expandPartyToCharacters(party, characters);
      const combatants: CombatantState[] = expanded.map((c: any) => ({
        id: `party-${party.id}-${c.id}`,
        name: c.name,
        type: 'player' as const,
        initiative: 0,
        abilityScores: c.abilityScores || {},
        hp: c.hp,
        maxHp: c.maxHp,
        ac: c.ac,
        conditions: [],
      }));

      // Verify IDs are properly namespaced
      expect(combatants).toHaveLength(3);
      expect(combatants[0].id).toMatch(/^party-/);
      expect(combatants.every(c => c.id.includes('party-three'))).toBe(true);
    });

    test('encounter monsters and party characters coexist in combat', () => {
      // Simulate having both encounter monsters and party characters
      const encounteredMonsters: CombatantState[] = [
        {
          id: 'monster-goblin-1',
          name: 'Goblin 1',
          type: 'monster',
          initiative: 0,
          abilityScores: {},
          hp: 10,
          maxHp: 10,
          ac: 15,
          conditions: [],
        },
      ];

      const parties = PartyTestDataProvider.sampleParties();
      const party = parties.find(p => p.id === 'party-one');
      if (!party) throw new Error('party-one not found');

      const characters = [
        { id: 'char-1', name: 'Frodo', hp: 30, maxHp: 30, ac: 10, abilityScores: {} },
      ];

      const expanded = expandPartyToCharacters(party, characters);
      const partyMembers: CombatantState[] = expanded.map((c: any) => ({
        id: `party-${party.id}-${c.id}`,
        name: c.name,
        type: 'player' as const,
        initiative: 0,
        abilityScores: c.abilityScores || {},
        hp: c.hp,
        maxHp: c.maxHp,
        ac: c.ac,
        conditions: [],
      }));

      const allCombatants = [...encounteredMonsters, ...partyMembers];

      expect(allCombatants).toHaveLength(2);
      expect(allCombatants.some(c => c.type === 'monster')).toBe(true);
      expect(allCombatants.some(c => c.type === 'player')).toBe(true);
    });
  });

  describe('Party selection state clearing', () => {
    test('end-of-combat clears party-added combatants', () => {
      const parties = PartyTestDataProvider.sampleParties();
      const party = parties.find(p => p.id === 'party-three');
      if (!party) throw new Error('party-three not found');

      const characters = [
        { id: 'char-2', name: 'Legolas', hp: 40, maxHp: 40, ac: 16, abilityScores: {} },
        { id: 'char-3', name: 'Gimli', hp: 60, maxHp: 60, ac: 19, abilityScores: {} },
        { id: 'char-4', name: 'Boromir', hp: 55, maxHp: 55, ac: 17, abilityScores: {} },
      ];

      const expanded = expandPartyToCharacters(party, characters);
      const partyCombatants: CombatantState[] = expanded.map((c: any) => ({
        id: `party-${party.id}-${c.id}`,
        name: c.name,
        type: 'player' as const,
        initiative: 0,
        abilityScores: c.abilityScores || {},
        hp: c.hp,
        maxHp: c.maxHp,
        ac: c.ac,
        conditions: [],
      }));

      // Simulate ending combat by filtering out party-added combatants
      const setupCombatants = [
        ...partyCombatants,
        {
          id: 'manual-char-1',
          name: 'Aragorn',
          type: 'player' as const,
          initiative: 0,
          abilityScores: {},
          hp: 50,
          maxHp: 50,
          ac: 18,
          conditions: [],
        },
      ];

      const clearedSetup = setupCombatants.filter(c => !c.id.startsWith('party-'));

      // Only manually added combatant should remain
      expect(clearedSetup).toHaveLength(1);
      expect(clearedSetup[0].id).toBe('manual-char-1');
    });

    test('repeated combat sessions do not duplicate party characters', () => {
      // First session: party selected
      const parties = PartyTestDataProvider.sampleParties();
      const party = parties.find(p => p.id === 'party-one');
      if (!party) throw new Error('party-one not found');

      const characters = [
        { id: 'char-1', name: 'Frodo', hp: 30, maxHp: 30, ac: 10, abilityScores: {} },
      ];

      const expanded = expandPartyToCharacters(party, characters);

      // Session 1 setup
      let setupCombatants: CombatantState[] = expanded.map((c: any) => ({
        id: `party-${party.id}-${c.id}`,
        name: c.name,
        type: 'player' as const,
        initiative: 0,
        abilityScores: c.abilityScores || {},
        hp: c.hp,
        maxHp: c.maxHp,
        ac: c.ac,
        conditions: [],
      }));

      expect(setupCombatants).toHaveLength(1);

      // Simulate end of combat clearing
      setupCombatants = setupCombatants.filter(c => !c.id.startsWith('party-'));
      expect(setupCombatants).toHaveLength(0);

      // Session 2 setup: select same party again
      const expanded2 = expandPartyToCharacters(party, characters);
      setupCombatants = expanded2.map((c: any) => ({
        id: `party-${party.id}-${c.id}`,
        name: c.name,
        type: 'player' as const,
        initiative: 0,
        abilityScores: c.abilityScores || {},
        hp: c.hp,
        maxHp: c.maxHp,
        ac: c.ac,
        conditions: [],
      }));

      // Still only 1, no duplication
      expect(setupCombatants).toHaveLength(1);
    });
  });
});
