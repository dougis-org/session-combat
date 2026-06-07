## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED `CampaignCharacterShare` type

The system SHALL define a `CampaignCharacterShare` interface with fields `id`, `campaignId`, `characterId`, `userId`, and `sharedAt`.

#### Scenario: Type shape is correct

- **Given** the `CampaignCharacterShare` interface in `lib/types.ts`
- **When** a value is typed as `CampaignCharacterShare`
- **Then** it must have `id: string`, `campaignId: string`, `characterId: string`, `userId: string`, `sharedAt: Date`; any other shape is a TypeScript type error

---

### Requirement: ADDED `campaignCharacterShares` unique compound index

The system SHALL create a unique index on `{ campaignId: 1, characterId: 1 }` in the `campaignCharacterShares` MongoDB collection during `initializeDatabase()`.

#### Scenario: Index enforces uniqueness

- **Given** a `campaignCharacterShares` record exists for `(campaignId=C, characterId=X)`
- **When** a second insert is attempted with the same `(campaignId=C, characterId=X)` by any user
- **Then** MongoDB rejects the insert with a duplicate key error (code 11000)

#### Scenario: Index allows same character in different campaigns

- **Given** a share record for `(campaignId=C1, characterId=X)`
- **When** a record is inserted for `(campaignId=C2, characterId=X)`
- **Then** the insert succeeds

#### Scenario: Index allows different characters in the same campaign

- **Given** a share record for `(campaignId=C, characterId=X)`
- **When** a record is inserted for `(campaignId=C, characterId=Y)`
- **Then** the insert succeeds

---

### Requirement: ADDED `DuplicateShareError`

The system SHALL throw a `DuplicateShareError` (extending `Error`, `name = 'DuplicateShareError'`) when `addShare` is called with a `{campaignId, characterId}` pair that already exists. The error message SHALL include both `campaignId` and `characterId`.

#### Scenario: Typed error on duplicate

- **Given** character X is already shared into campaign C
- **When** `storage.addShare({ campaignId: C, characterId: X, ... })` is called
- **Then** a `DuplicateShareError` is thrown (not a raw MongoError)

---

### Requirement: ADDED `storage.addShare`

The system SHALL provide `addShare(share: CampaignCharacterShare): Promise<void>` that inserts a new share record into `campaignCharacterShares`.

#### Scenario: Successful share

- **Given** character X is not yet shared into campaign C
- **When** `addShare` is called with a valid `CampaignCharacterShare`
- **Then** the record is persisted and `listSharesForCampaign(C, userId)` includes it

#### Scenario: Duplicate rejected

- **Given** character X is already shared into campaign C
- **When** `addShare` is called with the same `{campaignId, characterId}`
- **Then** `DuplicateShareError` is thrown

---

### Requirement: ADDED `storage.removeShare`

The system SHALL provide `removeShare(campaignId: string, characterId: string, userId: string): Promise<boolean>` that deletes the share record matching `{campaignId, characterId, userId}` (scoped by owner for defense-in-depth). Returns `true` if a record was deleted, `false` if no record was found.

#### Scenario: Successful removal

- **Given** character X is shared into campaign C by user U
- **When** `removeShare(C, X, U)` is called
- **Then** the record is deleted and `listSharesForCampaign(C, U)` no longer includes it; return value is `true`

#### Scenario: Remove non-existent share returns false

- **Given** character X is not shared into campaign C
- **When** `removeShare(C, X, U)` is called
- **Then** no error is thrown and the return value is `false`

---

### Requirement: ADDED `storage.listSharesForCampaign`

The system SHALL provide `listSharesForCampaign(campaignId: string, userId: string): Promise<CampaignCharacterShare[]>` that returns only the share records matching both `campaignId` and `userId`.

#### Scenario: Returns caller's shares only

- **Given** campaign C has shares from player P1 (characters X, Y) and player P2 (character Z)
- **When** `listSharesForCampaign(C, P1)` is called
- **Then** returns exactly the two records for P1; the record for P2 is not included

#### Scenario: Returns empty array for campaign with no shares by this user

- **Given** campaign C exists but user U has no shares in it
- **When** `listSharesForCampaign(C, U)` is called
- **Then** an empty array is returned

---

### Requirement: ADDED `POST /api/campaigns/[id]/characters` — share a character

The system SHALL allow an authenticated active player-member to share one of their own characters into a campaign by `POST`ing `{ characterId }` to `/api/campaigns/[id]/characters`.

#### Scenario: Successful share

- **Given** user U is an active player-member of campaign C and owns character X
- **When** `POST /api/campaigns/C/characters` with body `{ characterId: X }` is called
- **Then** response is `201` with `{ id: <shareId>, characterId: X }` and `listSharesForCampaign(C, U)` includes the new record

#### Scenario: Non-member rejected

- **Given** user U is not a member of campaign C
- **When** `POST /api/campaigns/C/characters` with body `{ characterId: X }` is called
- **Then** response is `403 Forbidden`

#### Scenario: Non-active member rejected

- **Given** user U is an `invited` or `declined` or `removed` member of campaign C
- **When** `POST /api/campaigns/C/characters` with any `characterId` is called
- **Then** response is `403 Forbidden`

#### Scenario: DM cannot share via this endpoint

- **Given** user U is an active `dm` member of campaign C and owns character X
- **When** `POST /api/campaigns/C/characters` with body `{ characterId: X }` is called
- **Then** response is `403 Forbidden` (endpoint is player-only)

#### Scenario: Unowned character rejected

- **Given** user U is an active player-member of campaign C; character X exists but is owned by user V
- **When** `POST /api/campaigns/C/characters` with body `{ characterId: X }` is called
- **Then** response is `403 Forbidden`

#### Scenario: Character not found

- **Given** user U is an active player-member of campaign C; character Z does not exist
- **When** `POST /api/campaigns/C/characters` with body `{ characterId: Z }` is called
- **Then** response is `404 Not Found`

#### Scenario: Duplicate share rejected

- **Given** character X is already shared into campaign C by user U
- **When** `POST /api/campaigns/C/characters` with body `{ characterId: X }` is called again
- **Then** response is `409 Conflict`

#### Scenario: Missing characterId rejected

- **Given** user U is an active player-member of campaign C
- **When** `POST /api/campaigns/C/characters` with body `{}` or missing `characterId` is called
- **Then** response is `400 Bad Request`

---

### Requirement: ADDED `GET /api/campaigns/[id]/characters` — list caller's shares

The system SHALL allow an authenticated active member to list the characters they have shared into a campaign by `GET /api/campaigns/[id]/characters`.

#### Scenario: Player retrieves their shares

- **Given** user U (active player) has shared characters X and Y into campaign C
- **When** `GET /api/campaigns/C/characters` is called by U
- **Then** response is `200` with an array containing exactly the two share records for U; no other player's shares appear

#### Scenario: Non-member cannot list

- **Given** user U is not a member of campaign C
- **When** `GET /api/campaigns/C/characters` is called by U
- **Then** response is `403 Forbidden`

#### Scenario: Empty list for player with no shares

- **Given** user U is an active player-member of campaign C but has not shared any characters
- **When** `GET /api/campaigns/C/characters` is called by U
- **Then** response is `200` with an empty array

---

### Requirement: ADDED `DELETE /api/campaigns/[id]/characters/[cid]` — unshare a character

The system SHALL allow an authenticated active player-member to remove their own character share from a campaign.

#### Scenario: Successful unshare

- **Given** user U (active player) has shared character X into campaign C
- **When** `DELETE /api/campaigns/C/characters/X` is called by U
- **Then** response is `204 No Content` and `listSharesForCampaign(C, U)` no longer includes character X

#### Scenario: Unshare non-existent share returns 404

- **Given** character X is not currently shared into campaign C
- **When** `DELETE /api/campaigns/C/characters/X` is called
- **Then** response is `404 Not Found`

#### Scenario: Cannot unshare another player's character

- **Given** character X is shared into campaign C by player P2; user U (different player) attempts deletion
- **When** `DELETE /api/campaigns/C/characters/X` is called by U
- **Then** response is `403 Forbidden`

#### Scenario: Non-member cannot unshare

- **Given** user U is not a member of campaign C
- **When** `DELETE /api/campaigns/C/characters/X` is called by U
- **Then** response is `403 Forbidden`

---

### Requirement: ADDED Player character-sharing UI on campaign view

The system SHALL render a "Shared Characters" panel on the campaign view, visible only to the authenticated user when they are an active player-member of that campaign. The panel SHALL list the player's own characters with a toggle (share/unshare) per character.

#### Scenario: Panel is visible to active player

- **Given** user U is an active player-member of campaign C
- **When** U views the campaign page
- **Then** a "Shared Characters" section is visible showing U's characters with share toggles

#### Scenario: Panel is hidden from DM

- **Given** user U is the DM of campaign C
- **When** U views the campaign page
- **Then** no "Shared Characters" section is rendered

#### Scenario: Panel is hidden from non-members

- **Given** user U is not a member of campaign C
- **When** U views the campaign page (if accessible)
- **Then** no "Shared Characters" section is rendered

#### Scenario: Toggle shares a character

- **Given** character X is not yet shared; the player clicks the toggle for X
- **When** the toggle action completes
- **Then** character X shows as shared in the panel; a POST to `/api/campaigns/C/characters` was made

#### Scenario: Toggle unshares a character

- **Given** character X is shared; the player clicks the toggle for X
- **When** the toggle action completes
- **Then** character X shows as unshared; a DELETE to `/api/campaigns/C/characters/X` was made

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal: `CampaignCharacterShare` type → Requirement: ADDED `CampaignCharacterShare` type
- Proposal: Unique `{campaignId, characterId}` index → Requirement: ADDED `campaignCharacterShares` unique compound index
- Proposal: `DuplicateShareError` → Requirement: ADDED `DuplicateShareError`
- Proposal: `addShare` storage method → Requirement: ADDED `storage.addShare`
- Proposal: `removeShare` storage method → Requirement: ADDED `storage.removeShare`
- Proposal: `listSharesForCampaign` storage method → Requirement: ADDED `storage.listSharesForCampaign`
- Proposal: POST route → Requirement: ADDED `POST /api/campaigns/[id]/characters`
- Proposal: GET route → Requirement: ADDED `GET /api/campaigns/[id]/characters`
- Proposal: DELETE route → Requirement: ADDED `DELETE /api/campaigns/[id]/characters/[cid]`
- Proposal: Player UI on campaign view → Requirement: ADDED Player character-sharing UI
- Design Decision 1 (type shape) → `CampaignCharacterShare` type requirement
- Design Decision 2 (index) → `campaignCharacterShares` index requirement
- Design Decision 3 (error class) → `DuplicateShareError` requirement
- Design Decision 4 (storage signatures) → `addShare`, `removeShare`, `listSharesForCampaign` requirements
- Design Decision 5 (route layout) → POST, GET, DELETE route requirements
- Design Decision 6 (UI panel) → Player UI requirement

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: List query is bounded

- **Given** a player has N shared characters in a campaign (N < 1000)
- **When** `listSharesForCampaign` is called
- **Then** exactly one DB query is issued (no N+1 pattern)
