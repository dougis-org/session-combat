## 1. Preparation

- [x] 1.1 Checkout `main` and pull with fast-forward only (`git checkout main && git pull --ff-only`)
- [x] 1.2 Create feature branch `feat/initiative-modifiers-advantage` from `main`
- [x] 1.3 Push branch to remote immediately (`git push -u origin feat/initiative-modifiers-advantage`)
- [x] 1.4 Read `lib/utils/combat.ts` — verify `buildCombatantFromSource` always populates `abilityScores` for both player and monster combatants (required before simplifying `getInitiativeBonus`)

## 2. Type Changes

- [x] 2.1 Add `initiativeAdvantage?: boolean` and `initiativeFlatBonus?: number` to `CombatantState` in `lib/types.ts`
- [x] 2.2 Add `advantage?: boolean`, `altRoll?: number`, and `flatBonus?: number` to `InitiativeRoll` in `lib/types.ts`
- [x] 2.3 Run `npx tsc --noEmit` — verify it compiles cleanly before any logic changes

## 3. Fix `getBonus()` DEX Modifier (TDD)

- [x] 3.1 **RED** — Write unit tests for the fixed `getBonus()` behavior: DEX 16 → +3, DEX 10 → 0, DEX 8 → -1, missing `abilityScores` → 0. Run tests and confirm they fail.
- [x] 3.2 **GREEN** — Fix `InitiativeEntry.getBonus()` (line 2171): replace `return 0` with `Math.floor(((combatant.abilityScores?.dexterity ?? 10) - 10) / 2)`. Run tests and confirm they pass.
- [x] 3.3 **RED** — Write unit tests for `getInitiativeBonus` using `combatant.abilityScores.dexterity` directly (same formula). Run tests and confirm they fail.
- [x] 3.4 **GREEN** — Replace the secondary `characters`/`encounters` lookup in `getInitiativeBonus` with direct `combatant.abilityScores?.dexterity ?? 10` computation. Run tests and confirm they pass.

## 4. Advantage Roll Logic (TDD)

- [x] 4.1 **RED** — Write unit tests for advantage roll math: `rollDie(20, 2)` → higher value taken as `roll`, lower stored as `altRoll`, `advantage: true` set on `InitiativeRoll`. Run tests and confirm they fail.
- [x] 4.2 **GREEN** — Update `InitiativeEntry.handleRoll()`: when `advantage` is true call `rollDie(20, 2)`, take `Math.max` as `roll`, store `Math.min` as `altRoll`, set `advantage: true` on `InitiativeRoll`. Run tests and confirm they pass.
- [x] 4.3 **RED** — Write unit tests verifying that without advantage `handleRoll()` uses a single die, `altRoll` is absent, and `advantage` is absent/false. Run tests and confirm they fail.
- [x] 4.4 **GREEN** — Verify the single-die path is correct (no changes needed or minimal guard). Run tests and confirm they pass.

## 5. Flat Bonus Application (TDD)

- [x] 5.1 **RED** — Write unit tests for flat bonus in `handleRoll()`: total = roll + DEX modifier + flatBonus, `InitiativeRoll.flatBonus` = bonus value. Run tests and confirm they fail.
- [x] 5.2 **GREEN** — Update `handleRoll()` to apply `initiativeFlatBonus ?? 0` to total and store it in `InitiativeRoll.flatBonus`. Run tests and confirm they pass.
- [x] 5.3 **RED** — Write unit tests for flat bonus in `handleDiceEntry()`: total = dice + DEX modifier + flatBonus. Run tests and confirm they fail.
- [x] 5.4 **GREEN** — Update `handleDiceEntry()` to apply and record `flatBonus`. Run tests and confirm they pass.
- [x] 5.5 **RED** — Write unit tests for flat bonus in `handleTotalEntry()`: total = entered value + flatBonus. Run tests and confirm they fail.
- [x] 5.6 **GREEN** — Update `handleTotalEntry()` to apply and record `flatBonus`. Run tests and confirm they pass.

## 6. Bulk Roll Advantage + Flat Bonus (TDD)

- [x] 6.1 **RED** — Write unit tests for bulk `rollInitiative`: combatant with `initiativeAdvantage: true` produces `InitiativeRoll` with `advantage: true`, `altRoll` set, and `roll` = higher die. Run tests and confirm they fail.
- [x] 6.2 **GREEN** — Update bulk `rollInitiative` (line 382) to call `rollDie(20, 2)` when `c.initiativeAdvantage` is true, take `Math.max`, store `Math.min` as `altRoll`, set `advantage: true`. Run tests and confirm they pass.
- [x] 6.3 **RED** — Write unit tests for bulk roll flat bonus: combatant with `initiativeFlatBonus: 5` produces total = roll + DEX + 5, `InitiativeRoll.flatBonus` = 5. Run tests and confirm they fail.
- [x] 6.4 **GREEN** — Update bulk `rollInitiative` to apply `c.initiativeFlatBonus ?? 0` to total and store in `InitiativeRoll.flatBonus`. Run tests and confirm they pass.

## 7. `InitiativeEntry` Component Interface + Persistence (TDD)

- [x] 7.1 Add `onSettingsChange: (advantage: boolean, flatBonus: number) => void` to `InitiativeEntryProps`
- [x] 7.2 Initialize local `advantage` state from `combatant.initiativeAdvantage ?? false` and `flatBonus` state from `combatant.initiativeFlatBonus ?? 0`
- [x] 7.3 **RED** — Write component tests: toggling advantage checkbox fires `onSettingsChange(true, currentFlatBonus)` / `onSettingsChange(false, currentFlatBonus)`. Run tests and confirm they fail.
- [x] 7.4 **GREEN** — Add advantage checkbox UI below mode buttons; wire to `onSettingsChange`. Run tests and confirm they pass.
- [x] 7.5 **RED** — Write component tests: changing flat bonus input fires `onSettingsChange`; clicking ✕ fires `onSettingsChange(currentAdvantage, 0)`. Run tests and confirm they fail.
- [x] 7.6 **GREEN** — Add flat bonus number input with ✕ clear button; wire both to `onSettingsChange`. Run tests and confirm they pass.
- [x] 7.7 Add `updateCombatantInitiativeSettings(id: string, advantage: boolean, flatBonus: number)` page-level handler that updates `CombatantState` and calls `saveCombatState`
- [x] 7.8 Wire `onSettingsChange` on all three `InitiativeEntry` usages in `app/combat/page.tsx` (lines ~738, ~882, ~897)

## 8. Initiative Display (TDD)

- [x] 8.1 **RED** — Write component tests: when `initiativeRoll.advantage === true`, display shows winning die with ↑ notation and dropped die (e.g., "d20: 15↑ (dropped: 7)"). Run tests and confirm they fail.
- [x] 8.2 **GREEN** — Update `InitiativeEntry` roll result display (around line 2334) to render advantage detail. Run tests and confirm they pass.
- [x] 8.3 **RED** — Write component tests: when `initiativeRoll.flatBonus` is present and non-zero, display shows it as a separate addend. Run tests and confirm they fail.
- [x] 8.4 **GREEN** — Update both the `InitiativeEntry` display and the combat tracker initiative breakdown (around line 1689) to show flat bonus. Run tests and confirm they pass.

## 9. Refactor

- [x] 9.1 Review all changed code for duplication between `handleRoll` and bulk `rollInitiative` — extract a shared `buildInitiativeRoll(combatant, roll, altRoll)` helper if it reduces duplication
- [x] 9.2 Run full test suite (`npm test`) — all tests must pass, output pristine (no errors or warnings)
- [x] 9.3 Run `npx tsc --noEmit` and `npm run lint` — no new errors

## 10. Pre-PR Code Review

- [x] 10.1 Capture SHAs: `BASE_SHA=$(git rev-parse origin/main)` and `HEAD_SHA=$(git rev-parse HEAD)`
- [ ] 10.2 Dispatch `superpowers:code-reviewer` subagent with:
  - **WHAT_WAS_IMPLEMENTED**: Per-combatant initiative advantage toggle and flat bonus, DEX modifier fix in `InitiativeEntry.getBonus()`, `getInitiativeBonus` simplification, richer `InitiativeRoll` record with `altRoll`/`flatBonus`/`advantage`, updated display breakdowns
  - **PLAN_OR_REQUIREMENTS**: `openspec/changes/initiative-modifiers-advantage/tasks.md` and `openspec/changes/initiative-modifiers-advantage/specs/initiative-modifiers/spec.md`
  - **BASE_SHA**: value from 10.1
  - **HEAD_SHA**: value from 10.1
  - **DESCRIPTION**: Initiative modifiers feature (issue #95) — advantage, flat bonus, DEX fix
- [ ] 10.3 Fix all Critical issues from review before proceeding
- [ ] 10.4 Fix all Important issues from review before proceeding

## 11. PR and Merge

- [ ] 11.1 Commit all changes to `feat/initiative-modifiers-advantage` with a message referencing issue #95
- [ ] 11.2 Push branch and open PR to `main`
- [ ] 11.3 Monitor CI checks — diagnose and fix any failures, push fixes to branch
- [ ] 11.4 Address all review comments — commit fixes and push until no unresolved comments remain
- [ ] 11.5 Enable auto-merge once all CI checks are green and no blocking review comments remain

## 12. Post-Merge

- [ ] 12.1 Checkout `main` and pull (`git checkout main && git pull --ff-only`)
- [ ] 12.2 Verify merged changes appear on `main`
- [ ] 12.3 Sync approved spec delta to `openspec/specs/initiative-modifiers/spec.md` (copy from `openspec/changes/initiative-modifiers-advantage/specs/initiative-modifiers/spec.md`)
- [ ] 12.4 Archive the change in a single atomic commit: copy `openspec/changes/initiative-modifiers-advantage/` to `openspec/archive/initiative-modifiers-advantage/` and delete the original — do not split into two commits
- [ ] 12.5 Push archive commit to `main`
- [ ] 12.6 Delete local feature branch (`git branch -d feat/initiative-modifiers-advantage`)
