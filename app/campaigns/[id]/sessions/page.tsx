'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';
import { ErrorBanner, LoadingState, FormField, textInputClass } from '@/lib/components/ui';
import { SessionLog, SessionEvent, PartyMember } from '@/lib/types';
import { useCampaignContext } from '@/lib/hooks/useCampaignContext';
import { buildNpcEventsFromMemberChanges } from '@/lib/utils/sessionEvents';

function formatDate(d: Date | string): string {
  const date = typeof d === 'string'
    ? (d.includes('T') ? new Date(d) : new Date(d + 'T12:00:00'))
    : d;
  if (isNaN(date.getTime())) {
    return typeof d === 'string' ? d : '';
  }
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function SessionEntryCard({
  log,
  onEdit,
  onDelete,
}: {
  log: SessionLog;
  onEdit: (log: SessionLog) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-start">
        <button
          className="flex-1 text-left"
          onClick={() => setExpanded(e => !e)}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-400 text-sm font-mono">#{log.sessionNumber}</span>
            <span className="font-semibold">{log.title || 'Untitled Session'}</span>
            <span className="text-gray-400 text-sm">{formatDate(log.datePlayed)}</span>
            {log.milestone && (
              <span className="bg-yellow-700 text-yellow-100 text-xs px-2 py-0.5 rounded">
                Level {log.newLevel && log.newLevel > 0 ? log.newLevel : 'Up'}
              </span>
            )}
          </div>
        </button>
        <div className="flex gap-2 ml-2">
          <button
            onClick={() => onEdit(log)}
            className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(log.id)}
            className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
          >
            Delete
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2">
          {log.summary && (
            <p className="text-gray-300 text-sm whitespace-pre-wrap">{log.summary}</p>
          )}
          {log.events.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Events</p>
              <ul className="space-y-1">
                {log.events.map((e, i) => (
                  <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                    <span className="text-gray-500 capitalize">[{e.type.replace('_', ' ')}]</span>
                    <span>{e.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SessionForm({
  campaignId,
  existing,
  allMembers,
  hasParty,
  lastSessionDate,
  sinceCombatDate,
  nextSessionNumber,
  onSave,
  onCancel,
}: {
  campaignId: string;
  existing?: SessionLog;
  allMembers: PartyMember[];
  hasParty: boolean;
  lastSessionDate: Date | null;
  sinceCombatDate: Date | null;
  nextSessionNumber: number;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [sessionNumber, setSessionNumber] = useState(existing?.sessionNumber ?? nextSessionNumber);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [datePlayed, setDatePlayed] = useState(
    existing ? new Date(existing.datePlayed).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [summary, setSummary] = useState(existing?.summary ?? '');
  const [events, setEvents] = useState<SessionEvent[]>(existing?.events ?? []);
  const [milestone, setMilestone] = useState(existing?.milestone ?? false);
  const [newLevel, setNewLevel] = useState<string>(existing?.newLevel?.toString() ?? '');
  const [customEventText, setCustomEventText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) return;
    const npcEvents = hasParty ? buildNpcEventsFromMemberChanges(allMembers, lastSessionDate) : [];
    if (!sinceCombatDate) {
      setEvents(npcEvents);
      return;
    }
    const since = sinceCombatDate.toISOString();
    fetch(`/api/campaigns/${campaignId}/combat-events?since=${encodeURIComponent(since)}`)
      .then(res => res.ok ? res.json() : [])
      .catch(() => [])
      .then((combatEvents: SessionEvent[]) => {
        setEvents([...npcEvents, ...combatEvents]);
      });
  }, [allMembers, hasParty, lastSessionDate, sinceCombatDate, campaignId, existing]);

  const removeEvent = (index: number) => {
    setEvents(ev => ev.filter((_, i) => i !== index));
  };

  const addCustomEvent = () => {
    if (!customEventText.trim()) return;
    setEvents(ev => [...ev, { type: 'custom', description: customEventText.trim() }]);
    setCustomEventText('');
  };

  const handleSave = async () => {
    if (!datePlayed) {
      setError('Date played is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const url = existing
        ? `/api/campaigns/${campaignId}/sessions/${existing.id}`
        : `/api/campaigns/${campaignId}/sessions`;
      const method = existing ? 'PATCH' : 'POST';
      const body: Record<string, unknown> = {
        sessionNumber,
        title: title.trim() || undefined,
        datePlayed,
        summary: summary.trim() || undefined,
        events,
        milestone,
        ...(milestone && newLevel ? { newLevel: parseInt(newLevel, 10) } : {}),
      };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save session');
      }
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save session');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <h2 className="text-lg font-semibold mb-4">{existing ? 'Edit Session' : 'New Session'}</h2>
      <ErrorBanner message={error} />
      {!hasParty && !existing && (
        <p className="text-yellow-400 text-sm mb-3">No linked party found for this campaign.</p>
      )}

      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <FormField label="Session #" htmlFor="session-number">
          <input
            id="session-number"
            type="number"
            value={sessionNumber}
            onChange={e => { const v = parseInt(e.target.value, 10); setSessionNumber(isNaN(v) ? 0 : v); }}
            className={textInputClass()}
            disabled={saving}
            min={1}
          />
        </FormField>
        <FormField label="Date Played" htmlFor="date-played">
          <input
            id="date-played"
            type="date"
            value={datePlayed}
            onChange={e => setDatePlayed(e.target.value)}
            className={textInputClass()}
            disabled={saving}
          />
        </FormField>
        <FormField label="Title" htmlFor="session-title">
          <input
            id="session-title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className={textInputClass()}
            disabled={saving}
            placeholder="Optional session title"
          />
        </FormField>
      </div>

      <FormField label="Summary" htmlFor="session-summary">
        <textarea
          id="session-summary"
          value={summary}
          onChange={e => setSummary(e.target.value)}
          rows={4}
          className={textInputClass() + ' resize-y'}
          disabled={saving}
          placeholder="What happened this session? Include: key NPCs encountered, decisions made, plot threads advanced, combat outcomes."
        />
      </FormField>

      <div className="mb-4">
        <p className="text-sm font-semibold mb-2">Events</p>
        {events.length === 0 && (
          <p className="text-gray-400 text-sm mb-2">No events. Add custom events below.</p>
        )}
        <ul className="space-y-1 mb-2">
          {events.map((e, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span className="text-gray-400 capitalize">[{e.type.replace('_', ' ')}]</span>
              <span className="flex-1 text-gray-300">{e.description}</span>
              <button
                onClick={() => removeEvent(i)}
                className="text-red-400 hover:text-red-300 text-xs"
                disabled={saving}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            type="text"
            value={customEventText}
            onChange={e => setCustomEventText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustomEvent()}
            placeholder="Add a custom event..."
            className={textInputClass() + ' flex-1'}
            disabled={saving}
          />
          <button
            onClick={addCustomEvent}
            className="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-sm"
            disabled={saving}
          >
            + Add
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={milestone}
            onChange={e => setMilestone(e.target.checked)}
            disabled={saving}
          />
          <span className="text-sm">Milestone level-up this session?</span>
        </label>
        {milestone && (
          <div className="flex items-center gap-2">
            <label className="text-sm" htmlFor="new-level">New Level:</label>
            <input
              id="new-level"
              type="number"
              value={newLevel}
              onChange={e => setNewLevel(e.target.value)}
              className={textInputClass() + ' w-20'}
              disabled={saving}
              min={1}
              max={20}
            />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving || !datePlayed}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded text-sm"
        >
          {saving ? 'Saving...' : 'Save Session'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function SessionsContent({ campaignId }: { campaignId: string }) {
  const [logs, setLogs] = useState<SessionLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState<SessionLog | null>(null);

  const { context, loading: contextLoading, error: contextError } = useCampaignContext(campaignId);

  const fetchLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      setLogsError(null);
      const res = await fetch(`/api/campaigns/${campaignId}/sessions`);
      if (!res.ok) throw new Error('Failed to fetch session logs');
      setLogs(await res.json());
    } catch (err) {
      setLogsError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLogsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const loading = logsLoading || contextLoading;
  const error = logsError ?? contextError;

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this session log?')) return;
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/sessions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete session log');
      await fetchLogs();
    } catch (err) {
      setLogsError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleSaved = async () => {
    setShowForm(false);
    setEditingLog(null);
    await fetchLogs();
  };

  const lastSessionDate = logs.length > 0
    ? new Date(logs[0].datePlayed)
    : null;
  const nextSessionNumber = logs.length > 0
    ? logs[0].sessionNumber + 1
    : 1;
  const sinceCombatDate = lastSessionDate ?? (context?.campaign?.createdAt ? new Date(context.campaign.createdAt) : null);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Session Journal</h1>
          <Link href="/campaigns" className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm">
            Back to Campaigns
          </Link>
        </div>

        <ErrorBanner message={error} />

        {!showForm && !editingLog && (
          <button
            onClick={() => setShowForm(true)}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded mb-6"
          >
            + New Session
          </button>
        )}

        {(showForm || editingLog) && (
          <SessionForm
            campaignId={campaignId}
            existing={editingLog ?? undefined}
            allMembers={context?.allMembers ?? []}
            hasParty={(context?.parties.length ?? 0) > 0}
            lastSessionDate={lastSessionDate}
            sinceCombatDate={sinceCombatDate}
            nextSessionNumber={nextSessionNumber}
            onSave={handleSaved}
            onCancel={() => { setShowForm(false); setEditingLog(null); }}
          />
        )}

        {loading ? (
          <LoadingState label="Loading session logs..." />
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-2">No sessions logged yet.</p>
            <p className="text-sm">Add your first session above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map(log => (
              <SessionEntryCard
                key={log.id}
                log={log}
                onEdit={l => { setEditingLog(l); setShowForm(false); }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SessionsPage() {
  const params = useParams();
  const campaignId = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <ProtectedRoute>
      <SessionsContent campaignId={campaignId as string} />
    </ProtectedRoute>
  );
}
