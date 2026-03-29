## Why

Lair actions are a first-class 5e mechanic: at initiative count 20, certain encounters trigger environmental effects driven by a lair (a dragon's cave, a lich's sanctum, etc.). The current tracker has no slot in the initiative order for this, forcing DMs to track it mentally. This closes the gap between the tracker and the rules as written.

## What Changes

- A new `"lair"` pseudo-combatant type is added to the initiative order — a real entry in `combatants[]` at initiative 20 that the DM configures per encounter
- `CombatantState.type` union widens from `"player" | "monster"` to `"player" | "monster" | "lair"`
- `CreatureAbility` gains an optional `usesRemaining?: number` field for per-action charge tracking (lair actions can be use-limited)
- The initiative sort tiebreaker is updated: lair slots appear before players/monsters at the same initiative count
- A `LairActionsSlot` component renders the lair slot distinctly in the initiative order (no HP bar, no conditions — just the action list and a Skip button)
- DMs can add a lair slot at encounter setup or mid-combat, with descriptions auto-seeded from a monster's existing `lairActions[]` or entered manually
- Lair action descriptions are locked during combat; charge counts are editable via `[−] N [+]` controls
- Skip = advance turn — no persistent state change needed

## Capabilities

### New Capabilities

- `lair-action-slot`: The pseudo-combatant mechanic — type union, sort tiebreaker, creation/removal UI, `LairActionsSlot` component, and `CombatantCard` branching for `type === "lair"`
- `lair-action-charges`: Per-action charge tracking via `usesRemaining?: number` on `CreatureAbility` — editor controls and manual restore

### Modified Capabilities

- `legendary-action-tracking`: `CreatureAbility` gains `usesRemaining?: number` (additive, no behavioural change to existing legendary logic — field is absent on all current legendary action entries)

## Impact

**lib/types.ts**
- `CombatantState.type`: add `"lair"`
- `CreatureAbility`: add `usesRemaining?: number`

**app/combat/page.tsx**
- `sortCombatants`: tiebreaker update for `"lair"` type
- Initiative order render: branch to `LairActionsSlot` for `type === "lair"` instead of `CombatantCard`
- Add Lair UI: button available at setup and in-combat

**lib/components/**
- New: `LairActionsSlot.tsx` (follows `LegendaryActionsPanel` pattern — no Firebase deps, fully unit-testable)

**lib/utils/combat.ts**
- New pure functions: `useCharge`, `restoreCharge`, `restoreAllCharges`

**lib/data/srd-monsters.ts**
- No changes — `lairActions[]` already populated for applicable SRD monsters (Aboleth, etc.)

**lib/validation/monsterUpload.ts**
- No changes — `lairActions` already handled; `usesRemaining` is runtime state, not uploaded

**tests/**
- Unit: new pure functions, `LairActionsSlot` component
- E2E: full lair slot flow (add, initiative order appearance, action display, skip, charge decrement)

**No new npm dependencies.**

## Open Questions

No unresolved ambiguity. All design decisions were resolved in the exploration session prior to this proposal:

| Decision | Resolution |
|----------|-----------|
| Architecture | Pseudo-combatant (`type: "lair"`) |
| Multiple lairs | Supported (Scenario C) — no artificial limit |
| Description editing in combat | Locked at setup; auto-seed from monster or manual |
| Charge reset | Manual only — no auto-reset |
| Skip mechanic | `nextTurn()` — no persistent state |
| Toggle surface | Both setup and in-combat |

## Non-Goals

- Combat log entries for lair action use
- Lair action targeting (which creature is affected is narrated by DM, not tracked)
- Legendary resistances
- Any changes to `QuickCombatantModal` for lair configuration
- Lair action scheduling or automation (DM always chooses which action fires)

## Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| `type === "lair"` guard missing at a call site | Lair slot rendered with HP bar / conditions UI | Audit every `c.type` branch; `CombatantCard` short-circuits on `type === "lair"` |
| Dummy `CreatureStats` values on lair pseudo-combatant | Never — fields inert for `type === "lair"` | Document intent; never display ac/hp for lair type |
| `usesRemaining` persisted on `CreatureAbility` for non-lair abilities | Field is optional; existing legendary/trait entries unaffected | Guard `usesRemaining` display behind lair-specific UI only |
| Multiple lairs at same initiative — sort instability | Deterministic: alphabetical by name after lair tiebreaker | Covered by sort tiebreaker update |

## Change Control

If scope changes after this proposal is approved, `proposal.md`, `design.md`, `specs/`, and `tasks.md` must all be updated before implementation proceeds.

This proposal requires explicit human approval before design, specs, tasks, or apply proceed.
