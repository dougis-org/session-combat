---
name: tests
description: Tests for the test-login-and-encounters-pages change
---

# Tests

## Overview

This document outlines the tests for the `test-login-and-encounters-pages` change. All work follows a strict TDD process: write a failing test first, make it pass, then refactor.

The three test files are themselves the primary deliverable of this change. They are written in **Phase 2** of `tasks.md` as failing tests, then made green in **Phase 3**.

## Testing Steps

For each test file (Tasks 2.1 → 2.2 → 2.3):

1. **Write a failing test:** Write the full test file before touching source code. Run it and confirm it fails (red).
2. **Write code to pass the test:** The Phase 1 source refactor (extraction + export) should already satisfy most cases. Fix any remaining wiring issues in Phase 3.
3. **Refactor:** Clean up mock setup duplication, extract shared fixtures, and ensure each `describe` block is focused.

## Test Cases

### Task 2.1 — LoginPage.test.tsx

**Maps to:** `specs/login-page/spec.md` · `tests/unit/components/LoginPage.test.tsx`

- [ ] Renders email input (`input[type="email"]` present)
- [ ] Renders password input (`input[type="password"]` present)
- [ ] Renders a submit button (`button[type="submit"]` present)
- [ ] Blocks submit and shows "Email is required" when email field is empty
- [ ] Blocks submit and shows "Password is required" when password field is empty
- [ ] Blocks submit and shows "valid email" error when email is malformed
- [ ] `login` mock is NOT called on any blocked submission
- [ ] `login(email, password)` is called exactly once on a valid submit
- [ ] `router.replace('/campaigns')` is called when `login` returns `true`
- [ ] Error string from `useAuth.error` is displayed when `login` returns `false`
- [ ] `router.replace('/campaigns')` is called on mount when `isAuthenticated` is `true`

### Task 2.2 — EncountersPage.test.tsx

**Maps to:** `specs/encounters-page/spec.md` · `tests/unit/components/EncountersPage.test.tsx`

- [ ] Encounter names from fetch response appear in the DOM (`screen.findByText`)
- [ ] Empty state message is shown when fetch returns `[]`
- [ ] "Add New Encounter" button is present after fetch resolves
- [ ] Error message is displayed when fetch returns a non-OK response
- [ ] Error message is displayed when fetch throws
- [ ] `confirm` mock returning `true` → DELETE fetch called with correct URL
- [ ] After DELETE, encounters list is re-fetched (GET called again)
- [ ] `confirm` mock returning `false` → no DELETE fetch call made

### Task 2.3 — EncounterEditor.test.tsx

**Maps to:** `specs/encounter-editor/spec.md` · `tests/unit/components/EncounterEditor.test.tsx`

- [ ] Heading contains "Create Encounter" when `isNew={true}`
- [ ] Heading contains "Edit Encounter" when `isNew={false}`
- [ ] Name input has value matching `encounter.name` prop
- [ ] Description textarea has value matching `encounter.description` prop
- [ ] "Save Encounter" button is disabled when `encounter.name` is `""`
- [ ] "Save Encounter" button is enabled when `encounter.name` is non-empty
- [ ] Clicking Save calls `onSave` with object containing `name`, `description`, `monsters`
- [ ] Clicking Cancel calls `onCancel` once
- [ ] "No monsters added yet." text is present when `monsters: []`
- [ ] Monster name is visible and Edit/Delete buttons present when monsters array is non-empty
- [ ] "Add Combatant" button is present in the DOM
