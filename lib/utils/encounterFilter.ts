import type { Encounter } from '@/lib/types';

export function filterAndSortEncounters(
  encounters: Encounter[],
  query: string,
  selectedId: string,
): Encounter[] {
  const normalizedQuery = query.trim().toLowerCase();
  return encounters
    .filter(
      e =>
        e.id === selectedId ||
        normalizedQuery === '' ||
        e.name.toLowerCase().includes(normalizedQuery),
    )
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}
