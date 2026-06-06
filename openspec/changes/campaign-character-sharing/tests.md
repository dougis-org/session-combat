---
name: tests
description: Tests for the campaign-character-sharing change
---

# Tests

## Overview

All work follows strict TDD: write a failing test → write minimal code to pass → refactor.

Test files:
- `tests/unit/lib/storage-shares.test.ts` — storage methods (mocked DB)
- `tests/unit/api/campaigns/[id]/characters/route.test.ts` — POST and GET handlers
- `tests/unit/api/campaigns/[id]/characters/[cid]/route.test.ts` — DELETE handler
- `tests/unit/components/SharedCharactersPanel.test.tsx` — player UI panel (RTL)
- `tests/integration/campaigns/characterSharing.integration.test.ts` — real MongoDB

Run unit tests: `npm run test:unit`
Run integration tests: `npm run test:integration`

---

## Task 1 — Types (`lib/types.ts`)

No runtime test needed; covered by TypeScript compilation in `npm run build`.

---

## Task 2 — `DuplicateShareError` (`lib/errors.ts`)

### `tests/unit/lib/storage-shares.test.ts` (or dedicated errors test)

- [ ] **T2-1** `DuplicateShareError` has `name === 'DuplicateShareError'`
  - Spec: ADDED `DuplicateShareError`
  - Given: `new DuplicateShareError('c1', 'ch1')`
  - Then: `err.name === 'DuplicateShareError'` and message includes `'ch1'` and `'c1'`

- [ ] **T2-2** `DuplicateShareError` is an instance of `Error`
  - Then: `err instanceof Error === true`

---

## Task 3 — Storage methods (`lib/storage.ts`)

File: `tests/unit/lib/storage-shares.test.ts`

### `addShare`

- [ ] **T3-1** Successfully inserts a share
  - Spec: `storage.addShare` — Successful share
  - Given: DB mock returns success on `insertOne`
  - When: `addShare({ id, campaignId: 'c1', characterId: 'ch1', userId: 'u1', sharedAt: new Date() })`
  - Then: resolves without error; `insertOne` called once with correct fields (no `_id`)

- [ ] **T3-2** Throws `DuplicateShareError` on MongoDB code 11000
  - Spec: `storage.addShare` — Duplicate rejected
  - Given: DB mock throws `{ code: 11000 }` on `insertOne`
  - Then: `addShare` throws `DuplicateShareError`

- [ ] **T3-3** Re-throws non-11000 errors
  - Given: DB mock throws a generic Error
  - Then: `addShare` re-throws the original error (not `DuplicateShareError`)

### `removeShare`

- [ ] **T3-4** Returns `true` when a record is deleted
  - Spec: `storage.removeShare` — Successful removal
  - Given: `deleteOne` returns `{ deletedCount: 1 }`
  - When: `removeShare('c1', 'ch1')`
  - Then: returns `true`

- [ ] **T3-5** Returns `false` when no record found
  - Spec: `storage.removeShare` — Remove non-existent share returns false
  - Given: `deleteOne` returns `{ deletedCount: 0 }`
  - Then: returns `false`

### `listSharesForCampaign`

- [ ] **T3-6** Returns only the caller's shares
  - Spec: `storage.listSharesForCampaign` — Returns caller's shares only
  - Given: `find` returns two documents matching `{ campaignId: 'c1', userId: 'u1' }`
  - When: `listSharesForCampaign('c1', 'u1')`
  - Then: returns array of two normalized `CampaignCharacterShare` objects (no `_id`)

- [ ] **T3-7** Returns empty array when no shares match
  - Spec: `storage.listSharesForCampaign` — Returns empty array
  - Given: `find` returns empty array
  - Then: returns `[]`

- [ ] **T3-8** Query includes both `campaignId` and `userId` filters
  - When: `listSharesForCampaign('c1', 'u1')` is called
  - Then: `find` called with `{ campaignId: 'c1', userId: 'u1' }` (not just `campaignId`)

---

## Task 4 — POST and GET routes (`app/api/campaigns/[id]/characters/route.ts`)

File: `tests/unit/api/campaigns/[id]/characters/route.test.ts`

### POST

- [ ] **T4-1** Returns 400 when `characterId` is missing
  - Spec: Missing characterId rejected
  - Given: body `{}`
  - Then: 400

- [ ] **T4-2** Returns 400 when `characterId` is empty string
  - Given: body `{ characterId: '' }`
  - Then: 400

- [ ] **T4-3** Returns 403 when caller is not a member
  - Spec: Non-member rejected
  - Given: `getMember` returns `null`
  - Then: 403

- [ ] **T4-4** Returns 403 when caller is `invited`
  - Spec: Non-active member rejected
  - Given: `getMember` returns `{ status: 'invited', role: 'player' }`
  - Then: 403

- [ ] **T4-5** Returns 403 when caller is active `dm`
  - Spec: DM cannot share via this endpoint
  - Given: `getMember` returns `{ status: 'active', role: 'dm' }`
  - Then: 403

- [ ] **T4-6** Returns 404 when character not found
  - Spec: Character not found
  - Given: caller is active player; `loadCharacter` returns null
  - Then: 404

- [ ] **T4-7** Returns 403 when character is owned by someone else
  - Spec: Unowned character rejected
  - Given: caller is active player; character exists with `userId !== auth.userId`
  - Then: 403

- [ ] **T4-8** Returns 409 on duplicate share
  - Spec: Duplicate share rejected
  - Given: caller owns character; `addShare` throws `DuplicateShareError`
  - Then: 409

- [ ] **T4-9** Returns 201 with `{ id, characterId }` on success
  - Spec: Successful share
  - Given: all guards pass; `addShare` resolves
  - Then: 201 with `{ id: string, characterId: 'ch1' }`

### GET

- [ ] **T4-10** Returns 403 when caller is not a member
  - Spec: Non-member cannot list
  - Given: `getMember` returns `null`
  - Then: 403

- [ ] **T4-11** Returns 403 when caller is not active
  - Given: `getMember` returns `{ status: 'removed' }`
  - Then: 403

- [ ] **T4-12** Returns 200 with shares array
  - Spec: Player retrieves their shares
  - Given: active member; `listSharesForCampaign` returns two records
  - Then: 200 with the array

- [ ] **T4-13** Returns 200 with empty array when no shares
  - Spec: Empty list for player with no shares
  - Given: `listSharesForCampaign` returns `[]`
  - Then: 200 with `[]`

---

## Task 5 — DELETE route (`app/api/campaigns/[id]/characters/[cid]/route.ts`)

File: `tests/unit/api/campaigns/[id]/characters/[cid]/route.test.ts`

- [ ] **T5-1** Returns 403 when caller is not a member
  - Spec: Non-member cannot unshare
  - Given: `getMember` returns `null`
  - Then: 403

- [ ] **T5-2** Returns 404 when character not found
  - Given: caller is active member; character lookup returns null
  - Then: 404

- [ ] **T5-3** Returns 403 when character is owned by someone else
  - Spec: Cannot unshare another player's character
  - Given: active member; character exists with `userId !== auth.userId`
  - Then: 403

- [ ] **T5-4** Returns 404 when `removeShare` returns false
  - Spec: Unshare non-existent share returns 404
  - Given: ownership check passes; `removeShare` returns `false`
  - Then: 404

- [ ] **T5-5** Returns 204 on successful unshare
  - Spec: Successful unshare
  - Given: all guards pass; `removeShare` returns `true`
  - Then: 204

---

## Task 6 — `SharedCharactersPanel` UI (RTL)

File: `tests/unit/components/SharedCharactersPanel.test.tsx`

- [ ] **T6-1** Panel is NOT rendered when `currentUserMember` is null
  - Spec: Panel hidden from non-members
  - Then: no "Shared Characters" heading in document

- [ ] **T6-2** Panel is NOT rendered when member is active `dm`
  - Spec: Panel hidden from DM
  - Given: `currentUserMember = { role: 'dm', status: 'active' }`
  - Then: no "Shared Characters" heading

- [ ] **T6-3** Panel IS rendered when member is active `player`
  - Spec: Panel visible to active player
  - Given: `currentUserMember = { role: 'player', status: 'active' }`
  - Then: "Shared Characters" heading visible

- [ ] **T6-4** Panel lists player's characters with share toggle
  - Given: API returns characters [X, Y]; character X is already shared
  - Then: character X toggle is checked; character Y toggle is unchecked

- [ ] **T6-5** Clicking unchecked toggle calls POST
  - When: user clicks toggle for unshared character Y
  - Then: `POST /api/campaigns/[id]/characters` called with `{ characterId: Y }`

- [ ] **T6-6** Clicking checked toggle calls DELETE
  - When: user clicks toggle for shared character X
  - Then: `DELETE /api/campaigns/[id]/characters/X` called

---

## Task 7 — Integration tests

File: `tests/integration/campaigns/characterSharing.integration.test.ts`

- [ ] **T7-1** `addShare` inserts and `listSharesForCampaign` returns it
  - Spec: `storage.addShare` — Successful share; `listSharesForCampaign` — Returns caller's shares only

- [ ] **T7-2** Duplicate insert throws `DuplicateShareError`
  - Spec: `campaignCharacterShares` unique index; `DuplicateShareError`

- [ ] **T7-3** `removeShare` returns `true` on success
  - Spec: `storage.removeShare` — Successful removal

- [ ] **T7-4** `removeShare` returns `false` on non-existent record
  - Spec: `storage.removeShare` — Remove non-existent share

- [ ] **T7-5** `listSharesForCampaign` does not return other users' shares
  - Spec: Non-Functional — Security — Player cannot see other players' shares

- [ ] **T7-6** Same character can be shared into two different campaigns
  - Spec: `campaignCharacterShares` index — allows same character in different campaigns
