---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `monster-json-import-modal` change. All work follows a strict TDD (Test-Driven Development) process: write a failing test that captures the task's requirement, write the simplest code to pass, then refactor with the test still green.

Traceability columns: **Task** = step in `tasks.md`; **Scenario** = requirement scenario in `specs/monster-import/spec.md`.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** capturing the requirement; run it and confirm it fails.
2. **Write code to pass the test** — simplest thing that works.
3. **Refactor** while keeping the test green.

## Test Cases

### Zod schema & validation — `lib/validation/monsterUpload.ts` (Tasks: Step 4–9)

- [ ] **Ported: existing `monsterUpload` unit tests pass unchanged** against the Zod implementation (behavior parity) — Task: Step 4 · Scenario: Whole-file validation before preview / happy path
- [ ] **Bare top-level array accepted:** `validateMonsterUploadDocument([{...valid}])` → `valid: true` — Task: Step 5 · Scenario: Valid file produces a preview payload
- [ ] **`{ monsters: [...] }` wrapper accepted** equivalently — Task: Step 5 · Scenario: Valid file produces a preview payload
- [ ] **Empty array rejected** with a message requiring ≥ 1 monster — Task: Step 5/6 · Scenario: Empty array is rejected
- [ ] **Non-array / non-object top level rejected** — Task: Step 6 · Scenario: Empty array is rejected (boundary)
- [ ] **Missing required `name` → error field `monsters[0].name`** — Task: Step 6 · Scenario: Missing required field is reported by path
- [ ] **Missing required `abilityScores` on 4th monster → error field `monsters[3].abilityScores`** — Task: Step 6 · Scenario: Missing required field is reported by path
- [ ] **Each newly-required field (`size`, `type`, `ac`, `maxHp`, `speed`, `challengeRating`, all six ability scores) individually rejected when omitted**, with correct field path — Task: Step 5 · Scenario: Missing required field is reported by path
- [ ] **`hp` omitted → defaults to `maxHp`** in transform output — Task: Step 5/7 · Scenario: Valid file produces a preview payload
- [ ] **`hp > maxHp` → validation error on `monsters[i].hp`** — Task: Step 5 · Scenario: Missing required field is reported by path (cross-field)
- [ ] **`ac` out of range (−1, 31) rejected; 0 and 30 accepted** — Task: Step 5 · Scenario: File validation boundaries
- [ ] **`size` not in `VALID_SIZES` rejected with enumerated options in message** — Task: Step 5 · Scenario: Missing required field is reported by path
- [ ] **Unknown/extra key stripped** — parsed output and later stored record omit it — Task: Step 5 · Scenario: Unknown fields are stripped, not rejected
- [ ] **Overlong `name` (> 200 chars) rejected; `name` trimmed on accept** — Task: Step 5 · Scenario: Unknown fields are stripped / input bounds (NFAC Security: input bounds)
- [ ] **All errors returned at once** for a document with multiple bad monsters (not fail-fast) — Task: Step 6 · Scenario: Missing required field is reported by path
- [ ] **`transformMonsterData(raw, { userId, isGlobal: false })`** → record has that `userId`, `isGlobal: false` — Task: Step 7 · Scenario: Non-admin has no scope choice and imports personally
- [ ] **`transformMonsterData(raw, { userId: GLOBAL_USER_ID, isGlobal: true })`** → `userId === GLOBAL`, `isGlobal: true` — Task: Step 7 · Scenario: Admin imports to the Global library
- [ ] **`transformMonsterData` unrecognised `alignment` → dropped (undefined), not an error** — Task: Step 7 · Scenario: Unknown fields are stripped, not rejected (alignment edge case)
- [ ] **`describeMonsterUploadSchema()`** returns a descriptor for every schema field with correct `required` flags — Task: Step 8 · Scenario: Field list is shown with required markers
- [ ] **`describeMonsterUploadSchema()`** contains no calculated field (`experiencePoints`) — Task: Step 8 · Scenario: Field list is shown with required markers
- [ ] **All existing importers of `monsterUpload` still compile and their tests pass** after signature change — Task: Step 9 · Scenario: (regression guard)

### Storage layer — `lib/storage/monsterTemplateRepo.ts` (Tasks: Step 10–13)

- [ ] **`saveManyMonsterTemplates`** inserts all supplied templates in one `insertMany` call (spy asserts single call) — Task: Step 10 · Scenario: Bounded database round trips for a large batch
- [ ] **`saveManyMonsterTemplates`** wraps the op in `runStorageOp` with op name `saveManyMonsterTemplates`, collection `monsterTemplates` — Task: Step 10 · Scenario: Compensating delete is idempotent and logs orphans (telemetry seam)
- [ ] **`saveManyMonsterTemplates`** propagates a driver error to the caller (does not swallow) — Task: Step 10 · Scenario: Mid-ingestion failure reverts the batch
- [ ] **`deleteMonsterTemplatesByIds(ids, userId)`** issues one `deleteMany({ id: { $in }, userId })` — Task: Step 11 · Scenario: Mid-ingestion failure reverts the batch
- [ ] **`deleteMonsterTemplatesByIds`** called twice with the same ids does not error (idempotent) — Task: Step 11 · Scenario: Compensating delete is idempotent and logs orphans
- [ ] **`deleteMonsterTemplatesByIds`** never deletes rows belonging to a different `userId` — Task: Step 11 · Scenario: Forged Global request from a non-admin is denied (scoping guard)
- [ ] **`findExistingMonsterKeys(keys, userId)`** returns only `name|source` keys that exist for that `userId`; single query — Task: Step 12 · Scenario: Existing monster is skipped and reported
- [ ] **`findExistingMonsterKeys`** scoped to `GLOBAL_USER_ID` does not match a personal monster of the same name — Task: Step 12 · Scenario: Existing monster is skipped and reported

### Validation route — `POST /api/monsters/upload/validate` (Tasks: Step 14) — integration

- [ ] **12 valid monsters → 200, `count: 12`, `names` in file order** — Task: Step 14 · Scenario: Valid file produces a preview payload
- [ ] **No writes performed** — DB monster count unchanged after a validate call — Task: Step 14 · Scenario: Validation phase performs no writes
- [ ] **Empty array → 400** with "at least one monster" message — Task: Step 14 · Scenario: Empty array is rejected
- [ ] **Invalid monster → 400 with `errors[].field` = `monsters[3].abilityScores`** — Task: Step 14 · Scenario: Missing required field is reported by path
- [ ] **Response includes `isAdmin` reflecting the caller** — Task: Step 14 · Scenario: Non-admin has no scope choice / Admin imports to the Global library
- [ ] **Unauthenticated → 401** (via `withAuth`) — Task: Step 14 · Scenario: (auth guard)
- [ ] **Body over 5 MB → 413/400 without processing** — Task: Step 14 · Scenario: Oversize file rejected without upload

### Ingestion route — `POST /api/monsters/upload` (Tasks: Step 15, 17) — integration

- [ ] **10 non-duplicate monsters, healthy DB → 200, `inserted` has 10 names, `reverted: false`; all 10 present in DB** — Task: Step 15 · Scenario: Successful ingestion is not reverted
- [ ] **Batch containing an existing "Goblin"/"SRD" + 4 new → 200, `inserted` = 4, `skippedDuplicates` = ["Goblin"], exactly one Goblin/SRD in DB** — Task: Step 15 · Scenario: Existing monster is skipped and reported
- [ ] **File lists same name+source twice, nothing else → exactly one created, name in `skippedDuplicates`** — Task: Step 15 · Scenario: In-file repeated monster is imported once
- [ ] **All monsters already exist → 200, `inserted` empty, `skippedDuplicates` = all names, not an error** — Task: Step 15 · Scenario: All-duplicates import succeeds with zero inserts
- [ ] **`insertMany` mocked to throw → compensating `deleteMonsterTemplatesByIds` called with the generated ids; response `reverted: true` with error detail; DB contains none of the batch** — Task: Step 15 · Scenario: Mid-ingestion failure reverts the batch
- [ ] **Response is never HTTP 207** for any partial-failure input — Task: Step 15 · Scenario: Ingestion phase no longer returns partial success / REMOVED Partial-success monster upload
- [ ] **Non-admin sends `scope: "global"` → 403, no writes** — Task: Step 15 · Scenario: Forged Global request from a non-admin is denied
- [ ] **Admin sends `scope: "global"` → created monsters have `userId === GLOBAL`, `isGlobal: true`** — Task: Step 15 · Scenario: Admin imports to the Global library
- [ ] **Default (no/`personal` scope) → created monsters have caller `userId`, `isGlobal: false`** — Task: Step 15 · Scenario: Non-admin has no scope choice and imports personally
- [ ] **Re-validation on ingest: an invalid body that somehow reaches ingest → 400, no writes** — Task: Step 15 · Scenario: Whole-file validation before preview
- [ ] **DB driver error → client message is generic (no connection string / stack); `console.error` called with full detail and `orphanedMonsterIds`** — Task: Step 17 · Scenario: Ingestion errors do not leak infrastructure detail
- [ ] **Large batch (several hundred) → exactly one dedupe query + one `insertMany` (spies)** — Task: Step 15 · Scenario: Bounded database round trips for a large batch

### Schema document route — `GET /api/monsters/import-schema` (Tasks: Step 16) — integration

- [ ] **Returns `fields` listing every schema field with `required` flags matching the Zod schema** — Task: Step 16 · Scenario: Field list is shown with required markers
- [ ] **`fields` excludes calculated fields** — Task: Step 16 · Scenario: Field list is shown with required markers
- [ ] **`example` is an array with one fully-populated monster that passes `validateMonsterUploadDocument`** — Task: Step 16 · Scenario: Example file download

### Import modal — `app/monsters/ImportMonstersModal.tsx` (Tasks: Step 18) — component / RTL

- [ ] **Renders schema link and required-field table** in the idle state — Task: Step 18 · Scenario: Field list is shown with required markers
- [ ] **Download link produces a JSON blob** whose top level is an array of one monster — Task: Step 18 · Scenario: Example file download
- [ ] **Selecting a non-JSON file → parse error shown, no fetch issued** — Task: Step 18 · Scenario: Malformed JSON is rejected before any request
- [ ] **Selecting a file > 5 MB → size error, no fetch issued** — Task: Step 18 · Scenario: Oversize file rejected without upload
- [ ] **Valid file → calls `/validate`, then renders count + all names** — Task: Step 18 · Scenario: Preview lists count and names
- [ ] **Validation 400 → modal stays open, errors rendered, error region has `role="alert"` and `data-testid="import-modal-error"`** — Task: Step 18 · Scenario: Validation error keeps the modal open and announced
- [ ] **Non-admin (`isAdmin` false) → no Personal/Global radio; confirm posts `scope: "personal"`** — Task: Step 18 · Scenario: Non-admin has no scope choice and imports personally
- [ ] **Admin → radio shown, defaults to Personal; selecting Global posts `scope: "global"`** — Task: Step 18 · Scenario: Admin imports to the Global library
- [ ] **`done` with `skippedDuplicates` → renders skipped names** — Task: Step 18 · Scenario: Existing monster is skipped and reported
- [ ] **`reverted: true` response → error copy states rollback and possible manual cleanup** — Task: Step 18 · Scenario: Process crash between insert and compensation is a documented non-guarantee
- [ ] **`Esc` and Cancel close the modal; reopening shows idle state, no file** — Task: Step 18 · Scenario: Closing the modal leaves no state
- [ ] **jest-axe: modal has no critical a11y violations** — Task: Step 18 · Scenario: Validation error keeps the modal open and announced

### `/monsters` page integration (Tasks: Step 19) — component / RTL

- [ ] **`Import Monster(s)` button rendered for a non-admin authed user** — Task: Step 19 · Scenario: Any authenticated user sees the import control
- [ ] **Clicking the button opens the modal; URL unchanged** — Task: Step 19 · Scenario: Any authenticated user sees the import control
- [ ] **Successful import triggers the library refresh callback** (fetch re-invoked) — Task: Step 19 · Scenario: Successful ingestion is not reverted (UI refresh)

### Import page cleanup — `app/monsters/import/page.tsx` (Tasks: Step 20) — component / RTL

- [ ] **Page no longer renders the "Upload Monster JSON File" form** — Task: Step 20 · Scenario: Import page has no file upload form
- [ ] **Page still renders the "Sync from open5e" panel** — Task: Step 20 · Scenario: Import page has no file upload form

### End-to-end — Playwright (`tests/e2e/`) — run on a free port (not 3000)

- [ ] **E2E: non-admin user opens `/monsters`, clicks `Import Monster(s)`, uploads a valid 3-monster JSON, sees preview with 3 names, confirms, sees success, and the 3 monsters appear in "Your Monster Library"** — Task: Step 18/19 · Scenarios: Any authenticated user sees the import control; Preview lists count and names; Successful ingestion is not reverted
- [ ] **E2E: uploading a file with a missing required field shows the modal error (asserted via `data-testid="import-modal-error"`), modal stays open** — Task: Step 18 · Scenario: Validation error keeps the modal open and announced
- [ ] **E2E: uploading a batch that includes an already-imported monster shows it in the skipped list and does not duplicate it** — Task: Step 15/18 · Scenario: Existing monster is skipped and reported
- [ ] **E2E: admin user sees the Personal/Global choice; importing as Global makes the monsters appear in the Global section** — Task: Step 18 · Scenario: Admin imports to the Global library
- [ ] **E2E: forced ingestion failure (test hook / seeded fault) shows the rollback error and leaves the library unchanged** — Task: Step 15 · Scenario: Mid-ingestion failure reverts the batch

### Regression guards

- [ ] **Existing `/api/monsters/upload` integration tests updated** to the new response shape; no test still asserts HTTP 207 — Task: Step 15 · Scenario: REMOVED Partial-success monster upload
- [ ] **`npm run typecheck` clean**, **`npm run build` succeeds** — Task: Validation
- [ ] **Full unit + integration + E2E suites green** — Task: Remote push validation
