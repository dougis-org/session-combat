'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';
import { Party, Character } from '@/lib/types';

function PartiesContent() {
  const [parties, setParties] = useState<Party[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [partiesRes, charactersRes] = await Promise.all([
        fetch('/api/parties'),
        fetch('/api/characters'),
      ]);
      if (!partiesRes.ok || !charactersRes.ok) throw new Error('Failed to fetch data');
      const partiesData = await partiesRes.json();
      const charactersData = await charactersRes.json();
      setParties(partiesData || []);
      setCharacters(charactersData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addParty = () => {
    const newParty: Party = {
      id: '',
      userId: '',
      name: 'New Party',
      description: '',
      characterIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setEditingParty(newParty);
    setIsAdding(true);
  };

  const saveParty = async (party: Party) => {
    try {
      setError(null);
      const url = isAdding ? '/api/parties' : `/api/parties/${party.id}`;
      const method = isAdding ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(party),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save party');
      }

      await fetchData();
      setIsAdding(false);
      setEditingParty(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save party');
    }
  };

  const deleteParty = async (id: string) => {
    if (!confirm('Are you sure you want to delete this party?')) return;
    try {
      setError(null);
      const response = await fetch(`/api/parties/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete party');
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete party');
    }
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingParty(null);
  };

  const getCharacterNames = (characterIds: string[]): string => {
    return characterIds
      .map(id => characters.find(c => c.id === id)?.name || 'Unknown')
      .join(', ');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Parties</h1>
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
          onClick={addParty}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded mb-6"
        >
          Add New Party
        </button>

        {editingParty && (
          <PartyEditor
            party={editingParty}
            characters={characters}
            onSave={saveParty}
            onCancel={cancelEdit}
            isNew={isAdding}
          />
        )}

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Loading parties...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {parties.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-400">
                No parties yet. Create one to get started!
              </div>
            ) : (
              parties.map(party => (
                <div key={party.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold">{party.name}</h2>
                      {party.description && (
                        <p className="text-gray-400 text-sm mt-1">{party.description}</p>
                      )}
                      <div className="text-gray-400 text-sm mt-2">
                        <p>Members: {party.characterIds.length}</p>
                        {party.characterIds.length > 0 && (
                          <p className="mt-1 text-xs">{getCharacterNames(party.characterIds)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingParty(party);
                          setIsAdding(false);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteParty(party.id)}
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

function PartyEditor({
  party,
  characters,
  onSave,
  onCancel,
  isNew,
}: {
  party: Party;
  characters: Character[];
  onSave: (party: Party) => void;
  onCancel: () => void;
  isNew: boolean;
}) {
  const [name, setName] = useState(party.name);
  const [description, setDescription] = useState(party.description || '');
  const [characterIds, setCharacterIds] = useState<Set<string>>(new Set(party.characterIds));
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSave = async () => {
    setValidationError(null);

    if (!name.trim()) {
      setValidationError('Party name is required');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...party,
        name: name.trim(),
        description: description.trim(),
        characterIds: Array.from(characterIds),
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleCharacter = (characterId: string) => {
    const newIds = new Set(characterIds);
    if (newIds.has(characterId)) {
      newIds.delete(characterId);
    } else {
      newIds.add(characterId);
    }
    setCharacterIds(newIds);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6 border-2 border-blue-500">
      <h2 className="text-2xl font-bold mb-4">{isNew ? 'Create Party' : 'Edit Party'}</h2>
      
      {validationError && (
        <div className="p-3 bg-red-900 border border-red-700 rounded text-red-200 mb-4">
          {validationError}
        </div>
      )}
      
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block mb-1 text-sm font-semibold">Party Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
            disabled={saving}
            placeholder="e.g., The Adventurers Guild"
          />
        </div>
        
        <div>
          <label className="block mb-1 text-sm font-semibold">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
            disabled={saving}
            placeholder="Optional party description"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block mb-2 text-sm font-semibold">Party Members</label>
        {characters.length === 0 ? (
          <p className="text-gray-400 text-sm">No characters available. Create characters first.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-2">
            {characters.map(character => (
              <label key={character.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={characterIds.has(character.id)}
                  onChange={() => toggleCharacter(character.id)}
                  disabled={saving}
                  className="cursor-pointer"
                />
                <span className="text-sm">{character.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded"
        >
          {saving ? 'Saving...' : 'Save Party'}
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

export default function PartiesPage() {
  return (
    <ProtectedRoute>
      <PartiesContent />
    </ProtectedRoute>
  );
}
