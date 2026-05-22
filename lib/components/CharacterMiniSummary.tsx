'use client';

import { CharacterType, CharacterClass, calculateTotalLevel } from '@/lib/types';
import { CombatStatsRow } from '@/lib/components/CombatStatsRow';

const BADGE_LABELS: Partial<Record<CharacterType, string>> = {
  npc: 'NPC',
  companion: 'Companion',
};

interface CharacterMiniSummaryProps {
  name: string;
  race?: string;
  characterType?: CharacterType;
  classes?: CharacterClass[];
  ac: number;
  acNote?: string;
  hp: number;
  maxHp: number;
}

export function CharacterMiniSummary({
  name,
  race,
  characterType,
  classes,
  ac,
  acNote,
  hp,
  maxHp,
}: CharacterMiniSummaryProps) {
  const totalLevel = classes ? calculateTotalLevel(classes) : 0;
  const classNames = classes?.map(c => c.class).join('/');
  const hasClasses = classes && classes.length > 0;
  const badge = characterType ? BADGE_LABELS[characterType] : undefined;

  return (
    <div className="bg-gray-700 rounded p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm">{name}</span>
        {badge && (
          <span className="text-xs bg-gray-600 text-gray-300 px-1.5 py-0.5 rounded">
            {badge}
          </span>
        )}
      </div>
      <div className="text-xs text-gray-400">
        {race ?? '—'}
        {hasClasses && ` · ${classNames} · Lv ${totalLevel}`}
      </div>
      <CombatStatsRow ac={ac} acNote={acNote} hp={hp} maxHp={maxHp} />
    </div>
  );
}
