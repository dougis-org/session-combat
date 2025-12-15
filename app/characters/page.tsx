'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';
import { Character } from '@/lib/types';

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
      hp: 10,
      maxHp: 10,
      ac: 10,
      initiativeBonus: 0,
      dexterity: 10,
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
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h2 className="text-xl font-semibold">{character.name}</h2>
                      <div className="text-gray-400 mt-2 space-y-1">
                        <p>HP: {character.hp}/{character.maxHp}</p>
                        <p>AC: {character.ac}</p>
                        <p>Initiative Bonus: {character.initiativeBonus >= 0 ? '+' : ''}{character.initiativeBonus}</p>
                        <p>Dexterity: {character.dexterity}</p>
                      </div>
                    </div>
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
  const [hp, setHp] = useState(character.hp);
  const [maxHp, setMaxHp] = useState(character.maxHp);
  const [ac, setAc] = useState(character.ac);
  const [initiativeBonus, setInitiativeBonus] = useState(character.initiativeBonus);
  const [dexterity, setDexterity] = useState(character.dexterity);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSave = async () => {
    setValidationError(null);

    if (hp > maxHp) {
      setValidationError('Current HP cannot be greater than Max HP');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...character,
        name,
        hp,
        maxHp,
        ac,
        initiativeBonus,
        dexterity,
      });
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
      
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block mb-1 text-sm">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
            disabled={saving}
          />
        </div>
        
        <div>
          <label className="block mb-1 text-sm">AC</label>
          <input
            type="number"
            value={ac}
            onChange={(e) => setAc(parseInt(e.target.value) || 0)}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
            disabled={saving}
          />
        </div>

        <div>
          <label className="block mb-1 text-sm">Current HP</label>
          <input
            type="number"
            value={hp}
            onChange={(e) => setHp(parseInt(e.target.value) || 0)}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
            disabled={saving}
          />
        </div>

        <div>
          <label className="block mb-1 text-sm">Max HP</label>
          <input
            type="number"
            value={maxHp}
            onChange={(e) => {
              const newMaxHp = parseInt(e.target.value) || 0;
              setMaxHp(newMaxHp);
              // Cap current HP to new max HP if needed
              if (hp > newMaxHp) {
                setHp(newMaxHp);
              }
            }}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
            disabled={saving}
          />
        </div>

        <div>
          <label className="block mb-1 text-sm">Initiative Bonus</label>
          <input
            type="number"
            value={initiativeBonus}
            onChange={(e) => setInitiativeBonus(parseInt(e.target.value) || 0)}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
            disabled={saving}
          />
        </div>

        <div>
          <label className="block mb-1 text-sm">Dexterity</label>
          <input
            type="number"
            value={dexterity}
            onChange={(e) => setDexterity(parseInt(e.target.value) || 0)}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
            disabled={saving}
          />
        </div>
      </div>

      <div className="flex gap-2">
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
