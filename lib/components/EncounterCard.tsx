import type { ReactNode } from 'react';
import type { Encounter } from '@/lib/types';

/**
 * Pure presentational card for a single encounter, shared by the global
 * `/encounters` list and the campaign encounters page so the two read as the
 * same component. It renders the encounter name, its description when present,
 * and the monster roster; callers supply whatever action controls they support
 * (Edit / Delete / Unlink) via the `actions` slot.
 */
export function EncounterCard({
  encounter,
  actions,
}: {
  encounter: Encounter;
  actions?: ReactNode;
}) {
  return (
    <div className="bg-gray-800 rounded-lg p-4" data-testid="encounter-card">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h2 className="text-xl font-semibold">{encounter.name}</h2>
          {encounter.description && <p className="text-gray-400">{encounter.description}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>

      <div className="mt-4">
        <h3 className="font-semibold mb-2">Monsters ({encounter.monsters.length})</h3>
        <div className="grid gap-2">
          {encounter.monsters.map(monster => (
            <div key={monster.id} className="bg-gray-700 rounded p-2 text-sm">
              <span className="font-medium">{monster.name}</span>
              <span className="text-gray-400 ml-2">
                HP: {monster.hp}/{monster.maxHp}, AC: {monster.ac}
                {monster.abilityScores?.dexterity !== undefined && (
                  <>, DEX: {monster.abilityScores.dexterity}</>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
