'use client';

import { useState } from 'react';
import { Character, Party } from '@/lib/types';

interface Props {
  campaignId: string;
  party: Party;
  characters: Character[];
}

export function PartyMembershipPanel({ campaignId, party, characters }: Props) {
  const ownCharacterIds = new Set(characters.map((c) => c.id));
  const initialActiveIds = new Set(
    party.members
      .filter((m) => !m.leftAt && ownCharacterIds.has(m.characterId))
      .map((m) => m.characterId)
  );

  const [activeIds, setActiveIds] = useState<Set<string>>(initialActiveIds);
  const [toggling, setToggling] = useState<Set<string>>(new Set());

  const myUserId = characters[0]?.userId;

  const handleToggle = async (character: Character) => {
    const id = character.id;
    const prevIds = activeIds;
    const nextIds = new Set(activeIds);
    if (nextIds.has(id)) { nextIds.delete(id); } else { nextIds.add(id); }

    setToggling((prev) => new Set(prev).add(id));
    setActiveIds(nextIds);

    try {
      const res = await fetch(
        `/api/campaigns/${campaignId}/members/${myUserId}/parties/${party.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ characterIds: Array.from(nextIds) }),
        }
      );
      if (!res.ok) throw new Error('toggle failed');
    } catch {
      setActiveIds(prevIds);
    } finally {
      setToggling((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  return (
    <div className="mt-4 bg-gray-700 rounded-lg p-4">
      <p className="font-semibold text-sm text-gray-200">{party.name}</p>

      <div className="mt-3 space-y-2">
        {characters.length === 0 ? (
          <p className="text-gray-400 text-sm">No characters to add.</p>
        ) : (
          characters.map((character) => (
            <label
              key={character.id}
              className="flex items-center gap-3 cursor-pointer"
            >
              <input
                type="checkbox"
                aria-label={character.name}
                checked={activeIds.has(character.id)}
                disabled={toggling.has(character.id)}
                onChange={() => handleToggle(character)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-200">{character.name}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
