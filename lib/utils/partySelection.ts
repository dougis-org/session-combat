export function expandPartyToCharacters(party: { id: string; characterIds: string[] }, characters: Array<{ id: string; name?: string }>) {
  if (!party || !Array.isArray(party.characterIds)) return [];
  return party.characterIds
    .map(charId => characters.find(c => c.id === charId))
    .filter(Boolean)
    .map((c: any) => ({ id: c.id, name: c.name }));
}

export function findDuplicatePartyCharacters(partyCharacters: Array<{ id: string }>, setupCombatants: Array<{ id: string }>) {
  const setupIds = new Set(setupCombatants.map(s => s.id));
  return partyCharacters.filter(pc => {
    return Array.from(setupIds).some(id => id.includes(pc.id));
  });
}
