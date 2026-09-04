'use client';

import type { CombatantState } from '@/lib/types';

export function TargetCheckboxColumn({
  title,
  textColor,
  targets,
  selectedIds,
  onToggle,
}: {
  title: string;
  textColor: string;
  targets: CombatantState[];
  selectedIds: string[];
  onToggle: (id: string, checked: boolean) => void;
}) {
  return (
    <div>
      <h5 className={`text-xs font-semibold ${textColor} mb-2 uppercase`}>{title}</h5>
      <div className="space-y-2">
        {targets
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(target => (
            <label key={target.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.includes(target.id)}
                onChange={(e) => onToggle(target.id, e.target.checked)}
                className="w-4 h-4 rounded bg-gray-700 border border-gray-600 cursor-pointer"
              />
              <span className={`text-sm ${textColor}`}>{target.name}</span>
            </label>
          ))}
      </div>
    </div>
  );
}
