'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';
import type { Encounter } from '@/lib/types';
import { EncounterEditor } from './EncounterEditor';

export function EncountersContent() {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingEncounter, setIsAddingEncounter] = useState(false);
  const [editingEncounter, setEditingEncounter] = useState<Encounter | null>(null);

  useEffect(() => {
    fetchEncounters();
  }, []);

  const fetchEncounters = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/encounters');
      if (!response.ok) throw new Error('Failed to fetch encounters');
      const data = await response.json();
      setEncounters(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addEncounter = () => {
    const newEncounter: Encounter = {
      id: '',
      userId: '',
      name: 'New Encounter',
      description: '',
      monsters: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setEditingEncounter(newEncounter);
    setIsAddingEncounter(true);
  };

  const saveEncounter = async (encounter: Encounter) => {
    try {
      setError(null);
      // Check if this is a new encounter by looking at whether it has an ID
      // Check both id and _id since MongoDB uses _id
      const hasId = (encounter.id && encounter.id !== '') || (encounter._id && encounter._id !== '');
      const isNew = !hasId;
      const url = isNew ? '/api/encounters' : `/api/encounters/${encounter.id || encounter._id}`;
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(encounter),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save encounter');
      }

      await fetchEncounters();
      setIsAddingEncounter(false);
      setEditingEncounter(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save encounter');
    }
  };

  const deleteEncounter = async (id: string) => {
    if (!confirm('Are you sure you want to delete this encounter?')) return;
    try {
      setError(null);
      const response = await fetch(`/api/encounters/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete encounter');
      await fetchEncounters();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete encounter');
    }
  };

  const cancelEdit = () => {
    setIsAddingEncounter(false);
    setEditingEncounter(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Encounters</h1>
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
          onClick={addEncounter}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded mb-6"
        >
          Add New Encounter
        </button>

        {editingEncounter && (
          <EncounterEditor
            key={editingEncounter.id}
            encounter={editingEncounter}
            onSave={saveEncounter}
            onCancel={cancelEdit}
            isNew={isAddingEncounter}
          />
        )}

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Loading encounters...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {encounters.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No encounters yet. Create one to get started!
              </div>
            ) : (
              encounters.map(encounter => (
                <div key={encounter.id} className="bg-gray-800 rounded-lg p-4" data-testid="encounter-card">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h2 className="text-xl font-semibold">{encounter.name}</h2>
                      <p className="text-gray-400">{encounter.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingEncounter(encounter);
                          setIsAddingEncounter(false);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteEncounter(encounter.id)}
                        className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Monsters ({encounter.monsters.length})</h3>
                    <div className="grid gap-2">
                      {encounter.monsters.map(monster => (
                        <div key={monster.id} className="bg-gray-700 rounded p-2 text-sm">
                          <span className="font-medium">{monster.name}</span>
                          <span className="text-gray-400 ml-2">
                            HP: {monster.hp}/{monster.maxHp}, AC: {monster.ac}, DEX: {monster.abilityScores.dexterity}
                          </span>
                        </div>
                      ))}
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

export default function EncountersPage() {
  return (
    <ProtectedRoute>
      <EncountersContent />
    </ProtectedRoute>
  );
}

