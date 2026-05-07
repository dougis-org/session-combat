import { getAbilityModifier } from "./utils";
import { getModifierNumericValue } from "./dndBeyond-utils";
import { capDexterityByArmorType } from "./armor-class";
import type { AbilityScores } from "@/lib/types";

interface DndBeyondInventoryEntry {
  equipped?: boolean | null;
  definition?: {
    armorClass?: number | null;
    armorTypeId?: number | null;
    baseArmorName?: string | null;
  } | null;
}

interface DndBeyondModifier {
  type?: "bonus" | "set" | "set-base" | "proficiency" | "expertise" | "language" | "resistance" | "immunity" | "vulnerability" | null;
  subType?: string | null;
  fixedValue?: number | null;
  value?: number | null;
  friendlySubtypeName?: string | null;
}

/**
 * Map of D&D Beyond armor type IDs to their maximum dexterity modifier cap.
 * armorTypeId 2 = medium armor (max dex +2)
 * armorTypeId 3 = heavy armor (no dex, max 0)
 */
export const DNDEBEYOND_ARMOR_TYPE_MAX_DEX_MODIFIER: Partial<Record<number, number>> = {
  2: 2,
  3: 0,
};

/**
 * Filter modifiers with subType === "armor-class" and sum their numeric values.
 */
export function getArmorBonuses(modifiers: DndBeyondModifier[]): number {
  return modifiers
    .filter((modifier) => modifier.subType === "armor-class")
    .reduce(
      (total, modifier) => total + (getModifierNumericValue(modifier) || 0),
      0,
    );
}

/**
 * Extract unarmored AC bonuses from modifiers.
 * Set modifiers take max, bonus modifiers are summed.
 */
export function getUnarmoredAcBonus(modifiers: DndBeyondModifier[]): number {
  const { maxSet, sumBonus } = modifiers.reduce(
    (acc, modifier) => {
      if (modifier.subType !== "unarmored-armor-class") return acc;
      const value = getModifierNumericValue(modifier) || 0;
      if (modifier.type === "set") {
        acc.maxSet = Math.max(acc.maxSet, value);
      } else if (modifier.type === "bonus") {
        acc.sumBonus += value;
      }
      return acc;
    },
    { maxSet: 0, sumBonus: 0 },
  );
  return maxSet + sumBonus;
}

/**
 * Maps D&D Beyond armor type ID to max dex modifier, then applies generic cap.
 */
function getArmorDexterityContribution(
  dexterityModifier: number,
  armorTypeId?: number | null,
): number {
  const maxModifier =
    typeof armorTypeId === "number"
      ? DNDEBEYOND_ARMOR_TYPE_MAX_DEX_MODIFIER[armorTypeId]
      : undefined;

  return capDexterityByArmorType(dexterityModifier, maxModifier);
}

/**
 * Calculate armor class for a D&D Beyond character.
 * - With equipped armor: base AC + capped dex + bonuses
 * - Without armor: 10 + dex + unarmored bonus + bonuses
 */
export function normalizeArmorClass(
  inventory: DndBeyondInventoryEntry[] | null | undefined,
  abilityScores: AbilityScores,
  modifiers: DndBeyondModifier[],
): number {
  const dexterityModifier = getAbilityModifier(abilityScores.dexterity);
  const armorBonuses = getArmorBonuses(modifiers);

  const equippedArmor = (inventory || []).find(
    (item) =>
      item.equipped &&
      typeof item.definition?.armorClass === "number" &&
      item.definition?.armorTypeId !== 4,
  );

  if (
    !equippedArmor?.definition ||
    typeof equippedArmor.definition.armorClass !== "number"
  ) {
    const unarmoredBonus = getUnarmoredAcBonus(modifiers);
    return 10 + dexterityModifier + unarmoredBonus + armorBonuses;
  }

  return (
    equippedArmor.definition.armorClass +
    getArmorDexterityContribution(
      dexterityModifier,
      equippedArmor.definition.armorTypeId,
    ) +
    armorBonuses
  );
}
