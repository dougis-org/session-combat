---
name: tests
description: Tests for the member-aware-campaign-access change
---

# Tests

## Overview

All work follows strict TDD: write a failing test → write minimal code to pass → refactor.

Test files:
- `tests/unit/storage/campaignMembers.test.ts` — storage methods (`getMember`, `loadCampaignByIdAny`)
- `tests/unit/utils/assertCampaignAccess.test.ts` — utility function
- `tests/unit/api/campaigns/[id]/route.test.ts` — updated route handler (add new cases to existing file)
- `tests/unit/api/campaigns/[id]/sessions/route.test.ts` — sessions route (add new cases)
- `tests/unit/api/campaigns/[id]/sessions/[sessionId]/route.test.ts` — session PATCH route
- `tests/unit/api/campaigns/[id]/combat-events/route.test.ts` — combat-events GET route

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2. **Write code to pass the test:** Write the simplest possible code to make the test pass.
3. **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task 1 — `getMember` storage method

- [ ] `getMember` returns normalized `CampaignMember` when record exists (strips `_id`)
  - Spec: ADDED `getMember` — Scenario: Member exists
- [ ] `getMember` returns `null` when no matching record
  - Spec: ADDED `getMember` — Scenario: Member does not exist

### Task 2 — `loadCampaignByIdAny` storage method

- [ ] `loadCampaignByIdAny` returns normalized `Campaign` when campaign exists
  - Spec: ADDED `loadCampaignByIdAny` — Scenario: Campaign exists
- [ ] `loadCampaignByIdAny` returns `null` when campaign does not exist
  - Spec: ADDED `loadCampaignByIdAny` — Scenario: Campaign does not exist

### Task 3 — `assertCampaignAccess` utility

- [ ] Active DM member → returns `{ campaign, role: 'dm' }`
  - Spec: ADDED `assertCampaignAccess` — Scenario: Active member gains access
- [ ] Active player member → returns `{ campaign, role: 'player' }`
  - Spec: ADDED `assertCampaignAccess` — Scenario: Active member gains access
- [ ] `getMember` returns `null` → returns 404 NextResponse with `{ error: 'Campaign not found' }`
  - Spec: ADDED `assertCampaignAccess` — Scenario: Non-member is denied
- [ ] Member status `'pending'` → returns 404 NextResponse
  - Spec: ADDED `assertCampaignAccess` — Scenario: Pending member is denied
- [ ] Member status `'declined'` → returns 404 NextResponse
  - Spec: ADDED `assertCampaignAccess` — Scenario: Declined member is denied
- [ ] Active member but `loadCampaignByIdAny` returns `null` → returns 404 NextResponse
  - Spec: ADDED `assertCampaignAccess` — Scenario: Member record exists but campaign document is missing

### Task 4 — `app/api/campaigns/[id]/route.ts` refactor

- [ ] GET as active player member → 200 with campaign body
  - Spec: ADDED `GET /api/campaigns/[id]` — Scenario: Player member GET succeeds
- [ ] GET as active DM member → 200 with campaign body (regression)
  - Spec: ADDED `GET /api/campaigns/[id]` — Scenario: DM member GET succeeds
- [ ] GET as non-member → 404 with `{ error: 'Campaign not found' }`
  - Spec: ADDED `GET /api/campaigns/[id]` — Scenario: Non-member GET is denied
- [ ] PATCH as active DM → 200 with updated campaign
  - Spec: MODIFIED write routes — Scenario: DM PATCH succeeds
- [ ] PATCH as active player → 404
  - Spec: MODIFIED write routes — Scenario: Player PATCH is denied
- [ ] DELETE as active DM → 200
  - Spec: MODIFIED write routes — Scenario: DM DELETE succeeds
- [ ] DELETE as active player → 404
  - Spec: MODIFIED write routes — Scenario: Player DELETE is denied

### Task 5 — `app/api/campaigns/[id]/sessions/route.ts` refactor

- [ ] GET as active player → 200 with session log array
  - Spec: ADDED sessions GET — Scenario: Player sessions GET
- [ ] GET as non-member → 404
  - Spec: ADDED sessions GET — Scenario: Non-member sessions GET is denied
- [ ] POST as active DM → 201 with new session log
  - Spec: MODIFIED write routes — Scenario: DM POST session succeeds
- [ ] POST as active player → 404
  - Spec: MODIFIED write routes — Scenario: Player POST session is denied

### Task 6 — `app/api/campaigns/[id]/sessions/[sessionId]/route.ts`

- [ ] PATCH as active DM → 200 (or 404 if sessionId not found — pre-existing behavior)
  - Spec: MODIFIED write routes — Scenario: DM PATCH session log succeeds
- [ ] PATCH as active player → 404
  - Spec: MODIFIED write routes — Scenario: Player PATCH session log is denied
- [ ] PATCH as non-member → 404
  - Spec: Non-functional security — Scenario: Player cannot escalate to DM write

### Task 7 — `app/api/campaigns/[id]/combat-events/route.ts`

- [ ] GET as active player → 200 with events filtered to `auth.userId`
  - Spec: ADDED combat events GET — Scenario: Player combat events GET
- [ ] GET as non-member → 404
  - Spec: ADDED combat events GET — Scenario: Non-member combat events GET is denied

### Non-functional / security

- [ ] All denial responses use status 404 with body `{ error: 'Campaign not found' }` — not 403 or any body revealing campaign existence
  - Spec: Non-functional — Scenario: No campaign existence leakage
- [ ] Grep assertion: `loadCampaignByIdAny` is called only inside `lib/utils/campaign.ts`
  - Spec: Non-functional — security invariant (manual or CI grep step)
