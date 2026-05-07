/**
 * Cap a dexterity modifier by armor's maximum dexterity modifier.
 * Generic D&D 5e rule: some armor types limit how much dex can contribute to AC.
 * @param dexterityModifier The character's dexterity modifier
 * @param maxDexterityModifier The armor's max dex modifier (null/undefined = no cap)
 * @returns The capped dexterity modifier
 */
export function capDexterityByArmorType(
  dexterityModifier: number,
  maxDexterityModifier?: number | null,
): number {
  if (maxDexterityModifier == null) return dexterityModifier;
  if (maxDexterityModifier === 0) return 0;
  return Math.min(dexterityModifier, maxDexterityModifier);
}
