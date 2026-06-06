---
name: tests
description: Tests for the invite-api change
---

# Tests

## Overview

This document outlines the tests for the `invite-api` change. All work follows strict TDD: write a failing test, write the minimum code to pass it, then refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** — before any implementation, write a test capturing the requirement. Run it and confirm it fails.
2. **Write code to pass the test** — write the simplest code that makes the test pass.
3. **Refactor** — improve code quality and structure while keeping the test green.

---

## Test Cases

### Task 1 — Type changes (`lib/types.ts`)

These are compile-time checks enforced by TypeScript. No runtime test file needed; verified by `npm run typecheck` after edits.

- [ ] `MemberStatus` does not accept `"pending"` (type error if used)
- [ ] `MemberStatus` accepts `"invited"` and `"removed"` without error
- [ ] `MemberHistoryEntry` requires `action`, `by`, and `at`; omitting any field is a type error
- [ ] `CampaignMember` rejects `invitedBy`, `invitedAt`, `respondedAt` (type error if passed)
- [ ] `CampaignMember` requires `history: MemberHistoryEntry[]`

**File:** `lib/types.ts` | **Verified by:** `npm run typecheck`
**Spec ref:** ADDED `MemberStatus` values; ADDED `MemberHistoryEntry`; MODIFIED `CampaignMember`

---

### Task 2 — `storage.updateMemberStatus` unit tests

**File:** `tests/unit/storage/campaignMembers.test.ts`
**Spec ref:** ADDED `storage.updateMemberStatus`

- [ ] **Happy path — status updated:** Given a member with `status: "declined"`, calling `updateMemberStatus(campaignId, userId, "invited", dmId)` results in `status: "invited"` on the document
- [ ] **Happy path — history appended:** The same call appends `{ action: "invited", by: dmId, at: <Date> }` to `history`; prior history entries are preserved
- [ ] **Happy path — `at` is a Date:** The appended history entry has an `at` field that is a `Date` instance
- [ ] **Member not found:** Calling `updateMemberStatus` for a non-existent `(campaignId, userId)` completes without error and modifies no documents

---

### Task 3 — Updated `addMember` call in campaign creation

**File:** `tests/unit/api/campaigns/route.unit.test.ts` (existing test file)
**Spec ref:** MODIFIED `storage.addMember` callers; Scenario: Campaign creation seeds DM with history

- [ ] **DM seed has history:** When `POST /api/campaigns` creates a campaign, `storage.addMember` is called with `history: [{ action: "active", by: <userId>, at: <Date> }]`
- [ ] **DM seed has no flat fields:** `addMember` is NOT called with `invitedBy`, `invitedAt`, or `respondedAt`

---

### Task 4 — Updated existing `addMember` unit tests

**File:** `tests/unit/storage/campaignMembers.test.ts`
**Spec ref:** MODIFIED `storage.addMember` callers

- [ ] Existing `addMember` happy-path test passes with `history: [{ action: "active", by: userId, at: new Date() }]` instead of `invitedBy`/`invitedAt`
- [ ] `addMember` with `invitedBy` / `invitedAt` in the payload causes a TypeScript compile error (type-check only)

---

### Task 5 — `POST /api/campaigns/[id]/members` route unit tests

**File:** `tests/unit/api/campaigns/[id]/members/route.unit.test.ts`
**Spec ref:** All ADDED POST route scenarios

#### Successful invite (new member)

- [ ] Returns `201` with `{ id: <string>, status: "invited" }`
- [ ] Calls `storage.addMember` with `status: "invited"`, `role: "player"`, and `history: [{ action: "invited", by: <callerId>, at: <Date> }]`
- [ ] Does NOT call `storage.updateMemberStatus`

#### Re-invite declined member

- [ ] Given `getMember` returns a member with `status: "declined"`, returns `201` with `{ id: <existingId>, status: "invited" }`
- [ ] Calls `storage.updateMemberStatus(campaignId, userId, "invited", callerId)`
- [ ] Does NOT call `storage.addMember`

#### Re-invite removed member

- [ ] Given `getMember` returns a member with `status: "removed"`, returns `201` with `{ id: <existingId>, status: "invited" }`
- [ ] Calls `storage.updateMemberStatus(campaignId, userId, "invited", callerId)`

#### Duplicate rejection

- [ ] Given `getMember` returns a member with `status: "active"`, returns `409`
- [ ] Given `getMember` returns a member with `status: "invited"`, returns `409`
- [ ] Neither `addMember` nor `updateMemberStatus` is called in either case

#### Self-invite

- [ ] Given `userId` in body equals `auth.userId`, returns `400`
- [ ] No storage calls are made

#### Missing / invalid body

- [ ] Body `{}` (no `userId`) returns `400`
- [ ] Body `{ userId: 123 }` (non-string) returns `400`

#### Non-DM caller

- [ ] Given `getMember(campaignId, callerId)` returns `null`, returns `403`
- [ ] Given `getMember(campaignId, callerId)` returns a member with `role: "player"`, returns `403`
- [ ] Given `getMember(campaignId, callerId)` returns a member with `status: "invited"` (not active DM), returns `403`

#### Unauthenticated

- [ ] Request without auth token returns `401`

#### Race condition / duplicate insert

- [ ] Given `getMember` returns null but `addMember` throws `DuplicateMemberError`, returns `409`

#### Storage error

- [ ] Given `addMember` throws an unexpected error, returns `500`
- [ ] Given `updateMemberStatus` throws an unexpected error, returns `500`
- [ ] Error details are not present in the response body

---

## Test file locations

| Task | Test file |
|------|-----------|
| Types (compile-time) | `lib/types.ts` — verified by `npm run typecheck` |
| `updateMemberStatus` storage | `tests/unit/storage/campaignMembers.test.ts` |
| Campaign creation seed | `tests/unit/api/campaigns/route.unit.test.ts` |
| POST route | `tests/unit/api/campaigns/[id]/members/route.unit.test.ts` |

## Commands

```bash
npm run typecheck
npm run test:unit -- --testPathPattern=campaignMembers
npm run test:unit -- --testPathPattern="campaigns/route"
npm run test:unit -- --testPathPattern="members/route"
npm run test:unit   # full suite
```
