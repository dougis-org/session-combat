---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `migrate-membership-storage-callers` change. This is a purely mechanical import/call-site rewrite with no new behavior, so "TDD" here means: for each file, first prove the existing test suite still exercises the real code path after the mock target changes (red — a stale mock on `storage.<method>` would let a test pass without covering the migrated call), then make the mock/import changes so the test genuinely covers `membershipRepo.<method>` (green), then confirm no other test or lint signal regresses (refactor/cleanup).

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test (or confirm an existing test goes red for the right reason):** Before editing a production file's imports, update its test's mock target from `@/lib/storage` to `@/lib/storage/membershipRepo` for the migrated method(s). Run the test — it must fail (the mock is now on the module the code doesn't call yet), proving the test actually exercises which module is invoked rather than passing vacuously.
2.  **Migrate the production import to pass the test:** Rewrite the production file's import/call sites per `design.md` Decision 1/2/3. Run the test again — it must pass.
3.  **Refactor:** Remove now-unused imports, confirm lint/typecheck is clean, and re-run the full suite for that file plus any file sharing a mock module.

## Test Cases

### Full-swap files (8) — Requirement: "ADDED Callers use membershipRepo for membership operations"

- [ ] `lib/utils/campaign.ts` / `assertCampaignAccess`: mock updated to `membershipRepo.getMember`; existing test asserting `assertCampaignAccess` calls `getMember` and propagates `StorageError` still passes — maps to tasks.md "Full-swap files" bullet 1, spec scenario "Checking campaign access calls membershipRepo directly"
- [ ] `lib/server/transport.ts`: mock updated to `membershipRepo.listMembersForCampaign`; existing subscription/broadcast tests still pass with identical member lists — maps to tasks.md bullet 2
- [ ] `app/api/campaigns/[id]/parties/route.ts`: mock updated to `membershipRepo.getMember`; existing GET-parties-requires-membership test still passes (200 for member, 403/404 for non-member per current behavior) — maps to tasks.md bullet 3
- [ ] `app/api/campaigns/[id]/members/[userId]/parties/[partyId]/route.ts`: mock updated to `membershipRepo.getMember` for both `caller` and `member` lookups; existing authorization tests still pass — maps to tasks.md bullet 4
- [ ] `app/api/campaigns/route.ts`: mock updated to `membershipRepo.addMember`; existing campaign-creation test still asserts the creator is added as a member — maps to tasks.md bullet 5
- [ ] `app/api/me/invitations/route.ts`: mocks updated to `membershipRepo.listInvitationsForUser` and `membershipRepo.getUsersByIds`; existing invitations-list test still returns the same shape — maps to tasks.md bullet 6
- [ ] `app/api/campaigns/[id]/members/route.ts`: mocks updated to `membershipRepo.addMember`, `membershipRepo.getMember`, `membershipRepo.listMembersForCampaign`, `membershipRepo.updateMemberStatus`; existing test for the `DuplicateMemberError` → 409 branch still passes unchanged — maps to tasks.md bullet 7, spec scenario "Duplicate-member error handling is preserved after migration"
- [ ] `app/api/campaigns/[id]/members/me/route.ts`: mocks updated to `membershipRepo.getMember`, `membershipRepo.updateMemberStatus`; existing accept/decline-invitation tests still pass — maps to tasks.md bullet 8

### Partial-swap files (7) — Requirement: "ADDED Non-membership calls in mixed-domain files remain on the storage facade"

- [ ] `lib/storage/partyRepo.ts`: mock for `getMember` updated to target `./membershipRepo`; mocks for `storage.listAllSharesForCampaign`, `storage.loadCharacterById`, `storage.loadPartiesByCampaign`, `storage.saveParty` remain on `storage` and are unchanged; existing `buildSharedCharacterEntries` tests still pass — maps to tasks.md bullet 1, spec scenario "Internal repo-to-repo call is migrated"
- [ ] `app/api/campaigns/[id]/characters/[cid]/route.ts`: mock for `getMember` moved to `membershipRepo`; mock for `storage.removeShare` unchanged; existing DELETE-character-share test still passes — maps to tasks.md bullet 2, spec scenario "Share removal in a characters route stays on storage"
- [ ] `app/api/campaigns/[id]/characters/route.ts`: mock for `getMember` moved to `membershipRepo`; mocks for `storage.addShare`, `storage.listSharesForCampaign` unchanged; existing share-listing/creation tests still pass — maps to tasks.md bullet 3
- [ ] `app/api/campaigns/[id]/members/[userId]/route.ts`: mocks for `getMember`, `updateMemberStatus` moved to `membershipRepo`; mock for `storage.listAllSharesForCampaign` unchanged; existing member-removal test (including any share-cleanup assertion) still passes — maps to tasks.md bullet 4
- [ ] `app/api/campaigns/[id]/rolls/route.ts`: mocks for `getMember`, `getUserById`, `listMembersForCampaign` moved to `membershipRepo`; mocks for `storage.listCampaignRolls`, `storage.saveCampaignRoll` unchanged; existing roll-submission and roll-broadcast tests still pass — maps to tasks.md bullet 5
- [ ] `app/api/campaigns/[id]/messages/route.ts`: mocks for `getMember`, `getUserById`, `listMembersForCampaign` moved to `membershipRepo`; existing message-post tests still pass — maps to tasks.md bullet 6
- [ ] `app/api/campaigns/global/[id]/copy/route.ts`: mock for `addMember` moved to `membershipRepo`; mock for `storage.loadGlobalCampaignTemplateById` unchanged; existing campaign-copy test still asserts creator membership is added — maps to tasks.md bullet 7, spec scenario "Campaign-template lookup in the copy route stays on storage"

### Repo-wide verification — Requirement: Reliability

- [ ] **Test-file discovery sweep is clean:** after updating the 15 files above, `grep -rn "storage\.\(addMember\|updateMemberStatus\|listMembersForCampaign\|getMember\|listInvitationsForUser\|getUserById\|getUsersByIds\)("` under the test root returns matches only in files unrelated to the migrated production paths (i.e., no stale mock left pointing at `storage` for a method the corresponding production file now calls via `membershipRepo`) — maps to tasks.md "Repo-wide test-file discovery sweep", spec scenario "Grep sweep confirms complete migration"
- [ ] **Production-code grep sweep is clean:** `grep -rn "storage\.\(addMember\|updateMemberStatus\|listMembersForCampaign\|getMember\|listInvitationsForUser\|getUserById\|getUsersByIds\)("` across the repo, excluding `tests/**` and `.verity/.snapshot/**`, returns zero matches — maps to tasks.md Validation section, spec scenario "Grep sweep confirms complete migration"
- [ ] **No new lint/typecheck errors:** `tsc --noEmit` (or project equivalent) and the project's lint command report no unused-import or unresolved-import errors across all 15 touched files — maps to tasks.md Validation section, design.md NFR "reliability"
- [ ] **Full suite green:** the project's full unit + integration test suite passes with zero new failures and zero skipped assertions compared to the pre-change baseline — maps to tasks.md Validation section, spec scenario "No behavior change under identical inputs"
