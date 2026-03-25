## Context

- **Relevant architecture**: `CombatantState extends CreatureStats` (both in `lib/types.ts`). Damage is applied inline in two places inside `CombatCard` (the per-combatant component in `app/combat/page.tsx`): `adjustHp` (self damage/heal) and `applyDamageToTarget` (targeting flow). The combat state is persisted via `PUT /api/combat/[id]` which accepts the full `combatants[]` array — no targeted HP endpoint exists.
- **Dependencies**: No new npm packages. Pure TypeScript functions only.
- **Interfaces/contracts touched**: `CombatantState` (type), `CombatCard` component props (unchanged — `onUpdate: (updates: Partial<CombatantState>) => void` already accepts arbitrary partial updates).

## Goals / Non-Goals

### Goals

- Add `tempHp?: number` to `CombatantState` without breaking existing persisted states
- Extract damage/heal math into pure, unit-testable functions in `lib/utils/combat.ts`
- Enforce 5e absorption order: temp HP absorbs damage first, overflow drains regular HP
- Enforce no-stacking rule: `setTempHp` only applies the new value if it is higher than the current value
- Add a Temp mode toggle to the existing HP adjustment widget
- Extend the health bar to two segments, visually distinct for temp HP
- Update the HP numeric display to show temp HP when non-zero

### Non-Goals

- Explicit mid-combat clear button for temp HP
- Long rest mechanic
- API changes

## Decisions

### D1: `tempHp` on `CombatantState` only, not `CreatureStats`

- **Chosen**: Add `tempHp?: number` to `CombatantState`; leave `CreatureStats`, `Monster`, and `Character` unchanged.
- **Alternatives considered**: Adding to `CreatureStats` (would affect all creature types); a parallel `CombatantOverlay` type (over-engineered).
- **Rationale**: Temp HP is a combat-runtime concept — it is not part of a creature's stat block and should not persist to character or monster documents. Optional field means existing `CombatantState` documents (where `tempHp` is absent) deserialise cleanly as `undefined`, treated as `0`.
- **Trade-offs**: Future feature that wants temp HP at character-sheet level would need to revisit this.

### D2: Extract combat math to `lib/utils/combat.ts`

- **Chosen**: New file with three pure functions:
  ```typescript
  applyDamage(hp: number, tempHp: number, damage: number): { hp: number; tempHp: number }
  applyHealing(hp: number, maxHp: number, amount: number): { hp: number }
  setTempHp(currentTempHp: number, newValue: number): { tempHp: number }
  ```
- **Alternatives considered**: Keeping math inline in the component (untestable); a class-based `CombatEngine` (over-engineered for three functions).
- **Rationale**: Pure functions are trivially unit-testable. Extraction also provides a stable home for future combat math (damage types, resistances, undo history). The component stays thin — it handles UI state, calls utilities for business logic.
- **Trade-offs**: A thin indirection layer; worth it for testability.

### D3: Temp mode toggle transforms the Heal button

- **Chosen**: A `Temp [ ]` checkbox next to the existing `[Damage] [Heal]` buttons. When checked, the Heal button label changes to `Set Temp` and its click handler calls `setTempHp` instead of `applyHealing`. The Damage button behaviour is unchanged.
- **Alternatives considered**: A third `[+Temp]` button (adds a button; healing and temp HP are mutually exclusive actions on the same number); a separate temp HP input field (requires more UI space and a separate flow).
- **Rationale**: A single number and two mutually exclusive actions (heal vs. set temp) maps cleanly to a mode toggle. No new buttons, no new input fields — the existing number input is reused.
- **Trade-offs**: The toggle is a mild cognitive load; mitigated by the clear label change on the button.

### D4: Two-segment health bar

- **Chosen**: The bar container represents `maxHp + tempHp` total. Two `<div>` segments render inside it:
  - Segment 1 (left): regular HP, width = `(hp / total) * 100%`, colour = existing green/yellow/red logic
  - Segment 2 (right): temp HP, width = `(tempHp / total) * 100%`, colour = `bg-blue-400` (blue)
  - When `tempHp` is 0/undefined, `total = maxHp` and only segment 1 renders — identical to current behaviour.
- **Alternatives considered**: A separate temp HP bar below the main bar (requires more vertical space); overlaying temp HP as an opacity layer (complex, hard to read).
- **Rationale**: The extending bar is the standard D&D tooling convention (e.g. D&D Beyond). Blue distinguishes temp HP from the green/yellow/red regular HP spectrum without clashing, and reads as "magical/temporary" rather than a health warning.
- **Trade-offs**: Bar width proportions change when temp HP is present (regular HP segment appears narrower). Acceptable — the visual correctly conveys the relationship.

### D5: Numeric display

- **Chosen**: When `tempHp > 0`, append `+N tmp` after the current/max display:
  `Current: 42  Max: 80  +14 tmp`
  The `+N tmp` label uses blue (`text-blue-400`) to match the bar segment.
- **Alternatives considered**: A separate "Temp HP" row (more vertical space); showing `42 + 14 tmp / 80` in the main HP label (harder to parse).
- **Rationale**: Inline suffix is compact and scannable. Blue colouring links it visually to the bar segment.

### D6: Clear on combat end — no explicit action needed

- **Chosen**: No dedicated "clear temp HP" button. Temp HP disappears when `endCombat` calls `saveCombatState(null)` → `setCombatState(null)`, dropping the entire combat state.
- **Alternatives considered**: A "×" button per combatant (useful for mid-combat clearing; deferred to a future change).
- **Rationale**: The user confirmed "clear when combat ends is sufficient for now." The existing end-combat flow already handles this naturally.

## Proposal to Design Mapping

- Temp HP field on combatant → D1 (`CombatantState.tempHp?`)
- Damage absorbed by temp HP → D2 (`applyDamage` function)
- Visual distinction in health bar → D4 (two-segment bar) + D5 (numeric suffix)
- Temp HP cleared on combat end → D6 (natural via `setCombatState(null)`)
- No stacking → D2 (`setTempHp` uses `Math.max`)
- Temp HP editable during combat → D3 (Temp mode toggle)

## Functional Requirements Mapping

- Requirement: Damage drains temp HP first, overflow to regular HP
  - Design element: `applyDamage` in `combat.ts`
  - Acceptance criteria reference: AC2 (issue #87)
  - Testability notes: Pure function — full unit test coverage, no mocks needed

- Requirement: No stacking — higher value always wins
  - Design element: `setTempHp` in `combat.ts`
  - Acceptance criteria reference: AC5 (issue #87)
  - Testability notes: Unit test: setting lower value is ignored; setting higher value updates

- Requirement: Visual distinction in health bar
  - Design element: D4 (two-segment bar, gold colour)
  - Acceptance criteria reference: AC3 (issue #87)
  - Testability notes: E2E — check `data-testid="temp-hp-bar"` segment width > 0 when tempHp set

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Inline damage math refactor introduces regression | Existing heal/damage flows broken | Unit-test `applyDamage`/`applyHealing` covering all existing paths before touching the component |
| Optional `tempHp` field adds `undefined` checks throughout component | Runtime errors if comparisons assume `number` | Treat `tempHp ?? 0` at every read site in the component |
| Bar proportion shift confuses users | Health bar looks "wrong" when temp HP is active | Visual is intentional; gold segment is self-explanatory |

## Rollback / Mitigation

- Rollback trigger: CI failure or visual regression found post-merge
- Rollback steps: Revert the single PR; no DB migration needed (field is additive/optional)
- Data migration considerations: None — `tempHp` is optional; existing documents without the field continue to work
- Verification after rollback: Run `npm test` and `npm run build`

## Operational Blocking Policy

- If CI checks fail: fix; do not merge
- If security checks fail: remediate before merge
- If required reviews are blocked/stale: escalate after 48 hours
- Escalation path: tag repo owner in PR

## Open Questions

- ~~Colour choice for temp HP segment~~ — Resolved: blue (`bg-blue-400`) for bar segment, `text-blue-400` for numeric label.
