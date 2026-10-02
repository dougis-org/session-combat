import type { CombatantState } from "@/lib/types";
import { usesDeathSaves } from "@/lib/combat/deathSaves";

export type CombatEndSuggestion = "monsters-defeated" | "players-down";

function isDownPlayer(c: Pick<CombatantState, "type" | "hp" | "lifeState">): boolean {
  if (c.lifeState === "dead") return true;
  // Players that don't use death saves die at 0 HP; death-save users stay in play
  // while dying/stable and only count as down once marked dead.
  return c.hp <= 0 && !usesDeathSaves(c);
}

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
