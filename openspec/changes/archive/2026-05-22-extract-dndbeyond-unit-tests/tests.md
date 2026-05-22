---
name: tests
description: Tests for the extract-dndbeyond-unit-tests change
---

# Tests

## Overview

This change is itself a test refactor — the "implementation" is the test files. The TDD workflow here means: write each new test file, verify it fails if the module function is broken, verify it passes against the real module, then remove the corresponding test from the monolith and verify the monolith still passes.

Each task below maps to a test file and its acceptance scenarios in `specs/test-migration.md`.

## Testing Steps

For each task (T1–T8):

1. **Write the test file** (or extend the existing one) with tests that call the module function directly.
2. **Run the new file in isolation** — confirm all tests pass against the real implementation.
3. **Remove the corresponding tests from the monolith** — confirm the monolith still passes with the remaining tests.
4. **Run the full unit test suite** — confirm total count has not decreased.

## Test Cases

### T1 — `dndBeyond-identity.test.ts`

- [ ] `parseDndBeyondCharacterUrl` throws on non-URL string → maps to L46 / spec: isolation scenario
- [ ] `parseDndBeyondCharacterUrl` throws on unsupported host → maps to L52 / spec: isolation scenario
- [ ] `parseDndBeyondCharacterUrl` parses URL with share code correctly → maps to L60 / spec: migrated tests pass
- [ ] `parseDndBeyondCharacterUrl` parses URL without share code → maps to L72 / spec: migrated tests pass
- [ ] `parseDndBeyondCharacterUrl` trims whitespace from URL → maps to L84 / spec: migrated tests pass
- [ ] `requireCharacterIdentity` throws on missing id → maps to L189 / spec: isolation scenario
- [ ] `requireCharacterIdentity` throws on empty name → maps to L189 / spec: isolation scenario
- [ ] File imports only from `lib/import/dndBeyond-identity` (no orchestrator import) → spec: imports from module not orchestrator

### T2 — `dndBeyond-classes.test.ts`

- [ ] `normalizeClasses` throws when no supported classes remain → maps to L205 / spec: migrated tests pass
- [ ] `normalizeClasses` merges duplicate classes by summing levels → maps to L230 / spec: migrated tests pass
- [ ] `normalizeClasses` warns about unsupported classes → maps to L230 / spec: migrated tests pass
- [ ] `normalizeRace` returns "Mountain Dwarf" for correct input → maps to L676 / spec: migrated tests pass
- [ ] `normalizeRace` returns "Aasimar" for aasimar input → maps to L685 / spec: migrated tests pass
- [ ] `normalizeRace` normalizes mixed-case race names → maps to L695 / spec: migrated tests pass
- [ ] `normalizeRace` falls back to base race via substring matching → maps to L707 / spec: migrated tests pass

### T3 — `dndBeyond-ability-scores.test.ts`

- [ ] `normalizeAbilityScores` throws when stat ID 6 (charisma) is missing → maps to L221 / spec: migrated tests pass
- [ ] `normalizeAbilityScores` uses override stat when present → maps to L270 / spec: migrated tests pass
- [ ] `normalizeMaxHp` returns overrideHitPoints when set → maps to L270 / spec: migrated tests pass
- [ ] `normalizeCurrentHp` clamps to maxHp when currentHitPoints exceeds it → maps to L294 / spec: migrated tests pass
- [ ] `normalizeCurrentHp` derives HP from removedHitPoints when current is undefined, clamps at 0 → maps to L305 / spec: migrated tests pass
- [ ] `normalizeMaxHp` adds hit-points-per-level modifier times level → maps to L580 / spec: migrated tests pass
- [ ] `normalizeMaxHp` adds flat hit-points modifier → maps to L602 / spec: migrated tests pass
- [ ] `normalizeMaxHp` adds both per-level and flat HP modifiers → maps to L623 / spec: migrated tests pass
- [ ] `normalizeMaxHp` returns overrideHitPoints unchanged when HP modifiers also present → maps to L654 / spec: migrated tests pass

### T4 — `dndBeyond-armor-class.test.ts` (extensions)

- [ ] `normalizeArmorClass` returns base+DEX cap for medium armor (armorTypeId=2) → maps to L154 / spec: MODIFIED armor-class extended
- [ ] `normalizeArmorClass` returns fixed AC for heavy armor (armorTypeId=3) → maps to L154 / spec: MODIFIED armor-class extended
- [ ] `normalizeArmorClass` returns 10+DEX for no armor → maps to L154 / spec: MODIFIED armor-class extended
- [ ] `getUnarmoredAcBonus` applies set modifier → maps to L488 / spec: MODIFIED armor-class extended
- [ ] `getUnarmoredAcBonus` applies bonus modifier → maps to L509 / spec: MODIFIED armor-class extended
- [ ] `getUnarmoredAcBonus` combines set and bonus modifiers → maps to L530 / spec: MODIFIED armor-class extended
- [ ] `getUnarmoredAcBonus` uses maximum of multiple set modifiers → maps to L558 / spec: MODIFIED armor-class extended
- [ ] Pre-existing tests still pass → spec: existing tests unaffected

### T5 — `dndBeyond-skills-senses.test.ts`

- [ ] `normalizeSenses` omits speed when walk speed is 0 → maps to L440 / spec: isolation scenario
- [ ] `normalizeSenses` defaults passive senses from ability modifiers → maps to L440 / spec: isolation scenario

### T6 — `dndBeyond-defenses.test.ts`

- [ ] `normalizeImmunities` puts damage-type "poison" in damageImmunities → spec: normalizeImmunities separates damage from condition
- [ ] `normalizeImmunities` puts non-damage "poisoned" in conditionImmunities → spec: normalizeImmunities separates damage from condition
- [ ] `normalizeImmunities` deduplicates repeated entries → spec: normalizeImmunities deduplicates
- [ ] `normalizeImmunities` returns empty arrays with no immunity modifiers → spec: normalizeImmunities empty case
- [ ] `normalizeImmunities` uses friendlySubtypeName when available → spec: normalizeImmunities labelization
- [ ] `normalizeByModifierType` returns only modifiers of specified type → spec: normalizeByModifierType extracts by type
- [ ] `normalizeByModifierType` deduplicates and titleizes results → spec: normalizeByModifierType deduplicates
- [ ] `normalizeByModifierType` returns empty array with no matching modifiers → spec: normalizeByModifierType empty case
- [ ] `normalizeLanguages` extracts language modifiers and titleizes → spec: normalizeLanguages extracts
- [ ] `normalizeLanguages` returns empty array with no language modifiers → spec: normalizeLanguages empty case

### T7 — `dndBeyond-abilities.test.ts` (extension if needed)

- [ ] Check existing file for "omits actions with empty sanitized descriptions" coverage
- [ ] If not covered: `normalizeAbilities` omits actions with sanitized-empty descriptions → maps to L464 / spec: isolation scenario

### T8 — Monolith shrink (`dndBeyondCharacterImport.test.ts`)

- [ ] Full character normalization snapshot test passes (L96 retained) → spec: MODIFIED monolith contains only orchestration tests
- [ ] Unsupported-values warning test passes (L136 retained) → spec: MODIFIED monolith contains only orchestration tests
- [ ] Multi-domain languages/senses/defenses/abilities test passes (L315 retained) → spec: MODIFIED monolith contains only orchestration tests
- [ ] Test count in monolith = 3 → spec: monolith retains only 3 tests after migration

### Full suite

- [ ] `npx jest tests/unit/import/` — all tests pass, total ≥ pre-migration count → spec: Full test suite passes after migration
- [ ] `npx tsc --noEmit` — no type errors → spec: TypeScript compilation passes
- [ ] `grep -r "dndBeyondCharacterImport" tests/unit/import/dndBeyond-*.test.ts` → empty (no orchestrator imports in module test files) → spec: imports from module not orchestrator
