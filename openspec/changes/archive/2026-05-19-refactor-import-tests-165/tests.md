---
name: tests
description: Tests for the refactor-import-tests-165 change
---

# Tests

## Overview

Tests for two focused refactors: (1) `importMonsterSingle` existence-check deduplication, (2) D&D Beyond HTTP mock server extraction. Follow strict TDD: write failing tests before implementing.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** before any implementation code. Run it and confirm it fails.
2. **Write the simplest code** to make the test pass.
3. **Refactor** while keeping the test green.

## Test Cases

### Task 1.1 / 1.2 — dedupeEngine: `importMonsterSingle` uses `shouldImport`

File: `tests/unit/import/dedupeEngine.test.ts`

- [ ] **Duplicate monster returns skipped** — mock `shouldImport` to return `{ should: false }`; assert `importMonsterSingle` returns `{ inserted: false, skipped: true, error: false }` without calling `transformMonster`
  - Spec: `specs/dedupe-engine/spec.md` → "Duplicate monster is skipped without transformation"
  - Verify failing before task 1.2 is implemented

- [ ] **New monster is saved** — mock `shouldImport` to return `{ should: true }`; mock `transformMonster` to return a valid monster; assert `storage.saveMonsterTemplate` is called and result is `{ inserted: true, skipped: false, error: false }`
  - Spec: `specs/dedupe-engine/spec.md` → "New monster is transformed and saved"

- [ ] **Invalid+duplicate monster is skipped, not errored** — mock `shouldImport` to return `{ should: false }`; mock `transformMonster` to return `{ valid: false, errors: [...] }`; assert result is `{ inserted: false, skipped: true, error: false }` and `transformMonster` is NOT called
  - Spec: `specs/dedupe-engine/spec.md` → "Invalid monster that is also a duplicate is skipped"

- [ ] **Invalid non-duplicate monster is errored** — mock `shouldImport` to return `{ should: true }`; mock `transformMonster` to return `{ valid: false, errors: [...] }`; assert result is `{ inserted: false, skipped: false, error: true }`
  - Spec: `specs/dedupe-engine/spec.md` → "Invalid monster with no duplicate is errored"

### Task 1.3 — dedupeEngine integration tests still pass

File: `tests/integration/import/dedupeEngine.integration.test.ts`

- [ ] **All existing integration test assertions pass** after the refactor — run `npm run test:integration -- --testPathPattern="dedupeEngine"` and confirm green
  - Spec: `specs/dedupe-engine/spec.md` → all scenarios

### Task 2.1 — `createDndBeyondMockServer` factory

File: `tests/mocks/dndBeyond/server.ts` (new)

- [ ] **Server starts and sets env var** — call `setup()`; assert `process.env.DND_BEYOND_CHARACTER_SERVICE_BASE_URL` is set to a `http://127.0.0.1:<port>/character/v5` pattern
  - Spec: `specs/mock-server/spec.md` → "Integration test sets up mock server via helper"

- [ ] **Server responds to character endpoint** — after `setup()`, make an HTTP request to the mock server; assert expected response shape is returned
  - Spec: `specs/mock-server/spec.md` → "Integration test sets up mock server via helper"

- [ ] **Server tears down cleanly** — call `setup()` then `teardown()`; assert no errors thrown and server no longer accepts connections
  - Spec: `specs/mock-server/spec.md` → "Integration test tears down mock server via helper"

### Task 2.2 / 2.3 — characterImport integration test uses helper

File: `tests/integration/import/characterImport.integration.test.ts`

- [ ] **All existing integration assertions pass** after replacing inline server with `createDndBeyondMockServer` — run `npm run test:integration -- --testPathPattern="characterImport"` and confirm green
  - Spec: `specs/mock-server/spec.md` → "Character import integration test runs identically after refactor"

### Non-functional

- [ ] **No new package.json entries** — inspect `package.json` after all changes; confirm no new `dependencies` or `devDependencies` were added
  - Spec: `specs/mock-server/spec.md` → "No new package dependencies"
