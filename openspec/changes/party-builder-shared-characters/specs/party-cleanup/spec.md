## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED `setPartyMemberLeftAt` storage helper

The system SHALL expose `storage.setPartyMemberLeftAt(campaignId: string, characterId: string, timestamp: Date): Promise<void>` that finds all parties in the campaign, locates active members matching `characterId` (no `leftAt`), sets `leftAt` to `timestamp`, and saves each modified party. Errors SHALL be caught and logged without re-throwing.

#### Scenario: Active party member gets leftAt set

- **Given** party P is in campaign `C` and has an active member with `characterId: X`
- **When** `setPartyMemberLeftAt('C', 'X', now)` is called
- **Then** the party member entry for X has `leftAt` set to `now`; the party is persisted

#### Scenario: Already-left member is not modified

- **Given** party P is in campaign `C` and has a member with `characterId: X` where `leftAt` is already set
- **When** `setPartyMemberLeftAt('C', 'X', now)` is called
- **Then** that member's `leftAt` is unchanged

#### Scenario: Multiple parties in campaign are all cleaned up

- **Given** campaign `C` has parties P1 and P2, both with active members for `characterId: X`
- **When** `setPartyMemberLeftAt('C', 'X', now)` is called
- **Then** the member entry for X in both P1 and P2 has `leftAt` set

#### Scenario: Storage error does not propagate

- **Given** `storage.saveParty` throws an error during cleanup
- **When** `setPartyMemberLeftAt` is called
- **Then** the error is logged and the function returns without throwing

### Requirement: ADDED proactive cleanup on character unshare

The system SHALL call `setPartyMemberLeftAt(campaignId, characterId, now)` after a successful `DELETE /api/campaigns/[id]/characters/[cid]` response. Cleanup errors SHALL NOT affect the HTTP response.

#### Scenario: Unshare triggers leftAt on party member

- **Given** player P1 has shared character X into campaign `C`; party P in `C` has X as an active member
- **When** P1 calls `DELETE /api/campaigns/C/characters/X`
- **Then** the response is HTTP 204; the party member entry for X has `leftAt` set

#### Scenario: Unshare cleanup failure does not fail the response

- **Given** `setPartyMemberLeftAt` encounters a storage error
- **When** P1 calls `DELETE /api/campaigns/C/characters/X` (share exists and is deleted successfully)
- **Then** the response is still HTTP 204

### Requirement: ADDED proactive cleanup on member removal

The system SHALL enumerate all shares in the campaign belonging to the removed member and call `setPartyMemberLeftAt` for each after a successful `DELETE /api/campaigns/[id]/members/[userId]`. Cleanup errors SHALL NOT affect the HTTP response.

#### Scenario: Member removal cascades leftAt to all their shared characters

- **Given** player P1 (active member) has shared characters X and Y into campaign `C`; both are active members of party P
- **When** the DM calls `DELETE /api/campaigns/C/members/P1`
- **Then** the response is HTTP 200 with `{ status: 'removed' }`; party member entries for both X and Y have `leftAt` set

#### Scenario: Member with no shares — removal still succeeds

- **Given** player P1 is an active member of campaign `C` with no shared characters
- **When** the DM calls `DELETE /api/campaigns/C/members/P1`
- **Then** the response is HTTP 200; no party entries are modified

#### Scenario: Member removal cleanup failure does not fail the response

- **Given** `setPartyMemberLeftAt` throws during the cascade
- **When** the DM calls `DELETE /api/campaigns/C/members/P1` (member status update succeeds)
- **Then** the response is still HTTP 200 with `{ status: 'removed' }`

## ADDED Requirements — Storage Helpers

### Requirement: ADDED `listAllSharesForCampaign` storage method

The system SHALL expose `storage.listAllSharesForCampaign(campaignId: string): Promise<CampaignCharacterShare[]>` that returns all shares in the campaign regardless of which user created them.

#### Scenario: Returns shares from multiple players

- **Given** campaign `C` has shares from players P1 and P2 (two records total)
- **When** `listAllSharesForCampaign('C')` is called
- **Then** both share records are returned

#### Scenario: Returns empty array for campaign with no shares

- **Given** campaign `C` has no shares
- **When** `listAllSharesForCampaign('C')` is called
- **Then** returns `[]`

### Requirement: ADDED `loadPartiesByCampaign` storage method with timing observability

The system SHALL expose `storage.loadPartiesByCampaign(campaignId: string): Promise<Party[]>` that returns all parties with `campaignId` matching, logging `[perf] loadPartiesByCampaign <campaignId>: <ms>ms` to `console.log` when query duration exceeds 10ms.

#### Scenario: Returns only parties in the specified campaign

- **Given** parties P1 (campaignId: C) and P2 (campaignId: D) exist
- **When** `loadPartiesByCampaign('C')` is called
- **Then** only P1 is returned

#### Scenario: Timing log emitted for slow queries

- **Given** the MongoDB query takes longer than 10ms
- **When** `loadPartiesByCampaign` is called
- **Then** a `[perf]` line is written to `console.log` containing the campaignId and duration in ms

## Traceability

- Proposal element "setPartyMemberLeftAt proactive cleanup" → Requirement: ADDED `setPartyMemberLeftAt`, proactive cleanup on unshare, proactive cleanup on member removal
- Proposal element "listAllSharesForCampaign" → Requirement: ADDED `listAllSharesForCampaign`
- Proposal element "loadPartiesByCampaign with timing" → Requirement: ADDED `loadPartiesByCampaign`
- Design decision 5 (fire-and-forget cleanup) → Requirement: cleanup errors do not propagate
- Design decision 4 (timing log) → Requirement: timing log emitted
- Requirements → Tasks: "Add storage helpers", "Extend unshare route with cleanup", "Extend member-removal route with cleanup"

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Cleanup errors do not degrade primary operations

See functional scenarios: "Unshare cleanup failure does not fail the response", "Member removal cleanup failure does not fail the response", "Storage error does not propagate". No distinct NFAC reliability scenario needed.

### Requirement: Performance (observability)

#### Scenario: Perf log baseline established

- **Given** `loadPartiesByCampaign` is called during a cleanup operation
- **When** the query completes in any duration
- **Then** if duration > 10ms, a `[perf] loadPartiesByCampaign` log line is emitted; this provides data to justify a future `campaignId` index on the `parties` collection
