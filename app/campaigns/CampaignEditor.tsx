'use client';

import { useState } from 'react';
import { TextInputField, FormField, EditorShell, textInputClass } from '@/lib/components/ui';
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
  const [currentChapter, setCurrentChapter] = useState(campaign.currentChapter);
  const [currentChapterOrder, setCurrentChapterOrder] = useState(campaign.currentChapterOrder);
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
      await onSave({ ...campaign, name: name.trim(), moduleName: moduleName.trim(), currentChapter: currentChapter.trim(), currentChapterOrder, active });
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

        <TextInputField label="Current Chapter" value={currentChapter} onChange={setCurrentChapter}
          disabled={saving} placeholder="e.g., Chapter 4: The Sunken Temple" />

        <FormField label="Chapter Order">
          <input type="number" value={currentChapterOrder}
            onChange={(e) => { const v = parseInt(e.target.value, 10); setCurrentChapterOrder(isNaN(v) ? 0 : v); }}
            className={textInputClass()} disabled={saving} min={0} />
        </FormField>
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
