'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';
import { ErrorBanner } from '@/lib/components/ui';
import type { SavedContent } from '@/lib/types';

const TYPE_LABELS: Record<SavedContent['type'], string> = {
  'npc': 'NPC',
  'location': 'Location',
  'shop': 'Shop',
  'magic-item': 'Magic Item',
  'room': 'Room',
};

const FILTER_TABS: Array<{ id: SavedContent['type'] | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'npc', label: 'NPC' },
  { id: 'location', label: 'Location' },
  { id: 'shop', label: 'Shop' },
  { id: 'magic-item', label: 'Magic Item' },
  { id: 'room', label: 'Room' },
];

function formatDate(dateStr: string | Date): string {
  return new Date(dateStr).toLocaleDateString();
}

function PromptSection({ label, text, muted }: { label: string; text: string; muted: boolean }) {
  return (
    <div>
      <p className={`text-xs font-semibold ${muted ? 'text-gray-500' : 'text-gray-300'} mb-1 uppercase tracking-wide`}>{label}</p>
      <pre className={`${muted ? 'text-gray-400' : 'text-gray-100'} font-mono text-sm whitespace-pre-wrap bg-gray-900 rounded p-3`}>{text}</pre>
    </div>
  );
}

function LabeledTextarea({ label, value, onChange, rows, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; rows: number; placeholder: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white resize-y"
        placeholder={placeholder}
      />
    </div>
  );
}

function ContentCard({ item, onDelete }: { item: SavedContent; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [result, setResult] = useState(item.result ?? '');
  const [notes, setNotes] = useState(item.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasSavedResult, setHasSavedResult] = useState(!!(item.result));
  const [actionError, setActionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  async function handleSave() {
    setSaving(true);
    setActionError(null);
    setSaveSuccess(false);
    try {
      const res = await fetch(`/api/content/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result, notes }),
      });
      if (!res.ok) throw new Error('Save failed');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setHasSavedResult(result !== '');
      setSaveSuccess(true);
      saveTimerRef.current = setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setActionError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setActionError(null);
    try {
      const res = await fetch(`/api/content/${item.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      onDelete(item.id);
    } catch {
      setActionError('Failed to delete. Please try again.');
    }
  }

  async function handleCopy() {
    if (!navigator?.clipboard) return;
    try {
      await navigator.clipboard.writeText(item.prompt);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      setCopied(true);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard write rejected
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 mb-3">
      <button
        className="w-full text-left p-4 flex items-center gap-3"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <span className="bg-indigo-700 text-indigo-100 text-xs px-2 py-0.5 rounded font-medium">
          {TYPE_LABELS[item.type]}
        </span>
        <span className="font-medium flex-1">{item.title}</span>
        {item.chapter && (
          <span className="text-gray-400 text-sm">{item.chapter}</span>
        )}
        <span className="text-gray-500 text-xs">{formatDate(item.createdAt)}</span>
        {hasSavedResult && (
          <span className="text-green-400 text-sm" title="Response saved">✓</span>
        )}
        <span className="text-gray-400 ml-2">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="p-4 border-t border-gray-700 space-y-4">
          <PromptSection label="System" text={item.systemPrompt} muted={true} />
          <PromptSection label="User" text={item.userMessage} muted={false} />

          <button
            onClick={handleCopy}
            className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded text-sm"
          >
            {copied ? 'Copied!' : 'Copy Full Prompt'}
          </button>

          <LabeledTextarea label="Response" value={result} onChange={setResult} rows={6} placeholder="Paste AI response here..." />
          <LabeledTextarea label="Notes" value={notes} onChange={setNotes} rows={3} placeholder="Add notes..." />

          {actionError && (
            <p className="text-red-400 text-sm">{actionError}</p>
          )}
          {saveSuccess && (
            <p className="text-green-400 text-sm">Saved successfully.</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-4 py-2 rounded text-sm"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-700 hover:bg-red-800 px-4 py-2 rounded text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LibraryContent({ campaignId }: { campaignId: string }) {
  const [items, setItems] = useState<SavedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<SavedContent['type'] | 'all'>('all');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch(`/api/content?campaignId=${campaignId}`);
        if (!res.ok) throw new Error('Failed to load library');
        const data = await res.json() as SavedContent[];
        if (active) setItems(data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load library');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [campaignId]);

  function handleDelete(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  const filtered = activeFilter === 'all' ? items : items.filter(i => i.type === activeFilter);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Content Library</h1>
          <Link href="/campaigns" className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm">
            Back to Campaigns
          </Link>
        </div>

        <ErrorBanner message={error} />

        {loading ? (
          <p className="text-gray-400">Loading…</p>
        ) : (
          <>
            <div className="flex gap-2 mb-6 flex-wrap">
              {FILTER_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${activeFilter === tab.id ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <p className="text-gray-400 text-center py-12">
                {items.length === 0
                  ? 'No saved content yet. Generate a prompt and save it to the library.'
                  : 'No items match the selected filter.'}
              </p>
            ) : (
              filtered.map(item => (
                <ContentCard key={item.id} item={item} onDelete={handleDelete} />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function LibraryPage() {
  const params = useParams();
  const campaignId = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <ProtectedRoute>
      <LibraryContent campaignId={campaignId as string} />
    </ProtectedRoute>
  );
}
