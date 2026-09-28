## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Callers use membershipRepo for membership operations

The system SHALL route every call to a membership-domain operation (`addMember`, `updateMemberStatus`, `listMembersForCampaign`, `getMember`, `listInvitationsForUser`, `getUserById`, `getUsersByIds`) from the 15 identified caller files through a direct `membershipRepo` import (named imports from `@/lib/storage/membershipRepo`, or a relative `./membershipRepo` import for `lib/storage/partyRepo.ts`) rather than through the `storage` facade.

The 15 files are: `lib/utils/campaign.ts`, `lib/server/transport.ts`, `lib/storage/partyRepo.ts`, `app/api/campaigns/[id]/parties/route.ts`, `app/api/campaigns/[id]/members/[userId]/parties/[partyId]/route.ts`, `app/api/campaigns/route.ts`, `app/api/me/invitations/route.ts`, `app/api/campaigns/[id]/members/route.ts`, `app/api/campaigns/[id]/members/me/route.ts`, `app/api/campaigns/[id]/characters/[cid]/route.ts`, `app/api/campaigns/[id]/characters/route.ts`, `app/api/campaigns/[id]/members/[userId]/route.ts`, `app/api/campaigns/[id]/rolls/route.ts`, `app/api/campaigns/[id]/messages/route.ts`, `app/api/campaigns/global/[id]/copy/route.ts`.

#### Scenario: Checking campaign access calls membershipRepo directly

- **Given** `lib/utils/campaign.ts`'s `assertCampaignAccess` needs to verify a user's membership in a campaign
- **When** the migration is applied
- **Then** it calls `getMember(...)` imported from `@/lib/storage/membershipRepo`, not `storage.getMember(...)`

#### Scenario: Internal repo-to-repo call is migrated

- **Given** `lib/storage/partyRepo.ts` needs to verify a sharing user's campaign membership before building a shared-character entry
- **When** the migration is applied
- **Then** it calls `getMember(...)` imported from `./membershipRepo` (a sibling module under `lib/storage/`), not `storage.getMember(...)`

#### Scenario: Duplicate-member error handling is preserved after migration

- **Given** `app/api/campaigns/[id]/members/route.ts`'s POST handler calls `addMember` and catches `error instanceof DuplicateMemberError` to return a 409
- **When** the migration is applied
- **Then** the handler calls `addMember(...)` imported from `@/lib/storage/membershipRepo`, and the existing `instanceof DuplicateMemberError` catch branch is unchanged and still returns 409 on a duplicate key

### Requirement: ADDED Non-membership calls in mixed-domain files remain on the storage facade

The system SHALL continue routing calls to non-membership-domain operations (`removeShare`, `addShare`, `listSharesForCampaign`, `listAllSharesForCampaign`, `loadCharacterById`, `loadPartiesByCampaign`, `saveParty`, `listCampaignRolls`, `saveCampaignRoll`, `loadGlobalCampaignTemplateById`) in the 7 mixed-domain files through the existing `storage` import, unchanged.

The 7 mixed-domain files are: `lib/storage/partyRepo.ts`, `app/api/campaigns/[id]/characters/[cid]/route.ts`, `app/api/campaigns/[id]/characters/route.ts`, `app/api/campaigns/[id]/members/[userId]/route.ts`, `app/api/campaigns/[id]/rolls/route.ts`, `app/api/campaigns/[id]/messages/route.ts`, `app/api/campaigns/global/[id]/copy/route.ts`.

#### Scenario: Share removal in a characters route stays on storage

- **Given** `app/api/campaigns/[id]/characters/[cid]/route.ts`'s handler checks membership before removing a character share
- **When** the migration is applied
- **Then** the membership check calls `getMember(...)` from `membershipRepo`, and the subsequent share removal still calls `storage.removeShare(...)`

#### Scenario: Campaign-template lookup in the copy route stays on storage

- **Given** `app/api/campaigns/global/[id]/copy/route.ts` loads a global campaign template before adding the creator as a member
- **When** the migration is applied
- **Then** the template lookup still calls `storage.loadGlobalCampaignTemplateById(...)`, and only the subsequent `addMember` call switches to `membershipRepo`

## MODIFIED Requirements

*(None — this change does not modify externally observable requirements; it modifies internal module organization only. See ADDED Requirements above.)*

## REMOVED Requirements

*(None — no requirement, capability, or facade method is removed. `storage.ts`'s public membership methods remain available for any caller not covered by this issue's inventory.)*

## Traceability

- Proposal element: "8 pure-membership files get a full import swap" + "7 mixed-domain files get a partial import swap" -> Requirement: "ADDED Callers use membershipRepo for membership operations" + "ADDED Non-membership calls in mixed-domain files remain on the storage facade"
- Proposal element: "`lib/storage/partyRepo.ts`'s internal `storage.getMember` call is migrated in this change" -> Requirement: "ADDED Callers use membershipRepo for membership operations" (Scenario: Internal repo-to-repo call is migrated)
- Proposal element: "`DuplicateMemberError` handling preserved" -> Requirement: "ADDED Callers use membershipRepo for membership operations" (Scenario: Duplicate-member error handling is preserved after migration)
- Design decision: Decision 1 (full vs. partial import swap per file) -> Requirement: "ADDED Callers use membershipRepo for membership operations" / "ADDED Non-membership calls in mixed-domain files remain on the storage facade"
- Design decision: Decision 2 (named imports) -> Requirement: "ADDED Callers use membershipRepo for membership operations"
- Design decision: Decision 3 (partyRepo internal call in scope) -> Requirement: "ADDED Callers use membershipRepo for membership operations" (Scenario: Internal repo-to-repo call is migrated)
- Requirement: "ADDED Callers use membershipRepo for membership operations" -> Task(s): per-file migration tasks for each of the 15 files (see [`tasks.md`](../../tasks.md))
- Requirement: "ADDED Non-membership calls in mixed-domain files remain on the storage facade" -> Task(s): per-file partial-swap verification tasks for the 7 mixed-domain files (see [`tasks.md`](../../tasks.md))

## Non-Functional Acceptance Criteria

### Requirement: Performance

*(Not applicable — this is a static import/call-site refactor with no change to runtime query patterns, indexing, or request volume. No new scenario required.)*

### Requirement: Security

See functional scenario: "Duplicate-member error handling is preserved after migration" (covers that no new attack surface or altered access-control/error-handling path is introduced — the facade's method signatures, error types, and delegation targets are unchanged in behavior).

### Requirement: Reliability

#### Scenario: No behavior change under identical inputs

- **Given** the full existing membership, campaign-access, party, character-share, roll, and messages test suites (unit + integration) pass against the pre-change code
- **When** the same test suites run against the post-change code, with only mock targets updated from `storage.<method>` to `membershipRepo.<method>` where production code now calls `membershipRepo`
- **Then** every test's expected values, call counts, and error conditions remain identical — no test's assertions about behavior (as opposed to which module was called) need to change

#### Scenario: Grep sweep confirms complete migration

- **Given** the migration is complete across all 15 files
- **When** a repo-wide search for `storage\.(addMember|updateMemberStatus|listMembersForCampaign|getMember|listInvitationsForUser|getUserById|getUsersByIds)\(` is run, excluding `tests/**` and `.verity/.snapshot/**`
- **Then** zero matches remain
