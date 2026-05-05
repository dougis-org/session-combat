import type { CreatureAbility } from "../types";
import { titleize, isPresent, sanitizeHtmlSnippet, mapNarrativeEntries } from "./utils";

export interface DndBeyondActionEntry {
  name?: string | null;
  snippet?: string | null;
  description?: string | null;
  activation?: {
    activationType?: number | null;
  } | null;
}

export const ACTIONS_BY_ACTIVATION_TYPE: Partial<
  Record<number, "actions" | "bonusActions" | "reactions">
> = {
  3: "bonusActions",
  4: "reactions",
};

export const TRAIT_TITLE_MAP = {
  personalityTraits: "Personality Traits",
  ideals: "Ideals",
  bonds: "Bonds",
  flaws: "Flaws",
  appearance: "Appearance",
};

export const NOTE_TITLE_MAP = {
  backstory: "Backstory",
  allies: "Allies",
  enemies: "Enemies",
  organizations: "Organizations",
  otherNotes: "Other Notes",
};

export function normalizeAbilities(
  actions: Record<string, DndBeyondActionEntry[] | null> | null | undefined,
  traits: Record<string, string | null> | null | undefined,
  notes: Record<string, string | null> | null | undefined,
): {
  traits: CreatureAbility[];
  actions: CreatureAbility[];
  bonusActions: CreatureAbility[];
  reactions: CreatureAbility[];
} {
  const categorizedAbilities = {
    actions: [] as CreatureAbility[],
    bonusActions: [] as CreatureAbility[],
    reactions: [] as CreatureAbility[],
  };

  Object.values(actions || {})
    .flatMap((entries) => entries || [])
    .map((entry) => ({ entry, ability: normalizeActionEntry(entry) }))
    .filter(
      (
        item,
      ): item is { entry: DndBeyondActionEntry; ability: CreatureAbility } =>
        isPresent(item.ability),
    )
    .forEach(({ entry, ability }) => {
      pushAbilityByActivation(categorizedAbilities, entry, ability);
    });

  const mappedTraits = [
    ...mapNarrativeEntries(traits, TRAIT_TITLE_MAP),
    ...mapNarrativeEntries(notes, NOTE_TITLE_MAP),
  ];

  return {
    traits: mappedTraits,
    actions: categorizedAbilities.actions,
    bonusActions: categorizedAbilities.bonusActions,
    reactions: categorizedAbilities.reactions,
  };
}

function normalizeActionEntry(
  entry: DndBeyondActionEntry,
): CreatureAbility | null {
  if (!entry.name || !(entry.snippet || entry.description)) {
    return null;
  }

  const description = sanitizeHtmlSnippet(
    entry.snippet || entry.description || "",
  );

  if (!description) {
    return null;
  }

  return {
    name: entry.name,
    description,
  };
}

function pushAbilityByActivation(
  categorizedAbilities: {
    actions: CreatureAbility[];
    bonusActions: CreatureAbility[];
    reactions: CreatureAbility[];
  },
  entry: DndBeyondActionEntry,
  ability: CreatureAbility,
): void {
  const targetKey =
    ACTIONS_BY_ACTIVATION_TYPE[entry.activation?.activationType || 0] ||
    "actions";
  categorizedAbilities[targetKey].push(ability);
}
