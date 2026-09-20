---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `validate-session-post-body` change (GitHub #562). All work follows a strict TDD process: write a failing test against the acceptance scenarios in `openspec/changes/validate-session-post-body/specs/session-log-validation/spec.md`, implement the minimal code to pass it, then refactor.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task 1 — `zodErrorResponse` shared helper (`tests/unit/lib/server/zodErrorResponse.test.ts`)

- [ ] Given a `ZodError` whose first issue has a `path` (e.g. `['datePlayed']`) and a `message`, `zodErrorResponse` returns a `NextResponse` with `status: 400` and JSON body `{ error: "datePlayed: <message>" }`
- [ ] Given a `ZodError` whose first issue has a nested `path` (e.g. `['events', 0, 'description']`), the field prefix is the dot-joined path (`events.0.description: <message>`)
- [ ] Given a `ZodError` whose first issue has an empty `path`, the response body is `{ error: "<fallbackMessage>" }` with no field prefix
- [ ] The returned response's `status` is always `400`, regardless of issue content

### Task 2 — Refactor `rolls/route.ts` to use `zodErrorResponse` (no test changes; regression only)

- [ ] `tests/unit/api/campaigns/[id]/rolls.route.test.ts` passes unmodified after the refactor (proves the extraction preserves exact response shape for both POST and GET error paths) — maps to design.md Decision 4's validation approach

### Task 3 — `sessionLogSubmissionSchema` (`tests/unit/lib/validation/sessionLog.test.ts`)

- [ ] Missing `datePlayed` → `safeParse` fails, issue path includes `datePlayed` — maps to spec scenario "Missing datePlayed is rejected"
- [ ] `datePlayed: "not-a-date"` → `safeParse` fails, issue path includes `datePlayed` — maps to spec scenario "Unparseable datePlayed is rejected"
- [ ] `datePlayed: "2026-09-19"` → `safeParse` succeeds, `data.datePlayed` is a `Date` instance — maps to spec scenario "Valid datePlayed (ISO string) is accepted"
- [ ] `title` of 201 characters → `safeParse` fails, issue path includes `title` — maps to spec scenario "Oversized title is rejected"
- [ ] `summary` of 10,001 characters → `safeParse` fails, issue path includes `summary` — maps to spec scenario "Oversized summary is rejected"
- [ ] `title` of exactly 200 characters and `summary` of exactly 10,000 characters → `safeParse` succeeds — maps to spec scenario "At-bound title and summary are accepted"
- [ ] `title`/`summary` omitted → `safeParse` succeeds, both `undefined` — maps to spec scenario "Omitted title and summary are accepted"
- [ ] `events: [{ type: "not_a_real_type", description: "x" }]` → `safeParse` fails, issue path includes `events`, `0`, `type` — maps to spec scenario "Event with invalid type is rejected"
- [ ] `events: [{ type: "custom" }]` (no `description`) → `safeParse` fails, issue path includes `events`, `0`, `description` — maps to spec scenario "Event missing description is rejected"
- [ ] `events` element with `description` of 2,001 characters → `safeParse` fails — maps to spec scenario "Event with oversized description is rejected"
- [ ] `events: "not-an-array"` → `safeParse` fails — maps to spec scenario "Non-array events is rejected"
- [ ] `events` element matching the full auto-capture `combat_completed` shape (`type`, `description`, `encounterId`, `encounterDescription`, `rounds`, `completedAt`, `campaignId` all present and correctly typed) → `safeParse` succeeds, all fields preserved in `data` — maps to spec scenario "Full-shape combat_completed event is accepted"
- [ ] `events: [{ type: 'custom', description: 'Party found a secret door' }]` (no optional fields) → `safeParse` succeeds — maps to spec scenario "Minimal custom event from the manual form is accepted"
- [ ] `events` omitted → `safeParse` succeeds, `data.events` is `[]` — maps to spec scenario "Omitted events defaults to an empty array"
- [ ] `events` array of 201 valid elements → `safeParse` fails — maps to spec scenario "Oversized events array is rejected"
- [ ] `events` array of exactly 200 valid elements → `safeParse` succeeds — maps to spec scenario "At-bound events array is accepted"

### Task 4 — Rewrite `sessions/route.ts` POST handling (`tests/unit/api/campaigns/[id]/sessions.route.test.ts`)

- [ ] POST body larger than `SESSION_BODY_MAX_BYTES` (64 KiB) → response `413`, no session log created — maps to spec scenario "Oversized request body is rejected"
- [ ] POST body within limit but invalid JSON → response `400` (mirrors `rolls/route.ts`'s `invalid-json` handling)
- [ ] POST body missing `datePlayed` → response `400`, no session log created — maps to spec scenario "Missing datePlayed is rejected" (route-level)
- [ ] POST body with `datePlayed: "not-a-date"` → response `400` — maps to spec scenario "Unparseable datePlayed is rejected" (route-level)
- [ ] POST body with oversized `title` → response `400` — maps to spec scenario "Oversized title is rejected" (route-level)
- [ ] POST body with oversized `summary` → response `400` — maps to spec scenario "Oversized summary is rejected" (route-level)
- [ ] POST body with malformed `events` element → response `400` — maps to spec scenario "Event with invalid type is rejected" / "Event missing description is rejected" (route-level)
- [ ] POST body with 201 `events` elements → response `400` — maps to spec scenario "Oversized events array is rejected" (route-level)
- [ ] POST body with a full-shape `combat_completed` event → response `201`, created `SessionLog.events[0]` matches input exactly — maps to spec scenario "Full-shape combat_completed event is accepted" (route-level)
- [ ] POST body with a minimal custom event and no `title`/`summary` → response `201` — maps to spec scenarios "Minimal custom event from the manual form is accepted", "Omitted title and summary are accepted" (route-level)
- [ ] **Regression:** POST body with `sessionNumber: "not-a-number"` (or omitted) and an otherwise-valid payload → `storage.getNextSessionNumber` is still invoked and its result used, response `201` — maps to spec scenario "Invalid sessionNumber still falls back to auto-numbering (unchanged)"
- [ ] **Regression:** POST body with no `sessionNumber` where `storage.getNextSessionNumber` throws → response `503` with `code: "SESSION_NUMBER_UNAVAILABLE"` — maps to spec scenario "getNextSessionNumber failure still returns 503 (unchanged)"
- [ ] **Regression:** existing valid `milestone`/`newLevel` handling (e.g. `milestone: true, newLevel: 5`) is unaffected — `SessionLog.newLevel` set exactly as before this change

## Non-Functional Test Cases

- [ ] Performance: not applicable — no new latency budget introduced (design.md Non-Functional Requirements Mapping, "Performance")
- [ ] Reliability: `rolls.route.test.ts` full suite passes unmodified post-refactor — maps to design.md Non-Functional Requirements Mapping, "Reliability" and specs.md "Roll-submission route behavior is unchanged after zodErrorResponse extraction"
