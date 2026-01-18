'use client';

import { AbilityScores, CreatureStats } from '@/lib/types';
import { useState } from 'react';

interface CreatureStatsFormProps {
  stats: CreatureStats;
  onChange: (stats: CreatureStats) => void;
}

export function CreatureStatsForm({ stats, onChange }: CreatureStatsFormProps) {
  const [expandedSections, setExpandedSections] = useState<Record<'abilities' | 'skills' | 'resistances' | 'senses' | 'abilities_section', boolean>>({
    abilities: true,
    skills: false,
    resistances: false,
    senses: false,
    abilities_section: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateAbilityScore = (ability: keyof AbilityScores, value: number) => {
    onChange({
      ...stats,
      abilityScores: {
        ...stats.abilityScores,
        [ability]: value,
      },
    });
  };

  const updateBasicStat = (field: keyof Omit<CreatureStats, 'abilityScores'>, value: any) => {
    onChange({
      ...stats,
      [field]: value,
    });
  };

  const updateSkill = (skill: string, bonus: number) => {
    const newSkills = stats.skills ? { ...stats.skills } : {};
    if (bonus === 0 && newSkills[skill]) {
      delete newSkills[skill];
    } else {
      newSkills[skill] = bonus;
    }
    updateBasicStat('skills', Object.keys(newSkills).length > 0 ? newSkills : undefined);
  };

  const addAbility = (type: 'traits' | 'actions' | 'bonusActions' | 'reactions') => {
    const newAbility = {
      name: 'New Ability',
      description: '',
    };
    const current = stats[type] || [];
    updateBasicStat(type, [...current, newAbility]);
  };

  const removeAbility = (type: 'traits' | 'actions' | 'bonusActions' | 'reactions', index: number) => {
    const current = stats[type] || [];
    const updated = current.filter((_: any, i: number) => i !== index);
    updateBasicStat(type, updated.length > 0 ? updated : undefined);
  };

  const updateAbility = (type: 'traits' | 'actions' | 'bonusActions' | 'reactions', index: number, ability: any) => {
    const current = stats[type] || [];
    const updated = [...current];
    updated[index] = ability;
    updateBasicStat(type, updated);
  };

  return (
    <div className="space-y-4 bg-gray-800 p-4 rounded">
      {/* Basic Combat Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-bold mb-1">AC</label>
          <input
            type="number"
            value={stats.ac}
            onChange={e => updateBasicStat('ac', parseInt(e.target.value) || 0)}
            className="w-full bg-gray-700 rounded px-2 py-1 text-white"
          />
          <input
            type="text"
            placeholder="AC Note (optional)"
            value={stats.acNote || ''}
            onChange={e => updateBasicStat('acNote', e.target.value || undefined)}
            className="w-full bg-gray-700 rounded px-2 py-1 text-white text-xs mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">HP</label>
          <input
            type="number"
            value={stats.hp}
            onChange={e => updateBasicStat('hp', parseInt(e.target.value) || 0)}
            className="w-full bg-gray-700 rounded px-2 py-1 text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">Max HP</label>
          <input
            type="number"
            value={stats.maxHp}
            onChange={e => updateBasicStat('maxHp', parseInt(e.target.value) || 0)}
            className="w-full bg-gray-700 rounded px-2 py-1 text-white"
          />
        </div>
      </div>

      {/* Ability Scores */}
      <div className="border-t border-gray-700 pt-4">
        <button
          onClick={() => toggleSection('abilities')}
          className="font-bold text-gray-300 hover:text-white mb-2 flex items-center gap-2"
        >
          <span>{expandedSections.abilities ? '▼' : '▶'}</span>
          Ability Scores
        </button>
        {expandedSections.abilities && (
          <div className="grid grid-cols-6 gap-2">
            {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map(ability => (
              <div key={ability}>
                <label className="block text-xs font-bold capitalize mb-1">{ability}</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={stats.abilityScores[ability]}
                  onChange={e => updateAbilityScore(ability, parseInt(e.target.value) || 10)}
                  className="w-full bg-gray-700 rounded px-1 py-1 text-white text-sm"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skills */}
      <div className="border-t border-gray-700 pt-4">
        <button
          onClick={() => toggleSection('skills')}
          className="font-bold text-gray-300 hover:text-white mb-2 flex items-center gap-2"
        >
          <span>{expandedSections.skills ? '▼' : '▶'}</span>
          Skills
        </button>
        {expandedSections.skills && (
          <div className="grid grid-cols-2 gap-2">
            {[
              'acrobatics', 'animal handling', 'arcana', 'athletics', 'deception', 'history',
              'insight', 'intimidation', 'investigation', 'medicine', 'nature', 'perception',
              'performance', 'persuasion', 'religion', 'sleight of hand', 'stealth', 'survival',
            ].map(skill => (
              <div key={skill}>
                <label className="text-xs capitalize">{skill}</label>
                <input
                  type="number"
                  value={stats.skills?.[skill] || 0}
                  onChange={e => updateSkill(skill, parseInt(e.target.value) || 0)}
                  className="w-full bg-gray-700 rounded px-1 py-1 text-white text-sm"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resistances & Immunities */}
      <div className="border-t border-gray-700 pt-4">
        <button
          onClick={() => toggleSection('resistances')}
          className="font-bold text-gray-300 hover:text-white mb-2 flex items-center gap-2"
        >
          <span>{expandedSections.resistances ? '▼' : '▶'}</span>
          Resistances & Immunities
        </button>
        {expandedSections.resistances && (
          <div className="space-y-2">
            <div>
              <label className="text-xs font-bold">Damage Vulnerabilities</label>
              <textarea
                value={(stats.damageVulnerabilities || []).join(', ')}
                onChange={e =>
                  updateBasicStat('damageVulnerabilities',
                    e.target.value ? e.target.value.split(',').map(s => s.trim()).filter(Boolean) : undefined
                  )
                }
                className="w-full bg-gray-700 rounded px-2 py-1 text-white text-sm"
                placeholder="Comma-separated"
                rows={2}
              />
            </div>
            <div>
              <label className="text-xs font-bold">Damage Resistances</label>
              <textarea
                value={(stats.damageResistances || []).join(', ')}
                onChange={e =>
                  updateBasicStat('damageResistances',
                    e.target.value ? e.target.value.split(',').map(s => s.trim()).filter(Boolean) : undefined
                  )
                }
                className="w-full bg-gray-700 rounded px-2 py-1 text-white text-sm"
                placeholder="Comma-separated"
                rows={2}
              />
            </div>
            <div>
              <label className="text-xs font-bold">Damage Immunities</label>
              <textarea
                value={(stats.damageImmunities || []).join(', ')}
                onChange={e =>
                  updateBasicStat('damageImmunities',
                    e.target.value ? e.target.value.split(',').map(s => s.trim()).filter(Boolean) : undefined
                  )
                }
                className="w-full bg-gray-700 rounded px-2 py-1 text-white text-sm"
                placeholder="Comma-separated"
                rows={2}
              />
            </div>
            <div>
              <label className="text-xs font-bold">Condition Immunities</label>
              <textarea
                value={(stats.conditionImmunities || []).join(', ')}
                onChange={e =>
                  updateBasicStat('conditionImmunities',
                    e.target.value ? e.target.value.split(',').map(s => s.trim()).filter(Boolean) : undefined
                  )
                }
                className="w-full bg-gray-700 rounded px-2 py-1 text-white text-sm"
                placeholder="Comma-separated"
                rows={2}
              />
            </div>
          </div>
        )}
      </div>

      {/* Senses & Languages */}
      <div className="border-t border-gray-700 pt-4">
        <button
          onClick={() => toggleSection('senses')}
          className="font-bold text-gray-300 hover:text-white mb-2 flex items-center gap-2"
        >
          <span>{expandedSections.senses ? '▼' : '▶'}</span>
          Senses & Languages
        </button>
        {expandedSections.senses && (
          <div className="space-y-2">
            <div>
              <label className="text-xs font-bold">Senses (e.g., darkvision 60 ft.)</label>
              <textarea
                value={
                  stats.senses
                    ? Object.entries(stats.senses)
                        .map(([sense, range]) => `${sense} ${range}`)
                        .join('\n')
                    : ''
                }
                onChange={e => {
                  const lines = e.target.value.split('\n').filter(Boolean);
                  const senses: Record<string, string> = {};
                  lines.forEach(line => {
                    const [sense, ...rangeParts] = line.split(' ');
                    senses[sense] = rangeParts.join(' ');
                  });
                  updateBasicStat('senses', Object.keys(senses).length > 0 ? senses : undefined);
                }}
                className="w-full bg-gray-700 rounded px-2 py-1 text-white text-sm"
                rows={2}
              />
            </div>
            <div>
              <label className="text-xs font-bold">Languages</label>
              <textarea
                value={(stats.languages || []).join(', ')}
                onChange={e =>
                  updateBasicStat('languages',
                    e.target.value ? e.target.value.split(',').map(s => s.trim()).filter(Boolean) : undefined
                  )
                }
                className="w-full bg-gray-700 rounded px-2 py-1 text-white text-sm"
                placeholder="Comma-separated"
                rows={2}
              />
            </div>
            <div>
              <label className="text-xs font-bold">Communication</label>
              <textarea
                value={stats.communication || ''}
                onChange={e => updateBasicStat('communication', e.target.value || undefined)}
                className="w-full bg-gray-700 rounded px-2 py-1 text-white text-sm"
                placeholder="Special communication abilities"
                rows={2}
              />
            </div>
          </div>
        )}
      </div>

      {/* Special Abilities */}
      <AbilityEditorSection
        title="Traits"
        abilities={stats.traits || []}
        onAdd={() => addAbility('traits')}
        onRemove={idx => removeAbility('traits', idx)}
        onUpdate={(idx, ability) => updateAbility('traits', idx, ability)}
      />
      <AbilityEditorSection
        title="Actions"
        abilities={stats.actions || []}
        onAdd={() => addAbility('actions')}
        onRemove={idx => removeAbility('actions', idx)}
        onUpdate={(idx, ability) => updateAbility('actions', idx, ability)}
      />
      <AbilityEditorSection
        title="Bonus Actions"
        abilities={stats.bonusActions || []}
        onAdd={() => addAbility('bonusActions')}
        onRemove={idx => removeAbility('bonusActions', idx)}
        onUpdate={(idx, ability) => updateAbility('bonusActions', idx, ability)}
      />
      <AbilityEditorSection
        title="Reactions"
        abilities={stats.reactions || []}
        onAdd={() => addAbility('reactions')}
        onRemove={idx => removeAbility('reactions', idx)}
        onUpdate={(idx, ability) => updateAbility('reactions', idx, ability)}
      />
    </div>
  );
}

interface AbilityEditorSectionProps {
  title: string;
  abilities: CreatureAbility[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, ability: CreatureAbility) => void;
}

function AbilityEditorSection({ title, abilities, onAdd, onRemove, onUpdate }: AbilityEditorSectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-t border-gray-700 pt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="font-bold text-gray-300 hover:text-white mb-2 flex items-center gap-2"
      >
        <span>{expanded ? '▼' : '▶'}</span>
        {title}
      </button>
      {expanded && (
        <div className="space-y-2">
          {abilities.map((ability, idx) => (
            <div key={idx} className="bg-gray-700 rounded p-2 space-y-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ability.name}
                  onChange={e => onUpdate(idx, { ...ability, name: e.target.value })}
                  placeholder="Ability Name"
                  className="flex-1 bg-gray-600 rounded px-2 py-1 text-white text-sm"
                />
                <button
                  onClick={() => onRemove(idx)}
                  className="bg-red-600 hover:bg-red-500 px-2 py-1 rounded text-sm"
                >
                  Remove
                </button>
              </div>
              <textarea
                value={ability.description}
                onChange={e => onUpdate(idx, { ...ability, description: e.target.value })}
                placeholder="Description"
                className="w-full bg-gray-600 rounded px-2 py-1 text-white text-sm"
                rows={2}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={ability.attackBonus || 0}
                  onChange={e => onUpdate(idx, { ...ability, attackBonus: parseInt(e.target.value) || undefined })}
                  placeholder="Attack Bonus"
                  className="bg-gray-600 rounded px-2 py-1 text-white text-xs"
                />
                <input
                  type="text"
                  value={ability.damageDescription || ''}
                  onChange={e => onUpdate(idx, { ...ability, damageDescription: e.target.value || undefined })}
                  placeholder="Damage (e.g., 2d6+3)"
                  className="bg-gray-600 rounded px-2 py-1 text-white text-xs"
                />
                <input
                  type="number"
                  value={ability.saveDC || 0}
                  onChange={e => onUpdate(idx, { ...ability, saveDC: parseInt(e.target.value) || undefined })}
                  placeholder="Save DC"
                  className="bg-gray-600 rounded px-2 py-1 text-white text-xs"
                />
                <input
                  type="text"
                  value={ability.saveType || ''}
                  onChange={e => onUpdate(idx, { ...ability, saveType: e.target.value || undefined })}
                  placeholder="Save Type (DEX, etc.)"
                  className="bg-gray-600 rounded px-2 py-1 text-white text-xs"
                />
                <input
                  type="text"
                  value={ability.recharge || ''}
                  onChange={e => onUpdate(idx, { ...ability, recharge: e.target.value || undefined })}
                  placeholder="Recharge (e.g., Recharge 5-6)"
                  className="bg-gray-600 rounded px-2 py-1 text-white text-xs col-span-2"
                />
              </div>
            </div>
          ))}
          <button
            onClick={onAdd}
            className="w-full bg-gray-700 hover:bg-gray-600 rounded px-2 py-1 text-sm text-gray-300"
          >
            + Add {title}
          </button>
        </div>
      )}
    </div>
  );
}
