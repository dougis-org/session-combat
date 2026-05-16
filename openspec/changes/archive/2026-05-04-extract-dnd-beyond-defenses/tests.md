---
name: tests
description: Tests for the extract-dnd-beyond-defenses change
---

# Tests

## Overview

This is a pure structural refactor — no behavior changes. The TDD workflow here means verifying that the existing test suite covers the extracted functions and remains green after the move. No new test files are required.

## Testing Steps

For each task in `tasks.md`:

1. **Confirm existing coverage before touching code:** Run `npm test` and note which tests exercise `normalizeImmunities`, `normalizeByModifierType`, and `normalizeLanguages` via the character import pipeline.
2. **Create the new file (no tests to write yet — existing tests are the spec).**
3. **Update the main file imports.** Run `npm test` — all tests must still pass.
4. **Refactor check:** Run `npx tsc --noEmit` to confirm no circular dependency or type error.

## Test Cases

- [ ] **Existing character import tests pass after extraction** — `npm test` green before and after the change (spec: MODIFIED dndBeyondCharacterImport behavior unchanged)
- [ ] **No circular dependency** — `npx tsc --noEmit` succeeds; the new file has no `from "../dndBeyondCharacterImport"` import (spec: Non-Functional — no circular dependency)
- [ ] **`normalizeImmunities` splits correctly** — verify via existing tests that damage-type immunities land in `damageImmunities` and non-damage-type immunities land in `conditionImmunities` (spec: Scenario "Immunities are split by damage vs condition type")
- [ ] **`normalizeByModifierType` dedupes and titleizes** — verify via existing tests that resistance/vulnerability lists are correctly normalized (spec: Scenario "Resistances and vulnerabilities are normalized by modifier type")
- [ ] **`normalizeLanguages` dedupes and titleizes** — verify via existing tests that language strings are correctly returned (spec: Scenario "Languages are extracted and deduplicated")
- [ ] **`friendlySubtypeName` takes precedence** — covered by existing tests that use fixtures with both fields populated (spec: Scenario "friendlySubtypeName takes precedence over subType")
