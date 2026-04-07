---
name: tests
description: Tests for the add-character-gender-field change
---

# Tests

## Overview

Tests for the `add-character-gender-field` change. All work follows strict TDD: write a failing test, implement to pass it, then refactor.

The primary test surface is E2E in `tests/e2e/characters.spec.ts`. Type correctness is validated by TypeScript compilation. API validation is verified via E2E (happy path) and can be supplemented with unit tests if the project gains API-level unit tests in future.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** — add the test to `tests/e2e/characters.spec.ts` before writing implementation code; run `npm run test:e2e` and confirm it fails.
2. **Write code to pass the test** — implement the minimal change needed to make the test pass.
3. **Refactor** — clean up without breaking tests; re-run `npm run test:e2e` to confirm green.

## Test Cases

### Task 1 — Type definition

- [ ] **TC-1.1 (compile-time):** After adding `gender?: string` to `lib/types.ts`, run `npx tsc --noEmit`. Must pass with no errors.
  - Spec: Gender field on Character type
  - Verification: `npx tsc --noEmit`

### Task 2 — API POST route

- [ ] **TC-2.1 (E2E, happy path):** Create a character with a gender value via the UI. Confirm the character is saved and the gender appears on the card.
  - Spec: API accepts and validates gender on POST — valid gender accepted
  - Verification: E2E — `createCharacter` helper with `gender: "Female"`; assert card contains "Female"

- [ ] **TC-2.2 (E2E, omission):** Create a character without a gender value. Confirm the character is saved and race displays as before.
  - Spec: API accepts and validates gender on POST — missing gender accepted
  - Verification: E2E — `createCharacter` helper without `gender`; existing callers continue to pass

### Task 3 — API PUT route

- [ ] **TC-3.1 (E2E, update):** Edit an existing character, change the gender value, save. Confirm the card displays the updated gender.
  - Spec: Gender persists through edit flow — gender updated on existing character
  - Verification: E2E — open edit form, fill new gender, save, assert card shows updated value

- [ ] **TC-3.2 (E2E, clear):** Edit an existing character, clear the gender field, save. Confirm the card shows no gender.
  - Spec: Gender persists through edit flow — gender cleared on existing character
  - Verification: E2E — open edit form, clear gender, save, assert gender value absent from card

### Task 4 — CharacterEditor form

- [ ] **TC-4.1 (E2E):** Open the "Add New Character" form. Assert that an element with `aria-label="Character gender"` is visible and enabled.
  - Spec: Gender input in CharacterEditor — field present in creation form
  - Verification: `await expect(page.getByLabel("Character gender")).toBeVisible()`

- [ ] **TC-4.2 (E2E):** Open the edit form for an existing character that has a gender. Assert the gender input is pre-populated with the correct value.
  - Spec: Gender input in CharacterEditor — field present in edit form
  - Verification: `await expect(page.getByLabel("Character gender")).toHaveValue("<existing gender>")`

### Task 5 — Character card display

- [ ] **TC-5.1 (E2E):** Create a character with `gender: "Female"` and `race: "Half-Elf"`. Assert the card subtitle contains "Female Half-Elf".
  - Spec: Display — both gender and race set
  - Verification: `await expect(page.getByText("Female Half-Elf")).toBeVisible()`

- [ ] **TC-5.2 (E2E):** Create a character with `gender: "Non-binary"` and no race. Assert the card subtitle contains "Non-binary" without a stray separator.
  - Spec: Display — gender set, race not set
  - Verification: Card text includes "Non-binary"; does not include "- " with trailing/leading extra space

- [ ] **TC-5.3 (E2E):** Create a character with no gender and `race: "Human"`. Assert the card subtitle contains "Human" — unchanged from current behaviour.
  - Spec: Display — race set, gender not set (regression)
  - Verification: Card text includes "Human"; existing E2E tests for race display continue to pass

### Task 6 — E2E helper

- [ ] **TC-6.1:** Call `createCharacter(page, { name, class, race, gender: "Male" })`. Assert the character is created and "Male" appears on the card.
  - Spec: createCharacter() helper — called with gender
  - Verification: Covered by TC-2.1 and TC-5.1 above when using the extended helper

- [ ] **TC-6.2 (regression):** All existing `createCharacter` call sites (no `gender` param) must continue to work without modification.
  - Spec: createCharacter() helper — called without gender
  - Verification: Full E2E suite passes without changes to existing callers

### Task 7 — E2E tests (new describe block)

- [ ] **TC-7.1:** `describe("gender field")` — "gender input is present in character creation form"
  - Covered by TC-4.1

- [ ] **TC-7.2:** `describe("gender field")` — "gender persists after save and appears on character card"
  - Covered by TC-2.1 + TC-5.1

- [ ] **TC-7.3:** `describe("gender field")` — "creating a character without gender does not break display"
  - Covered by TC-2.2 + TC-5.3
