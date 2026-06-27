'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';
import { ErrorBanner, LoadingState } from '@/lib/components/ui';
import { Campaign, CampaignTemplate, Party, Character, SessionLog, getCharacterType } from '@/lib/types';
import { CampaignEditor } from './CampaignEditor';
import { CharacterRosterCard } from '@/lib/components/CharacterRosterCard';
import { CampaignChapterInfo } from '@/lib/components/CampaignChapterInfo';

function ManagementChapterInfo({ campaign }: { campaign: Campaign }) {
  const currentCh = campaign.currentChapterId
    ? campaign.chapters?.find((ch) => ch.id === campaign.currentChapterId)
    : undefined;
  if (currentCh) {
    return (
      <p className="text-blue-400 text-xs font-semibold mt-1">
        📖 Current Chapter: Ch. {currentCh.order + 1}: {currentCh.title || 'Untitled Chapter'}
      </p>
    );
  }
  if (campaign.chapters && campaign.chapters.length > 0) {
    return (
      <p className="text-gray-500 text-xs mt-1">
        {campaign.chapters.length} chapter{campaign.chapters.length !== 1 ? 's' : ''}
      </p>
    );
  }
  return null;
}

function statusBadgeClass(status: Campaign['status'] | undefined): string {
  switch (status) {
    case 'planning': return 'bg-slate-600';
    case 'active': return 'bg-green-700';
    case 'on-hold': return 'bg-yellow-600';
    case 'completed': return 'bg-gray-600';
    default: return 'bg-green-700';
  }
}

function statusLabel(status: Campaign['status'] | undefined): string {
  switch (status) {
    case 'planning': return 'Planning';
    case 'active': return 'Active';
    case 'on-hold': return 'On Hold';
    case 'completed': return 'Completed';
    default: return 'Active';
  }
}

export function CampaignsContent() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [sessionsByCampaign, setSessionsByCampaign] = useState<Record<string, SessionLog | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [copyingIds, setCopyingIds] = useState<Set<string>>(new Set());
  const [copyError, setCopyError] = useState<Record<string, string>>({});
  const [catalogSearch, setCatalogSearch] = useState('');

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      setCatalogLoading(true);
      setCatalogError(null);

      const [campRes, partyRes, charRes, globalRes] = await Promise.all([
        fetch('/api/campaigns'),
        fetch('/api/parties'),
        fetch('/api/characters'),
        fetch('/api/campaigns/global'),
      ]);

      if (!campRes.ok) throw new Error('Failed to fetch campaigns');
      setCampaigns((await campRes.json()) || []);

      if (partyRes.ok) setParties((await partyRes.json()) || []);
      if (charRes.ok) setCharacters((await charRes.json()) || []);

      if (globalRes.ok) {
        setTemplates((await globalRes.json()) || []);
      } else {
        setCatalogError('Failed to load campaign catalog');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    const activeCampaigns = campaigns.filter(c => (c.status ?? 'active') === 'active');
    if (activeCampaigns.length === 0) return;

    const controller = new AbortController();

    const fetchSessions = async () => {
      const results = await Promise.all(
        activeCampaigns.map(async (campaign) => {
          try {
            const res = await fetch(`/api/campaigns/${campaign.id}/sessions?limit=1`, { signal: controller.signal });
            if (!res.ok) return [campaign.id, null] as const;
            const data: SessionLog[] = await res.json();
            return [campaign.id, data[0] ?? null] as const;
          } catch {
            return [campaign.id, null] as const;
          }
        })
      );
      if (!controller.signal.aborted) {
        setSessionsByCampaign(Object.fromEntries(results));
      }
    };

    fetchSessions();
    return () => controller.abort();
  }, [campaigns]);

  const copyTemplate = async (templateId: string) => {
    setCopyingIds((prev) => new Set(prev).add(templateId));
    setCopyError(({ [templateId]: _, ...rest }) => rest);
    try {
      const res = await fetch(`/api/campaigns/global/${templateId}/copy`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to copy campaign');
      }
      await loadAll();
    } catch (err) {
      setCopyError((prev) => ({ ...prev, [templateId]: err instanceof Error ? err.message : 'Failed to copy campaign' }));
    } finally {
      setCopyingIds((prev) => { const next = new Set(prev); next.delete(templateId); return next; });
    }
  };

  const addCampaign = () => {
    setEditingCampaign({
      id: '',
      userId: '',
      name: '',
      moduleName: '',
      chapters: [],
      status: 'active',
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    setIsAdding(true);
  };

  const saveCampaign = async (campaign: Campaign) => {
    try {
      setError(null);
      const url = isAdding ? '/api/campaigns' : `/api/campaigns/${campaign.id}`;
      const method = isAdding ? 'POST' : 'PATCH';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaign),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save campaign');
      }
      await loadAll();
      setIsAdding(false);
      setEditingCampaign(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save campaign');
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    try {
      setError(null);
      const response = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete campaign');
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete campaign');
    }
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingCampaign(null);
  };

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const filteredTemplates = templates.filter(t => t.name.toLowerCase().includes(catalogSearch.trim().toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Campaigns</h1>
        </div>

        <ErrorBanner message={error} />

        {/* Active Campaigns Dashboard */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Active Campaigns</h2>
          {activeCampaigns.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <p className="text-gray-400 mb-2">
                No active campaigns — set one to Active or create a new one.
              </p>
              <a href="#campaigns-list" className="text-blue-400 hover:text-blue-300 text-sm">
                Go to campaign list ↓
              </a>
            </div>
          ) : (
            <div className="space-y-6">
              {activeCampaigns.map(campaign => {
                const linkedParties = parties.filter(p => p.campaignId === campaign.id);
                const lastSession = sessionsByCampaign[campaign.id];

                return (
                  <div key={campaign.id} className="bg-gray-800 rounded-lg p-6">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-xl font-bold min-w-0 truncate">{campaign.name}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded text-white flex-shrink-0 ${statusBadgeClass(campaign.status)}`}>
                        {statusLabel(campaign.status)}
                      </span>
                    </div>
                    {campaign.moduleName && (
                      <p className="text-gray-400 text-sm">{campaign.moduleName}</p>
                    )}
                    <CampaignChapterInfo
                      chapters={campaign.chapters || []}
                      currentChapterId={campaign.currentChapterId}
                    />
                    <div className="flex flex-wrap gap-2 mt-3 mb-4">
                      <Link
                        href={`/campaigns/${campaign.id}`}
                        className="bg-teal-600 hover:bg-teal-700 px-3 py-1 rounded text-sm"
                      >
                        Members
                      </Link>
                      <Link
                        href={`/campaigns/${campaign.id}/prompts`}
                        className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm"
                      >
                        Prompt Builder
                      </Link>
                      <Link
                        href={`/campaigns/${campaign.id}/library`}
                        className="bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded text-sm"
                      >
                        Library
                      </Link>
                      <Link
                        href={`/campaigns/${campaign.id}/sessions`}
                        className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                      >
                        Session Log
                      </Link>
                      <Link
                        href="/encounters"
                        className="bg-orange-600 hover:bg-orange-700 px-3 py-1 rounded text-sm"
                      >
                        Start Encounter
                      </Link>
                    </div>

                    {lastSession ? (
                      <div className="bg-gray-700 rounded p-3 mb-4">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            Session {lastSession.sessionNumber}{lastSession.title ? ` — ${lastSession.title}` : ''}
                          </p>
                          {lastSession.milestone && (
                            <span className="bg-yellow-600 text-yellow-100 text-xs px-2 py-0.5 rounded">Milestone</span>
                          )}
                        </div>
                        <p className="text-gray-400 text-xs mt-1">{new Date(lastSession.datePlayed).toLocaleDateString()}</p>
                        <Link href={`/campaigns/${campaign.id}/sessions`} className="text-blue-400 text-xs hover:underline mt-1 inline-block">View all sessions →</Link>
                      </div>
                    ) : (
                      <div className="bg-gray-700 rounded p-3 mb-4">
                        <p className="text-sm text-gray-400">No sessions logged yet.</p>
                        <Link href={`/campaigns/${campaign.id}/sessions`} className="text-blue-400 text-xs hover:underline mt-1 inline-block">Log First Session →</Link>
                      </div>
                    )}

                    {campaign.notes?.trim() && (
                      <div className="bg-gray-700 rounded p-3 mb-4" data-testid="dm-notes-snippet">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">DM Notes</p>
                        <p className="text-sm text-gray-200 whitespace-pre-line line-clamp-4">
                          {campaign.notes.trim()}
                        </p>
                        <button
                          onClick={() => { setEditingCampaign(campaign); setIsAdding(false); }}
                          className="text-blue-400 text-xs hover:underline mt-1 inline-block"
                        >
                          Edit notes →
                        </button>
                      </div>
                    )}

                    {linkedParties.length === 0 ? (
                      <div className="bg-gray-700 rounded p-4 text-center">
                        <p className="text-gray-400 text-sm">
                          No party linked —{' '}
                          <Link href="/parties" className="text-blue-400 hover:underline">
                            add one in Parties
                          </Link>
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {linkedParties.map(party => {
                          const activeMembers = party.members.filter(m => !m.leftAt);
                          const resolvedMembers = activeMembers
                            .map(m => characters.find(c => c.id === m.characterId))
                            .filter((c): c is Character => !!c);

                          const pcs = resolvedMembers.filter(
                            c => getCharacterType(c.characterType) === 'character'
                          );
                          const npcs = resolvedMembers.filter(
                            c => getCharacterType(c.characterType) !== 'character'
                          );

                          return (
                            <div key={party.id} className="bg-gray-700 rounded-lg p-4">
                              <h4 className="font-semibold mb-3">{party.name}</h4>

                              {pcs.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">
                                    Player Characters
                                  </p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {pcs.map(c => (
                                      <CharacterRosterCard
                                        key={c.id}
                                        name={c.name}
                                        race={c.race}
                                        characterType={c.characterType}
                                        classes={c.classes}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}

                              {npcs.length > 0 && (
                                <div>
                                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">
                                    Travelling NPCs & Companions
                                  </p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {npcs.map(c => (
                                      <CharacterRosterCard
                                        key={c.id}
                                        name={c.name}
                                        race={c.race}
                                        characterType={c.characterType}
                                        classes={c.classes}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button
          onClick={addCampaign}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded mb-6"
        >
          New Campaign
        </button>

        {editingCampaign && (
          <CampaignEditor
            key={editingCampaign.id || 'new'}
            campaign={editingCampaign}
            onSave={saveCampaign}
            onCancel={cancelEdit}
            isNew={isAdding}
          />
        )}

        <div id="campaigns-list">
          {loading ? (
            <LoadingState label="Loading campaigns..." />
          ) : campaigns.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg mb-4">No campaigns yet.</p>
              <button
                onClick={addCampaign}
                className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded text-lg font-semibold"
              >
                New Campaign
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {campaigns.map(campaign => (
                <div key={campaign.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-xl font-bold min-w-0 truncate">{campaign.name}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded text-white flex-shrink-0 ${statusBadgeClass(campaign.status)}`}>
                      {statusLabel(campaign.status)}
                    </span>
                  </div>
                  {campaign.moduleName && (
                    <p className="text-gray-400 text-sm">{campaign.moduleName}</p>
                  )}
                  <ManagementChapterInfo campaign={campaign} />
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Link
                      href={`/campaigns/${campaign.id}`}
                      className="bg-teal-600 hover:bg-teal-700 px-3 py-1 rounded text-sm"
                    >
                      Members
                    </Link>
                    <Link
                      href={`/campaigns/${campaign.id}/sessions`}
                      className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm"
                    >
                      Session Log
                    </Link>
                    <button
                      type="button"
                      onClick={() => { setEditingCampaign(campaign); setIsAdding(false); }}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCampaign(campaign.id)}
                      className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Campaign Catalog</h2>
          {catalogLoading ? (
            <LoadingState label="Loading campaign catalog..." />
          ) : catalogError ? (
            <p className="text-red-400 text-sm">{catalogError}</p>
          ) : templates.length === 0 ? (
            <p className="text-gray-400">No campaign templates available yet.</p>
          ) : (
            <>
              <input
                type="text"
                aria-label="Search templates"
                placeholder="Search templates..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full md:w-80 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm mb-4 focus:outline-none focus:border-blue-500"
              />
              {filteredTemplates.length === 0 && catalogSearch ? (
                <p className="text-gray-400">No templates match your search.</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {filteredTemplates.map((template) => (
                    <div key={template.id} className="bg-gray-800 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">{template.name}</h3>
                          {template.moduleName && (
                            <p className="text-gray-400 text-sm">{template.moduleName}</p>
                          )}
                          <p className="text-gray-500 text-xs mt-1">
                            {template.chapters.length} chapter{template.chapters.length !== 1 ? 's' : ''}
                          </p>
                          {copyError[template.id] && (
                            <p className="text-red-400 text-xs mt-1">{copyError[template.id]}</p>
                          )}
                        </div>
                        <button
                          onClick={() => copyTemplate(template.id)}
                          disabled={copyingIds.has(template.id)}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-3 py-1 rounded text-sm ml-4"
                        >
                          {copyingIds.has(template.id) ? 'Copying...' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  return (
    <ProtectedRoute>
      <CampaignsContent />
    </ProtectedRoute>
  );
}
