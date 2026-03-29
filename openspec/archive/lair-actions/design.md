## Context

- **Relevant architecture**: `CombatantState extends CreatureStats` (both in `lib/types.ts`). The combat state is persisted via `PUT /api/combat/[id]` which accepts the full `combatants[]` array. `sortCombatants` in `app/combat/page.tsx` determines display order (descending initiative, then dex, then player-before-monster, then name). `currentTurnIndex` is a flat integer index into the sorted `combatants[]` array — every turn-related function (including `nextTurn`) relies on this directly.
- **Legendary actions precedent (PR #101)**: `LegendaryActionsPanel` was extracted to `lib/components/` (no Firebase/Next.js deps — fully unit-testable). Pure functions live in `lib/utils/combat.ts`. The `resetIncomingLegendaryPool` function hooks into `nextTurn` without modifying its core logic. This change follows the same pattern.
- **Existing stubs**: `lairActions?: CreatureAbility[]` already exists on `MonsterTemplate`, `Monster`, and `CombatantState`. The SRD data already populates `lairActions[]` for applicable monsters (e.g. Aboleth). The `monsterUpload` validator already handles `lairActions`.
- **Dependencies**: No new npm packages. Pure TypeScript only.

## Goals / Non-Goals

**Goals:**

- Add `"lair"` to the `CombatantState.type` union
- Add `usesRemaining?: number` to `CreatureAbility` for per-action charge tracking
- Update `sortCombatants` tiebreaker: lair slots sort before players/monsters at the same initiative
- Add/remove lair pseudo-combatants at encounter setup and mid-combat
- Auto-seed lair actions from an in-encounter monster's `lairActions[]`, or allow manual entry
- Lock descriptions during combat; allow charge editing via `[−] N [+]` per action
- Extract `LairActionsSlot` to `lib/components/` (no Firebase deps)
- Add pure functions `useCharge`, `restoreCharge`, `restoreAllCharges` to `lib/utils/combat.ts`
- Branch `CombatantCard` / initiative render for `type === "lair"` — distinct visual, no HP/conditions
- Unit-test new pure functions and `LairActionsSlot`; E2E-test full lair slot flow

**Non-Goals:**

- Changes to `nextTurn` core logic — the pseudo-combatant lands naturally at `currentTurnIndex`
- Changes to `QuickCombatantModal`
- Combat log entries for lair action use
- Lair action targeting / effect automation
- Legendary resistances

## Decisions

### D1: Pseudo-combatant with `type: "lair"` — not a display-layer virtual slot

- **Chosen**: A lair slot is a real `CombatantState` entry in `combatants[]` with `type: "lair"`, `initiative: 20`, and a DM-chosen name. `currentTurnIndex` lands on it naturally; `nextTurn` requires zero changes. Toggle on/off = add/remove from the array.
- **Alternatives considered**: (a) A `lairActionPending` boolean on `CombatState`, set when `nextTurn` detects "crossing initiative 20" — requires fragile boundary detection and introduces a two-phase state in `nextTurn`; (b) A display-only injected row in `getDisplayCombatants()` with a separate `lairSlotIndex` — breaks the `currentTurnIndex` model entirely.
- **Rationale**: The existing turn model is flat-index-into-sorted-array. Any approach that doesn't place the lair slot in that array requires significant rearchitecting of `nextTurn`, `saveCombatState`, and all `currentTurnIndex` consumers. The pseudo-combatant is the only approach with zero turn-management changes.
- **Trade-offs**: `CombatantState extends CreatureStats`, so the lair pseudo-combatant carries dummy values (`ac: 0, hp: 0, maxHp: 0`, all-10 ability scores). These are never displayed for `type === "lair"` and are inert in all combat math (conditions, temp HP, etc. are never applied to lair slots).

### D2: `type: "lair"` tiebreaker in `sortCombatants`

- **Chosen**: At the same initiative value, lair slots sort before players, which sort before monsters. Within multiple lair slots at the same initiative, sort alphabetically by name.
- **Alternatives considered**: Give lair slots `initiative: 20.5` to float above initiative-20 creatures — avoids a sort change but is a floating-point hack that breaks the integer initiative model and surprises DMs entering initiative values.
- **Rationale**: The 5e rule is explicit: lair actions fire "before any creature acts at initiative count 20." Adding a lair-first tiebreaker tier is the correct model. The sort change is two lines.

### D3: `usesRemaining?: number` on `CreatureAbility`

- **Chosen**: Add optional `usesRemaining?: number` to the shared `CreatureAbility` interface. Absent = unlimited uses. The field is runtime state on the lair pseudo-combatant — it is not stored on `MonsterTemplate` or `Monster`, and is not part of the monster upload schema.
- **Alternatives considered**: A separate `LairCreatureAbility` type extending `CreatureAbility` (over-engineered for one field; follows the `cost?` precedent exactly); tracking uses in a parallel array on `CombatantState` (more complex update path).
- **Rationale**: `cost?: number` was added to `CreatureAbility` for legendary actions with identical reasoning. `usesRemaining` is harmless on traits/reactions/legendary actions where it is absent.
- **Trade-offs**: `CreatureAbility` is used for all ability types. The field is optional and has no behavioral effect unless explicitly rendered.

### D4: Three pure functions in `lib/utils/combat.ts`

- **Chosen**:
  ```typescript
  useCharge(ability: CreatureAbility): CreatureAbility
  restoreCharge(ability: CreatureAbility): CreatureAbility
  restoreAllCharges(actions: CreatureAbility[]): CreatureAbility[]
  ```
  Each returns a new object (immutable). `useCharge` clamps `usesRemaining` to 0. `restoreCharge` increments by 1. `restoreAllCharges` resets all actions with a finite `usesRemaining` back to their original value — but since descriptions are locked and there is no "original" stored separately, `restoreAllCharges` is a manual increment-all, not a reset-to-template.
- **Alternatives considered**: Inline logic in `LairActionsSlot` (untestable); a shared `ChargesManager` class (over-engineered).
- **Rationale**: Consistent with `useLegendaryAction` / `resetLegendaryActions` precedent.

### D5: `LairActionsSlot` component in `lib/components/`

- **Chosen**: Extract all lair-specific UI to `lib/components/LairActionsSlot.tsx`. Props: `combatant: CombatantState`, `onUpdate: (updates: Partial<CombatantState>) => void`, `onNextTurn: () => void`, `isActive: boolean`. No Firebase or Next.js imports — fully unit-testable with jsdom.
- **Rationale**: Direct follow of `LegendaryActionsPanel` extraction pattern. Keeps `page.tsx` thin; enables component-level unit tests.
- **Active state**: When `isActive`, shows the full action list with Use/charge controls and a Skip button (`onNextTurn`). When not active, renders a compact "🏰 Name" badge row in the initiative list — distinct from `CombatantCard`.

### D6: Initiative render branches for `type === "lair"`

- **Chosen**: In `page.tsx` initiative-order render (`getDisplayCombatants().map(...)`), check `combatant.type === "lair"` and render `<LairActionsSlot>` instead of `<CombatantCard>`. The pre-initiative grouped view (players / monsters sections) uses `type === 'player'` and `type === 'monster'` filters — lair slots are already excluded.
- **Rationale**: Keeps `CombatantCard` clean (no lair-specific branches inside it). The lair slot is visually and functionally different enough to warrant its own component.

### D7: Add lair UI — setup and in-combat, with auto-seed option

- **Chosen**: An "Add Lair" button available both in the pre-combat setup surface and in the active combat view (same placement as "Add Combatant"). Clicking opens a small form: lair name + optional "Seed from monster" dropdown (lists monsters in the current encounter that have `lairActions[]` populated). Selecting a monster copies its `lairActions[]` to the new lair slot; otherwise the slot starts empty. Description fields are rendered in the form but locked (read-only) once combat starts.
- **Alternatives considered**: Lair configuration inside `QuickCombatantModal` — adds complexity to a modal used for every monster add; explicit non-goal.
- **Rationale**: The separate "Add Lair" flow keeps the lair concept distinct from adding a creature. Auto-seed is a UX convenience that avoids retyping data already in the stat block.

### D8: No changes to `nextTurn`

- **Chosen**: `nextTurn` advances `currentTurnIndex` by 1. When the index lands on a lair pseudo-combatant, the UI renders `LairActionsSlot` as the active slot. The DM uses or skips the lair action, then clicks Skip (which calls `nextTurn` again) or uses an action (which calls `onUpdate` to decrement a charge, then the DM manually clicks Skip/Next Turn).
- **Rationale**: This is the core architectural win of the pseudo-combatant approach. Zero turn-management risk.

## Proposal to Design Mapping

| Proposal element | Design decision |
|-----------------|----------------|
| Pseudo-combatant `type: "lair"` | D1 |
| Sort tiebreaker: lair before player/monster at init 20 | D2 |
| `usesRemaining?: number` on `CreatureAbility` | D3 |
| Pure charge functions | D4 |
| `LairActionsSlot` component | D5 |
| Initiative render branching | D6 |
| Add Lair UI (setup + in-combat, auto-seed) | D7 |
| `nextTurn` unchanged | D8 |

## Functional Requirements Mapping

| Requirement | Design element | Testability |
|-------------|---------------|-------------|
| Toggle lair on/off per encounter | D1 — add/remove pseudo-combatant | E2E: Add Lair button creates slot; remove deletes it |
| Configurable action list stored on encounter | D1 — `lairActions[]` on pseudo-combatant in `combatants[]` | Integration: combat state persists lair slot |
| Pseudo-turn at init 20, before creatures at that count | D1 + D2 — pseudo-combatant at initiative 20 with lair tiebreaker | E2E: lair slot appears before init-20 player in order |
| DM prompted with options at count 20 | D5 + D6 — `LairActionsSlot` renders when `isActive` | E2E: advance to init 20, lair panel visible |
| Visual indicator in initiative order | D5 + D6 — compact badge when not active | E2E: lair slot visible in initiative list |
| Slot is skippable | D8 — Skip calls `nextTurn()` | E2E: Skip advances to next combatant |
| Per-action charge tracking | D3 + D4 — `usesRemaining`, `useCharge`, `restoreCharge` | Unit: pure functions; E2E: Use decrements, restore increments |

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|-----------|
| `type === "lair"` guard missing at a call site | Lair slot renders HP bar / conditions | Audit all `c.type` branches; `LairActionsSlot` renders instead of `CombatantCard` for lair type |
| Dummy `CreatureStats` values on lair pseudo-combatant | Never displayed — inert | Document intent in types.ts; no combat math touches lair slots |
| `usesRemaining` leaks to non-lair UI | Field absent on existing abilities; display guarded | Guard `usesRemaining` rendering to `LairActionsSlot` only |
| Multiple lairs at same initiative — sort instability | Alphabetical by name after lair tier | Covered by tiebreaker; deterministic |
| Pre-initiative grouped view shows lair slots | Grouped view filters by `'player'` / `'monster'` — lair excluded | No change needed; already excluded by existing filters |

## Rollback / Mitigation

- Rollback trigger: CI failure, visual regression, or runtime error post-merge
- Rollback steps: Revert the single PR; no DB migration needed — all new fields are additive/optional
- Data migration: None — `type: "lair"` entries are new; existing `CombatantState` documents without lair slots deserialise cleanly. `usesRemaining` is optional on `CreatureAbility`.
- Verification after rollback: `npm test && npm run build`

## Operational Blocking Policy

- CI checks fail: fix; do not merge
- Security checks fail: remediate before merge
- Required reviews stale: escalate after 48 hours by tagging repo owner in PR

## Open Questions

No open questions. All decisions resolved in the exploration session prior to proposal.
