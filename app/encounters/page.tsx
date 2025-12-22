'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';
import { QuickCombatantModal } from '@/lib/components/QuickCombatantModal';
import { Modal } from '@/lib/components/Modal';
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
      // Check if this is a new encounter by looking at whether it has an ID
      // Check both id and _id since MongoDB uses _id
      const hasId = (encounter.id && encounter.id !== '') || (encounter._id && encounter._id !== '');
      const isNew = !hasId;
      const url = isNew ? '/api/encounters' : `/api/encounters/${encounter.id || encounter._id}`;
      const method = isNew ? 'POST' : 'PUT';

      console.log('Saving encounter:', { isNew, method, url, id: encounter.id, _id: encounter._id });

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
  const [showCombatantModal, setShowCombatantModal] = useState(false);
  const [showCustomMonsterModal, setShowCustomMonsterModal] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    if (showCombatantModal && monsterTemplates.length === 0) {
      loadMonsterTemplates();
    }
  }, [showCombatantModal]);

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

  const addMonster = (monster: Monster) => {
    setMonsters([...monsters, monster]);
  };

  const saveMonster = (monster: Monster) => {
    const existingIndex = monsters.findIndex(m => m.id === monster.id);
    if (existingIndex >= 0) {
      setMonsters(monsters.map(m => m.id === monster.id ? monster : m));
    } else {
      setMonsters([...monsters, monster]);
    }
    setEditingMonster(null);
    setShowCustomMonsterModal(false);
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
      
      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="encounter-name" className="block mb-1 text-sm">Name</label>
          <input
            id="encounter-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
            disabled={saving}
          />
        </div>
        
        <div>
          <label htmlFor="encounter-description" className="block mb-1 text-sm">Description</label>
          <textarea
            id="encounter-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
            rows={3}
            disabled={saving}
          />
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold mb-3 text-lg">Monsters ({monsters.length})</h3>

        <div className="space-y-2 mb-4">
          {monsters.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No monsters added yet.</p>
          ) : (
            monsters.map(monster => (
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
                    onClick={() => {
                      setEditingMonster(monster);
                      setShowCustomMonsterModal(true);
                    }}
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
            ))
          )}
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setShowCombatantModal(true)}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-3 py-2 rounded text-sm"
          >
            Add Combatant
          </button>
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

      {/* Combatant Modal */}
      {showCombatantModal && (
        <QuickCombatantModal
          onAddMonster={(monster) => {
            addMonster(monster);
          }}
          onAddCharacter={(character) => {
            // Characters not supported in encounter builder
          }}
          onClose={() => setShowCombatantModal(false)}
          monsterTemplates={monsterTemplates}
          characterTemplates={[]}
          loadingTemplates={loadingTemplates}
          userId={user?.userId}
        />
      )}

      {/* Custom Monster Edit Modal */}
      {editingMonster && showCustomMonsterModal && (
        <Modal
          isOpen={showCustomMonsterModal}
          title={
            monsters.some((m) => m.id === editingMonster.id)
              ? 'Edit Monster'
              : 'Add Custom Monster'
          }
          onClose={() => {
            setShowCustomMonsterModal(false);
            setEditingMonster(null);
          }}
          size="medium"
        >
          <MonsterEditor
            monster={editingMonster}
            onSave={saveMonster}
            onCancel={() => {
              setShowCustomMonsterModal(false);
              setEditingMonster(null);
            }}
            hideCancel={false}
          />
        </Modal>
      )}
    </div>
  );
}

function MonsterEditor({
  monster,
  onSave,
  onCancel,
  hideCancel = false,
}: {
  monster: Monster;
  onSave: (monster: Monster) => void;
  onCancel: () => void;
  hideCancel?: boolean;
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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="monster-name" className="block mb-1 text-sm font-medium">Name</label>
          <input
            id="monster-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
          />
        </div>
        <div>
          <label htmlFor="monster-ac" className="block mb-1 text-sm font-medium">AC</label>
          <input
            id="monster-ac"
            type="number"
            value={ac}
            onChange={(e) => setAc(parseInt(e.target.value) || 0)}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
          />
        </div>
        <div>
          <label htmlFor="monster-hp" className="block mb-1 text-sm font-medium">HP</label>
          <input
            id="monster-hp"
            type="number"
            value={hp}
            onChange={(e) => {
              const newHp = parseInt(e.target.value) || 0;
              setHp(Math.min(newHp, maxHp));
            }}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
          />
        </div>
        <div>
          <label htmlFor="monster-maxhp" className="block mb-1 text-sm font-medium">Max HP</label>
          <input
            id="monster-maxhp"
            type="number"
            value={maxHp}
            onChange={(e) => setMaxHp(parseInt(e.target.value) || 0)}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
          />
        </div>
        <div className="col-span-2">
          <label htmlFor="monster-dex" className="block mb-1 text-sm font-medium">Dexterity</label>
          <input
            id="monster-dex"
            type="number"
            value={dexterity}
            onChange={(e) => setDexterity(parseInt(e.target.value) || 0)}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
          />
        </div>
      </div>
      <div className="flex gap-2 pt-4">
        <button
          onClick={handleSave}
          className="flex-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm font-medium"
        >
          Save Monster
        </button>
        {!hideCancel && (
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-sm font-medium"
          >
            Cancel
          </button>
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

