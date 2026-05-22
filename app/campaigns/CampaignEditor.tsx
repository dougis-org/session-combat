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

  const handleSave = async () => {
    setValidationError(null);
    if (!name.trim()) {
      setValidationError('Campaign name is required');
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...campaign, name: name.trim(), moduleName: moduleName.trim(), active });
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

      {campaign.chapters.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold mb-2">Chapters</p>
          <ul className="space-y-1">
            {campaign.chapters.map((ch) => (
              <li key={ch.id} className={`text-sm px-2 py-1 rounded ${ch.id === campaign.currentChapterId ? 'bg-blue-700 text-white' : 'text-gray-300'}`}>
                {ch.order + 1}. {ch.title}
                {ch.id === campaign.currentChapterId && <span className="ml-2 text-xs opacity-75">(current)</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

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
