## Why

Initiative rolls in D&D 5e frequently involve modifiers beyond the base DEX bonus — the Alert feat, Jack of All Trades, bardic inspiration, and advantage from various sources are common at most tables. The current system only supports a single d20 + DEX modifier, forcing DMs to mentally adjust results and enter totals manually. This ships the core initiative modifiers needed to run a standard 5e session correctly.

## What Changes

- **New fields on `CombatantState`**: `initiativeAdvantage?: boolean` and `initiativeFlatBonus?: number` — per-combatant settings that persist for the full combat session.
- **Richer `InitiativeRoll` record**: adds `advantage?: boolean`, `altRoll?: number` (dropped d20), and `flatBonus?: number` so the roll history captures exactly what was rolled.
- **Bulk roll respects per-combatant settings**: "Roll All" now reads each combatant's `initiativeAdvantage` and `initiativeFlatBonus` when computing initiative.
- **`InitiativeEntry` UI**: adds an advantage toggle and flat bonus input (with individual clear controls) below the existing mode buttons.
- **Bug fix — `getBonus()` always returned 0**: `InitiativeEntry.getBonus()` now computes the DEX modifier from `combatant.abilityScores.dexterity` (which is already present on `CombatantState` via `CreatureStats`).
- **Simplify `getInitiativeBonus`**: the bulk-roll helper currently does a secondary lookup through `characters`/`encounters` arrays; since `CombatantState` already carries `abilityScores`, it can use `combatant.abilityScores.dexterity` directly.

## Capabilities

### New Capabilities

- `initiative-modifiers`: Per-combatant initiative advantage toggle and flat bonus field, persisted for the combat session, applied during both bulk and per-combatant rolls.

### Modified Capabilities

- `dice-rolling`: No requirement changes — the existing `rollDie(20, 2)` already supports two-die rolls. No spec delta needed.

## Impact

- **`lib/types.ts`** — `CombatantState` and `InitiativeRoll` interfaces
- **`app/combat/page.tsx`** — `rollInitiative` (bulk roll), `getInitiativeBonus`, `InitiativeEntry` component and its props interface, initiative display in the combat tracker header
- **Tests** — new unit tests for advantage roll math and DEX modifier fix; new component tests for the UI controls
- **No API or persistence schema changes** — `CombatantState` is stored in the combat session document; optional fields are backwards-compatible with existing stored sessions

## Problem Space

**In scope:**
- Advantage toggle per combatant (roll 2d20, take higher)
- Flat bonus field per combatant (additive on top of DEX modifier)
- Settings persist for the duration of combat
- Settings clearable individually
- Bug fix: DEX modifier applied correctly in per-combatant roll UI
- Simplification of `getInitiativeBonus` to use `combatant.abilityScores` directly

**Out of scope:**
- Disadvantage (not a standard 5e initiative rule; separate issue if ever needed)
- Tiebreaker rules (separate issue)
- Initiative modifiers from spell effects or conditions — those would be entered as flat bonuses manually
- Proficiency bonus or expertise applied to initiative — DM enters as flat bonus

## Risks

- **`getInitiativeBonus` simplification**: The existing secondary lookup through `characters`/`encounters` may exist because `abilityScores` was not reliably populated on `CombatantState` at some point. Must verify that `buildCombatantFromSource` always populates `abilityScores` before removing the lookup.
- **Backwards compatibility**: Existing stored `CombatantState` objects have no `initiativeAdvantage` or `initiativeFlatBonus` — code must treat absence as `false`/`0` respectively.

## Open Questions

No unresolved ambiguity. Design decisions confirmed during exploration:
- Settings live on `CombatantState` (not local component state) for session persistence.
- `InitiativeRoll` stores both d20 results (Option B) for transparent display.
- Advantage applies only to "Roll d20" mode; manual entry modes use flat bonus only.
- Clearing advantage = unchecking the toggle; clearing flat bonus = ✕ button resets to 0.
- Neither clear action triggers a re-roll.

## Non-Goals

- No UI for entering the *reason* for a bonus (e.g., "Alert feat") — the value is sufficient.
- No automatic detection of feats or class features from character data.
- No batch-clear of initiative modifier settings across all combatants.

---

*If scope changes after approval, `proposal.md`, `design.md`, `specs/`, and `tasks.md` must all be updated before `/opsx:apply` proceeds.*
