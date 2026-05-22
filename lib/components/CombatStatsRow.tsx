'use client';

interface CombatStatsRowProps {
  ac: number;
  acNote?: string;
  hp: number;
  maxHp: number;
}

export function CombatStatsRow({ ac, acNote, hp, maxHp }: CombatStatsRowProps) {
  return (
    <div className="grid grid-cols-3 gap-4 text-sm border-b border-gray-700 pb-4">
      <div>
        <div className="text-gray-400">AC</div>
        <div className="text-lg font-bold">
          {ac}
          {acNote && <span className="text-xs text-gray-400 ml-1">({acNote})</span>}
        </div>
      </div>
      <div>
        <div className="text-gray-400">HP</div>
        <div className="text-lg font-bold">
          {hp}/{maxHp}
        </div>
      </div>
    </div>
  );
}
