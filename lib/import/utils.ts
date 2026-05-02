export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function getProficiencyBonus(totalLevel: number): number {
  return 2 + Math.floor(Math.max(totalLevel - 1, 0) / 4);
}