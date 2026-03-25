## Why

- **Problem statement**: Combatants have no way to track temporary hit points during combat. Spells and abilities that grant temp HP (e.g. *False Life*, *Aid*, Paladin *Lay on Hands* overflow) are a first-class D&D 5e mechanic; the tracker ignores them entirely, forcing DMs to apply temp HP manually by pre-adjusting max HP — which corrupts the health bar and the permanent stat.
- **Why now**: Party selection for combat shipped in #86, completing the core encounter setup flow. HP tracking is the next most impactful combat mechanic gap (Feature List §1.1, GitHub issue #87).
- **Business/user impact**: Without temp HP, DMs must mentally track an extra number per combatant and adjust it manually — error-prone in fast combat. Correct absorption logic also prevents the common mistake of applying full damage to a combatant who has temp HP buffering them.

## Problem Space

- **Current behavior**: `CombatantState` has only `hp` and `maxHp` (inherited from `CreatureStats`). Damage is applied directly to `hp`. The health bar is a single-color segment. There is no way to represent or absorb temp HP.
- **Desired behavior**: Each combatant can have a `tempHp` value. Damage drains temp HP first; overflow goes to regular HP. The health bar shows a visually distinct extension for temp HP. DMs can set temp HP via the existing HP adjustment widget with a mode toggle, and temp HP is cleared when combat ends.
- **Constraints**: `tempHp` must be optional on `CombatantState` so existing persisted combat states deserialise without error. The no-stacking rule (always take the higher value) must be enforced at the point of setting temp HP.
- **Assumptions**: Temp HP is combat-runtime state only — it does not persist to the `Character` or `Monster` document.
- **Edge cases considered**: Damage exactly equal to temp HP (temp goes to 0, regular HP unchanged); damage greater than temp HP (temp zeroed, overflow to regular); setting a lower temp HP value when one already exists (silently ignored, current higher value retained); combat end (temp HP disappears with the combat state).

## Scope

### In Scope

- `tempHp?: number` field on `CombatantState` (optional, defaults to 0/undefined = none)
- Damage math extracted to `lib/utils/combat.ts` as pure functions: `applyDamage`, `applyHealing`, `setTempHp`
- "Temp" mode toggle on the existing HP adjustment widget — transforms the Heal button into "Set Temp"
- Health bar: second segment in a distinct colour representing temp HP (extends beyond maxHp proportion)
- Numeric display update: show `+N tmp` alongside current/max HP when temp HP is non-zero
- Clear temp HP when combat ends (natural: combat state is dropped on `endCombat`)
- Unit tests for all damage math functions
- E2E scenario: set temp HP, take damage (absorbed), take more damage (overflow), end combat (temp clears)

### Out of Scope

- Explicit mid-combat "Clear Temp HP" button (deferred; combat end is sufficient for now)
- Long rest mechanic to clear temp HP
- Temp HP on `Monster`, `Character`, or `CreatureStats` base type
- Damage type / resistance interactions (Feature List §1.2)
- HP undo / damage history (Feature List §1.3)

## What Changes

- **`lib/types.ts`** — add `tempHp?: number` to `CombatantState`
- **`lib/utils/combat.ts`** (new file) — pure functions: `applyDamage`, `applyHealing`, `setTempHp`
- **`app/combat/page.tsx`** — replace inline damage math with `combat.ts` calls; add Temp mode toggle to HP widget; update health bar to two-segment rendering; update HP numeric display
- **`tests/unit/combat/combat.test.ts`** (new) — unit tests for all three combat utility functions
- **`tests/e2e/combat.spec.ts`** — add temp HP E2E scenario

## Capabilities

### New Capabilities
- `temp-hp-tracking`: Temporary hit points per combatant, with correct 5e damage absorption ordering, no-stacking enforcement, and visual health bar distinction

### Modified Capabilities
- None — existing damage/heal logic is refactored into `combat.ts` but behaviour for non-temp HP cases is preserved

## Impact

- **`lib/types.ts`** — additive type change, backward compatible
- **`lib/utils/combat.ts`** — new file, no downstream impact beyond what imports it
- **`app/combat/page.tsx`** — HP widget and health bar UI changes; damage logic refactored (not rewritten)
- **`app/api/combat/[id]/route.ts`** — no change; the PUT handler already accepts the full `combatants[]` array, so `tempHp` round-trips transparently
- No database migrations required (`tempHp` is optional and absent from existing documents)
- No new npm dependencies

## Open Questions

1. ~~Should the temp HP segment colour be gold or blue?~~ — Resolved: blue (`bg-blue-400`).

## Non-Goals

- Real-time multiplayer sync of temp HP
- Importing temp HP from D&D Beyond character sheets
- Displaying temp HP in the combatant detail pop-over (out of scope for this change; detail view shows base stats)

## Risks

- Risk: Inline damage math in `combat/page.tsx` has no unit tests today; extraction is a refactor with behavioural risk.
  - Impact: Regression in existing damage/heal flows.
  - Mitigation: Unit-test `applyDamage` and `applyHealing` covering all existing code paths before touching the component.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
