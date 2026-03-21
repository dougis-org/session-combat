import { Party, Character } from '@/lib/types';

/**
 * Returns the Character objects that belong to the given party.
 * Characters not found in the library are silently excluded.
 */
export function expandPartyToCharacters(
  party: Party,
  characters: Character[]
): Character[] {
  if (!party || !Array.isArray(party.characterIds)) return [];
  return party.characterIds
    .map(id => characters.find(c => c.id === id))
    .filter((c): c is Character => c !== undefined);
}

/**
 * Returns party characters that are already represented in setupCombatants.
 * Matches on substring because setupCombatants use IDs like `character-${char.id}`.
 */
export function findDuplicatePartyCharacters(
  partyCharacters: Character[],
  setupCombatants: Array<{ id: string }>
): Character[] {
  const setupIds = setupCombatants.map(s => s.id);
  return partyCharacters.filter(pc =>
    setupIds.some(id => id.includes(pc.id))
  );
}
