import type { SavedContent } from '@/lib/types';
import { validateString } from './core';

export const SAVED_CONTENT_TYPES: SavedContent['type'][] = ['npc', 'location', 'shop', 'magic-item', 'room'];

export type Validation<T> = { valid: true; value: T } | { valid: false; error: string };

export interface SavedContentCreateInput {
  campaignId: string;
  type: SavedContent['type'];
  title: string;
  systemPrompt: string;
  userMessage: string;
  prompt: string;
  chapter?: string;
}

export type SavedContentPatch = Pick<SavedContent, 'result' | 'notes'>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Trim and require a non-empty identifier (campaignId, content id). */
export function validateIdentifier(raw: unknown, field: string): Validation<string> {
  const result = validateString(raw, field, { required: true, minLength: 1 });
  if (!result.valid) return { valid: false, error: `${field} is required` };
  return { valid: true, value: result.value };
}

export function validateSavedContentCreate(body: unknown): Validation<SavedContentCreateInput> {
  if (!isRecord(body)) return { valid: false, error: 'Invalid request body' };
  const { campaignId, type, title, systemPrompt, userMessage, prompt, chapter } = body;

  const trimmedId = validateString(campaignId, 'campaignId', { required: true, minLength: 1 });
  const trimmedTitle = validateString(title, 'title', { required: true, minLength: 1 });
  if (
    !trimmedId.valid || !trimmedTitle.valid ||
    typeof type !== 'string' ||
    typeof systemPrompt !== 'string' || !systemPrompt.trim() ||
    typeof userMessage !== 'string' || !userMessage.trim() ||
    typeof prompt !== 'string' || !prompt.trim()
  ) {
    return { valid: false, error: 'Missing required fields' };
  }
  if (!(SAVED_CONTENT_TYPES as string[]).includes(type)) {
    return { valid: false, error: 'Invalid type' };
  }

  return {
    valid: true,
    value: {
      campaignId: trimmedId.value,
      type: type as SavedContent['type'],
      title: trimmedTitle.value,
      systemPrompt,
      userMessage,
      prompt,
      chapter: typeof chapter === 'string' ? chapter : undefined,
    },
  };
}

export function validateSavedContentPatch(body: unknown): Validation<SavedContentPatch> {
  if (!isRecord(body)) return { valid: false, error: 'Invalid request body' };
  const { result, notes } = body;

  if (result !== undefined && typeof result !== 'string') {
    return { valid: false, error: 'result must be a string' };
  }
  if (notes !== undefined && typeof notes !== 'string') {
    return { valid: false, error: 'notes must be a string' };
  }

  const patch: SavedContentPatch = {};
  if (result !== undefined) patch.result = result;
  if (notes !== undefined) patch.notes = notes;
  if (Object.keys(patch).length === 0) {
    return { valid: false, error: 'At least one of result or notes is required' };
  }
  return { valid: true, value: patch };
}
