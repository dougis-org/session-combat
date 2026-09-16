## GitHub Issues

- #734

## Why

- Problem statement: During combat, a DM has no quick way to roll a d20 for a monster (e.g. an ad-hoc attack roll) without leaving the combat screen and opening the separate global dice tool.
- Why now: Reported directly by the app's DM-facing user as a combat-flow friction point (issue #734).
- Business/user impact: Reduces context-switching for the DM during active combat, which is the app's highest-frequency, time-pressured screen.

## Problem Space

- Current behavior: The only way to roll a d20 during combat is the global dice FAB (bottom-left), which opens a separate panel, requires selecting a d20 from the pool, and is not scoped to any particular combatant.
- Desired behavior: Each monster's combat card gets a quick-roll button (reusing the same d20 icon as the global dice FAB) that immediately rolls one d20 and shows the result in the same result modal used elsewhere in the app — no animation, no pool selection, no attack-bonus math.
- Constraints:
  - Must reuse existing dice primitives (`DiceD20Icon`, `rollDie`, `DiceRollOverlay`, the `BuiltRoll` shape) rather than introducing new roll/display mechanisms.
  - Must not persist or share this roll (no chat send, no server round-trip) — it is a local, ephemeral, DM-only convenience roll.
  - `CombatantCard.tsx` already reserves an empty slot for this (`data-card-section="quick-rolls"`); the button belongs there.
- Assumptions:
  - "Monster" means `CombatantState.type === 'monster'` (the type union is `"player" | "monster" | "lair"`, confirmed in `lib/types.ts`). Player and lair rows do not get this button.
  - "Bypass animation" means the roll never attempts the 3D tumble at all (equivalent to always passing `disableAnimation={true}` to `DiceRollOverlay`), not merely a fast/skippable animation.
  - A raw, unmodified d20 (no attack bonus, no advantage/disadvantage) satisfies the issue as written; per-action attack-bonus rolls are explicitly out of scope (see Non-Goals).
- Edge cases considered:
  - Multiple monster cards on screen simultaneously rolling independently (each roll/overlay instance must be scoped to its own card, not a single shared state).
  - Rapid repeated clicks on the same card's button before a prior overlay is dismissed.
  - Cards for `lair` actions, which are not "monsters" in the player-facing sense, must not show the button.

## Scope

### In Scope

- A new quick-roll button rendered inside the existing `data-card-section="quick-rolls"` slot in `CombatantCard.tsx`, visible only when `combatant.type === 'monster'`.
- Wiring that button to roll one d20 via the existing `rollDie` utility and display the result via the existing `DiceRollOverlay` component with animation disabled.
- Unit tests covering: button visibility gated to monster-type combatants, correct `BuiltRoll` construction for the roll, and overlay open/close behavior.

### Out of Scope

- Any change to the global dice FAB, dice pool builder, percentile roll, or shared/session-chat roll submission path.
- Any attack-bonus, advantage/disadvantage, or per-action roll logic.
- Any animation or 3D dice engine work.
- Any change to `CombatantState` data shape or persistence.

## What Changes

- `lib/components/CombatantCard.tsx`: populate the existing empty `quick-rolls` slot with a monster-only d20 roll button and local state to hold/display the resulting `DiceRollOverlay`.
- New unit tests under `tests/unit/components/` covering the above.
- No API, schema, or shared-state changes.

## Risks

- Risk: Conflating this ephemeral card-local roll with the shared/session-chat roll path, accidentally causing it to persist or broadcast.
  - Impact: Unwanted chat noise or unintended roll history entries for what should be a private DM scratch roll.
  - Mitigation: Reuse only `rollDie` + `DiceRollOverlay` directly; do not touch `useRollSubmission`, `diceSessionBridge`, or the rolls API route.
- Risk: Button rendering for non-monster combatant types (e.g. `lair`) due to an incorrect or incomplete type check.
  - Impact: DM-facing confusion about which rows can be quick-rolled.
  - Mitigation: Explicit test asserting the button is absent for `player` and `lair` typed combatants.
- Risk: Multiple simultaneous overlays if a card is clicked repeatedly before the previous roll's overlay closes.
  - Impact: Stacked/duplicate modals.
  - Mitigation: Single piece of per-card state holding at most one active `BuiltRoll`; a new roll replaces rather than stacks.

## Open Questions

- Question: None outstanding. All ambiguity raised during exploration (bare d20 vs. attack-bonus roll; result display mechanism; the `CombatantState.type` discriminator) was resolved with the requester before this proposal was written.
  - Needed from: n/a
  - Blocker for apply: no

## Non-Goals

- Rolling with the monster's attack bonus, per-action attack rolls, or any modifier math.
- Sending this roll to session chat or persisting it to any roll history.
- Any visual/animation enhancement beyond the existing static numeric-chip result modal.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
