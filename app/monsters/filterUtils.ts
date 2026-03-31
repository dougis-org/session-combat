import type { MonsterTemplate } from '@/lib/types';

export function filterMonsters(
  templates: MonsterTemplate[],
  filterText: string,
  filterType: string,
): MonsterTemplate[] {
  return templates.filter(t => {
    const nameMatch = filterText === '' || t.name.toLowerCase().includes(filterText.toLowerCase());
    const typeMatch = filterType === '' || t.type === filterType;
    return nameMatch && typeMatch;
  });
}

export function getAvailableTypes(
  userTemplates: MonsterTemplate[],
  globalTemplates: MonsterTemplate[],
): string[] {
  const types = new Set([...userTemplates, ...globalTemplates].map(t => t.type));
  return Array.from(types).sort();
}
