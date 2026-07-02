'use client';

import { useState } from 'react';
import { TextInputField, EditorShell } from '@/lib/components/ui';
import { Campaign } from '@/lib/types';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableChapterRowProps {
  id: string;
  ch: { id: string; title: string; order: number };
  index: number;
  currentChapterId: string | undefined;
  saving: boolean;
  onTitleChange: (index: number, newTitle: string) => void;
  onSelectCurrent: (id: string | undefined) => void;
  onRemove: (index: number) => void;
}

function SortableChapterRow({
  id,
  ch,
  index,
  currentChapterId,
  saving,
  onTitleChange,
  onSelectCurrent,
  onRemove,
}: SortableChapterRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 bg-gray-800/30 p-2 rounded-lg border border-gray-700/30 hover:border-gray-700/50 transition-all duration-200 ${
        isDragging ? 'opacity-50 shadow-lg border-blue-500/50 bg-gray-800/60 z-50' : ''
      }`}
    >
      <span
        {...attributes}
        {...listeners}
        tabIndex={saving ? -1 : 0}
        data-testid={`drag-handle-${index}`}
        title="Drag to reorder"
        aria-label="Drag to reorder"
        className={`inline-flex items-center justify-center w-6 h-6 cursor-grab select-none text-gray-500 hover:text-gray-300 focus:text-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded text-lg ${
          saving ? 'pointer-events-none opacity-50' : ''
        }`}
      >
        ⠿
      </span>

      <span className="text-xs font-semibold text-gray-500 w-8 text-right select-none">
        Ch. {index + 1}
      </span>
      <input
        type="text"
        data-testid="chapter-title-input"
        aria-label={`Chapter ${index + 1} title`}
        value={ch.title}
        onChange={(e) => onTitleChange(index, e.target.value)}
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
          onClick={() => onSelectCurrent(undefined)}
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
          onClick={() => onSelectCurrent(ch.id)}
          disabled={saving}
          className="px-2 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:pointer-events-none text-xs rounded text-gray-300 transition-all cursor-pointer"
        >
          <span aria-hidden="true">🚩</span>
        </button>
      )}

      {/* Remove button */}
      <button
        type="button"
        data-testid={`remove-chapter-${index}`}
        aria-label={`Remove ${ch.title || `chapter ${index + 1}`}`}
        onClick={() => onRemove(index)}
        disabled={saving}
        className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/40 hover:border-red-800/60 text-xs rounded transition-all font-semibold cursor-pointer"
      >
        Remove
      </button>
    </div>
  );
}

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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setChapters((prev) => {
        const oldIndex = prev.findIndex((ch) => ch.id === active.id);
        const newIndex = prev.findIndex((ch) => ch.id === over.id);
        const reordered = arrayMove(prev, oldIndex, newIndex);
        return reordered.map((ch, i) => ({ ...ch, order: i }));
      });
    }
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
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={chapters.map((ch) => ch.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {chapters.map((ch, index) => (
                      <SortableChapterRow
                        key={ch.id}
                        id={ch.id}
                        ch={ch}
                        index={index}
                        currentChapterId={currentChapterId}
                        saving={saving}
                        onTitleChange={handleTitleChange}
                        onSelectCurrent={setCurrentChapterId}
                        onRemove={handleRemoveChapter}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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
