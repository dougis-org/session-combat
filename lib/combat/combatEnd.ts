import type { CombatantState } from "@/lib/types";

export type CombatEndSuggestion = "monsters-defeated" | "players-down";

// Players always use death saves, so a player at 0 HP stays in play while dying/stable
// and only counts as down once marked dead.
const isDownPlayer = (c: Pick<CombatantState, "lifeState">): boolean => c.lifeState === "dead";

/**
 * Suggest ending combat when one side can no longer act. Lair combatants belong
 * to neither side. A combat with no monsters (or no players) never suggests ending.
 * When both sides are finished, `monsters-defeated` wins.
 */
export function getCombatEndSuggestion(
  combatants: readonly CombatantState[],
): CombatEndSuggestion | null {
  const monsters = combatants.filter((c) => c.type === "monster");
  const players = combatants.filter((c) => c.type === "player");

  if (monsters.length > 0 && monsters.every((m) => m.hp <= 0)) return "monsters-defeated";
  if (players.length > 0 && players.every(isDownPlayer)) return "players-down";
  return null;
}
