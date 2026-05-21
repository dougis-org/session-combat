---
name: tests
description: Tests for the extract-query-helper-storage change
---

# Tests

## Overview

This document outlines the tests for the `extract-query-helper-storage` change. All work follows a strict TDD (Test-Driven Development) process.

The change is a pure internal refactor: no new behaviour is introduced. Tests verify that:
1. The extracted helper produces identical query objects to the inline blocks it replaces.
2. All five updated save functions continue to behave correctly end-to-end.
3. `saveParty` remains unmodified and continues to behave correctly.
4. TypeScript compilation passes (no `any` or unsafe casts in the changed lines).

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2. **Write code to pass the test:** Write the simplest possible code to make the test pass.
3. **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### `buildEntityQuery` helper unit tests

- [ ] Returns `{ userId }` when entity has no `_id`
- [ ] Returns `{ userId, _id: ObjectId }` when entity has a non-empty `_id` string
- [ ] Returns `{ userId, id }` when entity has no `_id` (uses `entity.id` as the secondary key)
- [ ] Returns a `Filter<Document>` — TypeScript type check passes (compile-time, verified via `tsc --noEmit`)

### `saveEncounter` integration tests (task 5)

- [ ] Calls `updateOne` with `{ userId, _id: ObjectId }` filter when encounter has `_id`
- [ ] Calls `updateOne` with `{ userId, id }` filter when encounter has no `_id`
- [ ] Does not use `any` in the query variable (verified by type check)

### `saveCharacter` integration tests (task 6)

- [ ] Calls `updateOne` with `{ userId, _id: ObjectId }` filter when character has `_id`
- [ ] Calls `updateOne` with `{ userId, id }` filter when character has no `_id`

### `saveCombatState` integration tests (task 7)

- [ ] Calls `updateOne` with `{ userId, _id: ObjectId }` filter when combatState has `_id`
- [ ] Calls `updateOne` with `{ userId, id }` filter when combatState has no `_id`

### `saveMonsterTemplate` integration tests (task 8)

- [ ] Calls `updateOne` with `{ userId, _id: ObjectId }` filter when template has `_id`
- [ ] Calls `updateOne` with `{ userId, id }` filter when template has no `_id`

### `saveSpellTemplate` integration tests (task 9)

- [ ] Calls `updateOne` with `{ userId, _id: ObjectId }` filter when spell has `_id`
- [ ] Calls `updateOne` with `{ userId, id }` filter when spell has no `_id`

### `saveParty` regression test (task 10)

- [ ] `saveParty` query shape is unchanged (`{ id, userId }` only — no `_id` branch)
- [ ] `saveParty` still passes all existing tests without modification

### Type-safety verification (tasks 3–4)

- [ ] `tsc --noEmit` reports zero errors after adding `QueryableEntity` and `buildEntityQuery`
- [ ] No `any` appears in the query variable across all five updated call sites (grep check)
