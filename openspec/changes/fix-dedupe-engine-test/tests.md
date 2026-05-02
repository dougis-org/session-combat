---
name: tests
description: Tests for the fix-dedupe-engine-test change
---

# Tests

## Overview

This document outlines the tests for the `fix-dedupe-engine-test` change. Tests are organized by layer (unit vs integration) and follow TDD workflow.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test**: Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2. **Write code to pass the test**: Write the simplest possible code to make the test pass.
3. **Refactor**: Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Unit Tests (tests/unit/import/dedupeEngine.test.ts)

- [ ] **Test 1.1 (Task 1.3):** Verify tests for `shouldImport` function still exist
  - Returns should=false for spells that exist by name and source
  - Returns should=true for spells that do not exist
  - Returns should=true and no existingId for new monsters
  - Returns should=false and existingId for existing monsters

- [ ] **Test 1.2 (Task 1.3):** Verify "inserts monster when not duplicate and valid" test exists
  - Mock: `findMonsterByNameAndSource` returns null
  - Assert: `result.inserted === 1, result.skipped === 0, result.errors === 0`
  - Maps to spec: "Transform validation at unit level" scenario

- [ ] **Test 1.3 (Task 1.3):** Verify "skips monster when it already exists" test exists
  - Mock: `findMonsterByNameAndSource` returns `{ id: "existing-id" }`
  - Assert: `result.inserted === 0, result.skipped === 1, result.errors === 0`
  - Maps to spec: REMOVED requirement (but test remains as unit-level verification with mocks)

- [ ] **Test 1.4 (Task 1.3):** Verify "counts error when monster transform is invalid" test exists
  - Mock: `findMonsterByNameAndSource` returns null
  - Input: creature with empty name
  - Assert: `result.errors === 1, result.inserted === 0, result.skipped === 0`
  - Maps to spec: "Transform validation at unit level" scenario

- [ ] **Test 1.5 (Task 1.3):** Verify "processes multiple monsters" test exists
  - Mock: `findMonsterByNameAndSource` returns null, multiple creatures passed
  - Assert: `result.inserted === 2`
  - Maps to spec: "Multiple monsters processed (unit)" scenario

- [ ] **Test 1.6 (Task 1.2):** Verify broken test is removed
  - Search file for "skips monster when transform is invalid (not when it exists)"
  - Should NOT exist in file
  - Maps to spec: "REMOVED Requirements - Conflicting Test Scenario"

### Integration Tests (tests/integration/import/dedupeEngine.integration.test.ts)

- [ ] **Test 2.1 (Task 3.1):** "inserts monster when not duplicate and valid"
  - Given: No Goblin with source "open5e" exists in MongoDB
  - When: `importMonstersFromOpen5E` is called with valid Goblin
  - Then: `result.inserted === 1`
  - And: Monster is retrievable from MongoDB by name and source
  - Maps to spec: "Insert when not duplicate (integration)" scenario

- [ ] **Test 4.1 (Task 4.1):** "skips monster when it already exists"
  - Given: Goblin with source "open5e" already exists in MongoDB (from Test 2.1)
  - When: `importMonstersFromOpen5E` is called with same Goblin
  - Then: `result.skipped === 1, result.inserted === 0`
  - And: Only one Goblin with source "open5e" exists in MongoDB
  - Maps to spec: "Skip when duplicate exists (integration)" scenario

- [ ] **Test 5.1 (Task 5.1):** "counts error when monster transform is invalid"
  - Given: No monsters exist
  - When: `importMonstersFromOpen5E` is called with creature having empty name
  - Then: `result.errors === 1, result.inserted === 0, result.skipped === 0`
  - And: No monster is saved to MongoDB
  - Maps to spec: "Transform validation at unit level" scenario (tested at integration level for consistency)

## Test Mapping Summary

| Task | Spec Scenario | Test File | Layer |
|------|--------------|-----------|-------|
| 1.2 | Insert when not duplicate | dedupeEngine.test.ts | Unit |
| 1.3 | Skip when exists (with mock) | dedupeEngine.test.ts | Unit |
| 1.4 | Transform validation | dedupeEngine.test.ts | Unit |
| 1.5 | Multiple monsters | dedupeEngine.test.ts | Unit |
| 1.6 | Conflicting test removed | dedupeEngine.test.ts | Unit |
| 3.1 | Insert when not duplicate | dedupeEngine.integration.test.ts | Integration |
| 4.1 | Skip when exists | dedupeEngine.integration.test.ts | Integration |
| 5.1 | Error when invalid | dedupeEngine.integration.test.ts | Integration |

## Running Tests

```bash
# Unit tests only
npm test -- tests/unit/import/dedupeEngine.test.ts

# Integration tests only
npm test -- tests/integration/import/dedupeEngine.integration.test.ts

# Both
npm test -- tests/unit/import/dedupeEngine.test.ts tests/integration/import/dedupeEngine.integration.test.ts
```