'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';
import { filterMonsters, getAvailableTypes } from './filterUtils';
import { MonsterTemplateCard } from './MonsterTemplateCard';
import { MonsterTemplateEditor } from './MonsterTemplateEditor';
import { ImportMonstersModal } from './ImportMonstersModal';
import { useMonsterTemplates } from './useMonsterTemplates';

export function MonstersContent() {
  const {
    userTemplates,
    globalTemplates,
    loading,
    error,
    isAdmin,
    copyingId,
    editingTemplate,
    editingMode,
    isAddingTemplate,
    fetchTemplates,
    addTemplate,
    startEdit,
    saveTemplate,
    deleteTemplate,
    copyTemplate,
    cancelEdit,
  } = useMonsterTemplates();

  const [isImporting, setIsImporting] = useState(false);
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
            <div className="flex gap-2">
              <button
                onClick={() => setIsImporting(true)}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
              >
                Import Monster(s)
              </button>
              <button
                onClick={() => addTemplate('user')}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded"
              >
                Add New Monster
              </button>
            </div>
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
                    onEdit={() => startEdit(template, 'user')}
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
                    onEdit={() => startEdit(template, 'global')}
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

      <ImportMonstersModal
        key={isImporting ? 'import-open' : 'import-closed'}
        isOpen={isImporting}
        onClose={() => setIsImporting(false)}
        onImported={fetchTemplates}
      />

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
