'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';
import { CharacterCard } from '@/lib/components/CharacterCard';
import { CharacterEditor } from '@/lib/components/CharacterEditor';
import {
  Character,
  CharacterType,
  CHARACTER_TYPE_LABELS,
  CHARACTER_TYPE_ORDER,
  getCharacterType,
} from '@/lib/types';

interface ImportConflictState {
  existingCharacterName: string;
}

interface ImportResponseBody {
  conflict?: string;
  error?: string;
  existingCharacter?: {
    id: string;
    name: string;
  };
  warnings?: string[];
}

export function CharactersContent() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [importUrl, setImportUrl] = useState('');
  const [isImportPanelOpen, setIsImportPanelOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importConflict, setImportConflict] = useState<ImportConflictState | null>(null);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [typeFilter, setTypeFilter] = useState<CharacterType | 'all'>('all');

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
    setImportWarnings([]);
    setImportConflict(null);
    const newCharacter: Character = {
      id: '',
      userId: '',
      name: 'New Character',
      ac: 10,
      hp: 10,
      maxHp: 10,
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      classes: [{ class: 'Fighter', level: 1 }],
    };
    setEditingCharacter(newCharacter);
    setIsAdding(true);
  };

  const saveCharacter = async (character: Character) => {
    try {
      setError(null);
      setImportWarnings([]);
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
      setImportWarnings([]);
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

  const toggleImportPanel = () => {
    setIsImportPanelOpen((current) => !current);
    setImportConflict(null);
    setError(null);
  };

  const submitImport = async (overwrite = false) => {
    try {
      setIsImporting(true);
      setError(null);
      setImportWarnings([]);

      const response = await fetch('/api/characters/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: importUrl,
          overwrite,
        }),
      });

      const data = await readImportResponseBody(response);
      if (!response.ok) {
        if (
          response.status === 409 &&
          data?.conflict === 'duplicate-name' &&
          data.existingCharacter
        ) {
          setImportConflict({
            existingCharacterName: data.existingCharacter.name,
          });
          setImportWarnings(Array.isArray(data.warnings) ? data.warnings : []);
          return;
        }

        throw new Error(data?.error || 'Failed to import character');
      }

      setImportConflict(null);
      setImportWarnings(Array.isArray(data?.warnings) ? data.warnings : []);
      setImportUrl('');
      setIsImportPanelOpen(false);
      await fetchCharacters();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import character');
    } finally {
      setIsImporting(false);
    }
  };

  const abortImportConflict = () => {
    setImportConflict(null);
    setImportWarnings([]);
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

        {importWarnings.length > 0 && (
          <div className="p-4 bg-amber-900 border border-amber-700 rounded text-amber-100 mb-6">
            <div className="font-semibold mb-2">Import warnings</div>
            <ul className="list-disc pl-5 space-y-1">
              {importWarnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={addCharacter}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded"
          >
            Add New Character
          </button>
          <button
            onClick={toggleImportPanel}
            disabled={loading || isImporting}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 px-4 py-2 rounded"
          >
            Import from D&D Beyond
          </button>
        </div>

        {isImportPanelOpen && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-indigo-500">
            <h2 className="text-xl font-bold mb-4">Import a Public D&amp;D Beyond Character</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-bold" htmlFor="dnd-beyond-url">
                  Publicly Available Character URL
                </label>
                <input
                  id="dnd-beyond-url"
                  type="url"
                  value={importUrl}
                  onChange={(event) => setImportUrl(event.target.value)}
                  placeholder="https://www.dndbeyond.com/characters/<id>"
                  className="w-full bg-gray-700 rounded px-3 py-2 text-white"
                  disabled={isImporting}
                />
                <p className="mt-1 text-xs text-gray-400">Enter a publicly available D&amp;D Beyond character URL.</p>
              </div>

              {importConflict && (
                <div className="p-4 bg-amber-950 border border-amber-700 rounded text-amber-100">
                  <div className="font-semibold mb-2">Character already exists</div>
                  <p className="mb-3">
                    A character named {importConflict.existingCharacterName} already exists. You can abort the import or overwrite the existing character.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={abortImportConflict}
                      disabled={isImporting}
                      className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 px-4 py-2 rounded"
                    >
                      Abort
                    </button>
                    <button
                      onClick={() => submitImport(true)}
                      disabled={isImporting}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 px-4 py-2 rounded"
                    >
                      Overwrite Existing Character
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => submitImport(false)}
                  disabled={isImporting || !importUrl.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 px-4 py-2 rounded"
                >
                  {isImporting ? 'Importing...' : 'Import from D&D Beyond'}
                </button>
                <button
                  onClick={toggleImportPanel}
                  disabled={isImporting}
                  className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {editingCharacter && (
          <CharacterEditor
            key={isAdding ? 'new' : editingCharacter.id}
            character={editingCharacter}
            onSave={saveCharacter}
            onCancel={cancelEdit}
            isNew={isAdding}
          />
        )}

        {!loading && characters.length > 0 && (
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 rounded text-sm ${typeFilter === 'all' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
              aria-label="Filter: All"
            >
              All
            </button>
            {CHARACTER_TYPE_ORDER.map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1 rounded text-sm ${typeFilter === type ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                aria-label={`Filter: ${CHARACTER_TYPE_LABELS[type]}`}
              >
                {CHARACTER_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Loading characters...</p>
          </div>
        ) : characters.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No characters yet. Create one to get started!
          </div>
        ) : (
          <div>
            {CHARACTER_TYPE_ORDER.filter(type => typeFilter === 'all' || typeFilter === type).map(type => {
              const group = characters.filter(c => getCharacterType(c.characterType) === type);
              if (group.length === 0) return null;
              return (
                <div key={type} className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-300 mb-3" aria-label={`Section: ${CHARACTER_TYPE_LABELS[type]}`}>
                    {CHARACTER_TYPE_LABELS[type]}
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {group.map(character => (
                      <CharacterCard
                        key={character.id}
                        character={character}
                        onEdit={() => {
                          setEditingCharacter(character);
                          setIsAdding(false);
                        }}
                        onDelete={() => deleteCharacter(character.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

async function readImportResponseBody(
  response: Response,
): Promise<ImportResponseBody | null> {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      return (await response.json()) as ImportResponseBody;
    } catch {
      return null;
    }
  }

  try {
    const text = await response.text();
    return text ? { error: text } : null;
  } catch {
    return null;
  }
}

export default function CharactersPage() {
  return (
    <ProtectedRoute>
      <CharactersContent />
    </ProtectedRoute>
  );
}
