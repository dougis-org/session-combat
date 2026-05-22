import type { CampaignChapter } from '@/lib/types';

/**
 * Sanitizes and normalizes an input array of chapters.
 * Ensures each chapter has a unique ID, trimmed title, and sequence orders
 * that are sorted and contiguous starting from 0.
 */
export function sanitizeChapters(chapters: unknown): CampaignChapter[] {
  if (!Array.isArray(chapters)) {
    return [];
  }

  const seenIds = new Set<string>();

  return chapters
    .map((ch: any, index: number) => {
      const title = typeof ch?.title === 'string' ? ch.title.trim() : '';
      const order = typeof ch?.order === 'number' ? ch.order : index;
      
      let id = typeof ch?.id === 'string' ? ch.id.trim() : '';
      if (!id || seenIds.has(id)) {
        id = crypto.randomUUID();
      }
      seenIds.add(id);

      const sanitized: CampaignChapter = { id, title, order };
      if (typeof ch?.description === 'string') {
        sanitized.description = ch.description.trim();
      }
      if (typeof ch?.levelRange === 'string') {
        sanitized.levelRange = ch.levelRange.trim();
      }
      if (typeof ch?.location === 'string') {
        sanitized.location = ch.location.trim();
      }

      return sanitized;
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
  if (typeof currentChapterId === 'string') {
    const trimmed = currentChapterId.trim();
    if (trimmed !== '') {
      const exists = chapters.some((ch) => ch.id === trimmed);
      return exists ? trimmed : undefined;
    }
  }
  return undefined;
}
