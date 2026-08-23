'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';
import { CharacterEditor } from '@/lib/components/CharacterEditor';
import { CreatureStatBlock } from '@/lib/components/CreatureStatBlock';
import { CharacterDescription } from '@/lib/components/CharacterDescription';
import { Character } from '@/lib/types';
import { Modal } from '@/lib/components/Modal';

function CharacterDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const fetchCharacter = async () => {
      try {
        const response = await fetch(`/api/characters/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Character not found');
          } else {
            setError('Failed to load character');
          }
          return;
        }
        const data = await response.json();
        setCharacter(data);
      } catch (err) {
        setError('An error occurred while fetching the character');
      } finally {
        setLoading(false);
      }
    };

    fetchCharacter();
  }, [id]);

  const handleSave = async (updatedCharacter: Character) => {
    try {
      const response = await fetch(`/api/characters/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCharacter),
      });

      if (!response.ok) {
        throw new Error('Failed to save character');
      }

      const data = await response.json();
      setCharacter(data);
      setIsEditing(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred while saving');
    }
  };

  const handleSync = async () => {
    if (!character?.externalSync?.url) return;
    setSyncing(true);
    try {
      const response = await fetch('/api/characters/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: character.externalSync.url, overwrite: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync character');
      }

      const data = await response.json();
      setCharacter(data.character);
      setShowSyncModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred while syncing');
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this character?')) return;
    
    try {
      const response = await fetch(`/api/characters/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete character');
      }
      
      router.push('/characters');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred while deleting');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-400">Loading character...</p>
        </div>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link href="/characters" className="text-blue-400 hover:text-blue-300 flex items-center gap-2 w-fit">
              <span aria-hidden="true">&larr;</span> Back to Characters
            </Link>
          </div>
          <div className="p-4 bg-red-900 border border-red-700 rounded text-red-200">
            {error || 'Character not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Link href="/characters" className="text-blue-400 hover:text-blue-300 flex items-center gap-2 w-fit">
            <span aria-hidden="true">&larr;</span> Back to Characters
          </Link>
          
          <div className="flex gap-2">
            {!isEditing && (
              <>
                {character.externalSync?.provider === 'dndbeyond' && character.externalSync?.url && (
                  <button
                    onClick={() => setShowSyncModal(true)}
                    className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-sm font-semibold flex items-center gap-2"
                  >
                    Sync from D&D Beyond
                  </button>
                )}
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-semibold"
                >
                  Edit Character
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-semibold"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        {isEditing ? (
          <CharacterEditor
            character={character}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
            isNew={false}
          />
        ) : (
          <div className="bg-gray-800 rounded-lg p-6">
            <h1 className="text-3xl font-bold mb-2">{character.name}</h1>
            <div className="text-gray-400 mb-6 pb-4 border-b border-gray-700">
              <CharacterDescription character={character} />
            </div>

            <CreatureStatBlock
              abilityScores={character.abilityScores}
              ac={character.ac}
              acNote={character.acNote}
              hp={character.hp}
              maxHp={character.maxHp}
              skills={character.skills}
              savingThrows={character.savingThrows}
              damageResistances={character.damageResistances}
              damageImmunities={character.damageImmunities}
              damageVulnerabilities={character.damageVulnerabilities}
              conditionImmunities={character.conditionImmunities}
              senses={character.senses}
              languages={character.languages}
              traits={character.traits}
              actions={character.actions}
              bonusActions={character.bonusActions}
              reactions={character.reactions}
              isCompact={false}
            />
          </div>
        )}

        <Modal
          isOpen={showSyncModal}
          title="Sync from D&D Beyond"
          onClose={() => !syncing && setShowSyncModal(false)}
        >
          <div className="space-y-4 text-gray-300">
            <p className="font-semibold text-white">Warning: Full Replacement</p>
            <p>
              Syncing will completely overwrite this character with the data from D&D Beyond.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Current HP and temporary HP will be reset.</li>
              <li>Any local edits to stats, abilities, or notes will be lost.</li>
              <li>Active conditions or damage effects will be removed.</li>
            </ul>
            <p>Are you sure you want to proceed?</p>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={() => setShowSyncModal(false)}
                disabled={syncing}
                className="px-4 py-2 rounded font-semibold text-gray-300 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-semibold text-white disabled:opacity-50 flex items-center gap-2"
              >
                {syncing ? 'Syncing...' : 'Confirm Sync'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}

export default function CharacterDetailPage() {
  return (
    <ProtectedRoute>
      <CharacterDetailContent />
    </ProtectedRoute>
  );
}
