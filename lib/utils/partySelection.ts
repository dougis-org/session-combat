import { Party, Character } from '@/lib/types';

/**
 * Returns the Character objects that belong to the given party.
 * Characters not found in the library are silently excluded.
 * Uses a Map for O(M+N) lookup instead of O(M*N).
 */
export function expandPartyToCharacters(
  party: Party,
  characters: Character[]
): Character[] {
  if (!party || !Array.isArray(party.characterIds)) return [];
  const characterMap = new Map(characters.map(c => [c.id, c]));
  return party.characterIds
    .map(id => characterMap.get(id))
    .filter((c): c is Character => c !== undefined);
}

/**
 * Resolves which characters should be added to combat based on party selection.
 * - No party selected: returns all library characters (existing behavior)
 * - Party selected but not found: returns [] (unknown party ID treated as empty)
 * - Party selected: returns party characters minus any already in setupCombatants
 */
export function resolveCharactersForCombat(
  selectedPartyId: string | null,
  parties: Party[],
  characters: Character[],
  setupCombatants: Array<{ id: string }>
): Character[] {
  if (!selectedPartyId) return characters;
  const party = parties.find(p => p.id === selectedPartyId);
  if (!party) return [];
  const partyChars = expandPartyToCharacters(party, characters);
  const duplicates = findDuplicatePartyCharacters(partyChars, setupCombatants);
  const duplicateIds = new Set(duplicates.map(d => d.id));
  return partyChars.filter(c => !duplicateIds.has(c.id));
}

/**
 * Returns party characters that are already represented in setupCombatants.
 * Matches by `character-${pc.id}` prefix to avoid false positives from
 * unrelated IDs that happen to contain the same substring. Handles both
 * plain `character-${id}` and suffixed `character-${id}-${uuid}` forms.
 */
export function findDuplicatePartyCharacters(
  partyCharacters: Character[],
  setupCombatants: Array<{ id: string }>
): Character[] {
  const setupIds = setupCombatants.map(s => s.id);
  return partyCharacters.filter(pc =>
    setupIds.some(id => id.startsWith(`character-${pc.id}`))
  );
}
