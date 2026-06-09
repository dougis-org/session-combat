## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED `canAddToCampaignParty` access rule

The system SHALL expose a `storage.canAddToCampaignParty(campaignId, characterId, dmUserId): Promise<boolean>` helper that returns `true` if and only if the character is owned by `dmUserId` OR an active share exists in `campaignCharacterShares` where `characterId` matches and the share's `userId` belongs to a campaign member with `status === 'active'`.

#### Scenario: DM-owned character is always allowed

- **Given** character X is owned by the DM (character.userId === dmUserId)
- **When** `canAddToCampaignParty(campaignId, X.id, dmUserId)` is called
- **Then** returns `true`

#### Scenario: Shared character from active member is allowed

- **Given** character X is owned by player P1 who is an active member of campaign `C` and has shared X into `C`
- **When** `canAddToCampaignParty('C', X.id, dmUserId)` is called
- **Then** returns `true`

#### Scenario: Shared character from invited (non-active) member is rejected

- **Given** character X is owned by player P1 who has `status: 'invited'` in campaign `C` and has a share record for X in `C`
- **When** `canAddToCampaignParty('C', X.id, dmUserId)` is called
- **Then** returns `false`

#### Scenario: Character not shared into campaign is rejected

- **Given** character X is owned by player P1 who is an active member of campaign `C` but has NOT shared X
- **When** `canAddToCampaignParty('C', X.id, dmUserId)` is called
- **Then** returns `false`

#### Scenario: Character from removed member is rejected

- **Given** character X was shared into campaign `C` by player P1 whose status is now `removed`
- **When** `canAddToCampaignParty('C', X.id, dmUserId)` is called
- **Then** returns `false`

### Requirement: ADDED party POST access rule enforcement

The system SHALL reject `POST /api/parties` with HTTP 403 if any `characterId` in the request fails `canAddToCampaignParty` when the request body includes a `campaignId`.

#### Scenario: POST with DM-owned characters succeeds

- **Given** all `characterIds` in the request are owned by the DM
- **When** DM calls `POST /api/parties` with or without `campaignId`
- **Then** response is HTTP 201

#### Scenario: POST with shared character in campaign party succeeds

- **Given** character X is shared into campaign `C` by an active member
- **When** DM calls `POST /api/parties` with `campaignId: 'C'` and `characterIds: [X.id]`
- **Then** response is HTTP 201

#### Scenario: POST with unshared character in campaign party is rejected

- **Given** character X is not shared into campaign `C`
- **When** DM calls `POST /api/parties` with `campaignId: 'C'` and `characterIds: [X.id]`
- **Then** response is HTTP 403

#### Scenario: POST without campaignId skips share check

- **Given** character X is owned by a player and not shared
- **When** DM calls `POST /api/parties` without `campaignId` and `characterIds: [X.id]`
- **Then** response is HTTP 403 only if X is not DM-owned; no share lookup occurs

### Requirement: ADDED party PUT access rule enforcement

The system SHALL reject `PUT /api/parties/[id]` with HTTP 403 if any newly added `characterId` fails `canAddToCampaignParty` when the party has a `campaignId`.

#### Scenario: PUT adding shared character succeeds

- **Given** party P is in campaign `C`; character X is shared into `C` by an active member
- **When** DM calls `PUT /api/parties/P` adding X to `characterIds`
- **Then** response is HTTP 200

#### Scenario: PUT adding unshared character is rejected

- **Given** party P is in campaign `C`; character X is not shared into `C`
- **When** DM calls `PUT /api/parties/P` adding X to `characterIds`
- **Then** response is HTTP 403

#### Scenario: PUT re-adding an existing active member is idempotent (no re-check)

- **Given** party P already has character X as an active member
- **When** DM calls `PUT /api/parties/P` with characterIds including X
- **Then** no new access check is performed for X; response is HTTP 200

#### Scenario: PUT on party without campaignId skips share check

- **Given** party P has no `campaignId`; character X is DM-owned
- **When** DM calls `PUT /api/parties/P` adding X
- **Then** response is HTTP 200 without share lookup

## Traceability

- Proposal element "access rule helper `canAddToCampaignParty`" → Requirement: ADDED `canAddToCampaignParty`
- Design decision 2 (access rule helper) → Requirement: ADDED `canAddToCampaignParty`, ADDED POST rule, ADDED PUT rule
- Requirement → Tasks: "Add `canAddToCampaignParty` storage helper", "Enforce access rule in POST /api/parties", "Enforce access rule in PUT /api/parties/[id]"

## Non-Functional Acceptance Criteria

### Requirement: Security

See functional scenarios: "POST with unshared character is rejected", "PUT adding unshared character is rejected", "Character from removed member is rejected".

No distinct NFAC security scenarios — all access-control cases are fully covered by the functional scenarios above.

### Requirement: Performance

#### Scenario: Access rule check latency

- **Given** `canAddToCampaignParty` is called for a party with up to 10 character additions
- **When** each character requires a share lookup and member status check
- **Then** total additional latency per party save is under 200ms (two indexed MongoDB reads per character, small party sizes)
