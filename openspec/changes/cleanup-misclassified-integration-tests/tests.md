---
name: tests
description: Tests for cleanup-misclassified-integration-tests
---

# Tests

## Overview

This change IS the tests — implementation consists of relocating, merging, and augmenting test files. The TDD workflow here means: write the destination test file first, verify it passes, then delete the source. This document maps each task to its verification criteria and the spec scenario it satisfies.

> Note: "Write failing test first" does not apply to pure moves (A1–A3, D1) since the tests already exist. It applies fully to B1, B2, and C1–C4 where new test content is authored.

## Test Cases

### Group A — Simple moves

- [ ] **A1** `tests/unit/api/monsters/duplicate.test.ts` exists and `npm run test:unit` passes before `tests/integration/duplicate-monster.test.ts` is deleted
  - Spec: `specs/test-classification.md` → REMOVED duplicate-monster.test.ts

- [ ] **A2** `tests/unit/lib/clientStorage.test.ts` exists and `npm run test:unit` passes before `tests/integration/clientStorage.test.ts` is deleted
  - Spec: `specs/test-classification.md` → REMOVED clientStorage.test.ts

- [ ] **A3** `tests/unit/validation/password.test.ts` exists and `npm run test:unit` passes before `tests/integration/validation/password.test.ts` is deleted
  - Spec: `specs/test-classification.md` → REMOVED password.test.ts

### Group B — Augment existing unit files

- [ ] **B1a** New assertion in POST "creates party and returns 201": `savedParty._id` is `undefined` and `savedParty.id` is a non-empty string — passes before integration file deleted
  - Spec: `specs/test-classification.md` → ADDED Unit tests for party route PUT handler (POST assertion)

- [ ] **B1b** New `describe("PUT /api/parties/[id]")` in `tests/unit/api/parties/route.test.ts`:
  - Test: updates party fields and returns 200
  - Test: `_id` is absent from the saved payload
  - Both pass before `tests/integration/party-routes.test.ts` is deleted
  - Spec: `specs/test-classification.md` → ADDED Unit tests for party route PUT handler

- [ ] **B2** New `describe("storage.saveParty")` in `tests/unit/storage/storage.test.ts`:
  - Test: `collection("parties")` is called
  - Test: `updateOne` called with filter `{id, userId}`, `{$set: partyDataWithout_id}`, `{upsert: true}`
  - Passes before `tests/integration/storage.party.test.ts` is deleted
  - Spec: `specs/test-classification.md` → ADDED Unit test for storage.saveParty

### Group C — monsterUpload split

- [ ] **C1** `tests/unit/monster-upload/document-validation.test.ts` covers all `validateMonsterUploadDocument` scenarios:
  - Rejects missing `monsters` array
  - Rejects empty `monsters` array
  - Accepts single valid monster
  - Accepts multi-monster document
  - Collects errors from all invalid monsters
  - `npm run test:unit` passes
  - Spec: `specs/test-classification.md` → ADDED document-validation.test.ts

- [ ] **C2** `tests/unit/monster-upload/field-validation.test.ts` covers all `validateMonsterData` scenarios:
  - Required: name, maxHp — missing and invalid cases
  - Optional: size enum, AC range 0–30, challengeRating non-negative
  - Ability scores: valid set, missing fields, out-of-range values
  - Array fields: languages (string validation), traits (name+description required)
  - legendaryActionCount: valid int, 0, undefined, non-integer, negative, string, NaN
  - `npm run test:unit` passes
  - Spec: `specs/test-classification.md` → ADDED field-validation.test.ts

- [ ] **C3** `tests/unit/monster-upload/transform.test.ts` covers:
  - General transform: defaults applied, complete data passed through, hp clamped to maxHp, hp defaults to maxHp, name trimmed, unique IDs, userId assigned, isGlobal=false
  - Nested `describe("damage type filtering")`: all 13 canonical types pass through, mixed-case normalized, whitespace trimmed, freeform strings filtered, empty array when all invalid, undefined arrays → empty arrays, mixed valid/invalid
  - Alignment normalization: casing and whitespace → canonical title case
  - `npm run test:unit` passes — including all tests previously in `tests/unit/validation/monsterUpload.test.ts`
  - Spec: `specs/test-classification.md` → ADDED transform.test.ts, REMOVED unit/validation/monsterUpload.test.ts

- [ ] **C4** `tests/unit/monster-upload/pipeline.test.ts` covers:
  - Validate + transform complete two-monster document: all monsters userId-stamped
  - Validate + transform minimal document: valid, transformable
  - `npm run test:unit` passes
  - Spec: `specs/test-classification.md` → ADDED pipeline.test.ts

- [ ] **C5** After C1–C4 green: `tests/integration/monsterUpload.test.ts` deleted, `tests/integration/monsterUploadRoute.test.ts` deleted, `tests/unit/validation/monsterUpload.test.ts` deleted — `npm run test:unit` still passes
  - Spec: `specs/test-classification.md` → REMOVED monsterUpload.test.ts, REMOVED monsterUploadRoute.test.ts

### Group D — Documentation

- [ ] **D1** `tests/integration/offline/logout-clears-storage.test.ts` has JSDoc header naming real modules integrated and explaining boundary-only mocks — `npm run test:integration` still passes
  - Spec: `specs/test-classification.md` → ADDED documentation header

### Group E — Config collapse

- [ ] **E1** `grep -r "jest.mock" tests/integration/` returns only `tests/integration/offline/logout-clears-storage.test.ts`

- [ ] **E2** `jest.integration.config.js` contains no `testPathIgnorePatterns` — `npm run test:integration` runs the full suite including testcontainer tests

- [ ] **E3** `jest.docker.config.js` does not exist

- [ ] **E4** `package.json` scripts does not contain `test:docker`

- [ ] **E5** `npm run test:ci` passes
  - Spec: `specs/jest-config.md` → MODIFIED jest.integration.config.js, REMOVED jest.docker.config.js, REMOVED test:docker
