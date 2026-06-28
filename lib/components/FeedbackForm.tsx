'use client';

import { useState } from 'react';

export interface FeedbackFormData {
  type: 'bug' | 'feature';
  title: string;
  description: string;
  pageUrl: string;
}

interface FeedbackFormProps {
  defaultType?: 'bug' | 'feature';
  onSubmit: (data: FeedbackFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function FeedbackForm({ defaultType = 'bug', onSubmit, onCancel, isSubmitting = false }: FeedbackFormProps) {
  const [type, setType] = useState<'bug' | 'feature'>(defaultType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pageUrl] = useState(() => (typeof window !== 'undefined' ? window.location.href : ''));

  const canSubmit = title.trim().length > 0 && !isSubmitting;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ type, title: title.trim(), description, pageUrl });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType('bug')}
          className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${
            type === 'bug'
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Bug Report
        </button>
        <button
          type="button"
          onClick={() => setType('feature')}
          className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${
            type === 'feature'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Feature Request
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="feedback-title" className="text-sm text-gray-300">
          Title <span className="text-red-400">*</span>
        </label>
        <input
          id="feedback-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-gray-700 text-white rounded px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-blue-500"
          placeholder="Brief summary"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="feedback-description" className="text-sm text-gray-300">
          Description
        </label>
        <textarea
          id="feedback-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={4}
          className="bg-gray-700 text-white rounded px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-blue-500 resize-none"
          placeholder="Additional details (optional)"
        />
        <span className="text-xs text-gray-500 text-right">{description.length}/2000</span>
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="py-2 px-4 rounded text-sm text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="py-2 px-4 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Submitting…' : 'Submit'}
        </button>
      </div>
    </form>
  );
}
