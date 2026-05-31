---
name: tests
description: Tests for the campaign-members-collection change
---

# Tests

## Overview

All work follows strict TDD: write a failing test, write the minimum code to pass it, then refactor. Test files are scoped to `campaigns.members.*` and must not modify existing campaign test files.

- Unit tests: `tests/unit/storage/campaigns.members.test.ts`
- Integration tests: `tests/integration/campaigns.members.integration.test.ts`

## Testing Steps

For each test case below:

1. **Write the failing test** in the appropriate file. Run the suite and confirm it fails.
2. **Write implementation code** — minimum to make it pass.
3. **Refactor** — clean up without breaking the test.

---

## Test Cases

### Types and errors (tasks 1–2)

- [ ] **[types] `MEMBER_ROLES` contains exactly `['dm', 'player']`** — import and assert length and values
  - Spec: ADDED CampaignMember type and role enum
  - Task: Execution §1

- [ ] **[types] `CampaignMember` has all required fields** — construct a valid object and assert TypeScript compiles (type-level test via `satisfies`)
  - Spec: ADDED CampaignMember type and role enum
  - Task: Execution §1

- [ ] **[errors] `DuplicateMemberError` has `name === 'DuplicateMemberError'`** — construct and assert
  - Spec: ADDED `DuplicateMemberError`
  - Task: Execution §2

- [ ] **[errors] `DuplicateMemberError` message includes campaignId and userId** — construct with known values and assert `message` contains both
  - Spec: ADDED `DuplicateMemberError`
  - Task: Execution §2

- [ ] **[errors] `DuplicateMemberError` is instanceof `Error`** — assert inheritance
  - Spec: ADDED `DuplicateMemberError`
  - Task: Execution §2

---

### `addMember` — unit (task 4, mocked DB)

- [ ] **[unit] `addMember` happy path — no error thrown when insert resolves**
  - Mock: `campaignMembers.insertOne` resolves
  - Assert: resolves without throwing
  - Spec: ADDED `storage.addMember` / Scenario: Successful add
  - Task: Execution §6

- [ ] **[unit] `addMember` duplicate — throws `DuplicateMemberError` on mongo code 11000**
  - Mock: `campaignMembers.insertOne` rejects with `{ code: 11000 }`
  - Assert: thrown error is `instanceof DuplicateMemberError`
  - Spec: ADDED `storage.addMember` / Scenario: Duplicate rejected
  - Task: Execution §6

---

### `updateMember` — unit (task 4, mocked DB)

- [ ] **[unit] `updateMember` status only — `$set` contains `status` but not `role`**
  - Mock: `updateOne` resolves
  - Call: `updateMember(C, U, undefined, 'active')`
  - Assert: `$set` arg equals `{ status: 'active' }`
  - Spec: ADDED `storage.updateMember` / Scenario: Update status
  - Task: Execution §6

- [ ] **[unit] `updateMember` role only — `$set` contains `role` but not `status`**
  - Call: `updateMember(C, U, 'dm', undefined)`
  - Assert: `$set` arg equals `{ role: 'dm' }`
  - Spec: ADDED `storage.updateMember` / Scenario: Update role
  - Task: Execution §6

- [ ] **[unit] `updateMember` both fields — `$set` contains both**
  - Call: `updateMember(C, U, 'player', 'pending')`
  - Assert: `$set` arg equals `{ role: 'player', status: 'pending' }`
  - Spec: ADDED `storage.updateMember`
  - Task: Execution §6

- [ ] **[unit] `updateMember` no match — no error when `matchedCount === 0`**
  - Mock: `updateOne` returns `{ matchedCount: 0 }`
  - Assert: resolves without throwing
  - Spec: ADDED `storage.updateMember` / Scenario: Non-existent member is a no-op
  - Task: Execution §6

---

### `listMembersForCampaign` — unit (task 4, mocked DB)

- [ ] **[unit] returns normalized members for a campaign**
  - Mock: `find().toArray()` returns two raw member docs
  - Assert: both returned with `id` normalized
  - Spec: ADDED `storage.listMembersForCampaign` / Scenario: Returns all members
  - Task: Execution §6

- [ ] **[unit] returns empty array when no members**
  - Mock: `find().toArray()` returns `[]`
  - Assert: return value is `[]`
  - Spec: ADDED `storage.listMembersForCampaign` / Scenario: Returns empty array
  - Task: Execution §6

---

### `listCampaignsForMember` — unit (task 4, mocked DB)

- [ ] **[unit] returns `CampaignMemberSummary[]` when user has memberships**
  - Mock: `campaignMembers.find` returns two docs with campaignIds; `campaigns.find` returns matching `{ id, name }` docs
  - Assert: two `CampaignMemberSummary` objects returned
  - Spec: ADDED `storage.listCampaignsForMember` / Scenario: Returns campaigns for member
  - Task: Execution §6

- [ ] **[unit] returns `[]` without querying campaigns when user has no memberships**
  - Mock: `campaignMembers.find` returns `[]`
  - Assert: campaigns collection is never queried; return value is `[]`
  - Spec: ADDED `storage.listCampaignsForMember` / Scenario: Returns empty array
  - Task: Execution §6

---

### Route seeding — unit (task 5, mocked storage)

- [ ] **[unit] POST campaign — 201 returned and `addMember` called with correct DM payload**
  - Mock: `saveCampaign` resolves, `addMember` resolves
  - Assert: response status 201; `addMember` called with `{ role: 'dm', status: 'active', userId: auth.userId, invitedBy: auth.userId }`
  - Spec: ADDED DM membership seeding / Scenario: Owner seeded as active DM; MODIFIED Campaign creation route
  - Task: Execution §5 + §6

- [ ] **[unit] POST campaign — `deleteCampaign` called and 500 returned when `addMember` throws**
  - Mock: `saveCampaign` resolves, `addMember` throws
  - Assert: `deleteCampaign` called with new campaign id; response status 500
  - Spec: ADDED DM membership seeding / Scenario: Campaign rolled back on seed failure
  - Task: Execution §5 + §6

---

### Integration tests — real MongoDB (task 7)

- [ ] **[integration] `addMember` — inserted record returned by `listMembersForCampaign`**
  - Spec: ADDED `storage.addMember` / Scenario: Successful add
  - Task: Execution §7

- [ ] **[integration] `addMember` duplicate — throws `DuplicateMemberError`**
  - Spec: ADDED `storage.addMember` / Scenario: Duplicate rejected
  - Task: Execution §7

- [ ] **[integration] `addMember` — same user, different campaigns: both succeed**
  - Spec: ADDED `campaignMembers` unique compound index / Scenario: Index allows same user in different campaigns
  - Task: Execution §7

- [ ] **[integration] `updateMember` status — persisted and readable**
  - Spec: ADDED `storage.updateMember` / Scenario: Update status
  - Task: Execution §7

- [ ] **[integration] `updateMember` role — persisted and readable**
  - Spec: ADDED `storage.updateMember` / Scenario: Update role
  - Task: Execution §7

- [ ] **[integration] `updateMember` non-existent — no error, no record created**
  - Spec: ADDED `storage.updateMember` / Scenario: Non-existent member is a no-op
  - Task: Execution §7

- [ ] **[integration] `listMembersForCampaign` — returns correct members**
  - Spec: ADDED `storage.listMembersForCampaign` / Scenario: Returns all members
  - Task: Execution §7

- [ ] **[integration] `listMembersForCampaign` — empty for unknown campaign**
  - Spec: ADDED `storage.listMembersForCampaign` / Scenario: Returns empty array
  - Task: Execution §7

- [ ] **[integration] `listCampaignsForMember` — returns `{ id, name }` for each campaign**
  - Spec: ADDED `storage.listCampaignsForMember` / Scenario: Returns campaigns for member
  - Task: Execution §7

- [ ] **[integration] `listCampaignsForMember` — empty for non-member**
  - Spec: ADDED `storage.listCampaignsForMember` / Scenario: Returns empty array for non-member
  - Task: Execution §7

- [ ] **[integration] POST `/api/campaigns` — 201 and DM member record exists**
  - Spec: ADDED DM membership seeding / Scenario: Owner seeded as active DM
  - Task: Execution §7
