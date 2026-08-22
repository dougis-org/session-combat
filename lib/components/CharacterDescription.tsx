'use client';

import { Character, calculateTotalLevel } from '@/lib/types';

export function CharacterDescription({ character }: { character: Character }) {
  if (!character.classes?.length && !character.gender && !character.race) {
    return null;
  }

  return (
    <>
      {character.classes && character.classes.length > 0 && (
        <div>
          {character.classes.map((c, idx) => (
            <span key={idx}>
              {c.class} Level {c.level}
              {idx < character.classes.length - 1 && ' / '}
            </span>
          ))}
          <span className="ml-2 font-semibold">
            (Total Level {calculateTotalLevel(character.classes)})
          </span>
        </div>
      )}
      {(character.gender || character.race) && (
        <div>
          {[character.gender, character.race].filter(Boolean).join(' ')}
        </div>
      )}
    </>
  );
}
