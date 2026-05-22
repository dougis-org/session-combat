'use client';

import { useState } from 'react';
import { TextInputField, EditorShell } from '@/lib/components/ui';
import { Campaign } from '@/lib/types';

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
  const [active, setActive] = useState(campaign.active);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Chapters & Active Chapter States
  const [chapters, setChapters] = useState(campaign.chapters || []);
  const [currentChapterId, setCurrentChapterId] = useState(campaign.currentChapterId);
  const [chaptersExpanded, setChaptersExpanded] = useState(!!campaign.chapters?.length);

  const generateId = () => {
    if (typeof crypto !== 'undefined') {
      if (crypto.randomUUID) {
        return crypto.randomUUID();
      }
      if (crypto.getRandomValues) {
        const array = new Uint32Array(4);
        crypto.getRandomValues(array);
        return 'ch-' + Array.from(array).map(n => n.toString(36)).join('-');
      }
    }
    // Safe fallback that avoids Math.random()
    return 'ch-' + Date.now().toString(36) + '-' + Math.floor(Date.now() / 1000).toString(36);
  };

  const handleAddChapter = () => {
    const newChapter = {
      id: generateId(),
      title: '',
      order: chapters.length,
    };
    setChapters([...chapters, newChapter]);
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
        active,
        chapters,
        currentChapterId: finalCurrentChapterId,
      });
    } finally {
      setSaving(false);
    }
  };

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
            {/* Active Chapter dropdown picker (if chapters exist) */}
            {chapters.length > 0 ? (
              <div className="mb-4 bg-gray-800/20 p-3 rounded-lg border border-gray-800/40">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Current Chapter
                </label>
                <select
                  data-testid="current-chapter-select"
                  value={currentChapterId || ''}
                  onChange={(e) => setCurrentChapterId(e.target.value || undefined)}
                  disabled={saving}
                  className="w-full text-sm bg-gray-950 border border-gray-700 hover:border-gray-600 rounded px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                >
                  <option value="">-- No Active Chapter --</option>
                  {chapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      Ch. {ch.order + 1}: {ch.title || 'Untitled Chapter'}
                    </option>
                  ))}
                </select>
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
                      value={ch.title}
                      onChange={(e) => handleTitleChange(index, e.target.value)}
                      disabled={saving}
                      placeholder="e.g. Arrival at the Village"
                      className="flex-1 bg-gray-950 border border-gray-700 hover:border-gray-600 focus:border-blue-500 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none transition-all duration-200"
                    />

                    {/* Move buttons */}
                    <div className="flex gap-1">
                      <button
                        type="button"
                        data-testid={`move-up-${index}`}
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
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)}
            disabled={saving} className="cursor-pointer" />
          <span className="text-sm font-semibold">Active</span>
        </label>
      </div>
    </EditorShell>
  );
}
