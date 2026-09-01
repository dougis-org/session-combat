import { validateString } from './core';

export interface FeedbackInput {
  type: 'bug' | 'feature';
  title: string;
  description: string;
  /** Empty string when absent or not an allowed (https / site-relative) URL. */
  pageUrl: string;
}

export const MAX_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 2000;
export const MAX_PAGE_URL_LENGTH = 2048;

/** Drop ASCII/C1 control characters (0x00–0x1F and 0x7F). */
function stripControlChars(value: string): string {
  let out = '';
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 0x20 && code !== 0x7f) out += ch;
  }
  return out;
}

/**
 * Reduce an untrusted `pageUrl` to a safe value for the feedback email body:
 * strip control characters, clamp length, then allow only an absolute `https://`
 * URL or a site-relative path (`/foo`, never `//host`). Anything else → `''`.
 */
export function sanitizePageUrl(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const cleaned = stripControlChars(raw).trim().slice(0, MAX_PAGE_URL_LENGTH);

  const isHttps = cleaned.startsWith('https://');
  const isSiteRelative = cleaned.startsWith('/') && !cleaned.startsWith('//');
  return isHttps || isSiteRelative ? cleaned : '';
}

export type FeedbackValidation =
  | { valid: true; value: FeedbackInput }
  | { valid: false; error: string };

/**
 * Validate the raw parsed JSON body of `POST /api/feedback`. Runs immediately
 * after JSON parsing, before rate limiting or any datastore access.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateFeedbackInput(body: unknown): FeedbackValidation {
  if (!isRecord(body)) {
    return { valid: false, error: 'Invalid request body' };
  }

  const { type, title, description, pageUrl } = body;

  if (type !== 'bug' && type !== 'feature') {
    return { valid: false, error: 'type must be "bug" or "feature"' };
  }

  const titleResult = validateString(title, 'title', { required: true, minLength: 1 });
  if (!titleResult.valid) {
    return { valid: false, error: 'title is required' };
  }
  if (titleResult.value.length > MAX_TITLE_LENGTH) {
    return { valid: false, error: 'title must be 200 characters or fewer' };
  }

  if (typeof description === 'string' && description.length > MAX_DESCRIPTION_LENGTH) {
    return { valid: false, error: 'description must be 2000 characters or fewer' };
  }

  return {
    valid: true,
    value: {
      type,
      title: titleResult.value,
      description: typeof description === 'string' ? description : '',
      pageUrl: sanitizePageUrl(pageUrl),
    },
  };
}
