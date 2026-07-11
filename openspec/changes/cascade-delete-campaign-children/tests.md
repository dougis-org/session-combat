---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `cascade-delete-campaign-children` change. All work should follow a strict TDD (Test-Driven Development) process: write each failing test first against the current (non-cascading) `storage.deleteCampaign`, then implement the cascade in `lib/storage.ts` to make it pass.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

All test cases live in `tests/unit/storage/campaigns.test.ts` (extending the existing `describe("storage.deleteCampaign", ...)` block) and integration test coverage in `tests/integration/campaigns.integration.test.ts`.

- [x] **Test 1** (Task: implement cascade delete for `Party`; Scenario: "Campaign with multiple parties is deleted"): Seed two `Party` documents with `campaignId` matching the target campaign and one `Party` document with a different `campaignId`. Call `storage.deleteCampaign`. Assert the two matching parties are gone and the unrelated party still exists.
- [x] **Test 2** (Task: implement cascade delete for `Party`; Scenario: "Campaign with no parties is deleted"): Call `storage.deleteCampaign` for a campaign with zero seeded `Party` documents. Assert the call resolves without throwing.
- [x] **Test 3** (Task: implement cascade delete for `CampaignMember`; Scenario: "Campaign with multiple members across different users is deleted"): Seed `CampaignMember` documents for two different `userId`s (DM + player) under the same `campaignId`. Call `storage.deleteCampaign` as the DM. Assert both members' documents are removed, including the player's.
- [x] **Test 4** (Task: implement cascade delete for campaign child collections; Scenario: "Campaign with session history, rolls, character shares, saved content, and messages is deleted"): Seed one `SessionLog`, one `CampaignRoll`, one `CampaignCharacterShare`, one `SavedContent`, and one `CampaignMessage` document referencing the campaign's `campaignId`. Call `storage.deleteCampaign`. Assert all five documents are removed.
- [x] **Test 5** (Task: implement cascade ordering; Scenario: "Campaign document is removed last, after cascade"): Spy/mock the underlying collection calls to assert the seven `deleteMany` calls are issued before `campaigns.deleteOne` is called (call-order assertion), so ordering does not regress silently in a future refactor.
- [x] **Test 6** (Scenario: "Existing rollback callers are unaffected"): Re-run the existing rollback-focused tests unmodified — `tests/unit/api/campaigns/route.test.ts` (member-add-failure and party-save-failure rollback paths) and `tests/unit/api/campaigns/global.id.copy.route.test.ts` — to confirm they still pass with the cascading `deleteCampaign` implementation (these tests mock `storage.deleteCampaign` at the boundary, so they validate the call is still made correctly, not the cascade internals).
- [x] **Test 7** (Regression; existing tests at tests/unit/storage/campaigns.test.ts:149 and :155): Confirm the pre-existing "resolves without throwing for nonexistent campaign" and "rejects when underlying delete fails" tests still pass unmodified after the cascade is added.
- [x] **Integration Test 1** (Scenario: "Deleting a campaign deletes its default party"): Create a campaign (which creates its default party), delete the campaign, and assert that requesting the default party returns a 404.
- [x] **Integration Test 2** (Scenario: "Deleting a campaign deletes other members' parties"): Create a campaign as User 1, invite User 2, have User 2 accept and create a party, delete the campaign as User 1, and assert that User 2's party is also deleted (returns a 404).
