---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `default-condition-catalog` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### `lib/storage/conditionCatalogRepo.ts` (task: "Repo (write test first)")

New file: `tests/unit/lib/storage/conditionCatalogRepo.test.ts`

- [ ] `loadConditionCatalog()` returns all seeded entries with `{ name, description }` shape
  - Maps to spec: "Catalog is readable after seeding" (specs/condition-catalog/spec.md)
- [ ] `loadConditionCatalog()` returns `[]` (not an error) when the collection is empty
  - Maps to spec: "Catalog fetch failure falls back to custom entry" (via `isEmpty`/empty-array contract the UI depends on)
- [ ] `loadConditionCatalog()` strips extra/unexpected document fields, returning only `{ name, description }`
  - Maps to spec: "Catalog entry fields are rendered as plain text" (NFAC: Security)

### `lib/scripts/seedConditionCatalog.ts` (task: "Seed script (write test first)")

New file: `tests/unit/lib/scripts/seedConditionCatalog.test.ts`

- [ ] Running the seed script against an empty `conditionCatalog` collection inserts exactly 15 entries
  - Maps to spec: "Catalog is readable after seeding"
- [ ] Running the seed script twice in a row still results in exactly 15 entries (upsert-by-name, no duplicates)
  - Maps to spec: "Re-running the seed script is idempotent"
- [ ] Every seeded entry has a non-empty `name` and non-empty `description`
  - Maps to spec: "Catalog is readable after seeding"

### `app/api/conditions/catalog/route.ts` (task: "API route (write test first)")

- [ ] Authenticated `GET /api/conditions/catalog` returns 200 with a `{ name, description }[]` body
  - Maps to spec: "Catalog is readable after seeding"
- [ ] Response omits any extra fields present on the underlying stored document (e.g. `_id`, stray keys)
  - Maps to spec: "Catalog entry fields are rendered as plain text" (NFAC: Security)
- [ ] Unauthenticated request is rejected per the existing `withAuth` convention (no new behavior introduced, exercised for regression safety)
  - Maps to task: "API route (write test first)" (no dedicated spec scenario — inherits the project's standard auth contract)

### `lib/components/combatant-card/ConditionFormModal.tsx` (task: "ConditionFormModal (write/extend tests first)")

Extend: `tests/unit/components/combatant-card/ConditionFormModal.test.tsx`

- [ ] When the catalog fetch resolves with entries, the dropdown lists each catalog condition by name plus a trailing "Custom…" option
  - Maps to spec: "Selecting a catalog condition populates its description"
- [ ] Selecting a catalog condition and clicking Add calls `onSubmit` with `{ name, description }` matching that catalog entry (and `duration` from the existing duration input, unchanged)
  - Maps to spec: "Selecting a catalog condition populates its description"
- [ ] Selecting "Custom…" reveals the existing free-text name input; submitting calls `onSubmit` with the typed `name`, `description: ""`, using existing `parseConditionForm` validation (invalid name/duration still blocks submit)
  - Maps to spec: "Custom condition entry unchanged"
- [ ] When the catalog fetch rejects (network error) or resolves with zero entries, the dropdown is hidden/limited to "Custom…" and a muted note is shown; Add still works via the free-text path
  - Maps to spec: "Catalog fetch failure falls back to custom entry"
- [ ] Before the catalog fetch resolves, the modal already renders the free-text/Custom entry path as usable (not blocked/disabled)
  - Maps to spec: "Modal is usable while catalog is loading" (NFAC: Performance)
- [ ] A catalog `description` containing HTML-like text (e.g. `<b>x</b>`) is rendered literally in the dropdown/option, not as markup
  - Maps to spec: "Catalog entry fields are rendered as plain text" (NFAC: Security)

### `lib/components/combatant-card/ConditionControls.tsx` (task: "ConditionControls (write/extend tests first)")

Extend: `tests/unit/components/combatant-card/ConditionControls.test.tsx`

- [ ] Expanding the "Conditions (N)" list shows a condition's description text when `condition.description` is non-empty
  - Maps to spec: "Description shown inline for catalog conditions"
- [ ] Expanding the "Conditions (N)" list renders no extra description line/element when `condition.description` is empty (custom conditions)
  - Maps to spec: "No description line for custom conditions"
- [ ] A condition's `description` containing HTML-like text renders literally, not as injected markup
  - Maps to spec: "Catalog entry fields are rendered as plain text" (NFAC: Security)

## Traceability Summary

- Every scenario in `openspec/changes/default-condition-catalog/specs/condition-catalog/spec.md` has at least one corresponding test case above.
- Every implementation task in `tasks.md`'s Execution section with a "(write test first)" / "(write/extend tests first)" marker has a corresponding test-case group above.
