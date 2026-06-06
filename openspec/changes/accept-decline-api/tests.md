---
name: tests
description: Tests for the accept-decline-api change
---

# Tests

## Overview

Test cases for the `accept-decline-api` change. All implementation follows strict TDD: write a failing test first, then write the minimum code to pass, then refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** — capture the requirement; run and confirm it fails.
2. **Write code to pass** — minimum implementation to make it green.
3. **Refactor** — improve quality while keeping tests green.

## Task 2 — Storage methods (`lib/storage.ts`)

File: `tests/unit/storage/users.test.ts`

### `getUserById`

- [ ] **Found user** — given a user document exists, returns `{ id, username }` as `PublicUser`
  - Spec: ADDED `storage.getUserById` — Found user returns PublicUser

- [ ] **Unknown userId** — given no matching document, returns `null`
  - Spec: ADDED `storage.getUserById` — Unknown userId returns null

- [ ] **Invalid ObjectId** — given a non-ObjectId string, throws `InvalidUserIdError`
  - Spec: ADDED `storage.getUserById` — Invalid ObjectId throws

### `getUsersByIds`

- [ ] **All users found** — given N matching documents, returns map with all N entries
  - Spec: ADDED `storage.getUsersByIds` — All users found

- [ ] **Some users missing** — given 2 of 3 ids match, returns map with only 2 entries
  - Spec: ADDED `storage.getUsersByIds` — Some users missing

- [ ] **Empty input** — given `[]`, returns `{}` without querying the DB
  - Spec: ADDED `storage.getUsersByIds` — Empty array input

File: `tests/unit/storage/campaignMembers.test.ts`

### `listInvitationsForUser`

- [ ] **Has invitations** — given user has 2 `invited` + 1 `active` memberships, returns only the 2 `invited` ones
  - Spec: ADDED `storage.listInvitationsForUser` — Returns pending invitations

- [ ] **No invitations** — given user has no `invited` memberships, returns `[]`
  - Spec: ADDED `storage.listInvitationsForUser` — Returns empty array when no invitations

---

## Task 3 — PATCH `/api/campaigns/[id]/members/me` route

File: `tests/unit/api/campaigns/[id]/members/me.test.ts`

### Happy path transitions

- [ ] **Accept from invited** — `getMember` returns `invited`; `action: accept`; response is `200 { status: "active" }`; `updateMemberStatus` called with `"active"`
  - Spec: ADDED PATCH accept invitation — Successful accept

- [ ] **Decline from invited** — `getMember` returns `invited`; `action: decline`; response is `200 { status: "declined" }`; `updateMemberStatus` called with `"declined"`
  - Spec: ADDED PATCH decline invitation — Successful decline

### Idempotent paths (no DB write)

- [ ] **Accept when already active** — `getMember` returns `active`; `action: accept`; response is `200 { status: "active" }`; `updateMemberStatus` NOT called
  - Spec: ADDED PATCH idempotent — Accept when already active

- [ ] **Decline when already declined** — `getMember` returns `declined`; `action: decline`; response is `200 { status: "declined" }`; `updateMemberStatus` NOT called
  - Spec: ADDED PATCH idempotent — Decline when already declined

### Conflict paths (409)

- [ ] **Decline when already accepted** — `getMember` returns `active`; `action: decline`; response is `409 { error: "You have already accepted this invitation" }`
  - Spec: ADDED PATCH conflict — Decline when already accepted

- [ ] **Accept when already declined** — `getMember` returns `declined`; `action: accept`; response is `409 { error: "You have already declined this invitation" }`
  - Spec: ADDED PATCH conflict — Accept when already declined

### Not found (404)

- [ ] **No membership** — `getMember` returns `null`; response is `404 { error: "No invitation found" }`
  - Spec: ADDED PATCH not found — No membership

- [ ] **Removed member** — `getMember` returns `{ status: "removed" }`; response is `404 { error: "No invitation found" }`
  - Spec: ADDED PATCH not found — Removed member

### Input validation (400)

- [ ] **Missing action field** — body is `{}`; response is `400` with error message
  - Spec: ADDED PATCH input validation — Missing action field

- [ ] **Invalid action value** — body is `{ action: "maybe" }`; response is `400` with error message
  - Spec: ADDED PATCH input validation — Invalid action value

### Auth + error

- [ ] **Unauthenticated** — no auth token; response is `401`
  - Spec: Non-Functional — Unauthenticated PATCH rejected

- [ ] **Storage error** — `getMember` throws; response is `500`; body contains no internal details
  - Spec: Non-Functional — Storage error on PATCH surfaces as 500

---

## Task 4 — GET `/api/me/invitations` route

File: `tests/unit/api/me/invitations.test.ts`

### Happy path

- [ ] **Pending invitations returned** — `listInvitationsForUser` returns 2 members; campaigns and usernames loaded; response is `200` with correctly shaped `invitations` array (`id`, `campaignId`, `campaignName`, `invitedBy`, `invitedAt`)
  - Spec: ADDED GET invitations — Returns pending invitations

- [ ] **Empty list** — `listInvitationsForUser` returns `[]`; response is `200 { invitations: [] }`
  - Spec: ADDED GET invitations — Returns empty array when no invitations

### History edge cases

- [ ] **Re-invited member** — member has two `action: "invited"` history entries; `invitedBy` and `invitedAt` reflect the **last** one
  - Spec: ADDED GET invitations — invitedBy and invitedAt use the last "invited" history entry

- [ ] **Missing inviter username** — inviter userId not in `getUsersByIds` result; `invitedBy` is `"Unknown user"`
  - Spec: ADDED GET invitations — Missing inviter username falls back gracefully

### Performance

- [ ] **Batch user lookup** — regardless of how many invitations are returned, `getUsersByIds` is called exactly once
  - Spec: Non-Functional — Invitations list uses batch user lookup

### Auth + error

- [ ] **Unauthenticated** — no auth token; response is `401`
  - Spec: Non-Functional — Unauthenticated GET rejected

- [ ] **Storage error** — `listInvitationsForUser` throws; response is `500`; body contains no internal details
  - Spec: Non-Functional — Storage error on GET surfaces as 500

---

## Acceptance Scenario Mapping

| Test | Task | Spec Scenario |
|------|------|---------------|
| `getUserById` found | Task 2 | ADDED `storage.getUserById` — Found user |
| `getUserById` null | Task 2 | ADDED `storage.getUserById` — Unknown userId |
| `getUserById` invalid ID | Task 2 | ADDED `storage.getUserById` — Invalid ObjectId |
| `getUsersByIds` all found | Task 2 | ADDED `storage.getUsersByIds` — All users found |
| `getUsersByIds` some missing | Task 2 | ADDED `storage.getUsersByIds` — Some users missing |
| `getUsersByIds` empty | Task 2 | ADDED `storage.getUsersByIds` — Empty array input |
| `listInvitationsForUser` has invitations | Task 2 | ADDED `storage.listInvitationsForUser` — Returns pending |
| `listInvitationsForUser` empty | Task 2 | ADDED `storage.listInvitationsForUser` — Returns empty |
| PATCH accept from invited | Task 3 | ADDED PATCH accept — Successful accept |
| PATCH decline from invited | Task 3 | ADDED PATCH decline — Successful decline |
| PATCH accept idempotent | Task 3 | ADDED PATCH idempotent — Accept when already active |
| PATCH decline idempotent | Task 3 | ADDED PATCH idempotent — Decline when already declined |
| PATCH decline conflict | Task 3 | ADDED PATCH conflict — Decline when already accepted |
| PATCH accept conflict | Task 3 | ADDED PATCH conflict — Accept when already declined |
| PATCH no membership | Task 3 | ADDED PATCH not found — No membership |
| PATCH removed | Task 3 | ADDED PATCH not found — Removed member |
| PATCH missing action | Task 3 | ADDED PATCH input validation — Missing action |
| PATCH invalid action | Task 3 | ADDED PATCH input validation — Invalid action |
| PATCH unauthenticated | Task 3 | Non-Functional — Unauthenticated PATCH rejected |
| PATCH storage error | Task 3 | Non-Functional — Storage error on PATCH |
| GET pending invitations | Task 4 | ADDED GET invitations — Returns pending |
| GET empty list | Task 4 | ADDED GET invitations — Returns empty array |
| GET re-invited member | Task 4 | ADDED GET invitations — Last invited history entry |
| GET missing username | Task 4 | ADDED GET invitations — Missing username fallback |
| GET batch lookup | Task 4 | Non-Functional — Batch user lookup |
| GET unauthenticated | Task 4 | Non-Functional — Unauthenticated GET rejected |
| GET storage error | Task 4 | Non-Functional — Storage error on GET |
