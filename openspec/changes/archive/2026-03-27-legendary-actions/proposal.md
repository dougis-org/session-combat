## Why

Boss-tier monsters in D&D 5e have legendary actions — a shared pool of reactions usable by any player outside the monster's turn. Without tracking, the DM must mentally count remaining actions each round, which is error-prone during busy combat. This is the next planned combat-management feature (GitHub issue #90, PRD §4.5).

## What Changes

- `CreatureAbility` gains an optional `cost?: number` field (stored for future use; defaults to 1 in all existing data)
- `MonsterTemplate` and `Monster` gain `legendaryActionCount?: number` (pool size, e.g. 3 for most bosses)
- `CombatantState` gains `legendaryActionCount?: number` (DM-adjustable copy) and `legendaryActionsRemaining?: number` (runtime counter)
- SRD monsters with `legendaryActions[]` are backfilled with `legendaryActionCount: 3`
- Monster upload validator gains `legendaryActionCount` support
- Two new pure functions in `lib/utils/combat.ts`: `useLegendaryAction` and `resetLegendaryActions`
- `nextTurn` resets `legendaryActionsRemaining` for the incoming combatant on every turn advance
- Combat UI gains a `⚡ R/N` counter badge in the combatant row and per-action `[Use]` buttons + pool editor in the detail panel

## Capabilities

### New Capabilities

- `legendary-action-tracking`: Per-combatant legendary action pool — configurable count, runtime remaining counter, per-action use buttons with cost support, auto-reset on turn start, DM pool adjustment during combat

### Modified Capabilities

- `temp-hp-tracking`: No requirement change — referenced only as a precedent pattern for adding runtime fields to `CombatantState`

## Impact

- **Types**: `lib/types.ts` — `CreatureAbility`, `MonsterTemplate`, `Monster`, `CombatantState`
- **Data**: `lib/data/srd-monsters.ts` — backfill `legendaryActionCount` for all legendary monsters
- **Validation**: `lib/validation/monsterUpload.ts` — accept and pass through `legendaryActionCount`
- **Logic**: `lib/utils/combat.ts` — two new pure functions
- **Combat page**: `app/combat/page.tsx` — `nextTurn` reset logic
- **UI components**: `CombatantCard` (counter badge, detail panel controls) — component lives inside `app/combat/page.tsx`
- **No API changes** — `PUT /api/combat/[id]` already accepts the full `combatants[]` array; new fields are additive and optional
- **No new dependencies**

## Problem Space

DMs running encounters with legendary monsters (dragons, liches, beholders, etc.) currently have no tooling support for tracking legendary action expenditure. The counter must be tracked mentally or on paper, creating cognitive overhead during already-complex combat turns.

### In-Scope

- Legendary action pool tracking per combatant
- Auto-reset at the start of the creature's own turn
- Manual decrement via per-action Use buttons
- DM pool adjustment (scaling up/down) inline during combat
- SRD monster data backfill
- Unit tests for new pure functions
- E2E tests for counter visibility and use flow

### Out-of-Scope

- Lair actions (separate mechanic; future change — see Extensibility note)
- Legendary resistances
- Combat log entries for legendary action use
- Mid-combat legendary action text editing
- Any changes to `QuickCombatantModal` (add flow stays one-click)

## Extensibility Note

Lair actions use a different mechanic (initiative count 20 trigger, not per-turn reset) and will be a separate change. This change intentionally keeps `legendaryActions[]` and `lairActions[]` as separate arrays and does not conflate them. The `nextTurn` round-end branch is the correct future hook point for lair action triggers.

## Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| `nextTurn` reset applies to wrong combatant | Counter always shows full at start of wrong turn | Unit test reset logic; E2E test covers turn advance |
| Optional fields on `CombatantState` cause `undefined` errors in UI | Runtime crash when legendary monster added | Treat `legendaryActionsRemaining ?? legendaryActionCount ?? 0` at every read site |
| SRD backfill misses a monster | Some templates launch with no counter | Grep all `legendaryActions:` entries in `srd-monsters.ts` and verify each has `legendaryActionCount` |
| `cost` field abstracted away but stored inconsistently | Future cost-based actions break | Default all SRD entries to `cost: 1` explicitly; validator sets default on missing |

## Non-Goals

- Legendary resistances tracking
- Lair actions (future change)
- Combat log / history for legendary action use
- Editing legendary action text during combat
- Any UI changes outside the combatant card and detail panel

## Open Questions

No unresolved ambiguity. All design decisions were resolved in the exploration session:
- Cost defaults to 1, stored but abstracted in UI ✓
- Pool lives on `MonsterTemplate` and is copied (DM-adjustable) to `CombatantState` ✓
- Adjustment surface is the detail panel (not the add modal) ✓
- Option C UX (counter badge + per-action Use buttons) confirmed ✓
- Lair actions explicitly out of scope ✓

---

*Change-control note: if scope changes after approval, proposal.md, design.md, specs/, and tasks.md must all be updated before implementation proceeds.*
