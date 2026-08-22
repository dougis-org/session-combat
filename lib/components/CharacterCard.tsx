'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CreatureStatBlock } from '@/lib/components/CreatureStatBlock';
import { CharacterDescription } from '@/lib/components/CharacterDescription';
import { Character } from '@/lib/types';

export function CharacterCard({
  character,
  onEdit,
  onDelete,
}: {
  character: Character;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-semibold">{character.name}</h3>
        <div className="flex gap-2">
          <Link
            href={`/characters/${character.id}`}
            className="bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded text-sm text-white"
          >
            View Character
          </Link>
          <button
            onClick={onEdit}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm text-white"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm text-white"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-400 mb-2">
        <CharacterDescription character={character} />
        <div>
          HP: {character.hp} / {character.maxHp} | AC: {character.ac} {character.acNote ? `(${character.acNote})` : ''}
        </div>
      </div>

      <div className="mb-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-300 hover:text-white underline text-sm"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {isExpanded && (
        <CreatureStatBlock
          abilityScores={character.abilityScores}
          ac={character.ac}
          acNote={character.acNote}
          hp={character.hp}
          maxHp={character.maxHp}
          skills={character.skills}
          savingThrows={character.savingThrows}
          damageResistances={character.damageResistances}
          damageImmunities={character.damageImmunities}
          damageVulnerabilities={character.damageVulnerabilities}
          conditionImmunities={character.conditionImmunities}
          senses={character.senses}
          languages={character.languages}
          traits={character.traits}
          actions={character.actions}
          bonusActions={character.bonusActions}
          reactions={character.reactions}
          isCompact={false}
        />
      )}
    </div>
  );
}
