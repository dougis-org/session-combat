'use client';

import { useState, useEffect } from 'react';
import { QuickCombatantModal } from '@/lib/components/QuickCombatantModal';
import { Modal } from '@/lib/components/Modal';
import { useAuth } from '@/lib/hooks/useAuth';
import type { Encounter, Monster, MonsterTemplate } from '@/lib/types';
import { MonsterEditor } from './MonsterEditor';

export function EncounterEditor({
  encounter,
  onSave,
  onCancel,
  isNew,
}: {
  encounter: Encounter;
  onSave: (encounter: Encounter) => void | Promise<void>;
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
    if (!showCombatantModal || monsterTemplates.length > 0) {
      return;
    }

    const loadMonsterTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const response = await fetch('/api/monsters');
        if (!response.ok) {
          throw new Error(`Failed to fetch monster templates: ${response.statusText}`);
        }
        const data = await response.json();
        setMonsterTemplates(data || []);
      } catch (error) {
        console.error('Error loading monster templates:', error);
      } finally {
        setLoadingTemplates(false);
      }
    };

    void loadMonsterTemplates();
  }, [showCombatantModal, monsterTemplates.length]);

  const addMonster = (monster: Monster) => {
    setMonsters(prev => [...prev, monster]);
  };

  const saveMonster = (monster: Monster) => {
    setMonsters(prev => {
      const exists = prev.some(m => m.id === monster.id);
      return exists ? prev.map(m => m.id === monster.id ? monster : m) : [...prev, monster];
    });
    setEditingMonster(null);
    setShowCustomMonsterModal(false);
  };

  const deleteMonster = (id: string) => {
    setMonsters(prev => prev.filter(m => m.id !== id));
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
          onAddCharacter={(_character) => {
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
