'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';
import { ErrorBanner, LoadingState, FormField, textInputClass } from '@/lib/components/ui';
import { useCampaignContext } from '@/lib/hooks/useCampaignContext';
import { TEMPLATES, PromptTemplate } from '@/lib/prompts/templates';
import { BuiltPrompt } from '@/lib/types';

function PromptBuilderContent({ campaignId }: { campaignId: string }) {
  const { context, loading, error } = useCampaignContext(campaignId);
  const [activeTemplateId, setActiveTemplateId] = useState(TEMPLATES[0].id);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [builtPrompt, setBuiltPrompt] = useState<BuiltPrompt | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const activeTemplate: PromptTemplate = TEMPLATES.find(t => t.id === activeTemplateId) ?? TEMPLATES[0];
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  function selectTemplate(template: PromptTemplate) {
    setActiveTemplateId(template.id);
    setFields({});
    setBuiltPrompt(null);
    setValidationError(null);
    setCopied(false);
  }

  function handleFieldChange(key: string, value: string) {
    setFields(prev => ({ ...prev, [key]: value }));
    setBuiltPrompt(null);
    setValidationError(null);
  }

  function handleGenerate() {
    if (!context) return;

    const missingRequired = activeTemplate.fields
      .filter(f => !f.optional && !fields[f.key]?.trim())
      .map(f => f.label);

    if (missingRequired.length > 0) {
      setValidationError(`Required fields missing: ${missingRequired.join(', ')}`);
      setBuiltPrompt(null);
      return;
    }

    const prompt = activeTemplate.build(fields, context);
    setBuiltPrompt(prompt);
    setValidationError(null);
  }

  async function handleCopy() {
    if (!builtPrompt || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(builtPrompt.fullText);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      setCopied(true);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard write rejected (permissions / insecure context)
    }
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
            {context && (
              <p className="text-gray-400 mt-1">{context.campaign.name}</p>
            )}
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
            {/* Template selector tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {TEMPLATES.map(template => (
                <button
                  key={template.id}
                  onClick={() => selectTemplate(template)}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    activeTemplateId === template.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {template.label}
                </button>
              ))}
            </div>

            {/* Dynamic form */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">{activeTemplate.label}</h2>
              <div className="space-y-4 mb-6">
                {activeTemplate.fields.map(field => {
                  const Tag = field.multiline ? 'textarea' : 'input';
                  return (
                    <FormField key={field.key} label={field.label + (field.optional ? ' (optional)' : '')} htmlFor={field.key}>
                      <Tag
                        id={field.key}
                        value={fields[field.key] ?? ''}
                        onChange={e => handleFieldChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className={textInputClass() + (field.multiline ? ' resize-y' : '')}
                        {...(Tag === 'textarea' ? { rows: 3 } : { type: 'text' })}
                      />
                    </FormField>
                  );
                })}
              </div>

              {validationError && (
                <p className="text-red-400 text-sm mb-4">{validationError}</p>
              )}

              <button
                onClick={handleGenerate}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded font-medium"
              >
                Generate Prompt
              </button>
            </div>

            {/* Generated prompt output */}
            {builtPrompt && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-3">Generated Prompt</h2>
                <textarea
                  readOnly
                  value={builtPrompt.fullText}
                  rows={12}
                  className={textInputClass() + ' resize-y font-mono text-sm'}
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleCopy}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm"
                  >
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                  </button>
                </div>
              </div>
            )}

            {/* Save to Library stub — always visible */}
            <div className="mt-4">
              <button
                disabled
                title="Available with Content Library (#185)"
                className="bg-gray-600 text-gray-400 cursor-not-allowed px-4 py-2 rounded text-sm"
              >
                Save to Library
              </button>
            </div>
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
