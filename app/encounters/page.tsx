'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { storage } from '@/lib/storage';
import { Encounter, Monster } from '@/lib/types';

export default function EncountersPage() {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [isAddingEncounter, setIsAddingEncounter] = useState(false);
  const [editingEncounter, setEditingEncounter] = useState<Encounter | null>(null);

  useEffect(() => {
    const data = storage.load();
    setEncounters(data.encounters);
  }, []);

  const saveEncounters = (newEncounters: Encounter[]) => {
    setEncounters(newEncounters);
    storage.saveEncounters(newEncounters);
  };

  const addEncounter = () => {
    const newEncounter: Encounter = {
      id: Date.now().toString(),
      name: 'New Encounter',
      description: '',
      monsters: [],
    };
    setEditingEncounter(newEncounter);
    setIsAddingEncounter(true);
  };

  const saveEncounter = (encounter: Encounter) => {
    if (isAddingEncounter) {
      saveEncounters([...encounters, encounter]);
    } else {
      saveEncounters(encounters.map(e => e.id === encounter.id ? encounter : e));
    }
    setIsAddingEncounter(false);
    setEditingEncounter(null);
  };

  const deleteEncounter = (id: string) => {
    if (confirm('Are you sure you want to delete this encounter?')) {
      saveEncounters(encounters.filter(e => e.id !== id));
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

        <button
          onClick={addEncounter}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded mb-6"
        >
          Add New Encounter
        </button>

        {editingEncounter && (
          <EncounterEditor
            encounter={editingEncounter}
            onSave={saveEncounter}
            onCancel={cancelEdit}
          />
        )}

        <div className="space-y-4">
          {encounters.map(encounter => (
            <div key={encounter.id} className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="text-xl font-semibold">{encounter.name}</h2>
                  <p className="text-gray-400">{encounter.description}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingEncounter(encounter)}
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
                        HP: {monster.hp}/{monster.maxHp}, AC: {monster.ac}, Init: {monster.initiativeBonus >= 0 ? '+' : ''}{monster.initiativeBonus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EncounterEditor({
  encounter,
  onSave,
  onCancel,
}: {
  encounter: Encounter;
  onSave: (encounter: Encounter) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(encounter.name);
  const [description, setDescription] = useState(encounter.description);
  const [monsters, setMonsters] = useState<Monster[]>(encounter.monsters);
  const [editingMonster, setEditingMonster] = useState<Monster | null>(null);

  const addMonster = () => {
    const newMonster: Monster = {
      id: Date.now().toString(),
      name: 'New Monster',
      hp: 10,
      maxHp: 10,
      ac: 10,
      initiativeBonus: 0,
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

  const handleSave = () => {
    onSave({
      ...encounter,
      name,
      description,
      monsters,
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6 border-2 border-blue-500">
      <h2 className="text-2xl font-bold mb-4">Edit Encounter</h2>
      
      <div className="space-y-4 mb-4">
        <div>
          <label className="block mb-1 text-sm">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-700 rounded px-3 py-2"
          />
        </div>
        
        <div>
          <label className="block mb-1 text-sm">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-gray-700 rounded px-3 py-2"
            rows={3}
          />
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">Monsters</h3>
          <button
            onClick={addMonster}
            className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
          >
            Add Monster
          </button>
        </div>

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
                <span className="text-gray-400 ml-2 text-sm">
                  HP: {monster.hp}/{monster.maxHp}, AC: {monster.ac}, Init: {monster.initiativeBonus >= 0 ? '+' : ''}{monster.initiativeBonus}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingMonster(monster)}
                  className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteMonster(monster.id)}
                  className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-sm"
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
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
        >
          Save Encounter
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
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
  const [initiativeBonus, setInitiativeBonus] = useState(monster.initiativeBonus);

  const handleSave = () => {
    onSave({
      ...monster,
      name,
      hp,
      maxHp,
      ac,
      initiativeBonus,
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
            className="w-full bg-gray-700 rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block mb-1 text-xs">AC</label>
          <input
            type="number"
            value={ac}
            onChange={(e) => setAc(parseInt(e.target.value) || 0)}
            className="w-full bg-gray-700 rounded px-2 py-1 text-sm"
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
            className="w-full bg-gray-700 rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block mb-1 text-xs">Max HP</label>
          <input
            type="number"
            value={maxHp}
            onChange={(e) => setMaxHp(parseInt(e.target.value) || 0)}
            className="w-full bg-gray-700 rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block mb-1 text-xs">Initiative Bonus</label>
          <input
            type="number"
            value={initiativeBonus}
            onChange={(e) => setInitiativeBonus(parseInt(e.target.value) || 0)}
            className="w-full bg-gray-700 rounded px-2 py-1 text-sm"
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
