---
name: tests
description: Tests for the upload-route-test-coverage change
---

# Tests

## Overview

This document outlines the tests for the `upload-route-test-coverage` change. All work follows a strict TDD process: write a failing test → write code to pass it → refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Write the test first. Run it and confirm it fails.
2. **Write code to pass the test:** Write the simplest code that makes it pass.
3. **Refactor:** Improve quality while keeping the test green.

---

## Task 1 — Fix 207 field-name mismatch (`app/monsters/import/page.tsx`)

> Spec ref: `specs/upload-route-coverage.md` — MODIFIED Requirement: 207 partial-success page message

No automated test exists for the frontend page component. TDD here means:

1. Confirm the bug exists: inspect the 207 handler and verify it reads `successCount`/`totalCount`/`failures` (all undefined from the route).
2. Apply the fix (read `count`/`total`/`errors`).
3. Verify manually: start the dev server, trigger a partial upload (one valid monster, one missing `name`), and confirm the message shows real numbers and error detail.

---

## Task 2 — Unit tests (`tests/unit/api/monsters/upload.route.test.ts`)

> Spec ref: `specs/upload-route-coverage.md` — ADDED Requirement: Upload route unit test coverage

### Auth

- [ ] **Returns 401 when not authenticated**
  - Task: Task 2 | Spec: Scenario "Unauthenticated request rejected"
  - Test: `itReturns401(POST, makeReq, mockedRequireAuth)`
  - TDD: file doesn't exist yet → test fails → create file → passes

### Request parsing

- [ ] **Returns 400 for malformed JSON body**
  - Task: Task 2 | Spec: Scenario "Malformed JSON body"
  - Test: Construct `NextRequest` with non-JSON body; assert status 400 and `body.error` contains "Invalid JSON"
  - TDD: write test → fails (no file) → create handler mock → passes

### Document validation

- [ ] **Returns 400 when `monsters` key is missing**
  - Task: Task 2 | Spec: Scenario "Missing monsters key"
  - Test: POST `{}` → assert 400, `body.details` or `body.error` present

- [ ] **Returns 400 when `monsters` is not an array**
  - Task: Task 2 | Spec: Scenario "monsters is not an array"
  - Test: POST `{ monsters: "nope" }` → assert 400

- [ ] **Returns 400 for empty `monsters` array**
  - Task: Task 2 | Spec: Scenario "Empty monsters array"
  - Test: POST `{ monsters: [] }` → assert 400

- [ ] **Returns 400 when monster is missing `name`**
  - Task: Task 2 | Spec: Scenario "Monster missing required name field"
  - Test: POST `{ monsters: [{ maxHp: 10 }] }` → assert 400

- [ ] **Returns 400 when monster is missing `maxHp`**
  - Task: Task 2 | Spec: Scenario "Monster missing required maxHp field"
  - Test: POST `{ monsters: [{ name: "Beast" }] }` → assert 400

### Successful save

- [ ] **Returns 201 with count 1 for single valid monster**
  - Task: Task 2 | Spec: Scenario "Single valid monster, save succeeds"
  - Test: `saveMonsterTemplate` mocked to resolve; POST `{ monsters: [{ name: "G", maxHp: 7 }] }` → assert 201, `body.count === 1`, `body.imported.length === 1`, `body.imported[0].name === "G"`

- [ ] **Returns 201 with count 2 for two valid monsters**
  - Task: Task 2 | Spec: Scenario "Multiple valid monsters, all save"
  - Test: Both `saveMonsterTemplate` calls resolve; assert 201, `body.count === 2`

### Partial and total failure

- [ ] **Returns 207 when first save succeeds and second fails**
  - Task: Task 2 | Spec: Scenario "Partial save failure (207)"
  - Test: `mockResolvedValueOnce(undefined)` + `mockRejectedValueOnce(new Error("fail"))`; POST two valid monsters → assert 207, `body.count === 1`, `Array.isArray(body.errors)`, `body.errors.length === 1`

- [ ] **Returns 500 when all saves fail**
  - Task: Task 2 | Spec: Scenario "All saves fail"
  - Test: `saveMonsterTemplate` mocked to reject; POST one valid monster → assert 500

---

## Task 3 — Integration tests (appended to `tests/integration/monsters.integration.test.ts`)

> Spec ref: `specs/upload-route-coverage.md` — ADDED Requirement: Upload route integration test coverage

### Setup

- Nested `beforeAll` registers user with slug `"monster-upload-test"` and stores `uploadAuthCookie`.
- `uploadAuthed()` helper returns `{ "Content-Type": "application/json", Cookie: uploadAuthCookie }`.

### Test cases

- [ ] **Valid upload returns 201 and monster is queryable**
  - Task: Task 3 | Spec: Scenario "Valid upload, monsters queryable after"
  - Test:
    1. POST `{ monsters: [{ name: "Upload Beast", maxHp: 22 }] }` with `uploadAuthed()` headers
    2. Assert response status 201, `body.count === 1`
    3. GET `/api/monsters` with same headers
    4. Assert response includes a monster with `name === "Upload Beast"`

- [ ] **Upload without auth returns 401**
  - Task: Task 3 | Spec: Scenario "Upload without authentication"
  - Test: POST without Cookie header → assert 401

- [ ] **Upload with missing `monsters` key returns 400**
  - Task: Task 3 | Spec: Scenario "Upload with missing monsters key"
  - Test: POST `{}` with `uploadAuthed()` → assert 400
