---
name: tests
description: TDD test plan for party-builder-shared-characters change
---

# Tests

## Overview

Test plan for the `party-builder-shared-characters` change. All work follows strict TDD: write a failing test first, implement the minimum code to pass, then refactor.

Test files map to existing conventions:
- Storage unit tests → `tests/unit/lib/storage-shares.test.ts` (extend) or `tests/unit/lib/storage.test.ts`
- New storage helpers → new `describe` blocks in `tests/unit/lib/storage-shares.test.ts`
- Route integration tests → `tests/integration/campaigns.character-sharing.integration.test.ts` (extend) and `tests/integration/api.integration.test.ts` (party routes)
- `fetchCampaignContext` unit tests → `tests/unit/lib/campaignContext.test.ts` (new file)
- `PartyEditor` component tests → `tests/unit/components/PartyEditor.test.tsx` (new file)

## Testing Steps

For each task group:
1. **Write failing test** before any implementation
2. **Implement** minimum code to pass
3. **Refactor** while keeping tests green

---

## Task A1 — `SharedCharacterEntry` type

- [ ] TypeScript compilation test: import `SharedCharacterEntry` from `lib/types`; construct a valid object; assert shape matches expectation
  - Spec: `design.md` Decision 7
  - File: `tests/unit/lib/types.test.ts` (or build check)

---

## Task A2 — `listAllSharesForCampaign`

- [ ] Returns all shares for campaign regardless of userId
  - Setup: insert shares from two different userIds for the same campaignId
  - Call: `storage.listAllSharesForCampaign(campaignId)`
  - Assert: both shares returned
  - Spec: `specs/party-cleanup/spec.md` — "Returns shares from multiple players"

- [ ] Returns empty array when no shares exist
  - Setup: empty `campaignCharacterShares` collection for campaignId
  - Assert: `[]`
  - Spec: `specs/party-cleanup/spec.md` — "Returns empty array for campaign with no shares"

- [ ] Does not return shares from other campaigns
  - Setup: share in campaignA and share in campaignB
  - Call: `listAllSharesForCampaign(campaignA)`
  - Assert: only campaignA share returned

---

## Task A3 — `loadPartiesByCampaign`

- [ ] Returns only parties matching the campaignId
  - Setup: party P1 with campaignId: C, party P2 with campaignId: D
  - Call: `loadPartiesByCampaign('C')`
  - Assert: only P1 returned
  - Spec: `specs/party-cleanup/spec.md` — "Returns only parties in the specified campaign"

- [ ] Returns empty array for campaign with no parties
  - Assert: `[]`

- [ ] Timing log emitted when query exceeds 10ms (spy on `console.log`)
  - Setup: mock `Date.now` to return values 15ms apart
  - Assert: `console.log` called with string matching `/\[perf\] loadPartiesByCampaign/`
  - Spec: `specs/party-cleanup/spec.md` — "Timing log emitted for slow queries"

---

## Task A4 — `setPartyMemberLeftAt`

- [ ] Sets leftAt on active member matching characterId
  - Setup: party in campaign C with active member `characterId: X`
  - Call: `setPartyMemberLeftAt('C', 'X', now)`
  - Assert: member.leftAt === now; `saveParty` called with updated party
  - Spec: `specs/party-cleanup/spec.md` — "Active party member gets leftAt set"

- [ ] Does not modify already-left member
  - Setup: member with existing `leftAt`
  - Assert: `leftAt` value unchanged after call
  - Spec: `specs/party-cleanup/spec.md` — "Already-left member is not modified"

- [ ] Updates multiple parties in same campaign
  - Setup: P1 and P2 both in campaign C, both with active member X
  - Assert: both parties saved with X having `leftAt`
  - Spec: `specs/party-cleanup/spec.md` — "Multiple parties in campaign are all cleaned up"

- [ ] Does not throw when `saveParty` throws
  - Setup: mock `saveParty` to throw
  - Assert: `setPartyMemberLeftAt` resolves without error
  - Spec: `specs/party-cleanup/spec.md` — "Storage error does not propagate"

---

## Task A5 — `canAddToCampaignParty`

- [ ] Returns true for DM-owned character
  - Setup: character.userId === dmUserId
  - Assert: `true`
  - Spec: `specs/party-access-rule/spec.md` — "DM-owned character is always allowed"

- [ ] Returns true for shared character from active member
  - Setup: share exists; `getMember` returns `{ status: 'active' }`
  - Assert: `true`
  - Spec: `specs/party-access-rule/spec.md` — "Shared character from active member is allowed"

- [ ] Returns false for share from invited member
  - Setup: share exists; `getMember` returns `{ status: 'invited' }`
  - Assert: `false`
  - Spec: `specs/party-access-rule/spec.md` — "Shared character from invited member is rejected"

- [ ] Returns false when no share exists
  - Setup: no share in `campaignCharacterShares` for this characterId/campaignId
  - Assert: `false`
  - Spec: `specs/party-access-rule/spec.md` — "Character not shared into campaign is rejected"

- [ ] Returns false for share from removed member
  - Setup: share exists; `getMember` returns `{ status: 'removed' }`
  - Assert: `false`
  - Spec: `specs/party-access-rule/spec.md` — "Character from removed member is rejected"

---

## Task B1 — `GET /api/campaigns/[id]/characters` DM enriched response

Integration tests in `tests/integration/campaigns.character-sharing.integration.test.ts`:

- [ ] DM receives `SharedCharacterEntry[]` with character metadata
  - Setup: two players share characters; DM is campaign member with role `dm`
  - Call: `GET /api/campaigns/:id/characters` as DM
  - Assert: 200; each item has `{ share: {...}, character: { id, name, characterType, userId } }`
  - Spec: `specs/campaign-character-shares-dm-get/spec.md` — "DM receives enriched share list"

- [ ] DM list excludes shares from inactive members
  - Setup: P1 (active, shared X); P2 (removed, shared Y)
  - Assert: only X's entry returned
  - Spec: "DM receives only active-member shares"

- [ ] DM list excludes soft-deleted characters
  - Setup: P1 shared X; X has `deletedAt` set
  - Assert: X not in response
  - Spec: "Soft-deleted character excluded from DM list"

- [ ] Player still receives own shares in bare format
  - Setup: P1 and P2 each shared a character
  - Call: `GET` as P1
  - Assert: 200; response is array of `CampaignCharacterShare` objects (no `character` field); only P1's shares
  - Spec: "Player receives own shares only"

- [ ] Non-member gets 403 (see existing test coverage; verify still passes)

---

## Task B2 — `POST /api/parties` access rule

Integration tests in `tests/integration/api.integration.test.ts` (party section):

- [ ] DM-owned characters accepted without campaignId
  - Call: `POST /api/parties` with DM-owned characterIds, no campaignId
  - Assert: 201
  - Spec: `specs/party-access-rule/spec.md` — "POST with DM-owned characters succeeds"

- [ ] Shared character accepted with campaignId
  - Setup: character X shared into campaign C by active member
  - Call: `POST /api/parties` with `campaignId: C`, `characterIds: [X.id]`
  - Assert: 201
  - Spec: "POST with shared character in campaign party succeeds"

- [ ] Unshared foreign character rejected with campaignId
  - Call: `POST /api/parties` with `campaignId: C`, characterId not shared
  - Assert: 403
  - Spec: "POST with unshared character in campaign party is rejected"

---

## Task B3 — `PUT /api/parties/[id]` access rule

- [ ] Adding shared character to campaign party accepted
  - Assert: 200
  - Spec: "PUT adding shared character succeeds"

- [ ] Adding unshared character to campaign party rejected
  - Assert: 403
  - Spec: "PUT adding unshared character is rejected"

- [ ] Re-adding existing active member is idempotent (no check, 200)
  - Setup: character already in party members with no `leftAt`
  - Assert: 200; no `canAddToCampaignParty` call for that characterId
  - Spec: "PUT re-adding existing active member is idempotent"

- [ ] Party without campaignId — no share check, DM-owned accepted
  - Assert: 200

---

## Task B4 — `DELETE /api/campaigns/[id]/characters/[cid]` cleanup

- [ ] Unshare returns 204 and triggers leftAt on party member
  - Setup: share exists; party has active member for that characterId
  - Call: `DELETE /api/campaigns/:id/characters/:cid`
  - Assert: 204; party member has `leftAt` set
  - Spec: `specs/party-cleanup/spec.md` — "Unshare triggers leftAt on party member"

- [ ] Cleanup error does not change 204 response
  - Setup: mock `setPartyMemberLeftAt` to throw
  - Assert: 204 returned regardless
  - Spec: "Unshare cleanup failure does not fail the response"

---

## Task B5 — `DELETE /api/campaigns/[id]/members/[userId]` cleanup

- [ ] Member removal returns `{ status: 'removed' }` and cascades leftAt for all their shares
  - Setup: target user has 2 shared characters; both in party as active members
  - Call: `DELETE /api/campaigns/:id/members/:userId`
  - Assert: 200 `{ status: 'removed' }`; both party members have `leftAt` set
  - Spec: `specs/party-cleanup/spec.md` — "Member removal cascades leftAt to all their shared characters"

- [ ] Member with no shares — removal still returns 200
  - Assert: 200; no party entries modified
  - Spec: "Member with no shares — removal still succeeds"

- [ ] Cleanup error does not fail removal response
  - Setup: mock cascade to throw
  - Assert: 200 `{ status: 'removed' }`
  - Spec: "Member removal cleanup failure does not fail the response"

---

## Task C1 — `fetchCampaignContext` shared characters

Unit tests in `tests/unit/lib/campaignContext.test.ts` (new file), mocking `fetch`:

- [ ] Shared character active in party appears in `context.characters`
  - Setup: mock GET `/api/characters` → DM chars; mock GET `/api/campaigns/:id/characters` → SharedCharacterEntry with char X; mock GET `/api/parties` → party with X as active member
  - Assert: `context.characters` includes X
  - Spec: `specs/campaign-context-shared-chars/spec.md` — "Shared character in active party appears in context"

- [ ] DM-owned character in party still appears (no regression)
  - Assert: DM chars still in `context.characters`
  - Spec: "DM-owned character in party still appears"

- [ ] Reactive guard excludes character with revoked share
  - Setup: X is active party member; shared-chars fetch does NOT include X (share deleted)
  - Assert: X not in `context.characters`
  - Spec: "Reactive guard excludes character with revoked share"

- [ ] Soft-deleted shared character excluded
  - Setup: SharedCharacterEntry for X has `character.deletedAt` set
  - Assert: X not in `context.characters`
  - Spec: "Soft-deleted shared character excluded"

- [ ] Shared char with leftAt excluded (existing leftAt logic)
  - Setup: X in SharedCharacterEntry; party member for X has `leftAt` set
  - Assert: X not in `context.characters`
  - Spec: "Shared character with leftAt is excluded"

- [ ] Failed shares fetch degrades to DM-only characters (no throw)
  - Setup: mock GET `/api/campaigns/:id/characters` → non-OK response
  - Assert: `context.characters` contains only DM-owned chars; function resolves without error
  - Spec: `specs/campaign-context-shared-chars/spec.md` — "Shared-character fetch failure degrades gracefully"

- [ ] Shared-chars fetch runs in parallel (no sequential blocking)
  - Setup: spy on `fetch`; record call order
  - Assert: `/api/campaigns/:id/characters`, `/api/parties`, `/api/characters` are all called in the same `Promise.all` tick (fetch calls initiated before any await resolves)

---

## Task D1 — `PartyEditor` UI

Component tests in `tests/unit/components/PartyEditor.test.tsx` (new file), using React Testing Library:

- [ ] Shared character section rendered when campaignId set
  - Setup: render PartyEditor with `sharedCharacters` containing one entry
  - Assert: "Shared by Campaign Members" heading visible; character name visible with checkbox
  - Spec: `specs/party-builder-ui/spec.md` — "Shared characters shown when campaignId selected"

- [ ] Shared characters grouped by owner
  - Setup: two entries with different `share.userId`
  - Assert: two distinct owner group labels rendered
  - Spec: "Shared characters grouped by owner"

- [ ] Soft-deleted shared character not shown
  - Setup: entry with `character.deletedAt` set
  - Assert: character name not present in the shared section
  - Spec: "Soft-deleted shared character not shown"

- [ ] Shared character section absent when no campaignId
  - Setup: render with `sharedCharacters: []`
  - Assert: no "Shared by Campaign Members" heading
  - Spec: "No shared characters section when no campaignId"

- [ ] Shared character checkbox toggles and is included in save
  - Setup: render; check a shared character
  - Simulate save
  - Assert: `onSave` called with characterId included in the `characterIds` array
  - Spec: "Shared character selected and saved"
