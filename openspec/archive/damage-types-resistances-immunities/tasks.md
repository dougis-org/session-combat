## 1. Preparation

- [x] 1.1 Checkout `main` and pull with fast-forward only: `git checkout main && git pull --ff-only`
- [x] 1.2 Create feature branch: `git checkout -b feat/damage-types-resistances-immunities`
- [x] 1.3 Push branch to remote immediately: `git push -u origin feat/damage-types-resistances-immunities`

## 2. Type System Foundation

- [x] 2.1 Add `DAMAGE_TYPES` constant and `DamageType` union type to `lib/constants.ts`
- [x] 2.2 Add `ActiveDamageEffect` interface and `DamageEffectPreset` interface to `lib/types.ts`
- [x] 2.3 Add `activeDamageEffects?: ActiveDamageEffect[]` to `CombatantState` in `lib/types.ts` (NOT on `CreatureStats`)
- [x] 2.4 Add `DAMAGE_EFFECT_PRESETS` constant to `lib/constants.ts` with all 7 initial presets (Rage, Stoneskin, Protection from Energy, Fire Shield Warm, Fire Shield Chill, Absorb Elements, Warding Bond)
- [x] 2.5 Change `damageResistances`, `damageImmunities`, `damageVulnerabilities` on `CreatureStats` in `lib/types.ts` from `string[]` to `DamageType[]`
- [x] 2.6 Run `npx tsc --noEmit` — expect compilation errors surfacing all freeform string usages; note each one

## 3. SRD Data Fixes (one-time migration)

- [x] 3.1 Fix line 957 in `lib/data/srd-monsters.ts`: remove `'from nonmagical attacks'` from resistance array
- [x] 3.2 Fix line 1404: replace `'nonmagical bludgeoning'` with `'bludgeoning'`
- [x] 3.3 Fix line 1575: remove `'from nonmagical attacks'` from resistance array
- [x] 3.4 Fix line 1618: remove `'from nonmagical attacks'` and `"that aren't adamantine"` from resistance array
- [x] 3.5 Run `npx tsc --noEmit` — verify srd-monsters.ts errors are resolved
  - Also fixed: all 7 monster data files in `lib/data/monsters/`, `lib/validation/monsterUpload.ts`, `lib/dndBeyondCharacterImport.ts`

## 4. Combat Utility — TDD

- [x] 4.1 Write failing tests in `tests/unit/combat/damageResistance.test.ts` for `applyDamageWithType()` covering all spec scenarios: no-type passthrough, immune, resistant (even/odd), vulnerable, resistant+vulnerable cancel, immune-beats-vulnerable priority, pre-temp-HP ordering, permanent+active merge
- [x] 4.2 Confirm tests fail (red) before writing any implementation
- [x] 4.3 Add `applyDamageWithType()` to `lib/utils/combat.ts`: signature `(hp, tempHp, rawDamage, type, sources) → { hp, tempHp, effectiveDamage }`; implement priority logic
- [x] 4.4 Run tests — confirm all new tests pass (green), no regressions in existing `applyDamage` tests

## 5. Combatant Builder Fixes — TDD

- [x] 5.1 Write failing tests in `tests/unit/combat/combatantBuilder.test.ts` verifying `buildCombatantFromSource()` produces a `CombatantState` with all four resistance fields copied
- [x] 5.2 Confirm tests fail (red)
- [x] 5.3 Extract `buildCombatantFromSource()` to `lib/utils/combat.ts`; copy all four resistance fields from source
- [x] 5.4 Update `addCombatantFromLibrary()` in `app/combat/page.tsx` to use `buildCombatantFromSource`
- [x] 5.5 Update both paths in `startCombatWithSetupCombatants()` to use `buildCombatantFromSource`
- [x] 5.6 Run tests — confirm all new tests pass (green), run `npx tsc --noEmit` — no remaining type errors

## 6. Active Effects Merge Helper — TDD

- [x] 6.1 Write failing unit tests for `mergeActiveDamageEffects` and `removeActiveDamageEffects` in `tests/unit/combat/damageResistance.test.ts`
- [x] 6.2 Confirm tests fail (red)
- [x] 6.3 Implement `mergeActiveDamageEffects` and `removeActiveDamageEffects` in `lib/utils/combat.ts`
- [x] 6.4 Run tests — confirm all new tests pass (green)

## 7. Active Effects — Add/Remove UI on Combatant Card

- [x] 7.1 Add "Active Effects" section to combatant card in `app/combat/page.tsx`; hidden when no damage modifiers and panel closed
- [x] 7.2 Render stat-based immunities/resistances/vulnerabilities as read-only badges (purple/green/red)
- [x] 7.3 Render active effects as dismissible yellow badges with × remove button
- [x] 7.4 Add "+ Add effect" button that opens preset picker from `DAMAGE_EFFECT_PRESETS`
- [x] 7.5 Add custom effect section using the selected damage type + kind buttons
- [x] 7.6 On apply, update `combatant.activeDamageEffects` via `onUpdate`
- [x] 7.7 Run `npm test` — confirm no regressions

## 8. HP Adjustment Widget — Damage Type Selector

- [x] 8.1 Add damage type `<select>` dropdown to the direct HP adjustment widget, grouped by family
- [x] 8.2 Add same dropdown to the deal-damage-to-target widget
- [x] 8.3 Wire both to call `applyDamageWithType()` when a type is selected; fall back to `applyDamage()` when no type selected
- [x] 8.4 Run `npm test` — confirm no regressions

## 9. CreatureStatsForm Tag Picker

- [x] 9.1 Replace `damageVulnerabilities`, `damageResistances`, `damageImmunities` free-text textareas in `lib/components/CreatureStatsForm.tsx` with grouped checkbox multi-select pickers sourced from `DAMAGE_TYPE_GROUPS`
- [x] 9.2 Verify existing valid values are pre-selected correctly when form loads
- [x] 9.3 Run `npm test` — confirm no regressions

## 10. Refactor Pass

- [x] 10.1 Review all new and changed code for duplication — extracted merge/lookup patterns into shared helpers
- [x] 10.2 `app/combat/page.tsx` combatant builder sites — all three paths now share `buildCombatantFromSource`
- [x] 10.3 `applyDamageWithType()` — priority logic reads clearly (immunity check → resistance/vulnerability booleans → decision)
- [x] 10.4 Active effects UI — inline logic uses pure helpers `mergeActiveDamageEffects`/`removeActiveDamageEffects`; no duplication
- [x] 10.5 Run `npm test` and `npx tsc --noEmit` after refactor — all tests pass, zero source errors

## 11. Pre-PR Validation

- [x] 11.1 Run `npx tsc --noEmit` — zero source errors (test-file pre-existing errors unchanged)
- [x] 11.2 Run `npm test` — all 419 unit tests pass
- [x] 11.3 Run `npm run lint` — no new lint errors (pre-existing error in useAuth.test.ts unchanged)
- [x] 11.4 Manual smoke test: add a fire elemental (fire immunity) to combat, apply fire damage — HP unchanged, "Immune" feedback shown
- [x] 11.5 Manual smoke test: add a character with `damageResistances: ['poison']`, apply poison damage — halved, "Resisted" feedback shown
- [x] 11.6 Manual smoke test: apply damage with no type selected — raw damage applied, no regression
- [x] 11.7 Manual smoke test: open CreatureStatsForm, verify tag picker shows all 13 types, existing values pre-selected
- [x] 11.8 Manual smoke test: add Rage to a Barbarian mid-combat, apply bludgeoning — resisted; remove Rage, apply again — raw damage
- [x] 11.9 Manual smoke test: apply Protection from Energy preset, pick cold — cold damage halved on next hit
- [x] 11.10 Manual smoke test: verify all 7 presets appear in the add-effect picker

## 12. PR and Review Loop

- [x] 12.1 Commit all changes with a descriptive message referencing issue #88
- [x] 12.2 Push to remote and open PR against `main`
- [x] 12.3 Wait for CI results — if any check fails: diagnose, fix locally, run `npm test` + `npx tsc --noEmit` to confirm clean, commit fix, push; repeat until CI is fully green
- [x] 12.4 For each review comment received: address the feedback, run `npm test` to confirm nothing broke, commit the fix, push — repeat this loop until zero unresolved comments remain
- [x] 12.5 If new CI failures are introduced by review fixes: return to 12.3 loop before re-requesting review
- [x] 12.6 Enable auto-merge only when CI is fully green AND no blocking review comments remain — do not force-merge

## 13. Post-Merge

- [x] 13.1 Checkout `main` and pull: `git checkout main && git pull --ff-only`
- [x] 13.2 Verify merged changes appear on `main`
- [x] 13.3 Sync approved spec deltas: copy `openspec/changes/damage-types-resistances-immunities/specs/` contents to `openspec/specs/` (merge into existing `temp-hp-tracking/`, create new `damage-types/`, `damage-resistance-application/`, `combat-damage-effects/`)
- [x] 13.4 Archive change directory: move `openspec/changes/damage-types-resistances-immunities/` to `openspec/archive/damage-types-resistances-immunities/` in a single atomic commit (copy + delete)
- [x] 13.5 Push archive commit to `main`
- [x] 13.6 Delete local and remote feature branch: `git branch -d feat/damage-types-resistances-immunities && git push origin --delete feat/damage-types-resistances-immunities`
