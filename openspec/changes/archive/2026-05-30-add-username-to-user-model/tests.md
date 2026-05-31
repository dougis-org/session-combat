---
name: tests
description: Tests for the add-username-to-user-model change
---

# Tests

## Overview

Tests for `add-username-to-user-model`. Follow strict TDD: write failing test → implement → make it pass → refactor.

Test files:
- Unit/integration for type + index: `tests/integration/username-model.test.ts`
- Integration for backfill script: `tests/integration/backfill-usernames.test.ts`

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** — before any implementation, write the test and confirm it fails.
2. **Write code to pass the test** — minimal implementation to make it green.
3. **Refactor** — clean up while keeping tests green.

## Test Cases

### Task 1 — `username` field on `User` interface

- [x] **Type: User object with username compiles** — construct a `User`-typed object including `username: "alice"`; `tsc --noEmit` must pass.
  - Spec: ADDED Username field on User type / Scenario: User object with username is valid TypeScript

- [x] **Type: User object without username compiles** — construct a `User`-typed object omitting `username`; `tsc --noEmit` must pass.
  - Spec: ADDED Username field on User type / Scenario: User object without username is valid TypeScript

### Task 2 — Sparse unique index on `users.username`

- [x] **Integration: Two case-distinct usernames coexist** — insert `{ username: "Alice" }` and `{ username: "alice" }` into `users`; both inserts must succeed.
  - Spec: ADDED Sparse unique index / Scenario: Two users with different usernames can coexist

- [x] **Integration: Duplicate username rejected** — insert `{ username: "doug" }` twice; second insert must throw a MongoDB error with code 11000.
  - Spec: ADDED Sparse unique index / Scenario: Duplicate username is rejected

- [x] **Integration: Documents without username field coexist** — insert multiple user docs omitting `username`; all inserts must succeed.
  - Spec: ADDED Sparse unique index / Scenario: Documents without username do not conflict

- [x] **Integration: Index creation failure is non-fatal** — mock `db.collection("users").createIndex` to throw an unexpected error; call `initializeDatabase`; assert it resolves without rethrowing and logs a warning.
  - Spec: Non-Functional / Scenario: Index creation failure is non-fatal

### Task 3 — Backfill script (`scripts/backfill-usernames.ts`)

- [x] **Integration: Users without username receive one** — seed 2 users without `username`; run backfill; assert both documents now have `username` set to a non-empty string.
  - Spec: ADDED Idempotent username backfill script / Scenario: Users without username receive a username

- [x] **Integration: Username derived from email local-part** — seed user with `email: "doug@example.com"`; run backfill; assert `username === "doug"`.
  - Spec: ADDED Idempotent username backfill script / Scenario: Users without username receive a username

- [x] **Integration: Collision de-duplicated with suffix** — seed two users with `foo@a.com` and `foo@b.com`; run backfill; assert one gets `"foo"` and the other gets `"foo-2"`.
  - Spec: ADDED Idempotent username backfill script / Scenario: Email local-part collision de-duplicated with suffix

- [x] **Integration: Already-assigned usernames not overwritten** — seed user with `username: "existing"`; run backfill; assert `username` is still `"existing"`.
  - Spec: ADDED Idempotent username backfill script / Scenario: Already-assigned usernames are not overwritten

- [x] **Integration: Second run is a no-op** — run backfill on a fully-assigned collection; assert 0 documents modified and no errors thrown.
  - Spec: ADDED Idempotent username backfill script / Scenario: Second run of backfill is a no-op
  - Spec: Non-Functional / Scenario: Backfill is safe to re-run
