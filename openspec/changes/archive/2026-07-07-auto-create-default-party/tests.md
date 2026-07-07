---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `auto-create-default-party` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Unit — `tests/unit/api/campaigns/route.test.ts`

- [x] Test case: `POST /api/campaigns` with valid `name` calls `storage.saveParty` with `{ name: 'Main Party', campaignId: <new campaign id>, userId: <auth.userId>, members: [] }` — maps to tasks.md "construct and save a default Party"; spec scenario "Creating a campaign creates a linked default party"
- [x] Test case: `storage.saveParty` is called after `storage.saveCampaign` and before `storage.addMember` (assert mock call order) — maps to tasks.md "after storage.saveCampaign succeeds and before... addMember"; spec scenario "Default party is created before the DM member record"
- [x] Test case: Successful `POST /api/campaigns` response body is exactly the `Campaign` object — no `party` key present — maps to tasks.md "Confirm the response body is unchanged"; spec scenario "MODIFIED Creating a campaign with all fields"
- [x] Test case: `storage.saveParty` mocked to reject → response is 500; `storage.deleteCampaign` is called with the new campaign's id and `auth.userId`; `storage.addMember` is never called — maps to tasks.md "Wrap in its own try/catch... on failure, attempt storage.deleteCampaign"; spec scenario "Party creation fails after campaign creation succeeds"
- [x] Test case: `storage.addMember` mocked to reject (party save succeeded) → response is 500; `storage.deleteParty` is called with the new party's id and `auth.userId`, followed by `storage.deleteCampaign` with the new campaign's id and `auth.userId` — maps to tasks.md "Extend the existing... rollback on member failure also deletes the newly created party"; spec scenario "Member creation fails after party creation succeeds"
- [x] Test case: `storage.deleteParty` mocked to reject during member-failure rollback → the original `memberError` is still thrown/logged (not swallowed), and `storage.deleteCampaign` is still attempted — maps to tasks.md "logging (not swallowing) any rollback step that itself fails"; design.md "Risks / Trade-offs"

### Integration — `tests/integration/campaigns.integration.test.ts`

- [x] Test case: After a successful `POST /api/campaigns`, `storage.loadPartiesByCampaign(campaignId)` (or equivalent query) returns exactly one `Party` with `name: 'Main Party'` and `campaignId` equal to the new campaign's id — maps to tasks.md "extend campaigns.integration.test.ts"; spec scenario "Creating a campaign creates a linked default party" (implemented via `GET /api/parties` filtered by `campaignId`)
- [x] Test case: After a simulated downstream failure (party or member save throws), querying storage directly confirms no `Campaign`, `Party`, or `CampaignMember` row exists for the attempted creation — maps to tasks.md "Add rollback unit tests"; NFAC "No orphaned records after partial failure" (covered at the unit level via mocked `storage` rejections, since the live integration server does not expose fault injection into `storage`)

## Traceability to Tasks

- All unit test cases above map to the `Execution` section items in `tasks.md` under `app/api/campaigns/route.ts` changes.
- All integration test cases above map to the `Validation` section item "Add/extend `tests/integration/campaigns.integration.test.ts`" in `tasks.md`.
