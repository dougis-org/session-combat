'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';
import { ErrorBanner, LoadingState, FormField, EditorShell, textInputClass } from '@/lib/components/ui';
import { Party, Character, Campaign, CHARACTER_TYPE_ORDER, CHARACTER_TYPE_LABELS, getCharacterType } from '@/lib/types';
import { CharacterMiniSummary } from '@/lib/components/CharacterMiniSummary';

function PartiesContent() {
  const [parties, setParties] = useState<Party[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [partiesRes, charactersRes, campaignsRes] = await Promise.all([
        fetch('/api/parties'),
        fetch('/api/characters'),
        fetch('/api/campaigns').catch(() => null),
      ]);
      if (!partiesRes.ok || !charactersRes.ok) throw new Error('Failed to fetch data');
      const partiesData = await partiesRes.json();
      const charactersData = await charactersRes.json();
      const campaignsData = campaignsRes?.ok ? await campaignsRes.json() : [];
      setParties(partiesData || []);
      setCharacters(charactersData || []);
      setCampaigns(campaignsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addParty = () => {
    const newParty: Party = {
      id: '',
      userId: '',
      name: 'New Party',
      description: '',
      members: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setEditingParty(newParty);
    setIsAdding(true);
  };

  const saveParty = async (party: Party, characterIds: string[]) => {
    try {
      setError(null);
      const url = isAdding ? '/api/parties' : `/api/parties/${party.id}`;
      const method = isAdding ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...party, characterIds }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save party');
      }

      await fetchData();
      setIsAdding(false);
      setEditingParty(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save party');
    }
  };

  const deleteParty = async (id: string) => {
    if (!confirm('Are you sure you want to delete this party?')) return;
    try {
      setError(null);
      const response = await fetch(`/api/parties/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete party');
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete party');
    }
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingParty(null);
  };

  const campaignMap = useMemo(
    () => new Map(campaigns.map(c => [c.id, c.name])),
    [campaigns]
  );

  const characterMap = useMemo(
    () => new Map(characters.map(c => [c.id, c])),
    [characters]
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Parties</h1>
          <Link href="/" className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded">
            Back to Home
          </Link>
        </div>

        <ErrorBanner message={error} />

        <button
          onClick={addParty}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded mb-6"
        >
          Add New Party
        </button>

        {editingParty && (
          <PartyEditor
            party={editingParty}
            characters={characters}
            campaigns={campaigns}
            onSave={saveParty}
            onCancel={cancelEdit}
            isNew={isAdding}
          />
        )}

        {loading ? (
          <LoadingState label="Loading parties..." />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {parties.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-400">
                No parties yet. Create one to get started!
              </div>
            ) : (
              parties.map(party => {
                const activeIds = party.members.filter(m => !m.leftAt).map(m => m.characterId);
                const partyCharacters = activeIds.map(
                  id =>
                    characterMap.get(id) ?? ({
                      id,
                      userId: '',
                      name: 'Unknown',
                      characterType: 'character',
                      ac: 0,
                      hp: 0,
                      maxHp: 0,
                      classes: [],
                      abilityScores: {
                        strength: 10,
                        dexterity: 10,
                        constitution: 10,
                        intelligence: 10,
                        wisdom: 10,
                        charisma: 10,
                      },
                    } as Character)
                );
                return (
                  <div key={party.id} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold">{party.name}</h2>
                        {party.description && (
                          <p className="text-gray-400 text-sm mt-1">{party.description}</p>
                        )}
                        <div className="text-gray-400 text-sm mt-2">
                          <p>Campaign: {party.campaignId ? (campaignMap.get(party.campaignId) ?? 'No Campaign') : 'No Campaign'}</p>
                          <p>Members: {activeIds.length}</p>
                        </div>
                        {partyCharacters.length > 0 && (
                          <div className="mt-3 space-y-3">
                            {CHARACTER_TYPE_ORDER.map(type => {
                              const group = partyCharacters.filter(
                                c => getCharacterType(c.characterType) === type
                              );
                              if (group.length === 0) return null;
                              return (
                                <div key={type}>
                                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1"
                                    aria-label={`Member section: ${CHARACTER_TYPE_LABELS[type]}`}>
                                    {CHARACTER_TYPE_LABELS[type]}
                                  </p>
                                  <div className="grid md:grid-cols-2 gap-2">
                                    {group.map(character => (
                                      <CharacterMiniSummary
                                        key={character.id}
                                        name={character.name}
                                        race={character.race}
                                        characterType={character.characterType}
                                        classes={character.classes}
                                        ac={character.ac}
                                        acNote={character.acNote}
                                        hp={character.hp}
                                        maxHp={character.maxHp}
                                      />
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingParty(party);
                            setIsAdding(false);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteParty(party.id)}
                          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PartyEditor({
  party,
  characters,
  campaigns,
  onSave,
  onCancel,
  isNew,
}: {
  party: Party;
  characters: Character[];
  campaigns: Campaign[];
  onSave: (party: Party, characterIds: string[]) => Promise<void>;
  onCancel: () => void;
  isNew: boolean;
}) {
  const [name, setName] = useState(party.name);
  const [description, setDescription] = useState(party.description || '');
  const [campaignId, setCampaignId] = useState(party.campaignId ?? '');
  const [characterIds, setCharacterIds] = useState<Set<string>>(
    new Set(party.members.filter(m => !m.leftAt).map(m => m.characterId))
  );
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSave = async () => {
    setValidationError(null);

    if (!name.trim()) {
      setValidationError('Party name is required');
      return;
    }

    setSaving(true);
    try {
      await onSave(
        { ...party, name: name.trim(), description: description.trim(), campaignId: campaignId },
        Array.from(characterIds)
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleCharacter = (characterId: string) => {
    const newIds = new Set(characterIds);
    if (newIds.has(characterId)) {
      newIds.delete(characterId);
    } else {
      newIds.add(characterId);
    }
    setCharacterIds(newIds);
  };

  return (
    <EditorShell
      title={isNew ? 'Create Party' : 'Edit Party'}
      validationError={validationError}
      onSave={handleSave}
      onCancel={onCancel}
      saving={saving}
      canSave={!!name.trim()}
      saveLabel="Save Party"
    >
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <FormField label="Party Name" htmlFor="party-name">
          <input id="party-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
            className={textInputClass()} disabled={saving} placeholder="e.g., The Adventurers Guild" />
        </FormField>

        <FormField label="Description">
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
            className={textInputClass()} disabled={saving} placeholder="Optional party description" />
        </FormField>

        <FormField label="Campaign">
          <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)}
            className={textInputClass()} disabled={saving}>
            <option value="">None</option>
            {campaigns.map(campaign => (
              <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="mb-4">
        <label className="block mb-2 text-sm font-semibold">Party Members</label>
        {characters.length === 0 ? (
          <p className="text-gray-400 text-sm">No characters available. Create characters first.</p>
        ) : (
          <div className="space-y-4">
            {CHARACTER_TYPE_ORDER.map(type => {
              const label = CHARACTER_TYPE_LABELS[type];
              const group = characters.filter(c => getCharacterType(c.characterType) === type);
              if (group.length === 0) return null;
              return (
                <div key={type}>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1" aria-label={`Party section: ${label}`}>{label}</p>
                  <div className="grid md:grid-cols-2 gap-2">
                    {group.map(character => (
                      <label key={character.id} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={characterIds.has(character.id)}
                          onChange={() => toggleCharacter(character.id)} disabled={saving} className="cursor-pointer" />
                        <span className="text-sm">{character.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </EditorShell>
  );
}

export default function PartiesPage() {
  return (
    <ProtectedRoute>
      <PartiesContent />
    </ProtectedRoute>
  );
}
