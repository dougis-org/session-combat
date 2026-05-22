---
name: tests
description: Tests for the extract-dndbeyond-identity change
---

# Tests

## Overview

This document outlines the tests for the `extract-dndbeyond-identity` change.

This is a pure refactor — no behavior changes. The primary testing strategy is:
1. Confirm existing tests continue to pass unchanged (they cover the moved functions via `dndBeyondCharacterImport.ts`'s public API).
2. Add a small focused unit test file for the new module (`lib/import/dndBeyond-identity.ts`) to cover the renamed `normalizeAlignmentId` directly, since its old name `normalizeAlignment` is not directly tested in the existing suite.

**Existing test file:** `tests/unit/import/dndBeyondCharacterImport.test.ts` imports `parseDndBeyondCharacterUrl` from `@/lib/dndBeyondCharacterImport` — this import must remain valid after the move (re-export covers this).

## Testing Steps (TDD)

For each test case below:

1. **Write a failing test** before touching implementation code.
2. **Write the simplest code to pass it.**
3. **Refactor** while keeping tests green.

## Test Cases

### Task: Create `lib/import/dndBeyond-identity.ts`

- [ ] **`normalizeAlignmentId` — valid IDs 1–9 return correct alignments**
  - Test file: `tests/unit/import/dndBeyond-identity.test.ts` (new)
  - Spec scenario: "All nine alignment IDs map correctly"
  - Input: `1` through `9` — assert each returns the correct `DnDAlignment` string
  - Failing first: import `normalizeAlignmentId` from `@/lib/import/dndBeyond-identity` — fails because file doesn't exist yet

- [ ] **`normalizeAlignmentId` — null / undefined / non-number returns undefined**
  - Test file: `tests/unit/import/dndBeyond-identity.test.ts`
  - Spec scenario: "Non-numeric input returns undefined"
  - Inputs: `null`, `undefined`, `"1"` (string), `0`, `99`

- [ ] **`normalizeAlignmentId` — unknown numeric ID returns undefined**
  - Test file: `tests/unit/import/dndBeyond-identity.test.ts`
  - Spec scenario: "Unknown numeric ID returns undefined"
  - Input: `10`, `100`

- [ ] **`requireCharacterIdentity` — valid data returns identity object**
  - Test file: `tests/unit/import/dndBeyond-identity.test.ts`
  - Spec scenario: "Valid character data returns identity"
  - Input: `{ id: 42, name: "Tordek" }` → `{ name: "Tordek", sourceCharacterId: "42" }`

- [ ] **`requireCharacterIdentity` — missing ID throws `DndBeyondImportError`**
  - Test file: `tests/unit/import/dndBeyond-identity.test.ts`
  - Spec scenario: "Missing ID throws validation error"
  - Inputs: `{ id: 0, name: "Tordek" }`, `{ id: null, name: "Tordek" }`

- [ ] **`requireCharacterIdentity` — empty name throws `DndBeyondImportError`**
  - Test file: `tests/unit/import/dndBeyond-identity.test.ts`
  - Spec scenario: "Missing name throws validation error"
  - Input: `{ id: 1, name: "" }`, `{ id: 1, name: "   " }`

- [ ] **`buildNormalizationWarnings` — unsupported race produces warning**
  - Test file: `tests/unit/import/dndBeyond-identity.test.ts`
  - Spec scenario: "Unsupported race produces warning"
  - Asserts returned array contains the race name

- [ ] **`buildNormalizationWarnings` — all fields normalized returns empty array**
  - Test file: `tests/unit/import/dndBeyond-identity.test.ts`
  - Spec scenario: "All fields normalized returns empty warning array"

### Task: Update `lib/dndBeyondCharacterImport.ts` imports

- [ ] **Existing `parseDndBeyondCharacterUrl` tests still pass**
  - Test file: `tests/unit/import/dndBeyondCharacterImport.test.ts` (existing, no modification)
  - Spec scenario: "Valid canonical URL is parsed", "Unsupported hostname throws validation error"
  - These pass if the re-export is in place; failure = broken re-export

- [ ] **Existing full-character normalization tests still pass**
  - Test file: `tests/unit/import/dndBeyondCharacterImport.test.ts` (existing)
  - All `normalizeDndBeyondCharacter` scenarios — alignment, warnings, identity fields
  - Failure = broken import chain

### Task: Rename `normalizeAlignment` → `normalizeAlignmentId`

- [ ] **TypeScript build passes after rename**
  - Verification: `tsc --noEmit` exits 0
  - This catches any missed call site — no additional test needed beyond compiler check

- [ ] **`normalizeAlignmentId` is the only alignment-ID mapping entry point**
  - Grep: `grep -rn "normalizeAlignment[^I]" lib/` returns empty
  - Confirms old name is fully retired from implementation files

## Verification Commands

```bash
# Run new focused test file
npx jest tests/unit/import/dndBeyond-identity.test.ts

# Run existing tests that cover re-exported functions
npx jest tests/unit/import/dndBeyondCharacterImport.test.ts

# Full test suite
npm test

# TypeScript check
tsc --noEmit

# Confirm no stale function definitions remain
grep -n "function parseUrlOrThrow\|function isSupportedDndBeyondHostname\|function requireCharacterIdentity\|function buildNormalizationWarnings\|function normalizeAlignment\b" lib/dndBeyondCharacterImport.ts

# Confirm rename is complete
grep -rn "normalizeAlignment[^I]" lib/
```
