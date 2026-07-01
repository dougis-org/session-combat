'use client';

import { useState } from 'react';
import { TextInputField, EditorShell } from '@/lib/components/ui';
import { Campaign } from '@/lib/types';

const generateId = () => crypto.randomUUID();


export function CampaignEditor({
  campaign,
  onSave,
  onCancel,
  isNew,
}: {
  campaign: Campaign;
  onSave: (campaign: Campaign) => void;
  onCancel: () => void;
  isNew: boolean;
}) {
  const [name, setName] = useState(campaign.name);
  const [moduleName, setModuleName] = useState(campaign.moduleName);
  const [status, setStatus] = useState(campaign.status ?? 'active');
  const [notes, setNotes] = useState(campaign.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [chapters, setChapters] = useState(() => {
    const initialChapters = campaign.chapters || [];
    return [...initialChapters]
      .sort((a, b) => a.order - b.order)
      .map((ch, i) => ({ ...ch, order: i }));
  });
  const [currentChapterId, setCurrentChapterId] = useState(campaign.currentChapterId);
  const [chaptersExpanded, setChaptersExpanded] = useState(!!campaign.chapters?.length);

  const handleAddChapter = () => {
    setChapters((prev) => [
      ...prev,
      {
        id: generateId(),
        title: '',
        order: prev.length,
      },
    ]);
  };

  const handleRemoveChapter = (index: number) => {
    const target = chapters[index];
    const filtered = chapters.filter((_, i) => i !== index);
    const updated = filtered.map((ch, i) => ({ ...ch, order: i }));
    setChapters(updated);
    if (target && target.id === currentChapterId) {
      setCurrentChapterId(undefined);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...chapters];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    
    const ordered = updated.map((ch, i) => ({ ...ch, order: i }));
    setChapters(ordered);
  };

  const handleMoveDown = (index: number) => {
    if (index === chapters.length - 1) return;
    const updated = [...chapters];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    
    const ordered = updated.map((ch, i) => ({ ...ch, order: i }));
    setChapters(ordered);
  };

  const handleTitleChange = (index: number, newTitle: string) => {
    const updated = chapters.map((ch, i) => (i === index ? { ...ch, title: newTitle } : ch));
    setChapters(updated);
  };

  const handleSave = async () => {
    setValidationError(null);
    if (!name.trim()) {
      setValidationError('Campaign name is required');
      return;
    }
    
    // Server/Save validation: verify currentChapterId actually exists in the chapters
    let finalCurrentChapterId = currentChapterId;
    if (finalCurrentChapterId && !chapters.some(ch => ch.id === finalCurrentChapterId)) {
      finalCurrentChapterId = undefined;
    }

    setSaving(true);
    try {
      await onSave({
        ...campaign,
        name: name.trim(),
        moduleName: moduleName.trim(),
        status,
        notes,
        chapters,
        currentChapterId: finalCurrentChapterId,
      });
    } finally {
      setSaving(false);
    }
  };

  const activeChapterIndex = chapters.findIndex((ch) => ch.id === currentChapterId);
  const activeChapter = activeChapterIndex >= 0 ? chapters[activeChapterIndex] : undefined;

  return (
    <EditorShell
      title={isNew ? 'Create Campaign' : 'Edit Campaign'}
      validationError={validationError}
      onSave={handleSave}
      onCancel={onCancel}
      saving={saving}
      canSave={!!name.trim()}
      saveLabel="Save Campaign"
    >
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <TextInputField label="Campaign Name *" value={name} onChange={setName}
          disabled={saving} placeholder="e.g., Curse of Strahd" />

        <TextInputField label="Module / Adventure" value={moduleName} onChange={setModuleName}
          disabled={saving} placeholder="e.g., Curse of Strahd" />
      </div>

      {/* Chapters Accordion Section */}
      <div className="mb-6 border border-gray-700/50 rounded-lg overflow-hidden bg-gray-900/30 backdrop-blur-sm transition-all duration-300">
        <button
          type="button"
          aria-expanded={chaptersExpanded}
          onClick={() => setChaptersExpanded(!chaptersExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/40 hover:bg-gray-800/60 text-gray-200 font-semibold text-sm transition-all duration-200 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            📖 Chapters ({chapters.length})
          </span>
          <span className="text-gray-400 text-xs transition-transform duration-300">
            {chaptersExpanded ? '▲' : '▼'}
          </span>
        </button>

        {chaptersExpanded && (
          <div className="p-4 border-t border-gray-800/50 space-y-4">
            {/* Active Chapter display (if chapters exist) */}
            {chapters.length > 0 ? (
              <div
                data-testid="current-chapter-display"
                className="mb-4 bg-gray-800/20 p-3 rounded-lg border border-gray-800/40"
              >
                <p className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Current Chapter
                </p>
                {activeChapter ? (
                  <p className="text-sm text-gray-200">
                    Ch. {activeChapterIndex + 1}: {activeChapter.title || 'Untitled Chapter'}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 italic">-- No active chapter --</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic py-2 text-center">
                No chapters defined
              </p>
            )}

            {/* Chapter rows list */}
            {chapters.length > 0 && (
              <div className="space-y-2">
                {chapters.map((ch, index) => (
                  <div
                    key={ch.id}
                    className="flex items-center gap-2 bg-gray-800/30 p-2 rounded-lg border border-gray-700/30 hover:border-gray-700/50 transition-all duration-200"
                  >
                    <span className="text-xs font-semibold text-gray-500 w-8 text-right select-none">
                      Ch. {index + 1}
                    </span>
                    <input
                      type="text"
                      data-testid="chapter-title-input"
                      aria-label={`Chapter ${index + 1} title`}
                      value={ch.title}
                      onChange={(e) => handleTitleChange(index, e.target.value)}
                      disabled={saving}
                      placeholder="e.g. Arrival at the Village"
                      className="flex-1 bg-gray-950 border border-gray-700 hover:border-gray-600 focus:border-blue-500 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none transition-all duration-200"
                    />

                    {ch.id === currentChapterId ? (
                      <button
                        type="button"
                        data-testid={`active-chapter-indicator-${ch.id}`}
                        title="Clear active chapter"
                        aria-label="Clear active chapter"
                        onClick={() => setCurrentChapterId(undefined)}
                        disabled={saving}
                        className="bg-green-900/40 text-green-400 border border-green-800/40 hover:bg-red-900/40 hover:text-red-400 hover:border-red-800/40 disabled:opacity-30 disabled:pointer-events-none text-xs rounded px-2 py-0.5 font-semibold transition-all cursor-pointer"
                      >
                        ACTIVE
                      </button>
                    ) : (
                      <button
                        type="button"
                        data-testid={`activate-chapter-${ch.id}`}
                        title="Mark as current chapter"
                        aria-label="Mark as current chapter"
                        onClick={() => setCurrentChapterId(ch.id)}
                        disabled={saving}
                        className="px-2 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:pointer-events-none text-xs rounded text-gray-300 transition-all cursor-pointer"
                      >
                        <span aria-hidden="true">🚩</span>
                      </button>
                    )}

                    {/* Move buttons */}
                    <div className="flex gap-1">
                      <button
                        type="button"
                        data-testid={`move-up-${index}`}
                        aria-label={`Move chapter ${index + 1} up`}
                        onClick={() => handleMoveUp(index)}
                        disabled={saving || index === 0}
                        className="px-2 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:pointer-events-none text-xs rounded text-gray-300 font-bold transition-all cursor-pointer"
                        title="Move Up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        data-testid={`move-down-${index}`}
                        aria-label={`Move chapter ${index + 1} down`}
                        onClick={() => handleMoveDown(index)}
                        disabled={saving || index === chapters.length - 1}
                        className="px-2 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:pointer-events-none text-xs rounded text-gray-300 font-bold transition-all cursor-pointer"
                        title="Move Down"
                      >
                        ▼
                      </button>
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      data-testid={`remove-chapter-${index}`}
                      aria-label={`Remove ${ch.title || `chapter ${index + 1}`}`}
                      onClick={() => handleRemoveChapter(index)}
                      disabled={saving}
                      className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/40 hover:border-red-800/60 text-xs rounded transition-all font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Chapter Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAddChapter}
                disabled={saving}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-blue-950/40 hover:bg-blue-900/60 text-blue-400 border border-blue-900/40 hover:border-blue-800/60 rounded text-sm font-semibold transition-all duration-200 hover:scale-[1.01] cursor-pointer"
              >
                + Add Chapter
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
          Status
        </label>
        <select
          data-testid="status-select"
          value={status}
          onChange={(e) => setStatus(e.target.value as Campaign['status'])}
          disabled={saving}
          className="w-full text-sm bg-gray-950 border border-gray-700 hover:border-gray-600 rounded px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
        >
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="on-hold">On Hold</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
          DM Notes
        </label>
        <textarea
          data-testid="notes-textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={saving}
          maxLength={10000}
          rows={6}
          placeholder="Current quests, NPC states, world events..."
          className="w-full text-sm bg-gray-950 border border-gray-700 hover:border-gray-600 focus:border-blue-500 rounded px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-y"
        />
        <p className="text-xs text-gray-500 text-right mt-1">{notes.length}/10000</p>
      </div>
    </EditorShell>
  );
}
