---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `migrate-monster-spell-repo-callers` change. This is a mechanical, no-behavior-change import migration, so "TDD" here means: capture the current passing state as the baseline (red would mean a test currently fails, which none should), migrate one file at a time, and re-run the affected tests after each migration to confirm they still pass (green) with no code-behavior changes beyond the import swap. For the 4 test files that couple directly to the `storage` facade (T11-T14), the failing state is a stale mock that no longer matches the production import path — updating the mock target is the "make it pass" step.

## Testing Steps

For each task in `tasks.md`:

1.  **Baseline (red only for facade-coupled tests):** For T2-T10, run the affected test file(s) before editing to confirm they currently pass (this is the pre-migration baseline, not a literal failing test, since no new behavior is being added). For T11-T14, first confirm the test file still references `@/lib/storage` after its corresponding T2/T8/T9 production migration — at that point the test's mock is stale relative to production code, which is the "red" state for this task.
2.  **Write code to pass the test:** Apply the import/call-site swap in the production file (T2-T10) or update the mock target in the test file (T11-T14).
3.  **Refactor:** N/A for this change — no refactor beyond the mechanical swap is in scope (see design.md Non-Goals).

## Test Cases

### T1 — Repo method inventory

- [ ] Test case 1: `grep -n "export async function" lib/storage/monsterTemplateRepo.ts` includes all 9 Monster Template methods used by callers (`saveMonsterTemplate`, `loadMonsterTemplates`, `loadAllMonsterTemplates`, `loadGlobalMonsterTemplates`, `deleteMonsterTemplate`, `saveManyMonsterTemplates`, `deleteMonsterTemplatesByIds`, `findExistingMonsterKeys`, `findMonsterByNameAndSource`)
- [ ] Test case 2: `grep -n "export async function" lib/storage/spellRepo.ts` includes all 5 Spell Template methods used by callers (`loadSpells`, `loadSpellById`, `saveSpellTemplate`, `deleteSpellTemplate`, `spellExistsByNameAndSource`)

### T2 — `lib/import/dedupeEngine.ts`

- [ ] Test case 1 (maps to spec scenario "Dedupe check inside dedupeEngine.ts uses monsterTemplateRepo for the monster path"): `tests/unit/import/dedupeEngine.test.ts` — `shouldImport("monsters", ...)` path exercises `monsterTemplateRepo.findMonsterByNameAndSource` (via updated mock from T13), not `storage.findMonsterByNameAndSource`
- [ ] Test case 2 (maps to spec scenario "Dedupe check inside dedupeEngine.ts uses spellRepo for the spell path"): `tests/unit/import/dedupeEngine.test.ts` — `shouldImport("spells", ...)` path exercises `spellRepo.spellExistsByNameAndSource`, not `storage.spellExistsByNameAndSource`
- [ ] Test case 3 (maps to spec scenario "shouldImport dispatches to the correct repo per collection"): existing `importMonsterSingle` / `importSpellsFromOpen5E` tests still pass, confirming `monsterTemplateRepo.saveMonsterTemplate` and `spellRepo.saveSpellTemplate` are called on their respective paths
- [ ] Test case 4: `grep -n "storage\." lib/import/dedupeEngine.ts` returns no matches after migration

### T3 — `app/api/monsters/route.ts`

- [ ] Test case 1 (maps to spec scenario "Creating a monster template calls monsterTemplateRepo directly"): existing tests for `GET`/`POST` `app/api/monsters/route.ts` still pass with identical request/response assertions
- [ ] Test case 2: `grep -n "storage\." app/api/monsters/route.ts` returns no matches after migration

### T4 — `app/api/monsters/[id]/route.ts`

- [ ] Test case 1: existing tests for `GET`/`PUT`/`DELETE` `app/api/monsters/[id]/route.ts` still pass unmodified
- [ ] Test case 2: `grep -n "storage\." "app/api/monsters/[id]/route.ts"` returns no matches after migration

### T5 — `app/api/monsters/[id]/duplicate/route.ts`

- [ ] Test case 1: existing tests for `POST` `app/api/monsters/[id]/duplicate/route.ts` still pass unmodified
- [ ] Test case 2: `grep -n "storage\." "app/api/monsters/[id]/duplicate/route.ts"` returns no matches after migration

### T6 — `app/api/monsters/global/route.ts`

- [ ] Test case 1: existing tests for `GET`/`POST`/`PUT` (seed) `app/api/monsters/global/route.ts` still pass unmodified
- [ ] Test case 2: `grep -n "storage\." app/api/monsters/global/route.ts` returns no matches after migration

### T7 — `app/api/monsters/global/[id]/route.ts`

- [ ] Test case 1: existing tests for `GET`/`PUT`/`DELETE` `app/api/monsters/global/[id]/route.ts` still pass unmodified
- [ ] Test case 2: `grep -n "storage\." "app/api/monsters/global/[id]/route.ts"` returns no matches after migration

### T8 — `app/api/monsters/upload/route.ts`

- [ ] Test case 1 (maps to spec scenario "Bulk upload ingestion and compensating delete both use monsterTemplateRepo"): `tests/unit/api/monsters/upload.route.test.ts` — successful ingest path exercises `monsterTemplateRepo.saveManyMonsterTemplates` (via updated mock from T14), not `storage.saveManyMonsterTemplates`
- [ ] Test case 2: same file — the compensating-delete-on-failure path exercises `monsterTemplateRepo.deleteMonsterTemplatesByIds`, not `storage.deleteMonsterTemplatesByIds`
- [ ] Test case 3: `grep -n "storage\." app/api/monsters/upload/route.ts` returns no matches after migration

### T9 — `app/api/spells/route.ts`

- [ ] Test case 1 (maps to spec scenario n/a — direct GET/POST): existing tests for `GET`/`POST` `app/api/spells/route.ts` still pass unmodified
- [ ] Test case 2: `grep -n "storage\." app/api/spells/route.ts` returns no matches after migration

### T10 — `app/api/spells/[id]/route.ts`

- [ ] Test case 1 (maps to spec scenario "Loading a spell by id calls spellRepo directly"): existing tests for `GET`/`PUT`/`DELETE` `app/api/spells/[id]/route.ts` still pass unmodified
- [ ] Test case 2: `grep -n "storage\." "app/api/spells/[id]/route.ts"` returns no matches after migration

### T11 — `tests/unit/lib/storage.test.ts`

- [ ] Test case 1 (maps to spec scenario "storage.ts continues to expose the same public methods"): `storage.saveMonsterTemplate` / `storage.loadSpells` / etc. delegation tests still pass, confirming `lib/storage.ts`'s facade methods are untouched

### T12 — `tests/unit/lib/storage.characterization.test.ts`

- [ ] Test case 1: characterization suite still passes unmodified, confirming `lib/storage.ts`'s error-handling taxonomy (swallow/rethrow/mixed/no-try) for Monster/Spell Template methods is unchanged

### T13 — `tests/unit/import/dedupeEngine.test.ts` mock update

- [ ] Test case 1: `jest.mock('@/lib/storage/monsterTemplateRepo', ...)` and `jest.mock('@/lib/storage/spellRepo', ...)` replace any prior `jest.mock('@/lib/storage', ...)`; suite passes with mocks targeting the narrow repos

### T14 — `tests/unit/api/monsters/upload.route.test.ts` mock update

- [ ] Test case 1: `jest.mock('@/lib/storage/monsterTemplateRepo', ...)` replaces any prior `jest.mock('@/lib/storage', ...)`; suite passes with mocks targeting `monsterTemplateRepo`

### Scope boundary (maps to spec scenario "campaignTemplateRepo.ts is unaffected")

- [ ] Test case 1: `git diff --stat` after all tasks confirms `lib/storage.ts` and `lib/storage/campaignTemplateRepo.ts` show zero changes

### Full suite regression (maps to Non-Functional Acceptance Criteria — Reliability)

- [ ] Test case 1: full project test suite passes with zero new failures, and the only test files in the diff are the 4 listed in T11-T14
