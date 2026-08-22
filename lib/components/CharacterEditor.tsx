'use client';

import { useState } from 'react';
import { CreatureStatsForm } from '@/lib/components/CreatureStatsForm';
import { AlignmentSelect } from '@/lib/components/AlignmentSelect';
import {
  Character,
  CharacterType,
  CreatureStats,
  calculateTotalLevel,
  VALID_CLASSES,
  VALID_RACES,
  DnDRace,
  normalizeAlignment,
} from '@/lib/types';

export function CharacterEditor({
  character,
  onSave,
  onCancel,
  isNew,
}: {
  character: Character;
  onSave: (character: Character) => void;
  onCancel: () => void;
  isNew: boolean;
}) {
  const [name, setName] = useState(character.name);
  const [classes, setClasses] = useState(character.classes || [{ class: 'Fighter', level: 1 }]);
  const [race, setRace] = useState(character.race || '');
  const [gender, setGender] = useState(character.gender || '');
  const [alignment, setAlignment] = useState(
    normalizeAlignment(character.alignment) ?? '',
  );
  const [characterType, setCharacterType] = useState<CharacterType>(character.characterType ?? 'character');
  const [stats, setStats] = useState<CreatureStats>(character);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleStatsChange = (newStats: CreatureStats) => {
    setStats(newStats);
  };

  const handleSave = async () => {
    setValidationError(null);

    if (stats.hp > stats.maxHp) {
      setValidationError('Current HP cannot be greater than Max HP');
      return;
    }

    if (!name.trim()) {
      setValidationError('Character name is required');
      return;
    }

    setSaving(true);
    try {
      const characterData: Character = {
        ...stats,
        id: character.id,
        userId: character.userId,
        name,
        classes,
        race: (race as DnDRace) || undefined,
        gender: gender.trim(),
        alignment: normalizeAlignment(alignment),
        characterType,
      };
      await onSave(characterData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6 border-2 border-blue-500">
      <h2 className="text-2xl font-bold mb-4">{isNew ? 'Create Character' : 'Edit Character'}</h2>

      {validationError && (
        <div className="p-3 bg-red-900 border border-red-700 rounded text-red-200 mb-4">
          {validationError}
        </div>
      )}

      {/* Character Info */}
      <div className="grid md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-700">
        <div>
          <label className="block mb-1 text-sm font-bold">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
            disabled={saving}
            aria-label="Character name"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-bold">Classes (Multiclass)</label>
          <div className="space-y-2">
            {classes.map((classEntry, idx) => (
              <div key={idx} className="flex gap-2">
                <select
                  value={classEntry.class}
                  onChange={e => {
                    const newClasses = [...classes];
                    newClasses[idx].class = e.target.value as any;
                    setClasses(newClasses);
                  }}
                  className="flex-1 bg-gray-700 rounded px-3 py-2 text-white"
                  disabled={saving}
                  aria-label="Character class"
                >
                  <option value="">Select class...</option>
                  {VALID_CLASSES.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={classEntry.level}
                  onChange={e => {
                    const newClasses = [...classes];
                    newClasses[idx].level = parseInt(e.target.value) || 1;
                    setClasses(newClasses);
                  }}
                  className="w-20 bg-gray-700 rounded px-3 py-2 text-white"
                  disabled={saving}
                  min="1"
                  max="20"
                  aria-label="Class level"
                />
                <button
                  onClick={() => setClasses(classes.filter((_, i) => i !== idx))}
                  disabled={saving || classes.length === 1}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-3 py-2 rounded text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={() => setClasses([...classes, { class: 'Fighter', level: 1 }])}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm"
            >
              Add Class
            </button>
            <div className="text-sm text-gray-300">
              Total Level: {calculateTotalLevel(classes)}
            </div>
          </div>
        </div>

        <div>
          <label className="block mb-1 text-sm font-bold">Race</label>
          <select
            value={race}
            onChange={e => setRace(e.target.value)}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
            disabled={saving}
            aria-label="Character race"
          >
            <option value="">Select a race...</option>
            {VALID_RACES.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <AlignmentSelect value={alignment} onChange={setAlignment} disabled={saving} />
        </div>

        <div className="md:col-span-2">
          <label className="block mb-1 text-sm font-bold">Gender</label>
          <input
            type="text"
            value={gender}
            onChange={e => setGender(e.target.value)}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
            disabled={saving}
            aria-label="Character gender"
            placeholder="e.g., Female, Male, Non-binary, etc."
            maxLength={50}
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-bold">Type</label>
          <select
            value={characterType}
            onChange={e => setCharacterType(e.target.value as CharacterType)}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
            disabled={saving}
            aria-label="Character type"
          >
            <option value="character">Player Character</option>
            <option value="npc">Travelling NPC</option>
            <option value="companion">Companion</option>
          </select>
        </div>
      </div>

      {/* Creature Stats */}
      <CreatureStatsForm stats={stats} onChange={handleStatsChange} />

      <div className="flex gap-2 mt-6">
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded"
        >
          {saving ? 'Saving...' : 'Save Character'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 px-4 py-2 rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
