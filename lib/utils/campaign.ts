import { CampaignChapter } from '../types';

/**
 * Sanitizes and normalizes an input array of chapters.
 * Ensures each chapter has a unique ID, trimmed title, and sequence orders
 * that are sorted and contiguous starting from 0.
 */
export function sanitizeChapters(chapters: unknown): CampaignChapter[] {
  if (!Array.isArray(chapters)) {
    return [];
  }

  return chapters
    .map((ch: any, index: number) => {
      const id = typeof ch?.id === 'string' ? ch.id : crypto.randomUUID();
      const title = typeof ch?.title === 'string' ? ch.title.trim() : '';
      const order = typeof ch?.order === 'number' ? ch.order : index;
      return { id, title, order };
    })
    .sort((a, b) => a.order - b.order)
    .map((ch, index) => ({ ...ch, order: index }));
}

/**
 * Validates and returns the active chapter ID if it exists within the sanitized chapters.
 */
export function sanitizeCurrentChapterId(
  currentChapterId: unknown,
  chapters: CampaignChapter[]
): string | undefined {
  if (typeof currentChapterId === 'string' && currentChapterId.trim() !== '') {
    const exists = chapters.some((ch) => ch.id === currentChapterId);
    return exists ? currentChapterId : undefined;
  }
  return undefined;
}
