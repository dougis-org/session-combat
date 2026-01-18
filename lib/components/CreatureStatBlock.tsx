'use client';

import { AbilityScores } from '@/lib/types';

interface CreatureStatBlockProps {
  abilityScores: AbilityScores;
  ac?: number;
  acNote?: string;
  hp?: number;
  maxHp?: number;
  skills?: Record<string, number>;
  savingThrows?: Partial<Record<keyof AbilityScores, number>>;
  damageResistances?: string[];
  damageImmunities?: string[];
  damageVulnerabilities?: string[];
  conditionImmunities?: string[];
  senses?: Record<string, string>;
  languages?: string[];
  traits?: any[];
  actions?: any[];
  bonusActions?: any[];
  reactions?: any[];
  isCompact?: boolean; // Show minimal info
}

const abilityNames: Record<keyof AbilityScores, string> = {
  strength: 'STR',
  dexterity: 'DEX',
  constitution: 'CON',
  intelligence: 'INT',
  wisdom: 'WIS',
  charisma: 'CHA',
};

function getModifier(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  const sign = mod >= 0 ? '+' : '';
  return `${sign}${mod}`;
}

export function CreatureStatBlock({
  abilityScores,
  ac,
  acNote,
  hp,
  maxHp,
  skills,
  savingThrows,
  damageResistances,
  damageImmunities,
  damageVulnerabilities,
  conditionImmunities,
  senses,
  languages,
  traits,
  actions,
  bonusActions,
  reactions,
  isCompact = false,
}: CreatureStatBlockProps) {
  return (
    <div className="bg-gray-800 rounded p-4 space-y-4">
      {/* Combat Stats Row */}
      <div className="grid grid-cols-3 gap-4 text-sm border-b border-gray-700 pb-4">
        <div>
          <div className="text-gray-400">AC</div>
          <div className="text-lg font-bold">
            {ac ?? '—'}
            {acNote && <span className="text-xs text-gray-400 ml-1">({acNote})</span>}
          </div>
        </div>
        <div>
          <div className="text-gray-400">HP</div>
          <div className="text-lg font-bold">
            {(hp ?? 0)}/{(maxHp ?? 0)}
          </div>
        </div>
      </div>

      {!isCompact && (
        <>
          {/* Ability Scores */}
          <div>
            <div className="text-sm font-bold text-gray-300 mb-2">Ability Scores</div>
            <div className="grid grid-cols-6 gap-2 text-xs">
              {Object.entries(abilityNames).map(([key, abbr]) => {
                const score = abilityScores[key as keyof AbilityScores];
                return (
                  <div key={key} className="bg-gray-700 rounded p-2 text-center">
                    <div className="font-bold">{score}</div>
                    <div className="text-gray-400">{getModifier(score)}</div>
                    <div className="text-gray-500 text-xs">{abbr}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Skills */}
          {skills && Object.keys(skills).length > 0 && (
            <div>
              <div className="text-sm font-bold text-gray-300 mb-2">Skills</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(skills).map(([skill, bonus]) => (
                  <div key={skill} className="text-gray-300">
                    <span className="capitalize">{skill}</span>
                      <span className="float-right text-gray-400">{(bonus ?? 0) >= 0 ? '+' : ''}{bonus ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Saving Throws */}
          {savingThrows && Object.keys(savingThrows).length > 0 && (
            <div>
              <div className="text-sm font-bold text-gray-300 mb-2">Saving Throws</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(savingThrows).map(([ability, bonus]) => (
                  <div key={ability} className="text-gray-300">
                    <span className="capitalize">{ability}</span>                      {/* @ts-ignore */}                    <span className="float-right text-gray-400">{(bonus ?? 0) >= 0 ? '+' : ''}{bonus ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resistances & Immunities */}
          <div className="space-y-2 text-xs">
            {damageVulnerabilities && damageVulnerabilities.length > 0 && (
              <div>
                <span className="font-bold text-gray-300">Damage Vulnerabilities:</span>
                <span className="text-gray-400"> {damageVulnerabilities.join(', ')}</span>
              </div>
            )}
            {damageResistances && damageResistances.length > 0 && (
              <div>
                <span className="font-bold text-gray-300">Damage Resistances:</span>
                <span className="text-gray-400"> {damageResistances.join(', ')}</span>
              </div>
            )}
            {damageImmunities && damageImmunities.length > 0 && (
              <div>
                <span className="font-bold text-gray-300">Damage Immunities:</span>
                <span className="text-gray-400"> {damageImmunities.join(', ')}</span>
              </div>
            )}
            {conditionImmunities && conditionImmunities.length > 0 && (
              <div>
                <span className="font-bold text-gray-300">Condition Immunities:</span>
                <span className="text-gray-400"> {conditionImmunities.join(', ')}</span>
              </div>
            )}
          </div>

          {/* Senses & Languages */}
          {(senses || languages) && (
            <div className="space-y-2 text-xs">
              {senses && Object.keys(senses).length > 0 && (
                <div>
                  <span className="font-bold text-gray-300">Senses:</span>
                  <span className="text-gray-400">
                    {' '}
                    {Object.entries(senses)
                      .map(([sense, range]) => `${sense} ${range}`)
                      .join(', ')}
                  </span>
                </div>
              )}
              {languages && languages.length > 0 && (
                <div>
                  <span className="font-bold text-gray-300">Languages:</span>
                  <span className="text-gray-400"> {languages.join(', ')}</span>
                </div>
              )}
            </div>
          )}

          {/* Special Abilities */}
          {traits && traits.length > 0 && (
            <CreatureAbilitiesSection title="Traits" abilities={traits} />
          )}
          {actions && actions.length > 0 && (
            <CreatureAbilitiesSection title="Actions" abilities={actions} />
          )}
          {bonusActions && bonusActions.length > 0 && (
            <CreatureAbilitiesSection title="Bonus Actions" abilities={bonusActions} />
          )}
          {reactions && reactions.length > 0 && (
            <CreatureAbilitiesSection title="Reactions" abilities={reactions} />
          )}
        </>
      )}
    </div>
  );
}

interface CreatureAbilitiesSectionProps {
  title: string;
  abilities: any[];
}

function CreatureAbilitiesSection({ title, abilities }: CreatureAbilitiesSectionProps) {
  return (
    <div>
      <div className="text-sm font-bold text-gray-300 mb-2">{title}</div>
      <div className="space-y-2">
        {abilities.map((ability, idx) => (
          <div key={idx} className="bg-gray-700 rounded p-2">
            <div className="font-bold text-sm text-gray-200">
              {ability.name}
              {ability.recharge && <span className="text-xs text-gray-400 ml-2">({ability.recharge})</span>}
            </div>
            <div className="text-xs text-gray-400 mt-1">{ability.description}</div>
            {ability.attackBonus && (
              <div className="text-xs text-gray-400 mt-1">
                <span className="font-semibold">Attack:</span> {ability.attackBonus >= 0 ? '+' : ''}{ability.attackBonus}
              </div>
            )}
            {ability.damageDescription && (
              <div className="text-xs text-gray-400">
                <span className="font-semibold">Damage:</span> {ability.damageDescription}
              </div>
            )}
            {ability.saveDC && (
              <div className="text-xs text-gray-400">
                <span className="font-semibold">Save:</span> DC {ability.saveDC} {ability.saveType}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
