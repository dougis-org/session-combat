import React from 'react';
import { CharacterType, CharacterClass, calculateTotalLevel } from '@/lib/types';

interface Props {
  name: string;
  race?: string;
  characterType?: CharacterType;
  classes?: CharacterClass[];
}

export function CharacterRosterCard({ name, race, characterType, classes }: Props) {
  const isNpc = characterType === 'npc';
  const isCompanion = characterType === 'companion';
  const hasClasses = classes && classes.length > 0;

  return (
    <div className="bg-gray-700 rounded p-2">
      <div className="flex items-center gap-2">
        <span className="font-medium text-sm">{name}</span>
        {isNpc && (
          <span className="bg-yellow-800 text-yellow-200 text-xs px-1.5 py-0.5 rounded">NPC</span>
        )}
        {isCompanion && (
          <span className="bg-purple-800 text-purple-200 text-xs px-1.5 py-0.5 rounded">Companion</span>
        )}
      </div>
      <p className="text-gray-400 text-xs mt-0.5">
        {race || '—'}
        {hasClasses && ` · ${classes!.map(c => c.class).join('/')} · Lv ${calculateTotalLevel(classes!)}`}
      </p>
    </div>
  );
}
