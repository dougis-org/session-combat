'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';
import { MonsterTemplate } from '@/lib/types';

function MonstersContent() {
  const [userTemplates, setUserTemplates] = useState<MonsterTemplate[]>([]);
  const [globalTemplates, setGlobalTemplates] = useState<MonsterTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MonsterTemplate | null>(null);
  const [editingMode, setEditingMode] = useState<'user' | 'global'>('user');

  useEffect(() => {
    fetchTemplates();
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setIsAdmin(data.isAdmin === true);
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch user templates
      const userResponse = await fetch('/api/monsters');
      if (!userResponse.ok) throw new Error('Failed to fetch user templates');
      const userData = await userResponse.json();
      
      // Separate user and global templates
      const userOnly = userData.filter((t: MonsterTemplate) => t.userId !== 'GLOBAL');
      const global = userData.filter((t: MonsterTemplate) => t.userId === 'GLOBAL');
      
      setUserTemplates(userOnly || []);
      setGlobalTemplates(global || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addTemplate = (mode: 'user' | 'global') => {
    if (mode === 'global' && !isAdmin) {
      setError('Only administrators can create global monster templates');
      return;
    }
    
    const newTemplate: MonsterTemplate = {
      id: '',
      userId: mode === 'global' ? 'GLOBAL' : '',
      name: 'New Monster',
      hp: 10,
      maxHp: 10,
      ac: 10,
      initiativeBonus: 0,
      dexterity: 10,
      isGlobal: mode === 'global',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setEditingTemplate(newTemplate);
    setEditingMode(mode);
    setIsAddingTemplate(true);
  };

  const saveTemplate = async (template: MonsterTemplate) => {
    try {
      setError(null);
      const endpoint = editingMode === 'global' ? '/api/monsters/global' : '/api/monsters';
      const url = isAddingTemplate ? endpoint : `${endpoint}/${template.id}`;
      const method = isAddingTemplate ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save monster template');
      }

      await fetchTemplates();
      setIsAddingTemplate(false);
      setEditingTemplate(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save monster template');
    }
  };

  const deleteTemplate = async (id: string, mode: 'user' | 'global') => {
    if (!confirm('Are you sure you want to delete this monster template?')) return;
    try {
      setError(null);
      const endpoint = mode === 'global' ? '/api/monsters/global' : '/api/monsters';
      const response = await fetch(`${endpoint}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete monster template');
      await fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete monster template');
    }
  };

  const cancelEdit = () => {
    setIsAddingTemplate(false);
    setEditingTemplate(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Monster Library</h1>
          <Link href="/" className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded">
            Back to Home
          </Link>
        </div>

        {isAdmin && (
          <div className="mb-6 p-4 bg-blue-900 border border-blue-700 rounded text-blue-200">
            ✓ Admin Mode: You can manage both user and global monster templates
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-900 border border-red-700 rounded text-red-200 mb-6">
            {error}
          </div>
        )}

        {/* User Templates Section */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Your Monster Library</h2>
            <button
              onClick={() => addTemplate('user')}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded"
            >
              Add New Monster
            </button>
          </div>

          {editingTemplate && editingMode === 'user' && (
            <MonsterTemplateEditor
              template={editingTemplate}
              onSave={saveTemplate}
              onCancel={cancelEdit}
              isNew={isAddingTemplate}
              isGlobal={false}
            />
          )}

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-400">Loading monster templates...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userTemplates.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No personal monsters yet. Create one to get started!
                </div>
              ) : (
                userTemplates.map(template => (
                  <MonsterTemplateCard
                    key={template.id}
                    template={template}
                    isGlobal={false}
                    onEdit={() => {
                      setEditingTemplate(template);
                      setEditingMode('user');
                      setIsAddingTemplate(false);
                    }}
                    onDelete={() => deleteTemplate(template.id, 'user')}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* Global Templates Section */}
        {(isAdmin || globalTemplates.length > 0) && (
          <div className="mb-12">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-purple-400">Global Monster Library</h2>
              {isAdmin && (
                <button
                  onClick={() => addTemplate('global')}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-2 rounded"
                >
                  Add Global Monster
                </button>
              )}
            </div>

            {editingTemplate && editingMode === 'global' && (
              <MonsterTemplateEditor
                template={editingTemplate}
                onSave={saveTemplate}
                onCancel={cancelEdit}
                isNew={isAddingTemplate}
                isGlobal={true}
              />
            )}

            {globalTemplates.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                {isAdmin ? 'No global monsters yet.' : 'No global monsters available.'}
              </div>
            ) : (
              <div className="space-y-4">
                {globalTemplates.map(template => (
                  <MonsterTemplateCard
                    key={template.id}
                    template={template}
                    isGlobal={true}
                    canEdit={isAdmin}
                    onEdit={() => {
                      setEditingTemplate(template);
                      setEditingMode('global');
                      setIsAddingTemplate(false);
                    }}
                    onDelete={() => deleteTemplate(template.id, 'global')}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MonsterTemplateCard({
  template,
  isGlobal,
  canEdit = true,
  onEdit,
  onDelete,
}: {
  template: MonsterTemplate;
  isGlobal: boolean;
  canEdit?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`rounded-lg p-4 ${isGlobal ? 'bg-gray-800 border border-purple-600' : 'bg-gray-800'}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold">{template.name}</h3>
            {isGlobal && <span className="px-2 py-1 bg-purple-600 text-xs rounded">Global</span>}
          </div>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-gray-300">
            <div>
              <span className="text-gray-400">HP:</span> {template.hp}/{template.maxHp}
            </div>
            <div>
              <span className="text-gray-400">AC:</span> {template.ac}
            </div>
            <div>
              <span className="text-gray-400">Initiative:</span> {template.initiativeBonus >= 0 ? '+' : ''}{template.initiativeBonus}
            </div>
            <div>
              <span className="text-gray-400">Dexterity:</span> {template.dexterity}
            </div>
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-2 ml-4">
            <button
              onClick={onEdit}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MonsterTemplateEditor({
  template,
  onSave,
  onCancel,
  isNew,
  isGlobal,
}: {
  template: MonsterTemplate;
  onSave: (template: MonsterTemplate) => void;
  onCancel: () => void;
  isNew: boolean;
  isGlobal: boolean;
}) {
  const [name, setName] = useState(template.name);
  const [hp, setHp] = useState(template.hp);
  const [maxHp, setMaxHp] = useState(template.maxHp);
  const [ac, setAc] = useState(template.ac);
  const [initiativeBonus, setInitiativeBonus] = useState(template.initiativeBonus);
  const [dexterity, setDexterity] = useState(template.dexterity);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        ...template,
        name,
        hp,
        maxHp,
        ac,
        initiativeBonus,
        dexterity,
        updatedAt: new Date(),
      });
    } finally {
      setSaving(false);
    }
  };

  const title = isGlobal ? 'Global Monster' : 'Personal Monster';

  return (
    <div className={`rounded-lg p-6 mb-6 border-2 ${isGlobal ? 'border-purple-500 bg-gray-800' : 'border-blue-500 bg-gray-800'}`}>
      <h3 className="text-2xl font-bold mb-4">{isNew ? `Create ${title}` : `Edit ${title}`}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
            onChange={(e) => {
              const newHp = parseInt(e.target.value) || 0;
              setHp(Math.min(newHp, maxHp));
            }}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
            disabled={saving}
          />
        </div>
        <div>
          <label className="block mb-1 text-sm">Max HP</label>
          <input
            type="number"
            value={maxHp}
            onChange={(e) => setMaxHp(parseInt(e.target.value) || 0)}
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
          className={`hover:opacity-80 disabled:opacity-50 px-4 py-2 rounded ${isGlobal ? 'bg-purple-600' : 'bg-green-600'}`}
        >
          {saving ? 'Saving...' : `Save ${title}`}
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

export default function MonstersPage() {
  return (
    <ProtectedRoute>
      <MonstersContent />
    </ProtectedRoute>
  );
}
