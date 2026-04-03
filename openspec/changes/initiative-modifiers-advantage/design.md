## Context

Initiative rolling in `app/combat/page.tsx` has two paths:

1. **Bulk roll** (`rollInitiative`, line 382) — rolls all combatants at once via `rollDie(20)[0]` + `getInitiativeBonus(c)`.
2. **Per-combatant** (`InitiativeEntry` component, line 2156) — three modes (Roll d20, Enter Dice Roll, Enter Total) via `handleRoll`, `handleDiceEntry`, `handleTotalEntry`.

Both paths store results in `InitiativeRoll` on each `CombatantState`. Currently:
- No advantage support exists anywhere.
- No flat bonus field exists beyond the DEX modifier.
- `InitiativeEntry.getBonus()` always returns `0` — DEX modifier is never applied in per-combatant rolls.
- `getInitiativeBonus()` does a secondary lookup through `characters`/`encounters` arrays even though `CombatantState extends CreatureStats` and already carries `abilityScores`.

The `rollDie(sides, count)` utility already supports multiple dice via its `count` parameter (`rollDie(20, 2)` returns two d20 results). No changes to `lib/utils/dice.ts` are needed.

## Goals / Non-Goals

**Goals:**
- Add per-combatant `initiativeAdvantage` and `initiativeFlatBonus` settings that persist for the full combat session.
- Apply those settings in both bulk and per-combatant roll paths.
- Record the full roll detail (both d20s when advantage used, flat bonus applied) in `InitiativeRoll` for transparent display.
- Fix the DEX modifier bug in `InitiativeEntry` — use `combatant.abilityScores.dexterity` directly.
- Simplify `getInitiativeBonus` to remove the redundant secondary lookup.

**Non-Goals:**
- Disadvantage on initiative.
- Advantage/disadvantage on manual entry modes (Enter Dice Roll, Enter Total).
- Automatic feat/class-feature detection.
- Batch-clear of initiative settings across all combatants.

## Decisions

### Decision 1: Settings live on `CombatantState`, not component-local state

**Choice:** Add `initiativeAdvantage?: boolean` and `initiativeFlatBonus?: number` to `CombatantState`.

**Rationale:** The issue requires settings to persist "for the duration of combat". Component-local state resets whenever the `InitiativeEntry` panel unmounts (e.g., user navigates away, panel closes). `CombatantState` is the session source of truth and is persisted to storage.

**Alternative considered:** Store in `InitiativeEntry` local state initialized from `combatant` props. Rejected — doesn't survive unmount/remount cycles.

### Decision 2: `InitiativeRoll` stores the full roll record (Option B)

**Choice:** Add `advantage?: boolean`, `altRoll?: number`, and `flatBonus?: number` to `InitiativeRoll`.

**Rationale:** Players deserve to see both d20 results when advantage was used ("d20: 15↑ dropped: 7"). The `altRoll` field enables this display without ambiguity. These are all optional fields so existing stored `InitiativeRoll` objects remain valid.

**Alternative considered:** Store only the winning roll (Option A). Rejected — removes transparency; DMs and players can't verify that advantage was actually applied.

### Decision 3: Advantage applies only to "Roll d20" mode

**Choice:** `handleDiceEntry` and `handleTotalEntry` apply `flatBonus` only; `handleRoll` applies both advantage and flat bonus.

**Rationale:** When entering a dice roll manually, the user has already resolved advantage at the physical table. Applying advantage again would double-count it.

### Decision 4: Fix `getBonus()` using `combatant.abilityScores.dexterity`

**Choice:** Replace the always-zero stub with `Math.floor((combatant.abilityScores?.dexterity ?? 10) / 2) - 5`.

**Rationale:** `CombatantState extends CreatureStats` which has `abilityScores: AbilityScores`. The data is already present on the combatant object — no prop drilling needed.

**Risk to verify:** Confirm that `buildCombatantFromSource` always populates `abilityScores` before removing the secondary lookup in `getInitiativeBonus`. If any code path builds a `CombatantState` without `abilityScores`, the `?? 10` default (DEX 10 = +0 modifier) is a safe fallback.

### Decision 5: Simplify `getInitiativeBonus` to use `combatant.abilityScores`

**Choice:** Replace the `characters`/`encounters` array lookup with direct `combatant.abilityScores.dexterity` access — same logic as the fixed `getBonus()`.

**Rationale:** The existing secondary lookup was likely added before `CombatantState` reliably carried `abilityScores`. Now that both paths can use the same field, the lookup is dead weight. Removing it reduces coupling between `getInitiativeBonus` and the page-level `characters`/`encounters` state.

**Validation:** Verify `buildCombatantFromSource` (in `lib/utils/combat.ts`) populates `abilityScores` for both player and monster combatants before simplifying.

### Decision 6: `onSettingsChange` callback on `InitiativeEntry`

**Choice:** Add `onSettingsChange: (advantage: boolean, flatBonus: number) => void` to `InitiativeEntryProps`. The component fires this on every toggle/input change.

**Rationale:** Keeps the component stateless with respect to persistence — it reads from `combatant` props and writes back through `onSettingsChange`, which maps to a new `updateCombatantInitiativeSettings` handler in the page. This pattern matches how `onSet` already works.

### Decision 7: Clear behavior — no re-roll on clear

**Choice:** Unchecking the advantage toggle clears `initiativeAdvantage`. The ✕ button on the flat bonus input resets `initiativeFlatBonus` to `0`. Neither action triggers a re-roll.

**Rationale:** Clearing a setting is distinct from rolling. The DM may clear a setting between rounds without intending to re-roll.

## Proposal → Design Mapping

| Proposal element | Design decision |
|-----------------|----------------|
| `initiativeAdvantage`, `initiativeFlatBonus` on `CombatantState` | Decision 1 |
| Richer `InitiativeRoll` (Option B) | Decision 2 |
| Advantage applies to Roll d20 only | Decision 3 |
| Fix `getBonus()` returning 0 | Decision 4 |
| Simplify `getInitiativeBonus` | Decision 5 |
| Component persistence via `onSettingsChange` | Decision 6 |
| Individual clear, no re-roll | Decision 7 |

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| `buildCombatantFromSource` may not populate `abilityScores` for all paths | Read `lib/utils/combat.ts` before simplifying `getInitiativeBonus`; keep secondary lookup as fallback if needed |
| Existing stored `CombatantState` objects lack new fields | All new fields are optional; treat `undefined` as `false`/`0` at use sites |
| `altRoll` display adds visual complexity to the initiative breakdown | Keep display compact — show dropped roll in parentheses only when `advantage === true` |
| Three call sites use `InitiativeEntry` (lines 738, 882, 897) — all need `onSettingsChange` wired | Tasks will enumerate all three; straightforward prop addition |

## Rollback / Mitigation

All type changes are additive (optional fields). If a release needs to be rolled back:
- Old code ignores unknown optional fields in stored `CombatantState` and `InitiativeRoll` objects — no migration needed.
- Feature can be hidden behind an environment flag if needed, but the scope is small enough that rollback via revert commit is preferred.

**CI blocking policy:** If tests fail after implementing, do not merge. Fix the failure before proceeding. Do not bypass linting or type checks with `--no-verify`.

## Open Questions

No open questions. All design decisions were resolved during the explore/proposal phase.
