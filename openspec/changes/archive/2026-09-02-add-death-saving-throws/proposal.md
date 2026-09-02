## GitHub Issues

- #92

## Why

- Problem statement: When a player character drops to 0 HP, the tracker only shows a `☠️` next to the name. There is no representation of the 5e death-saving-throw process, so the DM has to track successes/failures, stabilization, and death on paper. The initiative list cannot distinguish a dying PC from a stable one or a dead one.
- Why now: Combat HP handling, conditions, and per-combatant runtime state are already established (`adjustHp`, `conditions`, `concentratingOn`/`pendingConSaveDC`, `legendaryActionsRemaining`). Death saves are the missing piece of the "0 HP" flow and are requested in #92.
- Business/user impact: DMs running combat in the app get automatic death-save tracking with real dice rolls recorded in the roll feed, correct stabilize/death resolution, and a clear at-a-glance view of who is down.

## Problem Space

- Current behavior:
  - `CombatantState` (`lib/types.ts:544`) has `hp`, `maxHp`, `tempHp`, `conditions`, `type: 'player' | 'monster' | 'lair'`.
  - `adjustHp` (`lib/components/CombatantCard.tsx:252`) already branches on `resultHp === 0` (clears concentration) and has a separate healing path.
  - `updateCombatant(id, updates)` (`lib/hooks/useCombat.ts:378`) shallow-merges a `Partial<CombatantState>` and persists the whole `CombatState`; adding optional fields is the established extension pattern — no migration needed.
  - "Dead" is purely derived (`combatant.hp <= 0 && '☠️'`, `CombatantCard.tsx:441`, `:674`); there is no stable/dead distinction.
  - Conditions carry a `duration` and are decremented/expired each round by `processRoundEnd` / `tickConditions`.
  - Turn advancement (`nextTurn`, `useCombat.ts:347`) has no concept of skipping combatants.
  - A dice subsystem exists: rolls go through a centralized unbiased generator and surface in the roll feed; the dice engine is lazy-loaded only when a roll begins.
- Desired behavior:
  - When a PC reaches 0 HP, a death-save tracker (3 success slots, 3 failure slots) appears automatically on that combatant.
  - The DM rolls each death save through the dice library; the d20 result is recorded to the roll feed and its outcome (success / failure / nat 20 / nat 1) is applied to the tracker.
  - 3 successes → `stable`; 3 failures → `dead`; both resolutions clear the tracker's running counts.
  - Damage taken while at 0 HP adds a failure (two failures / instant death on a critical hit or on damage ≥ maxHp).
  - Healing a downed PC above 0 HP clears all death-save state and returns them to active.
  - The initiative list visually distinguishes active vs. dying vs. stable vs. dead; stable and dead combatants are greyed out.
- Constraints:
  - Death-save state must NOT live in the `conditions` array (round-based expiry would decay it).
  - Follow existing dice conventions: centralized unbiased generation, lazy engine load, roll-feed recording.
  - Persist via optional fields on `CombatantState` merged through `updateCombatant`; no schema migration.
  - Monsters/NPCs never make death saves in this change (they die at 0 HP).
- Assumptions:
  - `usesDeathSaves` is determined by `type === 'player'`; there is no per-combatant opt-in toggle in this change.
  - The "nat 20 counts as 2 successes and revives at 1 HP" rule is implemented as always-on (it is RAW, not optional); a separate follow-up issue will introduce house-rule configuration and move any toggling there.
  - The existing dice roll UI/flow can record a labelled d20 roll ("Death Save — {name}") to the feed.
- Edge cases considered:
  - Nat 20 while dying: counts as 2 successes AND immediately revives the PC at 1 HP (active), clearing death-save state.
  - Nat 1 while dying: counts as 2 failures.
  - Reaching 3 successes and 3 failures in the same action is not possible (one roll at a time); crossing 3 failures always resolves to dead even if successes are also at 2.
  - Damage that reduces an already-0-HP PC: +1 failure (+2 / instant death on crit or massive damage).
  - Healing exactly to 0 does not revive (still dying); healing to ≥ 1 revives.
  - A `dead` PC that is later healed above 0: revival is a DM action (raise dead, etc.); healing above 0 clears state and returns to active, consistent with the "healed above 0" rule.
  - Stable PC taking damage drops back to `dying` and re-shows the tracker.
  - Non-player combatants at 0 HP: unchanged behavior (die at 0).

## Scope

### In Scope

- New optional fields on `CombatantState`: `deathSaves` (running success/failure counts) and `lifeState` (`'dying' | 'stable' | 'dead'`, absent = active/conscious).
- Death-save tracker UI on `CombatantCard` for player combatants at 0 HP: 3 success + 3 failure slots, each individually toggleable, plus a "Roll death save" action that rolls a d20 via the dice library and records it to the roll feed.
- Apply death-save roll outcomes: success, failure, nat 20 (2 successes + revive at 1 HP), nat 1 (2 failures).
- Resolution: 3 successes → `stable` (counts cleared); 3 failures → `dead` (counts cleared).
- Damage-while-downed rules in `adjustHp`: +1 failure normally, +2 / instant death on critical hit or damage ≥ maxHp.
- Auto-clear death-save state and `lifeState` when a downed PC is healed above 0 HP.
- Initiative-list visual states: active, dying (tracker visible), stable (greyed), dead (greyed). Stable and dead combatants greyed out in the list.
- Follow-up GitHub issue created for house-rule configuration (tracking optional rules and moving the nat-20 rule toggle there).
- Unit tests for the death-save state machine, roll-outcome application, damage-while-downed rules, and healing-clears-state.

### Out of Scope

- Per-combatant "this monster also makes death saves" opt-in toggle.
- House-rule / optional-rule configuration system (separate follow-up issue).
- Auto-skipping stable/dead combatants during `nextTurn` (they are only greyed out, DM clicks through).
- Undo support for death-save changes.
- Adding an "Unconscious" `StatusCondition` — `lifeState` alone conveys the state.
- Player-facing (non-DM) death-save UI.
- Automatic "raise dead" / revival mechanics beyond the existing "healed above 0" path.

## What Changes

- `lib/types.ts`: add optional `deathSaves?: { successes: number; failures: number }` and `lifeState?: 'dying' | 'stable' | 'dead'` to `CombatantState`.
- New helper module (e.g. `lib/combat/deathSaves.ts`): pure functions for entering the dying state, applying a death-save roll outcome, applying damage-while-downed, and clearing on heal; plus a `usesDeathSaves(combatant)` predicate (`type === 'player'`).
- `lib/components/CombatantCard.tsx`:
  - `adjustHp`: on a PC reaching 0 HP, set `lifeState: 'dying'` and initialize `deathSaves`; on damage while already dying/stable at 0 HP, apply failure(s); on healing above 0, clear `deathSaves` and `lifeState`.
  - Render the death-save tracker (success/failure slots + roll button) when `usesDeathSaves(combatant) && combatant.hp <= 0`.
- Dice integration: a "Roll death save" action that produces a d20 via the centralized unbiased generator, records it to the roll feed labelled for the combatant, and feeds the result into the state machine.
- Initiative list / card styling (`lib/components/ActiveCombatView.tsx`, `CombatantCard.tsx`): grey out `stable` and `dead` combatants; distinct treatment for `dying`.
- `nextTurn` (`lib/hooks/useCombat.ts`): unchanged for skipping, but greyed combatants still take their turn slot.
- New follow-up GitHub issue: "House-rule / optional-rule configuration" referencing #92.
- Tests under `tests/unit/combat/` for `deathSaves` helpers and integration points.

## Risks

- Risk: Death-save state and `hp` drift out of sync (e.g. `lifeState: 'dying'` but `hp > 0`).
  - Impact: Confusing UI, stuck trackers.
  - Mitigation: All transitions go through the `deathSaves` helper module; `adjustHp` is the single writer; healing above 0 always clears. Unit tests cover each transition.
- Risk: Dice integration diverges from existing conventions (bias, non-lazy engine load, missing roll-feed entry).
  - Impact: Inconsistent behavior, regressions in dice fairness guarantees.
  - Mitigation: Reuse the centralized unbiased generator and existing roll-feed recording path; do not import the dice engine at card render time.
- Risk: Persisted combat states created before this change lack the new fields.
  - Impact: None expected — fields are optional and absence means "active".
  - Mitigation: Treat `undefined` `lifeState`/`deathSaves` as active everywhere; no migration.
- Risk: Scope creep toward the house-rules system.
  - Impact: Larger, slower change.
  - Mitigation: nat-20 rule is hard-coded here; configuration is explicitly deferred to the follow-up issue.

## Open Questions

- Question: Where in the roll feed / dice UI should the "Roll death save" action live — inline in the tracker on `CombatantCard`, or routed through the existing roll modal?
  - Needed from: requester (Doug)
  - Blocker for apply: no — default to an inline button in the tracker that invokes the existing roll pipeline; adjust in design if there is a preferred entry point.
- Question: Should a nat-20 revive also count toward "successes" history for display, or just silently revive?
  - Needed from: requester (Doug)
  - Blocker for apply: no — default: revive immediately, clear counts, show a brief "Nat 20 — revived at 1 HP" note in the roll feed.

All other ambiguity from the explore session has been resolved by the requester:
dice library rolls and records impact (yes); nat-20 rule hard-coded now with a
house-rules follow-up issue; damage-while-downed rules included; stable/dead
combatants greyed out (not auto-skipped); bosses do not get death saves;
`lifeState` is sufficient (no Unconscious condition); no undo.

## Non-Goals

- Building a general optional/house-rule configuration framework.
- Changing turn-order logic to skip incapacitated combatants.
- Undo/redo for death-save edits.
- Monster or NPC death saves.
- Multiplayer/player-facing death-save interactions.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
