## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Callers use partyRepo for party operations

The system SHALL route every call to a party-domain operation (`loadParties`, `saveParty`, `saveParties`, `deleteParty`, `loadPartiesByCampaign`, `buildSharedCharacterEntries`, `setPartyMemberLeftAt`, `canAddToCampaignParty`, `addPartyToCampaign`, `removePartyFromCampaign`, `removePartyFromAllCampaigns`) from the 8 identified API route files (`app/api/parties/route.ts`, `app/api/parties/[id]/route.ts`, `app/api/campaigns/route.ts`, `app/api/campaigns/[id]/parties/route.ts`, `app/api/campaigns/[id]/members/[userId]/parties/[partyId]/route.ts`, `app/api/campaigns/[id]/members/[userId]/route.ts`, `app/api/campaigns/[id]/characters/route.ts`, `app/api/campaigns/[id]/characters/[cid]/route.ts`) through a direct `partyRepo` import (`import * as partyRepo from '@/lib/storage/partyRepo'`) rather than through the `storage` facade.

#### Scenario: Creating a party calls partyRepo directly

- **Given** a POST request to `app/api/parties/route.ts` with a valid party payload
- **When** the route handler persists the new party
- **Then** it calls `partyRepo.saveParty(...)`, not `storage.saveParty(...)`

#### Scenario: Call site inside a map/Promise.all callback is migrated

- **Given** `app/api/parties/[id]/route.ts`'s PUT handler validates each incoming character ID against campaign membership inside a `Promise.all(charsToCheck.map(...))` block
- **When** the migration is applied
- **Then** the callback calls `partyRepo.canAddToCampaignParty(...)`, not `storage.canAddToCampaignParty(...)`, and the surrounding control flow (map/Promise.all structure, error branching) is unchanged

### Requirement: ADDED Non-party calls in the same files remain on the storage facade

The system SHALL continue routing calls to non-party-domain operations (`getMember`, `addMember`, `updateMemberStatus`, `addShare`, `removeShare`, `listSharesForCampaign`, `listAllSharesForCampaign`) in the 8 identified files through the existing `storage` import, unchanged.

#### Scenario: Membership check in a party route stays on storage

- **Given** `app/api/campaigns/[id]/parties/route.ts`'s GET handler checks campaign membership before listing parties
- **When** the migration is applied
- **Then** the membership check still calls `storage.getMember(...)`, and only the subsequent `loadPartiesByCampaign` call switches to `partyRepo.loadPartiesByCampaign(...)`

### Requirement: ADDED Campaign-party linking functions relocated to partyRepo

The system SHALL define `addPartyToCampaign`, `removePartyFromCampaign`, and `removePartyFromAllCampaigns` as named exports of `lib/storage/partyRepo.ts`, with implementation bodies unchanged from their prior location in `lib/storage.ts` (same `runStorageOp` wrapper, same MongoDB query/update operations, same control flow).

#### Scenario: Relocated function preserves exact database operations

- **Given** `partyRepo.addPartyToCampaign(campaignId, partyId)` is called with a campaign that has no `partyIds` field set yet (legacy document)
- **When** the function executes
- **Then** it performs the same legacy-migration read against the `parties` collection and the same `$set` update against `campaigns` that `storage.addPartyToCampaign` performed before relocation, byte-for-byte

#### Scenario: storage.ts continues to expose the same public methods

- **Given** external code (or an existing test) calls `storage.addPartyToCampaign(campaignId, partyId)` directly
- **When** the call executes
- **Then** `lib/storage.ts`'s `addPartyToCampaign` method delegates to `partyRepo.addPartyToCampaign(campaignId, partyId)` and returns/behaves identically to before this change

## MODIFIED Requirements

*(None — this change does not modify externally observable requirements; it modifies internal module organization only. See ADDED Requirements above.)*

## REMOVED Requirements

*(None — no requirement, capability, or facade method is removed. `storage.ts`'s public surface is fully preserved via delegation.)*

## Traceability

- Proposal element: "8 caller files switch party-method calls to `partyRepo.*` while keeping `storage.*` for non-party calls" -> Requirement: "ADDED Callers use partyRepo for party operations" + "ADDED Non-party calls in the same files remain on the storage facade"
- Proposal element: "Move `addPartyToCampaign`/`removePartyFromCampaign`/`removePartyFromAllCampaigns` into `partyRepo.ts`; `storage.ts` delegates" -> Requirement: "ADDED Campaign-party linking functions relocated to partyRepo"
- Design decision: Decision 1 (mixed imports per file) -> Requirement: "ADDED Callers use partyRepo for party operations" / "ADDED Non-party calls in the same files remain on the storage facade"
- Design decision: Decision 2 (relocate campaign-linking functions) -> Requirement: "ADDED Campaign-party linking functions relocated to partyRepo"
- Requirement: "ADDED Callers use partyRepo for party operations" -> Task(s): per-file migration tasks for each of the 8 route files (see tasks.md)
- Requirement: "ADDED Campaign-party linking functions relocated to partyRepo" -> Task(s): partyRepo.ts relocation task, storage.ts delegation-rewrite task (see tasks.md)

## Non-Functional Acceptance Criteria

### Requirement: Performance

*(Not applicable — this is a static import/module-location refactor with no change to runtime query patterns, indexing, or request volume. No new scenario required.)*

### Requirement: Security

See functional scenario: "storage.ts continues to expose the same public methods" (covers that no new attack surface or altered access-control path is introduced — the facade's method signatures and delegation targets are unchanged in behavior).

### Requirement: Reliability

#### Scenario: No behavior change under identical inputs

- **Given** the full existing party and campaign-party-linking test suites (unit + integration) pass against the pre-change code
- **When** the same test suites run against the post-change code, with only mock targets updated from `storage.<method>` to `partyRepo.<method>` where production code now calls `partyRepo`
- **Then** every test's expected values, call counts, and error conditions remain identical — no test's assertions about behavior (as opposed to which object was called) need to change
