---
name: tests
description: Tests for scripts-test-coverage
---

# Tests

## Overview

Test cases for the `scripts-test-coverage` change. All work follows strict TDD: write a failing test, write code to pass it, refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** — before any implementation, write the test and confirm it fails (import fails or assertion fails).
2. **Write code to pass the test** — add the guard or export, implement the minimum change.
3. **Refactor** — clean up if needed; re-confirm the test passes.

## Test Cases

### T1 — migrateGlobalMonsters guard + export

- [ ] **Import without side effects** — `import { migrateGlobalMonsters } from 'lib/scripts/migrateGlobalMonsters'` in a test file does not throw, does not connect to DB
  - File: `tests/integration/scripts/migrateGlobalMonsters.integration.test.ts`
  - Spec: `specs/migrate-global-monsters.md` — "Import without execution"
- [ ] **Export is a function** — `typeof migrateGlobalMonsters === 'function'`

### T2 — populateMonstersByType guard + exports

- [ ] **Import without side effects** — `require('lib/scripts/populateMonstersByType')` does not make HTTP calls or write files
  - File: `tests/unit/lib/scripts/populateMonstersByType.test.ts`
  - Spec: `specs/populate-monsters-by-type.md` — "Import without execution"
- [ ] **All four functions exported** — `normalizeType`, `getCRExperience`, `transformMonster`, `generateTypeFile` are all functions

### T3 — Integration: migrateGlobalMonsters DB behavior

- [ ] **Tags untagged global monster (no source field)** — after migration, document has `source: "SRD"`
  - File: `tests/integration/scripts/migrateGlobalMonsters.integration.test.ts`
  - Spec: `specs/migrate-global-monsters.md` — "Untagged global monster is migrated"
- [ ] **Tags untagged global monster (empty source)** — document with `source: ""` gets `source: "SRD"`
  - Spec: "Untagged global monster is migrated"
- [ ] **Already-tagged monster not re-updated** — document with `source: "SRD"` has `modifiedCount` contribution of 0
  - Spec: "Already-tagged monster is not re-migrated"
- [ ] **Non-global monster not touched** — document with `isGlobal: false` is unchanged
  - Spec: "Non-global monster is not touched"
- [ ] **modifiedCount matches number of untagged docs** — function return value equals 2 for the two untagged seeds
- [ ] **Idempotency — second run returns 0** — calling `migrateGlobalMonsters()` again returns `0`
  - Spec: "Double-run idempotency"

### T4 — Unit: normalizeType

- [ ] **Swarm type → "beast"** — `normalizeType("swarm of Tiny beasts") === "beast"`
  - File: `tests/unit/lib/scripts/populateMonstersByType.test.ts`
  - Spec: `specs/populate-monsters-by-type.md` — "Swarm type is normalized"
- [ ] **Mixed-case swarm → "beast"** — `normalizeType("Swarm of Medium Undead") === "beast"`
- [ ] **Standard type → lowercased** — `normalizeType("Humanoid") === "humanoid"`
  - Spec: "Standard type is lowercased"
- [ ] **Already-lowercase unchanged** — `normalizeType("undead") === "undead"`
  - Spec: "Already-lowercase type is returned unchanged"

### T4 — Unit: getCRExperience

- [ ] **CR 0 → 10**
  - Spec: "Known CR returns correct XP"
- [ ] **CR 0.5 → 100**
  - Spec: "Fractional CR is handled"
- [ ] **CR 1 → 200**
- [ ] **CR 20 → 25000**
- [ ] **CR 99 → 0**
  - Spec: "Unknown CR returns 0"

### T4 — Unit: transformMonster

- [ ] **Full fixture maps correctly** — name, hp, ac, abilities, challengeRating, source "SRD", savingThrows, skills, actions, traits all present
  - Spec: "Full monster response is transformed correctly"
- [ ] **No proficiencies → savingThrows absent** — result has no `savingThrows` key
  - Spec: "Monster with no proficiencies is handled"
- [ ] **No proficiencies → skills absent** — result has no `skills` key
- [ ] **No senses → senses is ""** — `result.senses === ""`
  - Spec: "Monster with no senses is handled"
- [ ] **No actions → actions absent** — result has no `actions` key
  - Spec: "Monster with no actions is handled"
- [ ] **No xp, CR 5 → experiencePoints 1800** — falls back to getCRExperience lookup
  - Spec: "transformMonster uses getCRExperience when xp is absent"
- [ ] **Swarm monster → conditionImmunities mapped to name strings** — array of `{name}` objects becomes array of strings

### T4 — Unit: generateTypeFile

- [ ] **Creates file in specified temp dir** — file exists at `tmpDir/beasts.ts`
  - Spec: "File is written to specified directory"
- [ ] **Export name is correct** — file content contains `export const BEASTS:`
  - Spec: "Generated file has correct export name"
- [ ] **Type import present** — file content contains `import { MonsterTemplate } from`
- [ ] **afterEach cleans up temp dir** — temp directory is removed after each test
