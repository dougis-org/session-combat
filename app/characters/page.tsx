'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';
import { CreatureStatBlock } from '@/lib/components/CreatureStatBlock';
import { CreatureStatsForm } from '@/lib/components/CreatureStatsForm';
import { Character, AbilityScores, CreatureStats, calculateTotalLevel, VALID_CLASSES, VALID_RACES, DnDRace } from '@/lib/types';

function CharactersContent() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/characters');
      if (!response.ok) throw new Error('Failed to fetch characters');
      const data = await response.json();
      setCharacters(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addCharacter = () => {
    const newCharacter: Character = {
      id: '',
      userId: '',
      name: 'New Character',
      ac: 10,
      hp: 10,
      maxHp: 10,
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      classes: [{ class: 'Fighter', level: 1 }],
    };
    setEditingCharacter(newCharacter);
    setIsAdding(true);
  };

  const saveCharacter = async (character: Character) => {
    try {
      setError(null);
      const url = isAdding ? '/api/characters' : `/api/characters/${character.id}`;
      const method = isAdding ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(character),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save character');
      }

      await fetchCharacters();
      setIsAdding(false);
      setEditingCharacter(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save character');
    }
  };

  const deleteCharacter = async (id: string) => {
    if (!confirm('Are you sure you want to delete this character?')) return;
    try {
      setError(null);
      const response = await fetch(`/api/characters/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete character');
      await fetchCharacters();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete character');
    }
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingCharacter(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Characters</h1>
          <Link href="/" className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded">
            Back to Home
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-red-900 border border-red-700 rounded text-red-200 mb-6">
            {error}
          </div>
        )}

        <button
          onClick={addCharacter}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded mb-6"
        >
          Add New Character
        </button>

        {editingCharacter && (
          <CharacterEditor
            character={editingCharacter}
            onSave={saveCharacter}
            onCancel={cancelEdit}
            isNew={isAdding}
          />
        )}

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Loading characters...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {characters.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-400">
                No characters yet. Create one to get started!
              </div>
            ) : (
              characters.map(character => (
                <div key={character.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold">{character.name}</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingCharacter(character);
                          setIsAdding(false);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCharacter(character.id)}
                        className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {character.classes && character.classes.length > 0 && (
                    <div className="text-sm text-gray-400 mb-2">
                      {character.classes.map((c, idx) => (
                        <span key={idx}>
                          {c.class} Level {c.level}
                          {idx < character.classes.length - 1 && ' / '}
                        </span>
                      ))}
                      <span className="ml-2 font-semibold">
                        (Total Level {calculateTotalLevel(character.classes)})
                      </span>
                      {character.race && ` - ${character.race}`}
                    </div>
                  )}
                  <CreatureStatBlock
                    abilityScores={character.abilityScores}
                    ac={character.ac}
                    acNote={character.acNote}
                    hp={character.hp}
                    maxHp={character.maxHp}
                    skills={character.skills}
                    savingThrows={character.savingThrows}
                    damageResistances={character.damageResistances}
                    damageImmunities={character.damageImmunities}
                    damageVulnerabilities={character.damageVulnerabilities}
                    conditionImmunities={character.conditionImmunities}
                    senses={character.senses}
                    languages={character.languages}
                    traits={character.traits}
                    actions={character.actions}
                    bonusActions={character.bonusActions}
                    reactions={character.reactions}
                    isCompact={false}
                  />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CharacterEditor({
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
  const [alignment, setAlignment] = useState(character.alignment || '');
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
        ...character, // Preserve id, userId, and any other original fields
        name,
        classes,
        race: (race as DnDRace) || undefined,
        alignment: alignment || undefined,
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
          <label className="block mb-1 text-sm font-bold">Alignment</label>
          <input
            type="text"
            value={alignment}
            onChange={e => setAlignment(e.target.value)}
            placeholder="e.g., Lawful Good"
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
            disabled={saving}
          />
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

export default function CharactersPage() {
  return (
    <ProtectedRoute>
      <CharactersContent />
    </ProtectedRoute>
  );
}
