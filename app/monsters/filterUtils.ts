import type { MonsterTemplate } from '@/lib/types';

export function filterMonsters(
  templates: MonsterTemplate[],
  filterText: string,
  filterType: string,
): MonsterTemplate[] {
  const normalizedText = filterText.trim().toLowerCase();
  return templates.filter(t => {
    const nameMatch = normalizedText === '' || t.name.toLowerCase().includes(normalizedText);
    const typeMatch = filterType === '' || t.type.trim() === filterType;
    return nameMatch && typeMatch;
  });
}

export function getAvailableTypes(
  userTemplates: MonsterTemplate[],
  globalTemplates: MonsterTemplate[],
): string[] {
  const types = new Set(
    [...userTemplates, ...globalTemplates].map(t => t.type.trim()).filter(Boolean),
  );
  return Array.from(types).sort();
}
