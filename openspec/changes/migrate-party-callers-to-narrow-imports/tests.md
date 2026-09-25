---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `migrate-party-callers-to-narrow-imports` change. This change is a pure module-boundary refactor (no behavior change), so "TDD" here means: write/update a mock-target assertion that fails against the pre-migration code (because it asserts `partyRepo.X` was called, which isn't true yet) and passes once the corresponding task's import/call-site edit lands. Existing behavioral assertions (inputs → outputs, status codes, persisted data) must continue passing unmodified throughout — a change in their outcome at any point is a regression, not an expected TDD red state.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before editing a caller file, update or add a mock-target assertion (e.g. `expect(partyRepoMock.saveParty).toHaveBeenCalledWith(...)`) that fails because the route still calls `storage.saveParty`. Confirm it fails for that reason (not an unrelated error).
2.  **Write code to pass the test:** Apply the corresponding tasks.md edit (add `partyRepo` import, switch the call site). Re-run the test and confirm it passes.
3.  **Refactor:** N/A for this change beyond the prescribed mechanical edit — there is no additional refactor step, since introducing one would violate the "no behavior change" constraint in proposal.md.

## Test Cases

### Relocate campaign-party linking functions (partyRepo.ts / storage.ts)

- [ ] Test case: `partyRepo.addPartyToCampaign` exists as a named export and, given a campaign with no `partyIds` field, performs the same legacy-migration read against `parties` and `$set` update against `campaigns` as the pre-relocation `storage.addPartyToCampaign` did (maps to spec scenario "Relocated function preserves exact database operations"; task: "Relocate campaign-party linking functions").
- [ ] Test case: `partyRepo.removePartyFromCampaign` and `partyRepo.removePartyFromAllCampaigns` exist as named exports with behavior identical to their pre-relocation bodies (same scenario/task as above).
- [ ] Test case: `storage.addPartyToCampaign(campaignId, partyId)` (existing test, unmodified) still passes after relocation, proving the facade delegates correctly (maps to spec scenario "storage.ts continues to expose the same public methods"; task: "Relocate campaign-party linking functions").
- [ ] Test case: `storage.removePartyFromCampaign` / `storage.removePartyFromAllCampaigns` existing tests (unmodified) still pass after relocation (same scenario/task as above).

### app/api/parties/route.ts

- [ ] Test case: POST handler — mock assertion updated to expect `partyRepo.saveParty` (not `storage.saveParty`) to have been called with the constructed party object; existing assertion on the 201 response body/shape is unchanged (maps to spec scenario "Creating a party calls partyRepo directly"; task: "Migrate app/api/parties/route.ts").
- [ ] Test case: POST handler — mock assertion updated to expect `partyRepo.canAddToCampaignParty` (not `storage.canAddToCampaignParty`) to have been called once per character ID when `campaignId` is provided; existing assertion on the 403 response when a check fails is unchanged (maps to spec scenario "Creating a party calls partyRepo directly"; task: "Migrate app/api/parties/route.ts").
- [ ] Test case: POST handler — compensating-delete-on-error path: mock assertion updated to expect `partyRepo.deleteParty` (not `storage.deleteParty`) when `addPartyToCampaign` throws; existing assertion that the error still propagates (500 response) is unchanged (task: "Migrate app/api/parties/route.ts").
- [ ] Test case: GET handler — mock assertion updated to expect `partyRepo.loadParties` (not `storage.loadParties`); existing assertion on the returned party list is unchanged (task: "Migrate app/api/parties/route.ts").

### app/api/parties/[id]/route.ts

- [ ] Test case: PUT handler — mock assertion updated to expect `partyRepo.loadParties` for the existing-party lookup; existing 404-when-not-found assertion unchanged (task: "Migrate app/api/parties/[id]/route.ts").
- [ ] Test case: PUT handler — mock assertion updated to expect `partyRepo.canAddToCampaignParty` called from inside the `charsToCheck.map(...)` callback for each character being checked; existing 403-when-any-check-fails assertion unchanged (maps to spec scenario "Call site inside a map/Promise.all callback is migrated"; task: "Migrate app/api/parties/[id]/route.ts").
- [ ] Test case: PUT handler — mock assertion updated to expect `partyRepo.removePartyFromAllCampaigns` and `partyRepo.addPartyToCampaign` (including the rollback-on-error re-add path) when `campaignId` changes; existing assertion that the prior campaign link is restored on error is unchanged (task: "Migrate app/api/parties/[id]/route.ts").
- [ ] Test case: PUT handler — mock assertion updated to expect `partyRepo.saveParty` for the final persisted party; existing assertion on the returned updated party is unchanged (task: "Migrate app/api/parties/[id]/route.ts").
- [ ] Test case: DELETE handler — mock assertions updated to expect `partyRepo.loadParties` and `partyRepo.deleteParty`; existing assertion on the success response is unchanged (task: "Migrate app/api/parties/[id]/route.ts").

### app/api/campaigns/route.ts

- [ ] Test case: mock assertions updated to expect `partyRepo.saveParty` and `partyRepo.deleteParty` at their respective call sites; `storage.addMember` mock assertion is left unchanged (maps to spec scenario "Membership check in a party route stays on storage" pattern; task: "Migrate app/api/campaigns/route.ts").

### app/api/campaigns/[id]/parties/route.ts

- [ ] Test case: GET handler — mock assertion updated to expect `partyRepo.loadPartiesByCampaign`; `storage.getMember` mock assertion (membership check preceding it) is left unchanged (maps to spec scenario "Membership check in a party route stays on storage"; task: "Migrate app/api/campaigns/[id]/parties/route.ts").

### app/api/campaigns/[id]/members/[userId]/parties/[partyId]/route.ts

- [ ] Test case: mock assertions updated to expect `partyRepo.saveParty` and `partyRepo.loadPartiesByCampaign`; both `storage.getMember` mock assertions are left unchanged (task: "Migrate app/api/campaigns/[id]/members/[userId]/parties/[partyId]/route.ts").

### app/api/campaigns/[id]/members/[userId]/route.ts

- [ ] Test case: mock assertion updated to expect `partyRepo.setPartyMemberLeftAt` called once per share inside the `targetShares.map(...)` callback; `storage.getMember`, `storage.updateMemberStatus`, and `storage.listAllSharesForCampaign` mock assertions are left unchanged (maps to spec scenario "Call site inside a map/Promise.all callback is migrated"; task: "Migrate app/api/campaigns/[id]/members/[userId]/route.ts").

### app/api/campaigns/[id]/characters/route.ts

- [ ] Test case: DM-role branch — mock assertion updated to expect `partyRepo.buildSharedCharacterEntries`; existing assertion on the returned entries list is unchanged (task: "Migrate app/api/campaigns/[id]/characters/route.ts").
- [ ] Test case: `storage.getMember`, `storage.addShare`, and `storage.listSharesForCampaign` mock assertions are left unchanged in the same test file (maps to spec scenario "Membership check in a party route stays on storage"; task: "Migrate app/api/campaigns/[id]/characters/route.ts").

### app/api/campaigns/[id]/characters/[cid]/route.ts

- [ ] Test case: mock assertion updated to expect `partyRepo.setPartyMemberLeftAt`; `storage.getMember` and `storage.removeShare` mock assertions are left unchanged (task: "Migrate app/api/campaigns/[id]/characters/[cid]/route.ts").

### Repo-wide regression gate

- [ ] Test case: `grep -rn "storage\.\(loadParties\|saveParty\b\|saveParties\|deleteParty\|loadPartiesByCampaign\|buildSharedCharacterEntries\|setPartyMemberLeftAt\|canAddToCampaignParty\|addPartyToCampaign\|removePartyFromCampaign\|removePartyFromAllCampaigns\)" --include="*.ts" --include="*.tsx" app lib components` returns zero matches outside `lib/storage.ts`'s own delegation lines (maps to spec requirement "ADDED Callers use partyRepo for party operations"; task: "Repo-wide verification grep").
- [ ] Test case: full existing unit + integration suites for the 8 route files and `lib/storage/partyRepo.ts` pass with zero change to expected values, status codes, or call counts — only mock targets differ from pre-change runs (maps to NFAC scenario "No behavior change under identical inputs"; task: "Update tests mocking the migrated call sites").
