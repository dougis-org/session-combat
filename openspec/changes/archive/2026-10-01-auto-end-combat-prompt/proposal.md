## GitHub Issues

- #812

## Why

- Problem statement: When every monster is dead or every player is dead, the DM must notice and manually click "End Combat", then confirm a second dialog.
- Why now: The shared `ConfirmDialog` and `endCombat` flow were just consolidated (`openspec/changes/archive/2026-10-01-shared-confirm-dialog-end-combat/`), so a second prompt can reuse them cheaply.
- Business/user impact: Fewer missed end-of-combat moments and one less manual step at the table.

## Problem Space

- Current behavior: `ActiveCombatView` shows an "End Combat" button that opens a confirm dialog (`lib/components/ActiveCombatView.tsx`); `useCombat.endCombat()` (`lib/hooks/useCombat.ts`) ends the session. Nothing observes combatant state to suggest ending.
- Desired behavior: When no monster can act, or the party is wiped out with no actions left, prompt once "End combat?". On Yes, call `endCombat()` directly (no second confirmation). On No, dismiss and do not nag.
- Constraints:
  - Monsters die at `hp <= 0`; players at 0 HP enter `lifeState: 'dying'` and may later become `'dead'` or `'stable'` (`lib/combat/deathSaves.ts`).
  - `type: 'lair'` combatants belong to neither side.
- Assumptions:
  - "Fled" is handled by the existing remove-combatant action; no new fled state is added.
  - A player is only counted as down when `lifeState === 'dead'`.
- Edge cases considered:
  - Players-only combat (no monsters) must not prompt immediately.
  - Dying or stable players must not trigger a TPK prompt (they can still act or be saved).
  - "No" must not re-prompt on every HP edit; re-arm only after the condition clears and recurs (e.g. revive, new monster).
  - Page reload into an already-finished combat re-evaluates and prompts.
  - Both sides finished at once yields a single prompt.

## Scope

### In Scope

- Pure helper deriving an end-combat suggestion from combatants.
- Prompt in `ActiveCombatView` using `ConfirmDialog`, with dismiss/re-arm logic.
- Unit and component tests.

### Out of Scope

- A "fled" flag or UI.
- Auto-ending without user confirmation.
- Setup phase behavior.

## What Changes

- New `lib/combat/combatEnd.ts` exporting `getCombatEndSuggestion(combatants)` returning `'monsters-defeated' | 'players-down' | null`.
- `lib/components/ActiveCombatView.tsx`: effect + second `ConfirmDialog`; Yes calls `endCombat()` directly.
- New capability spec `combat-end-prompt`.

## Risks

- Risk: Prompt appears at a surprising time (e.g. mid-edit of HP).
  - Impact: Annoyance; accidental Yes ends combat (irreversible).
  - Mitigation: Prompt is a modal requiring explicit Yes; dismissal is remembered until condition clears.
- Risk: Removing the last monster as "fled" never prompts (no monsters left to count).
  - Impact: DM must end manually in that case.
  - Mitigation: Documented non-goal; same as today.

## Open Questions

- Question: Should "all monsters removed" (e.g. all fled via remove) also prompt?
  - Needed from: Requester
  - Blocker for apply: no (default: no prompt)

## Non-Goals

- Fled state tracking, auto-end, prompt in setup phase, changes to death-save rules.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
