---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `campaign-nav-fix-and-encounter-tests` change. All work should follow a strict TDD (Test-Driven Development) process, except where noted (Task C is verification-only — no new production code is written for it, so there is no failing-test-first step).

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task A/B — Campaign list card fix (`app/campaigns/page.tsx`)

- [ ] Unit test: renders a link labeled "Encounters" with `href="/campaigns/{campaign.id}/encounters"` for a campaign card — write failing first (current code has no such link), then implement Task A to pass. Maps to spec scenario "Campaign card shows Encounters and Start Combat links" / "Encounters link routes to the campaign's encounter management screen".
- [ ] Unit test: renders a link labeled "Start Combat" with `href="/campaigns/{campaign.id}/combat"` for a campaign card — write failing first, then implement Task A to pass. Maps to spec scenario "Campaign card shows Encounters and Start Combat links" / "Start Combat routes to campaign combat setup, not the global encounter browser".
- [ ] Unit test: does NOT render a link labeled "Start Encounter" or with `href="/encounters"` on the campaign card — write failing first (current code has exactly this link), then implement Task A to pass. Maps to spec scenario "Campaign card shows Encounters and Start Combat links".

### Task C — Verify existing API test coverage satisfies #541 (verification-only, no new tests)

- [ ] Run `npm run test:unit` and `npm run test:integration`; confirm `tests/unit/api/campaigns/[id]/encounters/route.test.ts` passes and contains scenarios: "DM fetches linked encounters", "Player member fetches the same linked encounters", "Non-member is rejected", "Empty encounterIds returns empty list", "DM links an owned encounter", "Linking the same encounter twice is idempotent", "Linking an encounter you don't own is rejected", "Player member cannot link".
- [ ] Confirm `tests/unit/api/campaigns/[id]/encounters/[encounterId]/route.test.ts` passes and contains scenarios: "DM unlinks a linked encounter", "Unlinking an encounter that isn't linked is a no-op success", "Player member cannot unlink".
- [ ] If any scenario above is missing or any test fails: STOP, do not write ad hoc replacement tests, and flag to the user per tasks.md Task C's Change Control note. Maps to spec requirement "ADDED E2E coverage confirms..." traceability note in specs/campaign-nav-encounter-fix/spec.md and design.md Decision 3.

### Task D — New E2E spec `tests/e2e/campaign-combat-linking.spec.ts`

- [ ] E2E test (D1): from `/campaigns`, clicking "Start Combat" on a campaign card navigates to `/campaigns/{id}/combat` and renders the campaign-scoped `CombatSetupView` — write failing first (file/test doesn't exist yet; would also fail today since the button doesn't exist until Task A lands), then confirm it passes once Task A is implemented. Maps to spec scenario "Start Combat routes to campaign combat setup, not the global encounter browser".
- [ ] E2E test (D2a): linking an existing owned encounter via `/campaigns/{id}/encounters` makes it appear in the `/campaigns/{id}/combat` "From Library" panel — write failing first, confirm passes against already-shipped API/picker code (no production code change expected for this case; test should pass once written since the underlying feature already exists). Maps to spec scenario "Linking an encounter makes it appear in the campaign's combat-setup picker".
- [ ] E2E test (D2b): unlinking that encounter removes it from the "From Library" panel but it remains visible on the global `/encounters` page — write failing first, confirm passes against already-shipped code. Maps to spec scenario "Unlinking an encounter removes it from the picker but not from the global list".
- [ ] E2E test (D3): navigating directly to `/combat` (no campaignId) and completing Quick Entry still starts combat successfully with zero campaign-linked encounters anywhere — write failing first (file doesn't exist yet), confirm passes against already-shipped ad hoc combat flow (regression guard, no production code change expected). Maps to spec scenario "Ad hoc combat Quick Entry works with zero campaign-linked encounters".
- [ ] Reliability check: run the new spec file with `--repeat-each=3` locally at least once; all three scenarios must pass consistently across repeats, with D2a/D2b asserting on final settled UI state rather than fixed waits. Maps to specs/campaign-nav-encounter-fix/spec.md Non-Functional Acceptance Criteria — Reliability — "New E2E tests do not introduce flakiness".
