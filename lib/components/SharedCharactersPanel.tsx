'use client';

import { useState, useEffect } from 'react';
import { CampaignMember, Character, CampaignCharacterShare } from '@/lib/types';

interface Props {
  campaignId: string;
  currentUserMember: CampaignMember | null | undefined;
}

export function SharedCharactersPanel({ campaignId, currentUserMember }: Props) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [sharedIds, setSharedIds] = useState<Set<string>>(new Set());
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(true);

  const isActivePlayer =
    currentUserMember?.role === 'player' && currentUserMember?.status === 'active';

  useEffect(() => {
    if (!isActivePlayer) return;

    const fetchData = async () => {
      const [charRes, shareRes] = await Promise.all([
        fetch('/api/characters'),
        fetch(`/api/campaigns/${campaignId}/characters`),
      ]);
      if (charRes.ok) {
        setCharacters(await charRes.json());
      }
      if (shareRes.ok) {
        const shares: CampaignCharacterShare[] = await shareRes.json();
        setSharedIds(new Set(shares.map((s) => s.characterId)));
      }
    };

    fetchData();
  }, [campaignId, isActivePlayer]);

  if (!isActivePlayer) return null;

  const handleToggle = async (character: Character) => {
    const id = character.id;
    const wasShared = sharedIds.has(id);
    setToggling((prev) => new Set(prev).add(id));
    try {
      if (wasShared) {
        const res = await fetch(`/api/campaigns/${campaignId}/characters/${id}`, { method: 'DELETE' });
        if (res.ok) setSharedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
      } else {
        const res = await fetch(`/api/campaigns/${campaignId}/characters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ characterId: id }),
        });
        if (res.ok) setSharedIds((prev) => { const next = new Set(prev); next.add(id); return next; });
      }
    } finally {
      setToggling((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  return (
    <div className="mt-4 bg-gray-700 rounded-lg p-4">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-2 w-full text-left font-semibold text-sm text-gray-200"
        aria-expanded={expanded}
      >
        <span>{expanded ? '▾' : '▸'}</span>
        <span>Shared Characters</span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {characters.length === 0 ? (
            <p className="text-gray-400 text-sm">No characters to share.</p>
          ) : (
            characters.map((character) => (
              <label
                key={character.id}
                className="flex items-center gap-3 cursor-pointer"
              >
                <input
                  type="checkbox"
                  aria-label={character.name}
                  checked={sharedIds.has(character.id)}
                  disabled={toggling.has(character.id)}
                  onChange={() => handleToggle(character)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-200">{character.name}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}
