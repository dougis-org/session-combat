/**
 * Cap a dexterity modifier by armor's maximum dexterity modifier.
 * D&D 5e rule: some armor types limit how much dex can contribute to AC.
 *
 * Heavy armor (maxDexterityModifier = 0) ignores DEX entirely—no positive
 * bonus, no negative penalty. Other armor types cap the DEX modifier at
 * their maximum (e.g., medium armor caps at +2, so DEX +5 contributes only +2).
 *
 * @param dexterityModifier The character's dexterity modifier (can be negative)
 * @param maxDexterityModifier The armor's max dex modifier (null/undefined = no cap)
 * @returns The capped dexterity modifier (0 if maxDexterityModifier is 0; otherwise min(dex, max))
 */
export function capDexterityByArmorType(
  dexterityModifier: number,
  maxDexterityModifier?: number | null,
): number {
  if (maxDexterityModifier == null) return dexterityModifier;
  if (maxDexterityModifier === 0) return 0;
  return Math.min(dexterityModifier, maxDexterityModifier);
}
