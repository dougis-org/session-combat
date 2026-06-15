'use client';

import { useState } from 'react';
import type { Monster, MonsterEditableFields } from '@/lib/types';
import { MonsterStatEditor } from '@/lib/components/MonsterStatEditor';

export function MonsterEditor({
  monster,
  onSave,
  onCancel,
  hideCancel = false,
}: {
  monster: Monster;
  onSave: (monster: Monster) => void;
  onCancel: () => void;
  hideCancel?: boolean;
}) {
  const [editableFields, setEditableFields] = useState<MonsterEditableFields>(monster);

  const handleChange = (fields: MonsterEditableFields) => {
    setEditableFields({ ...fields, hp: Math.min(fields.hp, fields.maxHp) });
  };

  const handleSave = () => {
    onSave({ ...monster, ...editableFields });
  };

  return (
    <div className="space-y-4">
      <MonsterStatEditor value={editableFields} onChange={handleChange} />
      <div className="flex gap-2 pt-4">
        <button
          onClick={handleSave}
          className="flex-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm font-medium"
        >
          Save Monster
        </button>
        {!hideCancel && (
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-sm font-medium"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
