---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `fix-get-next-session-number-fallback`
change. All work should follow a strict TDD (Test-Driven Development)
process: write each test first against the current (buggy) code, watch it
fail for the reason described, then implement the corresponding task from
`tasks.md` until it passes.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a
    test that captures the requirements of the task. Run the test and ensure
    it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make
    the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the
    test still passes.

## Test Cases

### Storage layer (`lib/storage.ts`) — maps to tasks 1.1–1.3

- [ ] `getNextSessionNumber` resolves `latest.sessionNumber + 1` on a
      successful query with an existing session (unchanged happy path) —
      covers spec `session-log`, requirement "MODIFIED ADDED Session log
      creation", scenario "Create session log with required fields only"
- [ ] `getNextSessionNumber` resolves `1` when no session exists for the
      campaign (unchanged happy path, empty-collection case) — covers spec
      `session-log`, requirement "Reliability: Session number auto-increment
      on first session"
- [ ] `getNextSessionNumber` rejects with a `StorageError` (not a resolved
      `1`) when the underlying `findOne` call rejects — fails today against
      current code (returns `1`), passes once task 1.1/1.2 land — covers
      spec `session-log`, requirement "ADDED Session number generation
      failure is surfaced explicitly"
- [ ] The thrown `StorageError`'s `op` is `"getNextSessionNumber"` and
      `collection` is `"sessionLogs"`, and exactly one `logStorageEvent` call
      was made with `outcome: "error"` — covers design.md Decision 1
      (`runStorageOp` wiring, no `isEmpty`)
- [ ] No-collision case: given a campaign with an existing session numbered
      `1`, a simulated DB failure on the next `getNextSessionNumber` call
      rejects rather than resolving to `1` again — covers proposal
      Acceptance Criteria "Test proves a DB failure does not produce a
      session numbered the same as an existing session"

### `POST /api/campaigns/[id]/sessions` — maps to tasks 2.1–2.3

- [ ] When `sessionNumber` is omitted and `storage.getNextSessionNumber`
      throws, the response status is `503` and the body includes
      `code: "SESSION_NUMBER_UNAVAILABLE"` — fails today (current code has
      no reachable throw path here since `getNextSessionNumber` never
      throws), passes once task 2.1/2.2 land — covers spec `session-log`,
      scenario "Datastore failure while creating a session without an
      explicit number"
- [ ] When `sessionNumber` is omitted and `storage.getNextSessionNumber`
      throws, `storage.saveSessionLog` is never called — covers same
      scenario, "no `SessionLog` document is created"
- [ ] The `503`/`SESSION_NUMBER_UNAVAILABLE` response body/status is
      distinct from the generic `{ error: "Failed to create session log" }`
      / `500` response produced by an unrelated failure (e.g.
      `saveSessionLog` rejecting) in the same handler — covers proposal
      Acceptance Criteria "no unhandled 500 masking, no swallow-and-continue
      with bad data" and design.md Decision 2 rationale
- [ ] When a valid explicit `sessionNumber` is supplied in the body and
      `storage.getNextSessionNumber` would throw if called, the request
      still succeeds (201) and `storage.getNextSessionNumber` is never
      invoked — covers spec `session-log`, scenario "Explicit sessionNumber
      bypasses the lookup entirely"

### `POST /api/campaigns/[id]/sessions/active` — maps to tasks 3.1–3.4

- [ ] When `storage.getNextSessionNumber` throws, the response status is
      `503` with `code: "SESSION_NUMBER_UNAVAILABLE"` — fails today (no
      reachable throw path), passes once task 3.1–3.3 land — covers spec
      `session-log`, scenario "Datastore failure while opening an active
      session"
- [ ] When `storage.getNextSessionNumber` throws, `storage.saveSessionLog`
      is never called and no `session` event is emitted via `emitFiltered`
      — covers same scenario, "no `SessionLog` document is created"
- [ ] When `storage.getNextSessionNumber` throws,
      `storage.claimActiveCampaignSession` is never called — fails against
      the current call order (claim happens first), passes once task 3.1's
      reorder lands — covers spec `session-log` scenario "the campaign's
      `activeSessionId` remains unclaimed" and design.md Decision 4
- [ ] When `campaign.activeSessionId` is already set, the request short
      circuits with `409` before `storage.getNextSessionNumber` is called
      (regression check that the reorder in 3.1 didn't move the lookup
      ahead of the existing "already active" guard) — covers task 3.4

## Traceability

- Task group 1 (Storage layer) → Test Cases section "Storage layer"
- Task group 2 (sessions/route.ts) → Test Cases section "POST
  /api/campaigns/[id]/sessions"
- Task group 3 (sessions/active/route.ts) → Test Cases section "POST
  /api/campaigns/[id]/sessions/active"
- Task group 4 (Tests) → this document defines the concrete cases task
  group 4 implements
- Task group 5 (Documentation) → no test cases; verified by design.md review
