'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';
import { MonsterSelector } from '@/lib/components/MonsterSelector';
import { useAuth } from '@/lib/hooks/useAuth';
import { Encounter, Monster, MonsterTemplate } from '@/lib/types';

function EncountersContent() {
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
      const url = isAddingEncounter ? '/api/encounters' : `/api/encounters/${encounter.id}`;
      const method = isAddingEncounter ? 'POST' : 'PUT';

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
                <div key={encounter.id} className="bg-gray-800 rounded-lg p-4">
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

function EncounterEditor({
  encounter,
  onSave,
  onCancel,
  isNew,
}: {
  encounter: Encounter;
  onSave: (encounter: Encounter) => void;
  onCancel: () => void;
  isNew: boolean;
}) {
  const { user } = useAuth();
  const [name, setName] = useState(encounter.name);
  const [description, setDescription] = useState(encounter.description);
  const [monsters, setMonsters] = useState<Monster[]>(encounter.monsters);
  const [editingMonster, setEditingMonster] = useState<Monster | null>(null);
  const [saving, setSaving] = useState(false);
  const [monsterTemplates, setMonsterTemplates] = useState<MonsterTemplate[]>([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    if (showTemplateSelector && monsterTemplates.length === 0) {
      loadMonsterTemplates();
    }
  }, [showTemplateSelector]);

  const loadMonsterTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const response = await fetch('/api/monsters');
      if (response.ok) {
        const data = await response.json();
        setMonsterTemplates(data || []);
      }
    } catch (error) {
      console.error('Error loading monster templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const addMonsterFromLibrary = (template: MonsterTemplate) => {
    // Create a unique instance from the template
    const newMonster: Monster = {
      ...template,
      id: crypto.randomUUID(),
      userId: undefined,
      templateId: template.id,
    };
    setMonsters([...monsters, newMonster]);
    setShowTemplateSelector(false);
  };

  const addMonster = () => {
    const newMonster: Monster = {
      id: crypto.randomUUID(),
      name: 'New Monster',
      hp: 10,
      maxHp: 10,
      ac: 10,
      abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
      size: 'medium',
      type: 'humanoid',
      speed: '30 ft.',
      challengeRating: 0,
    };
    setEditingMonster(newMonster);
  };

  const saveMonster = (monster: Monster) => {
    const existingIndex = monsters.findIndex(m => m.id === monster.id);
    if (existingIndex >= 0) {
      setMonsters(monsters.map(m => m.id === monster.id ? monster : m));
    } else {
      setMonsters([...monsters, monster]);
    }
    setEditingMonster(null);
  };

  const deleteMonster = (id: string) => {
    setMonsters(monsters.filter(m => m.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        ...encounter,
        name,
        description,
        monsters,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6 border-2 border-blue-500">
      <h2 className="text-2xl font-bold mb-4">{isNew ? 'Create Encounter' : 'Edit Encounter'}</h2>
      
      <div className="space-y-4 mb-4">
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
          <label className="block mb-1 text-sm">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
            rows={3}
            disabled={saving}
          />
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">Monsters</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTemplateSelector(!showTemplateSelector)}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-3 py-1 rounded text-sm"
            >
              Add from Library
            </button>
            <button
              onClick={addMonster}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-3 py-1 rounded text-sm"
            >
              Add Custom
            </button>
          </div>
        </div>

        {showTemplateSelector && (
          <MonsterSelector
            monsters={monsterTemplates}
            onSelect={addMonsterFromLibrary}
            onClose={() => setShowTemplateSelector(false)}
            loading={loadingTemplates}
            userId={user?.userId}
          />
        )}

        {editingMonster && (
          <MonsterEditor
            monster={editingMonster}
            onSave={saveMonster}
            onCancel={() => setEditingMonster(null)}
          />
        )}

        <div className="space-y-2">
          {monsters.map(monster => (
            <div key={monster.id} className="bg-gray-700 rounded p-3 flex justify-between items-center">
              <div>
                <span className="font-medium">{monster.name}</span>
                {monster.templateId && <span className="text-purple-400 ml-2 text-xs">(from library)</span>}
                <span className="text-gray-400 ml-2 text-sm">
                  HP: {monster.hp}/{monster.maxHp}, AC: {monster.ac}, DEX: {monster.abilityScores.dexterity}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingMonster(monster)}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-2 py-1 rounded text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteMonster(monster.id)}
                  disabled={saving}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-2 py-1 rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded"
        >
          {saving ? 'Saving...' : 'Save Encounter'}
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

function MonsterEditor({
  monster,
  onSave,
  onCancel,
}: {
  monster: Monster;
  onSave: (monster: Monster) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(monster.name);
  const [hp, setHp] = useState(monster.hp);
  const [maxHp, setMaxHp] = useState(monster.maxHp);
  const [ac, setAc] = useState(monster.ac);
  const [dexterity, setDexterity] = useState(monster.abilityScores.dexterity);

  const handleSave = () => {
    onSave({
      ...monster,
      name,
      hp,
      maxHp,
      ac,
      abilityScores: {
        ...monster.abilityScores,
        dexterity,
      },
    });
  };

  return (
    <div className="bg-gray-600 rounded p-4 mb-2 border-2 border-green-500">
      <h4 className="font-semibold mb-2">Edit Monster</h4>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block mb-1 text-xs">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-700 rounded px-2 py-1 text-sm text-white"
          />
        </div>
        <div>
          <label className="block mb-1 text-xs">AC</label>
          <input
            type="number"
            value={ac}
            onChange={(e) => setAc(parseInt(e.target.value) || 0)}
            className="w-full bg-gray-700 rounded px-2 py-1 text-sm text-white"
          />
        </div>
        <div>
          <label className="block mb-1 text-xs">HP</label>
          <input
            type="number"
            value={hp}
            onChange={(e) => {
              const newHp = parseInt(e.target.value) || 0;
              setHp(Math.min(newHp, maxHp));
            }}
            className="w-full bg-gray-700 rounded px-2 py-1 text-sm text-white"
          />
        </div>
        <div>
          <label className="block mb-1 text-xs">Max HP</label>
          <input
            type="number"
            value={maxHp}
            onChange={(e) => setMaxHp(parseInt(e.target.value) || 0)}
            className="w-full bg-gray-700 rounded px-2 py-1 text-sm text-white"
          />
        </div>
        <div>
          <label className="block mb-1 text-xs">Dexterity</label>
          <input
            type="number"
            value={dexterity}
            onChange={(e) => setDexterity(parseInt(e.target.value) || 0)}
            className="w-full bg-gray-700 rounded px-2 py-1 text-sm text-white"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm"
        >
          Cancel
        </button>
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

