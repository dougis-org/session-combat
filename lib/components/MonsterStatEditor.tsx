'use client';

import { useId } from 'react';
import type { MonsterEditableFields } from '@/lib/types';
import { normalizeAlignment } from '@/lib/types';
import { CreatureStatsForm } from '@/lib/components/CreatureStatsForm';
import { AlignmentSelect } from '@/lib/components/AlignmentSelect';

// handles already-stored speed values (string or legacy object);
// differs from lib/import/transformMonster.ts:normalizeSpeed which processes raw API input
export function formatSpeedValue(speedValue: unknown): string {
  if (typeof speedValue === 'string') {
    return speedValue;
  }
  if (typeof speedValue === 'object' && speedValue !== null && !Array.isArray(speedValue)) {
    return Object.entries(speedValue as Record<string, string>)
      .map(([key, value]) => `${key} ${value}`)
      .join(', ');
  }
  return '30 ft.';
}

export function MonsterStatEditor({
  value,
  onChange,
  disabled = false,
}: {
  value: MonsterEditableFields;
  onChange: (value: MonsterEditableFields) => void;
  disabled?: boolean;
}) {
  const uid = useId();
  const fid = (suffix: string) => `${uid}-${suffix}`;

  const update = (patch: Partial<MonsterEditableFields>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="space-y-4">
      <div className="mb-6 pb-6 border-b border-gray-700">
        <h4 className="font-bold text-gray-300 mb-4">Basic Info</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor={fid('name')} className="block mb-1 text-sm font-bold">Name</label>
            <input
              id={fid('name')}
              type="text"
              value={value.name}
              onChange={e => update({ name: e.target.value })}
              className="w-full bg-gray-700 rounded px-3 py-2 text-white"
              disabled={disabled}
            />
          </div>

          <div>
            <label htmlFor={fid('size')} className="block mb-1 text-sm font-bold">Size</label>
            <select
              id={fid('size')}
              value={value.size}
              onChange={e => update({ size: e.target.value as MonsterEditableFields['size'] })}
              className="w-full bg-gray-700 rounded px-3 py-2 text-white"
              disabled={disabled}
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
            <label htmlFor={fid('type')} className="block mb-1 text-sm font-bold">Type</label>
            <input
              id={fid('type')}
              type="text"
              value={value.type}
              onChange={e => update({ type: e.target.value })}
              placeholder="e.g., humanoid, beast"
              className="w-full bg-gray-700 rounded px-3 py-2 text-white"
              disabled={disabled}
            />
          </div>

          <div>
            <AlignmentSelect
              value={value.alignment ?? ''}
              onChange={a => update({ alignment: normalizeAlignment(a) })}
              disabled={disabled}
              showExtendedAlignments
            />
          </div>

          <div>
            <label htmlFor={fid('speed')} className="block mb-1 text-sm font-bold">Speed</label>
            <input
              id={fid('speed')}
              type="text"
              value={value.speed}
              onChange={e => update({ speed: e.target.value })}
              placeholder="e.g., 30 ft., fly 60 ft."
              className="w-full bg-gray-700 rounded px-3 py-2 text-white"
              disabled={disabled}
            />
          </div>

          <div>
            <label htmlFor={fid('cr')} className="block mb-1 text-sm font-bold">Challenge Rating</label>
            <input
              id={fid('cr')}
              type="number"
              value={value.challengeRating}
              onChange={e => update({ challengeRating: parseFloat(e.target.value) || 0 })}
              className="w-full bg-gray-700 rounded px-3 py-2 text-white"
              disabled={disabled}
              step="0.125"
              min="0"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor={fid('source')} className="block mb-1 text-sm font-bold">Source</label>
            <input
              id={fid('source')}
              type="text"
              value={value.source ?? ''}
              onChange={e => update({ source: e.target.value || undefined })}
              placeholder="e.g., Monster Manual"
              className="w-full bg-gray-700 rounded px-3 py-2 text-white"
              disabled={disabled}
            />
          </div>

          <div className="md:col-span-3">
            <label htmlFor={fid('description')} className="block mb-1 text-sm font-bold">Description / Notes</label>
            <textarea
              id={fid('description')}
              value={value.description ?? ''}
              onChange={e => update({ description: e.target.value || undefined })}
              className="w-full bg-gray-700 rounded px-3 py-2 text-white"
              disabled={disabled}
              rows={2}
            />
          </div>
        </div>
      </div>

      <CreatureStatsForm
        stats={value}
        onChange={updatedStats => onChange({ ...value, ...updatedStats })}
      />
    </div>
  );
}
