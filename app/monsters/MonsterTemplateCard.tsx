'use client';

import type { MonsterTemplate } from '@/lib/types';
import { CreatureStatBlock } from '@/lib/components/CreatureStatBlock';

export function MonsterTemplateCard({
  template,
  isGlobal,
  canEdit = true,
  onEdit,
  onDelete,
  onCopy,
  isCopying = false,
}: {
  template: MonsterTemplate;
  isGlobal: boolean;
  canEdit?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onCopy?: () => void;
  isCopying?: boolean;
}) {
  return (
    <div className={`rounded-lg p-4 ${isGlobal ? 'bg-gray-800 border border-purple-600' : 'bg-gray-800'}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold">{template.name}</h3>
            {isGlobal && <span className="px-2 py-1 bg-purple-600 text-xs rounded">Global</span>}
          </div>
          {(template.size || template.type) && (
            <p className="text-sm text-gray-400 mt-1">
              {template.size} {template.type}
              {template.challengeRating !== undefined && ` (CR ${template.challengeRating})`}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {isGlobal && onCopy && (
            <button
              onClick={onCopy}
              disabled={isCopying}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-3 py-1 rounded text-sm"
              aria-label={`Copy ${template.name} to your library`}
            >
              {isCopying ? 'Copying...' : 'Copy'}
            </button>
          )}
          {canEdit && (
            <>
              <button
                onClick={onEdit}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
              >
                Edit
              </button>
              <button
                onClick={onDelete}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
      <CreatureStatBlock
        abilityScores={template.abilityScores}
        ac={template.ac}
        acNote={template.acNote}
        hp={template.hp}
        maxHp={template.maxHp}
        skills={template.skills}
        savingThrows={template.savingThrows}
        damageResistances={template.damageResistances}
        damageImmunities={template.damageImmunities}
        damageVulnerabilities={template.damageVulnerabilities}
        conditionImmunities={template.conditionImmunities}
        senses={template.senses}
        languages={template.languages}
        traits={template.traits}
        actions={template.actions}
        bonusActions={template.bonusActions}
        reactions={template.reactions}
        isCompact={true}
      />
    </div>
  );
}
