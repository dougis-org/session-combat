## Context

- **Relevant architecture**: `CombatantState extends CreatureStats` (both in `lib/types.ts`). The combat state is persisted via `PUT /api/combat/[id]` which accepts the full `combatants[]` array — no targeted endpoint exists. The `CombatantCard` component (inside `app/combat/page.tsx`) uses `onUpdate: (updates: Partial<CombatantState>) => void` to propagate changes back to the parent. A detail panel (toggled per combatant) already renders `legendaryActions[]` descriptions.
- **Existing data**: `legendaryActions?: CreatureAbility[]` already exists on `CombatantState`, `MonsterTemplate`, and `Monster`. The SRD data (`lib/data/srd-monsters.ts`) populates these arrays but does not store a pool count or action costs.
- **Precedent**: The temp HP feature (PR #97) added `tempHp?: number` to `CombatantState` only, extracted combat math to `lib/utils/combat.ts` as pure functions, and surfaced UI in the combatant card. This change follows the same pattern.
- **Dependencies**: No new npm packages. Pure TypeScript functions only.

## Goals / Non-Goals

**Goals:**

- Add `cost?: number` to `CreatureAbility` — stored on stat block, defaults to 1
- Add `legendaryActionCount?: number` to `MonsterTemplate` and `Monster` (pool size)
- Add `legendaryActionCount?: number` and `legendaryActionsRemaining?: number` to `CombatantState`
- Backfill `legendaryActionCount: 3` in `lib/data/srd-monsters.ts` for all monsters with `legendaryActions[]`
- Add `legendaryActionCount` to monster upload validator
- Extract legendary action math to pure functions in `lib/utils/combat.ts`
- Reset `legendaryActionsRemaining` at the start of the creature's turn (in `nextTurn`)
- Render `⚡ R/N` counter badge in combatant row when `legendaryActionCount > 0`
- Render pool editor `[−] N [+]`, per-action `[Use — N ⚡]` buttons, and `[Restore All]` in detail panel

**Non-Goals:**

- Lair action tracking (future change)
- Combat log entries for legendary action use
- Editing legendary action text during combat
- Any changes to `QuickCombatantModal`
- Legendary resistances

## Decisions

### D1: `cost?: number` on `CreatureAbility`, defaulting to 1

- **Chosen**: Add `cost?: number` to the shared `CreatureAbility` interface. Set `cost: 1` explicitly on all SRD legendary action entries. The UI abstracts cost (shows `Use — N ⚡` but the number is always 1 for SRD content). The field is stored for future use by custom monsters.
- **Alternatives considered**: A separate `LegendaryAction` type extending `CreatureAbility` (over-engineered for one field; cost is the only delta); ignoring cost entirely (loses future flexibility for custom monsters with variable-cost actions).
- **Rationale**: Optional field on the shared type is the lightest change. `cost` is only meaningful for legendary actions; it's harmless on traits/reactions where it's absent.
- **Trade-offs**: `CreatureAbility` is used for all ability types (traits, actions, bonus actions, reactions). Adding `cost?` is a broad change but has no behavioral impact outside legendary actions since the field is optional.

### D2: `legendaryActionCount` on `MonsterTemplate`/`Monster`, copied to `CombatantState`

- **Chosen**: `legendaryActionCount?: number` lives on `MonsterTemplate` and `Monster` as a stat block property. When a monster is added to combat, `legendaryActionCount` is copied verbatim to `CombatantState`. The DM adjusts the combatant-level copy in the detail panel (not the template). `legendaryActionsRemaining` is `CombatantState`-only runtime state.
- **Alternatives considered**: `legendaryActionCount` on `CombatantState` only, not on the template (loses the default; DM must set manually for every boss); deriving the count as `legendaryActions.length` (wrong — pool size is independent of number of distinct actions).
- **Rationale**: Storing on the template provides the correct default at combat-add time. Copying to `CombatantState` allows per-combat scaling without mutating the reusable template.
- **Trade-offs**: Two sources of truth for the count (template vs. combatant), but this is intentional — it mirrors how `hp`/`maxHp` work (template provides the default, combatant tracks current state).

### D3: Two new pure functions in `lib/utils/combat.ts`

- **Chosen**:
  ```typescript
  useLegendaryAction(remaining: number, cost: number): { legendaryActionsRemaining: number }
  resetLegendaryActions(count: number): { legendaryActionsRemaining: number }
  ```
- **Alternatives considered**: Inline logic in component (untestable); a class-based `CombatEngine` (over-engineered).
- **Rationale**: Consistent with the temp HP precedent. Pure functions are trivially unit-testable and keep the component thin.
- **Trade-offs**: Minimal indirection cost; worthwhile for testability.

### D4: Auto-reset in `nextTurn` — applies to combatant at `nextIndex` in both branches

- **Chosen**: In `nextTurn`, after computing `nextIndex`, apply `resetLegendaryActions` to the combatant at `nextIndex` before saving state. This applies in both the mid-round branch (currently just advances index) and the round-end branch (currently runs `processRoundEnd`).
- **Alternatives considered**: Reset only at round end (wrong — legendary actions reset per-turn, not per-round); a separate `onTurnStart` callback (over-engineered for one field).
- **Rationale**: The reset is a turn-start event for the *incoming* combatant. It belongs at `nextIndex` in both paths. The round-end `processRoundEnd` logic for condition expiry is untouched.
- **Trade-offs**: The `else` branch of `nextTurn` now mutates `combatants` where it previously only advanced `currentTurnIndex`. This is a small scope expansion of that branch but keeps the logic co-located.

### D5: No adjustment in `QuickCombatantModal` — inline in detail panel

- **Chosen**: Monster add flow (`QuickCombatantModal`) stays one-click. After adding, the DM adjusts `legendaryActionCount` via `[−] N [+]` controls in the combatant detail panel. This edits `legendaryActionCount` on the combatant via the existing `onUpdate` callback, and also resets `legendaryActionsRemaining` to the new count.
- **Alternatives considered**: Expand-then-configure flow in the modal (adds friction to every monster add, even non-legendary ones).
- **Rationale**: Scaling is the exception, not the rule. Most DMs won't adjust. The detail panel is the correct surface for mid-combat stat inspection/adjustment — it's already used for conditions and stat block review.
- **Trade-offs**: DM must open the detail panel to scale. Acceptable — this is a deliberate act, not an accidental one.

### D6: Counter badge and detail panel layout

- **Chosen**:
  - Row badge: `⚡ R/N` in amber (`text-amber-400`) — visible only when `legendaryActionCount > 0`
  - Detail panel legendary section: section header with remaining count, `[−] N [+]` pool editor, per-action `[Use — N ⚡]` buttons (disabled when `remaining < cost`), `[Restore All]` button
- **Alternatives considered**: Separate UI panel for legendary actions (more vertical space); showing only remaining with no pool editor (loses scaling UX).
- **Rationale**: Amber/gold matches D&D tooling convention for legendary actions. Badge in row provides at-a-glance status during combat. Detail panel handles the full interaction surface. Consistent with how temp HP shows in the row and the HP widget handles the full interaction.

## Proposal to Design Mapping

| Proposal element | Design decision |
|-----------------|----------------|
| `cost?: number` on `CreatureAbility` | D1 |
| `legendaryActionCount` on template, copied to combatant | D2 |
| Pure functions for use/reset | D3 |
| Auto-reset at turn start | D4 |
| DM adjustment inline (not in modal) | D5 |
| Counter badge + detail panel UX | D6 |

## Functional Requirements Mapping

| Requirement | Design element | Testability |
|-------------|---------------|-------------|
| Configurable count per creature (0 = disabled) | D2 — `legendaryActionCount` on template; D5 — `[−]/[+]` in detail panel | Unit: `useLegendaryAction`; E2E: pool editor changes counter |
| Action descriptions with cost stored on stat block | D1 — `cost?` on `CreatureAbility`, backfilled in SRD | Unit: validator passes `cost`; snapshot: SRD entries have `cost: 1` |
| Visual counter in combatant row | D6 — `⚡ R/N` badge | E2E: badge visible when `legendaryActionCount > 0` |
| Auto-reset at start of creature's turn | D4 — `nextTurn` reset at `nextIndex` | Unit: `resetLegendaryActions`; E2E: advance turn → counter full |
| Manual decrement on use | D3 + D6 — `useLegendaryAction` + `[Use]` button | Unit: `useLegendaryAction`; E2E: click Use → remaining decrements |
| Works independently of main turn | D4 — reset only when creature's own turn starts; D6 — buttons available any time | E2E: Use button active on non-active combatant |

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|-----------|
| `nextTurn` reset mutates combatant when `legendaryActionCount` is 0/undefined | Unnecessary state writes, potential off-by-one | Guard: only reset if `legendaryActionCount > 0` |
| `legendaryActionsRemaining` not initialized on first turn | Counter shows `undefined` instead of full pool | Initialize `legendaryActionsRemaining = legendaryActionCount` when monster is added to combat (in `addCombatantFromLibrary`) |
| SRD backfill misses a monster | Template has no counter default | Verify all `legendaryActions:` entries in `srd-monsters.ts` have `legendaryActionCount: 3` |
| Optional `cost` field missing from older custom monsters | `[Use]` button cost label undefined | Default `cost ?? 1` at every read site in the UI |

## Rollback / Mitigation

- Rollback trigger: CI failure, visual regression, or runtime error post-merge
- Rollback steps: Revert the single PR; no DB migration needed (all fields are additive/optional)
- Data migration considerations: None — `legendaryActionCount` and `legendaryActionsRemaining` are optional; existing `CombatantState` documents without these fields deserialise cleanly
- Verification after rollback: `npm test && npm run build`

## Operational Blocking Policy

- CI checks fail: fix; do not merge
- Security checks fail: remediate before merge
- Required reviews stale: escalate after 48 hours by tagging repo owner in PR

## Open Questions

No open questions. All decisions resolved in exploration session prior to proposal.
