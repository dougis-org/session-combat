'use client';

import { useState } from 'react';
import type { MonsterTemplate, MonsterEditableFields } from '@/lib/types';
import { normalizeAlignment } from '@/lib/types';
import { MonsterStatEditor } from '@/lib/components/MonsterStatEditor';

// handles already-stored speed values (string or legacy object);
// differs from lib/import/transformMonster.ts:normalizeSpeed which processes raw API input
function formatSpeedValue(speedValue: unknown): string {
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
  const [editableFields, setEditableFields] = useState<MonsterEditableFields>({
    ...template,
    alignment: normalizeAlignment(template.alignment),
    speed: formatSpeedValue(template.speed),
  });
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSave = async () => {
    setValidationError(null);

    if (!editableFields.name.trim()) {
      setValidationError('Monster name is required');
      return;
    }

    if (editableFields.hp > editableFields.maxHp) {
      setValidationError('Current HP cannot be greater than Max HP');
      return;
    }

    setSaving(true);
    try {
      const updatedTemplate: MonsterTemplate = {
        ...template,
        ...editableFields,
        source: editableFields.source || undefined,
        description: editableFields.description || undefined,
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

      <MonsterStatEditor
        value={editableFields}
        onChange={setEditableFields}
        disabled={saving}
      />

      <div className="flex gap-2 mt-6">
        <button
          type="submit"
          disabled={saving}
          className={`hover:opacity-80 disabled:opacity-50 px-4 py-2 rounded ${isGlobal ? 'bg-purple-600' : 'bg-green-600'}`}
        >
          {saving ? 'Saving...' : (isNew ? 'Create' : `Save ${title}`)}
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
