import type { CombatantState } from "@/lib/types";

/**
 * Pure death-saving-throw state machine for combat.
 *
 * All functions are pure: they take a combatant (and any roll/damage context)
 * and return a `Partial<CombatantState>` the caller merges into its update path
 * (`onUpdate` / `updateCombatant`). They never mutate the input.
 *
 * Life state is represented by two optional fields on `CombatantState`:
 * - `lifeState`: `'dying' | 'stable' | 'dead'`; absent means active/conscious.
 * - `deathSaves`: running `{ successes, failures }` tally, cleared on resolution.
 */

export type DeathSaveKind = "success" | "failure";
export type DeathSaveSlotIndex = 0 | 1 | 2;

/** Result of a death-save roll: state updates plus an optional inline note. */
export type DeathSaveRollResult = Partial<CombatantState> & { note?: string };

/** Only player combatants make death saves; monsters/lair die at 0 HP. */
export function usesDeathSaves(c: Pick<CombatantState, "type">): boolean {
  return c.type === "player";
}

/** Transition a player combatant into the dying state with an empty tracker. */
export function enterDying(): Partial<CombatantState> {
  return { lifeState: "dying", deathSaves: { successes: 0, failures: 0 } };
}

/** Clear all death-save state, returning the combatant to active. */
export function clearDeathState(): Partial<CombatantState> {
  return { lifeState: undefined, deathSaves: undefined };
}

function currentSaves(c: Pick<CombatantState, "deathSaves">): {
  successes: number;
  failures: number;
} {
  return {
    successes: c.deathSaves?.successes ?? 0,
    failures: c.deathSaves?.failures ?? 0,
  };
}

/**
 * Resolve a running tally: 3 failures -> dead, 3 successes -> stable (both clear
 * the counts); otherwise keep the (clamped) running tally.
 */
function settle(successes: number, failures: number): Partial<CombatantState> {
  if (failures >= 3) return { lifeState: "dead", deathSaves: undefined };
  if (successes >= 3) return { lifeState: "stable", deathSaves: undefined };
  return {
    deathSaves: {
      successes: Math.max(0, Math.min(3, successes)),
      failures: Math.max(0, Math.min(3, failures)),
    },
  };
}

/**
 * Apply a d20 death-save roll (value supplied by the caller):
 * - natural 20: revive at 1 HP, clear death-save state;
 * - natural 1: two failures;
 * - 10-19: one success;
 * - 2-9: one failure.
 */
export function applyDeathSaveRoll(
  c: Pick<CombatantState, "deathSaves" | "lifeState">,
  d20: number
): DeathSaveRollResult {
  if (d20 === 20) {
    return {
      hp: 1,
      lifeState: undefined,
      deathSaves: undefined,
      note: "Nat 20 — revived at 1 HP",
    };
  }
  const { successes, failures } = currentSaves(c);
  if (d20 === 1) return settle(successes, failures + 2);
  if (d20 >= 10) return settle(successes + 1, failures);
  return settle(successes, failures + 1);
}

/**
 * Toggle an individual success/failure slot. A slot at `index` is filled when
 * the running count is greater than `index`; toggling fills up to `index + 1`
 * or clears back down to `index`. Re-resolves after the toggle.
 */
export function toggleDeathSaveSlot(
  c: Pick<CombatantState, "deathSaves">,
  kind: DeathSaveKind,
  index: DeathSaveSlotIndex
): Partial<CombatantState> {
  const { successes, failures } = currentSaves(c);
  const count = kind === "success" ? successes : failures;
  const next = count > index ? index : index + 1;
  return kind === "success" ? settle(next, failures) : settle(successes, next);
}

/**
 * Apply damage to a combatant that is already downed (dying or stable at 0 HP):
 * one failure normally, instant death on a critical hit or when the incoming
 * damage is at least the combatant's max HP. A stable combatant returns to dying.
 */
export function applyDamageWhileDowned(
  c: Pick<CombatantState, "deathSaves" | "lifeState" | "maxHp">,
  { critical, damage }: { critical: boolean; damage: number }
): Partial<CombatantState> {
  if (critical || damage >= c.maxHp) {
    return { lifeState: "dead", deathSaves: undefined };
  }
  const { successes, failures } = currentSaves(c);
  const settled = settle(successes, failures + 1);
  if (settled.lifeState) return settled;
  return { lifeState: "dying", ...settled };
}

export interface LifeStateDisplay {
  /** Badge text to show next to the name, or null for none. */
  badge: string | null;
  /** Whether the combatant should render greyed / de-emphasised. */
  greyed: boolean;
  /** Whether the death-save tracker should be shown. */
  showTracker: boolean;
}

/**
 * Presentation helper shared by the card header, target list, and initiative
 * list so the life-state badge/greying decision lives in one place.
 */
export function lifeStateDisplay(
  c: Pick<CombatantState, "type" | "hp" | "lifeState">
): LifeStateDisplay {
  switch (c.lifeState) {
    case "dying":
      return { badge: "Dying", greyed: false, showTracker: true };
    case "stable":
      return { badge: "Stable", greyed: true, showTracker: false };
    case "dead":
      return { badge: "Dead", greyed: true, showTracker: false };
    default:
      if (c.hp <= 0) return { badge: "☠️", greyed: false, showTracker: false };
      return { badge: null, greyed: false, showTracker: false };
  }
}
