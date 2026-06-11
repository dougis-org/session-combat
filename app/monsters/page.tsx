'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';
import type { MonsterTemplate } from '@/lib/types';
import { GLOBAL_USER_ID } from '@/lib/constants';
import { filterMonsters, getAvailableTypes } from './filterUtils';
import { MonsterTemplateCard } from './MonsterTemplateCard';
import { MonsterTemplateEditor } from './MonsterTemplateEditor';

export function MonstersContent() {
  const [userTemplates, setUserTemplates] = useState<MonsterTemplate[]>([]);
  const [globalTemplates, setGlobalTemplates] = useState<MonsterTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MonsterTemplate | null>(null);
  const [editingMode, setEditingMode] = useState<'user' | 'global'>('user');
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');
  const [filterType, setFilterType] = useState('');

  const availableTypes = useMemo(
    () => getAvailableTypes(userTemplates, globalTemplates),
    [userTemplates, globalTemplates],
  );

  const filteredUserTemplates = useMemo(
    () => filterMonsters(userTemplates, filterText, filterType),
    [userTemplates, filterText, filterType],
  );

  const filteredGlobalTemplates = useMemo(
    () => filterMonsters(globalTemplates, filterText, filterType),
    [globalTemplates, filterText, filterType],
  );

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
      const userOnly = userData.filter((t: MonsterTemplate) => t.userId !== GLOBAL_USER_ID);
      const global = userData.filter((t: MonsterTemplate) => t.userId === GLOBAL_USER_ID);
      
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
      userId: mode === 'global' ? GLOBAL_USER_ID : '',
      name: 'New Monster',
      size: 'medium',
      type: 'humanoid',
      ac: 10,
      hp: 10,
      maxHp: 10,
      speed: '30 ft.',
      challengeRating: 0,
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
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
      // Use safe hardcoded endpoints only
      const endpoint = mode === 'global' ? '/api/monsters/global' : '/api/monsters';
      const url = `${endpoint}/${id}`;
      const response = await fetch(url, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete monster template');
      await fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete monster template');
    }
  };

  const copyTemplate = async (id: string) => {
    // Prevent concurrent copy requests to avoid race condition with copyingId state
    if (copyingId) return;
    try {
      setError(null);
      setCopyingId(id);
      const response = await fetch(`/api/monsters/${id}/duplicate`, {
        method: 'POST',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to copy monster');
      }
      await fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to copy monster');
    } finally {
      setCopyingId(null);
    }
  };

  const cancelEdit = useCallback(() => {
    setIsAddingTemplate(false);
    setEditingTemplate(null);
  }, []);

  useEffect(() => {
    if (!editingTemplate) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelEdit();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [editingTemplate, cancelEdit]);

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

        {/* Filter Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            placeholder="Filter by name…"
            aria-label="Filter monsters by name"
            className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            aria-label="Filter monsters by type"
            className="sm:w-48 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500"
          >
            <option value="">All types</option>
            {availableTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

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

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-400">Loading monster templates...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUserTemplates.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  {userTemplates.length === 0
                    ? 'No personal monsters yet. Create one to get started!'
                    : 'No monsters match your filter.'}
                </div>
              ) : (
                filteredUserTemplates.map(template => (
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

            {filteredGlobalTemplates.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                {globalTemplates.length === 0
                  ? (isAdmin ? 'No global monsters yet.' : 'No global monsters available.')
                  : 'No monsters match your filter.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGlobalTemplates.map(template => (
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
                    onCopy={() => copyTemplate(template.id)}
                    isCopying={copyingId === template.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {editingTemplate && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto py-8"
          onClick={cancelEdit}
          role="dialog"
          aria-modal="true"
        >
          <div className="max-w-3xl w-full mx-4" onClick={e => e.stopPropagation()}>
            <MonsterTemplateEditor
              template={editingTemplate}
              onSave={saveTemplate}
              onCancel={cancelEdit}
              isNew={isAddingTemplate}
              isGlobal={editingMode === 'global'}
            />
          </div>
        </div>
      )}
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
