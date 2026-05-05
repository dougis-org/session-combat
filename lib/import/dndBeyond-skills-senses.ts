import type { AbilityScores } from "../types";
import { getAbilityModifier, ABILITY_KEYS } from "./utils";
import {
  collectModifierSubtypeSet,
  getModifierNumericValue,
  sumModifierBonusesBySubtype,
} from "./dndBeyond-utils";
import { SKILL_ABILITY_MAP, PASSIVE_SENSE_SKILLS } from "../characterReference";

interface DndBeyondModifier {
  type?: "bonus" | "set" | "set-base" | "proficiency" | "expertise" | "language" | "resistance" | "immunity" | "vulnerability" | null;
  subType?: string | null;
  fixedValue?: number | null;
  value?: number | null;
  friendlySubtypeName?: string | null;
}

interface DndBeyondCharacterData {
  race?: {
    weightSpeeds?: {
      normal?: {
        walk?: number | null;
      } | null;
    } | null;
  } | null;
}

export function normalizeSavingThrows(
  abilityScores: AbilityScores,
  modifiers: DndBeyondModifier[],
  proficiencyBonus: number,
): Partial<Record<keyof AbilityScores, number>> {
  const bonusesBySubtype = sumModifierBonusesBySubtype(modifiers);
  const proficientSaves = collectModifierSubtypeSet(
    modifiers,
    (modifier) =>
      modifier.type === "proficiency" &&
      Boolean(modifier.subType?.endsWith("-saving-throws")),
    (modifier) => (modifier.subType || "").replace("-saving-throws", ""),
  );

  return Object.fromEntries(
    ABILITY_KEYS.map((ability) => [
      ability,
      getAbilityModifier(abilityScores[ability]) +
        (proficientSaves.has(ability) ? proficiencyBonus : 0) +
        (bonusesBySubtype[`${ability}-saving-throws`] || 0),
    ]),
  );
}

export function normalizeSkills(
  abilityScores: AbilityScores,
  modifiers: DndBeyondModifier[],
  proficiencyBonus: number,
): Record<string, number> {
  const expertise = collectModifierSubtypeSet(
    modifiers,
    (modifier) => modifier.type === "expertise",
    (modifier) => normalizeSkillName(modifier.subType || ""),
  );
  const proficiency = collectModifierSubtypeSet(
    modifiers,
    (modifier) => modifier.type === "proficiency",
    (modifier) => normalizeSkillName(modifier.subType || ""),
  );
  const bonusesBySubtype = sumModifierBonusesBySubtype(modifiers);

  return Object.fromEntries(
    Object.entries(SKILL_ABILITY_MAP).map(([skill, ability]) => {
      const base = getAbilityModifier(abilityScores[ability]);
      const multiplier = expertise.has(skill)
        ? 2
        : proficiency.has(skill)
          ? 1
          : 0;
      const bonus = bonusesBySubtype[denormalizeSkillSubtype(skill)] || 0;
      return [skill, base + proficiencyBonus * multiplier + bonus];
    }),
  );
}

export function normalizeSenses(
  data: DndBeyondCharacterData,
  modifiers: DndBeyondModifier[],
  skills: Record<string, number>,
  abilityScores: AbilityScores,
): Record<string, string> {
  const senses = collectSenseModifiers(modifiers);

  const walkSpeed = data.race?.weightSpeeds?.normal?.walk;
  if (typeof walkSpeed === "number" && walkSpeed > 0) {
    senses.speed = `${walkSpeed} ft.`;
  }

  Object.assign(
    senses,
    Object.fromEntries(
      PASSIVE_SENSE_SKILLS.map(([label, skill, ability]) => [
        label,
        String(
          10 + (skills[skill] ?? getAbilityModifier(abilityScores[ability])),
        ),
      ]),
    ),
  );

  return senses;
}

function collectSenseModifiers(
  modifiers: DndBeyondModifier[],
): Record<string, string> {
  return modifiers.reduce<Record<string, string>>((senses, modifier) => {
    if (
      modifier.type !== "set-base" ||
      !modifier.subType ||
      typeof getModifierNumericValue(modifier) !== "number"
    ) {
      return senses;
    }

    senses[normalizeSenseKey(modifier.subType)] =
      `${getModifierNumericValue(modifier)} ft.`;
    return senses;
  }, {});
}

function normalizeSkillName(subType: string): string {
  return subType.replace(/-/g, " ").trim().toLowerCase();
}

function denormalizeSkillSubtype(skill: string): string {
  return skill.replace(/ /g, "-");
}

function normalizeSenseKey(subType: string): string {
  return subType.replace(/-/g, " ").toLowerCase();
}
