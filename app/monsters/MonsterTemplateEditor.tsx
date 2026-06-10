'use client';

import { useState } from 'react';
import type { MonsterTemplate } from '@/lib/types';
import { normalizeAlignment } from '@/lib/types';
import { CreatureStatsForm } from '@/lib/components/CreatureStatsForm';
import { AlignmentSelect } from '@/lib/components/AlignmentSelect';

// handles already-stored speed values (string or legacy object);
// differs from lib/import/transformMonster.ts:normalizeSpeed which processes raw API input
function formatSpeedValue(speedValue: unknown): string {
  if (typeof speedValue === 'string') {
    return speedValue;
  }
  if (typeof speedValue === 'object' && speedValue !== null) {
    return Object.entries(speedValue as Record<string, string>)
      .map(([key, value]) => `${key} ${value}`)
      .join(', ');
  }
  return '30 ft.';
}

export function MonsterTemplateEditor({
  template,
  onSave,
  onCancel,
  isNew,
  isGlobal,
}: {
  template: MonsterTemplate;
  onSave: (template: MonsterTemplate) => void;
  onCancel: () => void;
  isNew: boolean;
  isGlobal: boolean;
}) {
  const [name, setName] = useState(template.name);
  const [size, setSize] = useState(template.size);
  const [type, setType] = useState(template.type);
  const [alignment, setAlignment] = useState(
    normalizeAlignment(template.alignment) ?? '',
  );
  const [speed, setSpeed] = useState(formatSpeedValue(template.speed));
  const [challengeRating, setChallengeRating] = useState(template.challengeRating);
  const [source, setSource] = useState(template.source || '');
  const [description, setDescription] = useState(template.description || '');
  const [stats, setStats] = useState(template);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSave = async () => {
    setValidationError(null);

    if (!name.trim()) {
      setValidationError('Monster name is required');
      return;
    }

    if (stats.hp > stats.maxHp) {
      setValidationError('Current HP cannot be greater than Max HP');
      return;
    }

    setSaving(true);
    try {
      const updatedTemplate: MonsterTemplate = {
        ...stats,
        name,
        size,
        type,
        alignment: normalizeAlignment(alignment),
        speed,
        challengeRating: isNaN(challengeRating) ? 0 : challengeRating,
        source: source || undefined,
        description: description || undefined,
        updatedAt: new Date(),
      };
      await onSave(updatedTemplate);
    } finally {
      setSaving(false);
    }
  };

  const title = isGlobal ? 'Global Monster' : 'Personal Monster';

  return (
    <form
      onSubmit={e => { e.preventDefault(); handleSave(); }}
      className={`rounded-lg p-6 mb-6 border-2 ${isGlobal ? 'border-purple-500 bg-gray-800' : 'border-blue-500 bg-gray-800'}`}
    >
      <h3 className="text-2xl font-bold mb-4">{isNew ? `Create ${title}` : `Edit ${title}`}</h3>

      {validationError && (
        <div className="p-3 bg-red-900 border border-red-700 rounded text-red-200 mb-4">
          {validationError}
        </div>
      )}

      {/* Basic Monster Info */}
      <div className="mb-6 pb-6 border-b border-gray-700">
        <h4 className="font-bold text-gray-300 mb-4">Basic Info</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="mte-name" className="block mb-1 text-sm font-bold">Name</label>
            <input
              id="mte-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-gray-700 rounded px-3 py-2 text-white"
              disabled={saving}
            />
          </div>

          <div>
            <label htmlFor="mte-size" className="block mb-1 text-sm font-bold">Size</label>
            <select
              id="mte-size"
              value={size}
              onChange={e => setSize(e.target.value as MonsterTemplate['size'])}
              className="w-full bg-gray-700 rounded px-3 py-2 text-white"
              disabled={saving}
            >
              <option value="tiny">Tiny</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="huge">Huge</option>
              <option value="gargantuan">Gargantuan</option>
            </select>
          </div>

          <div>
            <label htmlFor="mte-type" className="block mb-1 text-sm font-bold">Type</label>
            <input
              id="mte-type"
              type="text"
              value={type}
              onChange={e => setType(e.target.value)}
              placeholder="e.g., humanoid, beast"
              className="w-full bg-gray-700 rounded px-3 py-2 text-white"
              disabled={saving}
            />
          </div>

          <div>
            <AlignmentSelect value={alignment} onChange={setAlignment} disabled={saving} showExtendedAlignments />
          </div>

          <div>
            <label htmlFor="mte-speed" className="block mb-1 text-sm font-bold">Speed</label>
            <input
              id="mte-speed"
              type="text"
              value={speed}
              onChange={e => setSpeed(e.target.value)}
              placeholder="e.g., 30 ft., fly 60 ft."
              className="w-full bg-gray-700 rounded px-3 py-2 text-white"
              disabled={saving}
            />
          </div>

          <div>
            <label htmlFor="mte-cr" className="block mb-1 text-sm font-bold">Challenge Rating</label>
            <input
              id="mte-cr"
              type="number"
              value={challengeRating}
              onChange={e => setChallengeRating(parseFloat(e.target.value))}
              className="w-full bg-gray-700 rounded px-3 py-2 text-white"
              disabled={saving}
              step="0.125"
              min="0"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="mte-source" className="block mb-1 text-sm font-bold">Source</label>
            <input
              id="mte-source"
              type="text"
              value={source}
              onChange={e => setSource(e.target.value)}
              placeholder="e.g., Monster Manual"
              className="w-full bg-gray-700 rounded px-3 py-2 text-white"
              disabled={saving}
            />
          </div>

          <div className="md:col-span-3">
            <label htmlFor="mte-description" className="block mb-1 text-sm font-bold">Description / Notes</label>
            <textarea
              id="mte-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-gray-700 rounded px-3 py-2 text-white"
              disabled={saving}
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Creature Stats */}
      <CreatureStatsForm stats={stats} onChange={(updatedStats) => setStats(prev => ({ ...prev, ...updatedStats }))} />

      <div className="flex gap-2 mt-6">
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className={`hover:opacity-80 disabled:opacity-50 px-4 py-2 rounded ${isGlobal ? 'bg-purple-600' : 'bg-green-600'}`}
        >
          {saving ? 'Saving...' : `Save ${title}`}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 px-4 py-2 rounded"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
