---
name: tests
description: Tests for the campaign-nav-fix-and-encounter-tests change
---

# Tests

## Overview

This document outlines the tests for the `campaign-nav-fix-and-encounter-tests` change. All new test cases follow strict TDD (write failing test, write minimal code to pass, refactor). Task D is verification-only (no new test code); it is listed here for traceability against the spec but has no fail/pass/refactor cycle of its own.

## Testing Steps

For each test case below:

1. **Write a failing test:** Before writing any implementation code, write the test capturing the requirement. Run it and confirm it fails for the expected reason (missing markup / missing route behavior), not a setup error.
2. **Write code to pass the test:** Make the minimal change to `app/campaigns/page.tsx` (Task B) or add the new E2E spec content (Task E) to make the test pass.
3. **Refactor:** Clean up test/implementation code while keeping the test green.

## Test Cases

### Task B/C — Campaign list card links (unit)

Maps to: `tasks.md` Task B, Task C · Spec: "ADDED Campaign list card offers correctly labeled, correctly routed Encounters and Start Combat actions"

- [x] Unit test: campaign card renders a link labeled "Encounters" with `href="/campaigns/{campaign.id}/encounters"`
- [x] Unit test: campaign card renders a link labeled "Start Combat" with `href="/campaigns/{campaign.id}/combat"`
- [x] Unit test: campaign card does NOT render a link labeled "Start Encounter" and does NOT render any link with `href="/encounters"`
- [x] Unit test: the four existing sibling links (Members, Prompt Builder, Library, Session Log) are still present and unchanged, confirming the fix is additive/replacing only the one link

### Task D — Existing API test coverage confirmation (verification only)

Maps to: `tasks.md` Task D · Spec: "Existing API test coverage satisfies #541's requirement" (non-functional/verification scenario, no new test code)

- [x] Verify `tests/unit/api/campaigns/[id]/encounters/route.test.ts` covers: DM links an owned encounter; linking twice is idempotent; linking an unowned encounter is rejected; player cannot link; list returns linked encounters for DM and player member; non-member is rejected; empty `encounterIds` returns empty list
- [x] Verify `tests/unit/api/campaigns/[id]/encounters/[encounterId]/route.test.ts` covers: DM unlinks; unlinking a non-linked encounter is a no-op success; player cannot unlink
- [x] If any scenario above is missing, STOP and report the gap per Change Control (do not silently add coverage under this task)
- [x] Re-run `npm run test:unit` and `npm run test:integration` and confirm both files pass

### Task E — E2E: Start Combat routing

Maps to: `tasks.md` Task E (scenario 1) · Spec: "Start Combat routes to campaign combat setup, not the global encounter browser"

- [x] E2E test: from `/campaigns`, clicking "Start Combat" on a campaign card navigates to `/campaigns/{id}/combat`
- [x] E2E test: the campaign-scoped `CombatSetupView` (or a stable selector within it) is visible after navigation, and the URL is not `/encounters`

### Task E — E2E: Encounters tab link/unlink reflected in combat-setup picker

Maps to: `tasks.md` Task E (scenario 2) · Spec: "Linking an encounter makes it appear in the campaign's combat-setup picker" / "Unlinking an encounter removes it from the picker but not from the global list"

- [x] E2E test: DM links an existing owned encounter via `/campaigns/{id}/encounters`, then navigates to `/campaigns/{id}/combat` and sees it in the "From Library" panel (assert on settled UI state, not a fixed wait)
- [x] E2E test: DM unlinks that encounter from `/campaigns/{id}/encounters`, returns to `/campaigns/{id}/combat`, and confirms it no longer appears in "From Library"
- [x] E2E test: after unlinking, the encounter still appears on the global `/encounters` list

### Task E — E2E: Ad hoc combat Quick Entry unaffected by campaign scoping

Maps to: `tasks.md` Task E (scenario 3) · Spec: "Ad hoc combat Quick Entry works with zero campaign-linked encounters"

- [x] E2E test: navigating directly to `/combat` (no `campaignId`), adding combatants via Quick Entry, and starting combat renders the active combat screen successfully, regardless of any campaign's linked-encounter state

### Reliability (NFAC)

Maps to: spec "New E2E tests do not introduce flakiness"

- [x] Run `tests/e2e/campaign-combat-linking.spec.ts` locally with `--repeat-each=3` and confirm all three scenarios pass consistently with no fixed-sleep assertions
