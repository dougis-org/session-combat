'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';
import { ErrorBanner, ValidationError } from '@/lib/components/ui';
import type { Encounter } from '@/lib/types';
import { EncounterCard } from '@/lib/components/EncounterCard';
import { EncounterEditor } from '@/app/encounters/EncounterEditor';
import { useIsDM } from '@/lib/hooks/useIsDM';

function unlinkConfirmMessage(name: string): string {
  return `Unlink "${name}" from the campaign? It will not be deleted and will remain available in the global Encounters list.`;
}

/** Extracts a server-supplied error message from a failed response, falling back when the body is missing or not JSON. */
async function extractErrorMessage(response: Response, fallback: string): Promise<string> {
  const data = await response.json().catch(() => ({}) as { error?: string });
  return data.error || fallback;
}

function EncountersManagementContent({ campaignId }: { campaignId: string }) {
  const { isDM } = useIsDM(campaignId);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEncounter, setEditingEncounter] = useState<Encounter | null>(null);

  const [isLinkingEncounter, setIsLinkingEncounter] = useState(false);
  const [owned, setOwned] = useState<Encounter[]>([]);
  const [ownedLoading, setOwnedLoading] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [linkingId, setLinkingId] = useState<string | null>(null);
  // Synchronous double-submit guard: `linkingId` state isn't visible until the next
  // render, so a second rapid click could slip through a state-only check. This ref
  // is set/read immediately inside handleLink instead.
  const linkingIdRef = useRef<string | null>(null);

  const [isCreatingEncounter, setIsCreatingEncounter] = useState(false);
  const [createWarning, setCreateWarning] = useState<string | null>(null);

  const fetchLinked = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`/api/campaigns/${encodeURIComponent(campaignId)}/encounters`);
      if (!response.ok) throw new Error(await extractErrorMessage(response, 'Failed to load linked encounters'));
      const data = await response.json();
      setEncounters(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load linked encounters';
      console.error('Failed to load linked encounters:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => { fetchLinked(); }, [fetchLinked]);

  async function openPicker() {
    setEditingEncounter(null);
    setIsCreatingEncounter(false);
    setIsLinkingEncounter(true);
    setPickerError(null);
    setSearch('');
    setOwned([]);
    setOwnedLoading(true);
    try {
      const response = await fetch('/api/encounters');
      if (!response.ok) throw new Error(await extractErrorMessage(response, 'Failed to load encounters'));
      const data = await response.json();
      setOwned(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load encounters';
      console.error('Failed to load encounters for picker:', err);
      setPickerError(message);
    } finally {
      setOwnedLoading(false);
    }
  }

  function closePicker() {
    setIsLinkingEncounter(false);
    setPickerError(null);
    setSearch('');
  }

  async function handleLink(encounter: Encounter) {
    if (linkingIdRef.current) return;
    linkingIdRef.current = encounter.id;
    setLinkingId(encounter.id);
    setPickerError(null);
    try {
      const response = await fetch(`/api/campaigns/${encodeURIComponent(campaignId)}/encounters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encounterId: encounter.id }),
      });
      if (!response.ok) throw new Error(await extractErrorMessage(response, 'Failed to link encounter'));
      await fetchLinked();
    } catch (err) {
      console.error('Failed to link encounter:', err);
      setPickerError(err instanceof Error ? err.message : 'Failed to link encounter');
    } finally {
      linkingIdRef.current = null;
      setLinkingId(null);
    }
  }

  async function handleCreateSave(encounter: Encounter) {
    setError(null);
    setCreateWarning(null);
    try {
      const response = await fetch('/api/encounters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: encounter.name,
          description: encounter.description,
          monsters: encounter.monsters,
          campaignId,
        }),
      });
      if (!response.ok) throw new Error(await extractErrorMessage(response, 'Failed to create encounter'));
      const data = await response.json();
      setIsCreatingEncounter(false);
      if (data.linkWarning) {
        setCreateWarning(data.linkWarning);
      }
      await fetchLinked();
    } catch (err) {
      console.error('Failed to create encounter:', err);
      setError(err instanceof Error ? err.message : 'Failed to create encounter');
    }
  }

  async function handleEditSave(encounter: Encounter) {
    setError(null);
    try {
      const response = await fetch(`/api/encounters/${encodeURIComponent(encounter.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: encounter.name,
          description: encounter.description,
          monsters: encounter.monsters,
        }),
      });
      if (!response.ok) throw new Error(await extractErrorMessage(response, 'Failed to save encounter'));
      setEditingEncounter(null);
      await fetchLinked();
    } catch (err) {
      console.error('Failed to save encounter:', err);
      setError(err instanceof Error ? err.message : 'Failed to save encounter');
    }
  }

  function startEditing(encounter: Encounter) {
    setEditingEncounter(encounter);
    setIsCreatingEncounter(false);
    closePicker();
  }

  function startCreating() {
    setCreateWarning(null);
    setEditingEncounter(null);
    closePicker();
    setIsCreatingEncounter(true);
  }

  async function handleUnlink(encounter: Encounter) {
    const confirmed = window.confirm(unlinkConfirmMessage(encounter.name));
    if (!confirmed) return;
    setError(null);
    try {
      const response = await fetch(
        `/api/campaigns/${encodeURIComponent(campaignId)}/encounters/${encodeURIComponent(encounter.id)}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error(await extractErrorMessage(response, 'Failed to unlink encounter'));
      await fetchLinked();
    } catch (err) {
      console.error('Failed to unlink encounter:', err);
      setError(err instanceof Error ? err.message : 'Failed to unlink encounter');
    }
  }

  const linkedIds = new Set(encounters.map(e => e.id));
  const unlinkedOwned = owned.filter(e => !linkedIds.has(e.id));
  // API responses are trusted but not schema-validated at this boundary; guard
  // against a malformed/missing name rather than letting toLowerCase() throw.
  const filteredOwned = unlinkedOwned.filter(e =>
    String(e.name ?? '').toLowerCase().includes(search.toLowerCase())
  );
  // These three states are mutually exclusive and cover every reason the picker
  // list could be empty: the user owns nothing at all, everything owned is already
  // linked, or a search term matches nothing. Each needs its own message so the
  // panel never renders as a silent blank list. All three are suppressed while
  // pickerError is set, since owned is also empty during/after a failed fetch and
  // showing "you have no encounters" alongside the error banner would contradict it.
  const ownsNoEncounters = !pickerError && owned.length === 0;
  const allOwnedAlreadyLinked = !pickerError && owned.length > 0 && unlinkedOwned.length === 0;
  const noSearchMatches = !pickerError && !ownsNoEncounters && !allOwnedAlreadyLinked && filteredOwned.length === 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Encounters</h1>
      </div>

      <ErrorBanner message={error} />

      {isDM && !isLinkingEncounter && !isCreatingEncounter && !editingEncounter && (
        <div className="flex gap-3 mb-6">
          <button
            onClick={openPicker}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
          >
            Link Existing Encounter
          </button>
          <button
            onClick={startCreating}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm"
          >
            Create New Encounter
          </button>
        </div>
      )}

      {createWarning && (
        <div className="p-4 bg-yellow-900 border border-yellow-700 rounded text-yellow-200 mb-6">
          {createWarning}
        </div>
      )}

      {isDM && isCreatingEncounter && (
        <EncounterEditor
          encounter={{
            id: '',
            userId: '',
            name: '',
            description: '',
            monsters: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          }}
          onSave={handleCreateSave}
          onCancel={() => setIsCreatingEncounter(false)}
          isNew={true}
        />
      )}

      {isDM && editingEncounter && (
        <EncounterEditor
          key={editingEncounter.id}
          encounter={editingEncounter}
          onSave={handleEditSave}
          onCancel={() => setEditingEncounter(null)}
          isNew={false}
        />
      )}

      {isDM && isLinkingEncounter && (
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border-2 border-blue-500">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Link Existing Encounter</h2>
            <button onClick={closePicker} className="bg-gray-600 hover:bg-gray-700 px-3 py-1.5 rounded text-sm">
              Cancel
            </button>
          </div>

          <ValidationError message={pickerError} />

          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search encounters..."
            aria-label="Search encounters"
            className="w-full bg-gray-700 rounded px-3 py-2 text-white mb-4"
          />

          {ownedLoading ? (
            <p className="text-gray-400">Loading…</p>
          ) : ownsNoEncounters ? (
            <p className="text-gray-400 text-center py-4">You don&apos;t have any encounters yet. Create one instead.</p>
          ) : allOwnedAlreadyLinked ? (
            <p className="text-gray-400 text-center py-4">All of your owned encounters are already linked.</p>
          ) : noSearchMatches ? (
            <p className="text-gray-400 text-center py-4">No encounters match your search.</p>
          ) : (
            <div className="space-y-2">
              {filteredOwned.map(encounter => (
                <div key={encounter.id} className="bg-gray-700 rounded p-3 flex justify-between items-center">
                  <span className="font-medium">{encounter.name}</span>
                  <button
                    onClick={() => handleLink(encounter)}
                    disabled={linkingId !== null}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-3 py-1 rounded text-sm"
                  >
                    {linkingId === encounter.id ? 'Linking…' : 'Link'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : encounters.length === 0 ? (
        <p className="text-gray-400 text-center py-12">
          No encounters linked yet. Link an existing encounter or create a new one to get started.
        </p>
      ) : (
        <div className="space-y-4">
          {encounters.map(encounter => (
            <EncounterCard
              key={encounter.id}
              encounter={encounter}
              actions={
                isDM ? (
                  <>
                    <button
                      onClick={() => startEditing(encounter)}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleUnlink(encounter)}
                      className="bg-red-700 hover:bg-red-800 px-3 py-1.5 rounded text-sm"
                    >
                      Unlink
                    </button>
                  </>
                ) : null
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CampaignEncountersPage() {
  const params = useParams<{ id: string }>();
  // This is a single dynamic segment ([id], not [...id]), so params.id is always a
  // string in practice; Array.isArray is defensive boilerplate consistent with how
  // Next.js types useParams for catch-all routes.
  const campaignId = Array.isArray(params.id) ? params.id[0] : params.id;

  if (!campaignId) return null;

  return (
    <ProtectedRoute>
      <EncountersManagementContent campaignId={campaignId} />
    </ProtectedRoute>
  );
}
