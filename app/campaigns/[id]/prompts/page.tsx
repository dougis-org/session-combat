'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';
import { ErrorBanner, LoadingState, FormField, textInputClass } from '@/lib/components/ui';
import { useCampaignContext } from '@/lib/hooks/useCampaignContext';
import { TEMPLATES, PromptField, PromptTemplate } from '@/lib/prompts/templates';
import type { BuiltPrompt, CampaignContext, SavedContent } from '@/lib/types';

function TemplateField({ field, value, onChange }: {
  field: PromptField;
  value: string;
  onChange: (key: string, value: string) => void;
}) {
  const Tag = field.multiline ? 'textarea' : 'input';
  return (
    <FormField label={field.label + (field.optional ? ' (optional)' : '')} htmlFor={field.key}>
      <Tag
        id={field.key}
        value={value}
        onChange={e => onChange(field.key, e.target.value)}
        placeholder={field.placeholder}
        className={textInputClass() + (field.multiline ? ' resize-y' : '')}
        {...(Tag === 'textarea' ? { rows: 3 } : { type: 'text' })}
      />
    </FormField>
  );
}

function TemplateForm({ template, fields, validationError, onFieldChange, onGenerate }: {
  template: PromptTemplate;
  fields: Record<string, string>;
  validationError: string | null;
  onFieldChange: (key: string, value: string) => void;
  onGenerate: () => void;
}) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">{template.label}</h2>
      <div className="space-y-4 mb-6">
        {template.fields.map(field => (
          <TemplateField key={field.key} field={field} value={fields[field.key] ?? ''} onChange={onFieldChange} />
        ))}
      </div>
      {validationError && (
        <p className="text-red-400 text-sm mb-4">{validationError}</p>
      )}
      <button onClick={onGenerate} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded font-medium">
        Generate Prompt
      </button>
    </div>
  );
}

function SavePanel({
  campaignId,
  template,
  fields,
  builtPrompt,
  chapter,
  onClose,
}: {
  campaignId: string;
  template: PromptTemplate;
  fields: Record<string, string>;
  builtPrompt: BuiltPrompt;
  chapter?: string;
  onClose: () => void;
}) {
  const suggestedTitle = template.fields
    .map(f => fields[f.key]?.trim())
    .find(v => v) ?? '';
  const [title, setTitle] = useState(suggestedTitle);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          type: template.id as SavedContent['type'],
          title: title.trim(),
          systemPrompt: builtPrompt.systemPrompt,
          userMessage: builtPrompt.userMessage,
          prompt: builtPrompt.fullText,
          chapter,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      const item = await res.json() as SavedContent;
      setSavedId(item.id);
    } catch {
      setSaveError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (savedId) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 mt-4">
        <p className="text-green-400 text-sm mb-2">Saved to library.</p>
        <Link
          href={`/campaigns/${campaignId}/library`}
          className="text-blue-400 hover:underline text-sm"
        >
          Go to Library →
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 mt-4">
      <h3 className="text-sm font-semibold mb-3">Save to Library</h3>
      <div className="mb-3">
        <label htmlFor="save-title" className="block text-sm text-gray-300 mb-1">Title</label>
        <input
          id="save-title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className={textInputClass()}
          placeholder="Enter a title"
        />
      </div>
      {saveError && <p className="text-red-400 text-sm mb-3">{saveError}</p>}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 px-4 py-2 rounded text-sm"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={onClose}
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function PromptOutput({ builtPrompt }: { builtPrompt: BuiltPrompt }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  async function handleCopy() {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(builtPrompt.fullText);
      if (timerRef.current) clearTimeout(timerRef.current);
      setCopied(true);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard write rejected (permissions / insecure context)
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-3">Generated Prompt</h2>
      <textarea readOnly value={builtPrompt.fullText} rows={12} className={textInputClass() + ' resize-y font-mono text-sm'} />
      <div className="flex gap-3 mt-4">
        <button onClick={handleCopy} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm">
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
      </div>
    </div>
  );
}

function PromptBuilderContent({ campaignId }: { campaignId: string }) {
  const { context, loading, error } = useCampaignContext(campaignId);
  const [activeTemplateId, setActiveTemplateId] = useState(TEMPLATES[0].id);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [builtPrompt, setBuiltPrompt] = useState<BuiltPrompt | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showSavePanel, setShowSavePanel] = useState(false);

  const activeTemplate = TEMPLATES.find(t => t.id === activeTemplateId) ?? TEMPLATES[0];

  function selectTemplate(template: PromptTemplate) {
    setActiveTemplateId(template.id);
    setFields({});
    setBuiltPrompt(null);
    setValidationError(null);
    setShowSavePanel(false);
  }

  function handleFieldChange(key: string, value: string) {
    setFields(prev => ({ ...prev, [key]: value }));
    setBuiltPrompt(null);
    setValidationError(null);
    setShowSavePanel(false);
  }

  function handleGenerate(ctx: CampaignContext) {
    const missing = activeTemplate.fields
      .filter(f => !f.optional && !fields[f.key]?.trim())
      .map(f => f.label);
    if (missing.length > 0) {
      setValidationError(`Required fields missing: ${missing.join(', ')}`);
      setBuiltPrompt(null);
      return;
    }
    setBuiltPrompt(activeTemplate.build(fields, ctx));
    setValidationError(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <LoadingState label="Loading campaign context..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Prompt Builder</h1>
            {context && <p className="text-gray-400 mt-1">{context.campaign.name}</p>}
          </div>
          <Link href="/campaigns" className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm">
            Back to Campaigns
          </Link>
        </div>

        <ErrorBanner message={error} />

        {context && context.parties.length === 0 && (
          <div className="bg-yellow-900 border border-yellow-700 rounded p-4 mb-6 text-yellow-200 text-sm">
            No party linked to this campaign. Prompts will be generated without party context.
          </div>
        )}

        {context && (
          <>
            <div className="flex gap-2 mb-6 flex-wrap">
              {TEMPLATES.map(template => (
                <button
                  key={template.id}
                  onClick={() => selectTemplate(template)}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${activeTemplateId === template.id ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                >
                  {template.label}
                </button>
              ))}
            </div>

            <TemplateForm
              template={activeTemplate}
              fields={fields}
              validationError={validationError}
              onFieldChange={handleFieldChange}
              onGenerate={() => handleGenerate(context)}
            />

            {builtPrompt && <PromptOutput builtPrompt={builtPrompt} />}

            <div className="mt-4">
              <button
                disabled={!builtPrompt}
                onClick={() => setShowSavePanel(true)}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed px-4 py-2 rounded text-sm"
              >
                Save to Library
              </button>
            </div>

            {builtPrompt && showSavePanel && (
              <SavePanel
                campaignId={campaignId}
                template={activeTemplate}
                fields={fields}
                builtPrompt={builtPrompt}
                chapter={context?.chapter?.title}
                onClose={() => setShowSavePanel(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function PromptBuilderPage() {
  const params = useParams();
  const campaignId = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <ProtectedRoute>
      <PromptBuilderContent campaignId={campaignId as string} />
    </ProtectedRoute>
  );
}
