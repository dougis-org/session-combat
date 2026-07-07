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
  const [error, setError] = useState<string | null>(null);

  const myUserId = characters[0]?.userId;

  const handleToggle = async (character: Character) => {
    const id = character.id;
    const wasActive = activeIds.has(id);
    const nextIds = new Set(activeIds);
    if (wasActive) { nextIds.delete(id); } else { nextIds.add(id); }

    setError(null);
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
      if (!res.ok) throw new Error(`toggle failed: ${res.status}`);
    } catch (err) {
      console.error('Failed to update party membership:', err);
      // Revert only this character's membership, not the whole set — another
      // character's toggle may have committed to `activeIds` while this
      // request was in flight, and that change must not be clobbered.
      setActiveIds((prev) => {
        const reverted = new Set(prev);
        if (wasActive) { reverted.add(id); } else { reverted.delete(id); }
        return reverted;
      });
      setError('Could not update party membership. Please try again.');
    } finally {
      setToggling((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  return (
    <div className="mt-4 bg-gray-700 rounded-lg p-4">
      <p className="font-semibold text-sm text-gray-200">{party.name}</p>
      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}

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
