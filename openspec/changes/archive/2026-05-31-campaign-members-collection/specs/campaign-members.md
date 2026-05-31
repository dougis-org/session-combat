## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED CampaignMember type and role enum

The system SHALL define a `CampaignMember` type with fields `id`, `campaignId`, `userId`, `role` (constrained to `MEMBER_ROLES`), `status`, `invitedBy`, `invitedAt`, and optional `respondedAt`. The system SHALL export `MEMBER_ROLES = ['dm', 'player'] as const` and derive `MemberRole` from it.

#### Scenario: Valid role values

- **Given** the `MEMBER_ROLES` const tuple
- **When** a value is tested against `MemberRole`
- **Then** only `'dm'` and `'player'` are valid; any other string is a TypeScript type error

### Requirement: ADDED `campaignMembers` unique compound index

The system SHALL create a unique index on `{ campaignId: 1, userId: 1 }` in the `campaignMembers` MongoDB collection during `initializeDatabase()`.

#### Scenario: Index enforces uniqueness

- **Given** a `campaignMembers` record exists for `(campaignId=C, userId=U)`
- **When** a second insert is attempted with the same `(campaignId=C, userId=U)`
- **Then** MongoDB rejects the insert with a duplicate key error (code 11000)

#### Scenario: Index allows same user in different campaigns

- **Given** a member record for `(campaignId=C1, userId=U)`
- **When** a record is inserted for `(campaignId=C2, userId=U)`
- **Then** the insert succeeds

### Requirement: ADDED `DuplicateMemberError`

The system SHALL throw a `DuplicateMemberError` (extending `Error`, `name = 'DuplicateMemberError'`) when `addMember` is called with a `{campaignId, userId}` pair that already exists. The error message SHALL include both the `campaignId` and `userId`.

#### Scenario: Typed error on duplicate

- **Given** user U is already a member of campaign C
- **When** `storage.addMember({ campaignId: C, userId: U, ... })` is called
- **Then** a `DuplicateMemberError` is thrown (not a raw MongoError)

### Requirement: ADDED `storage.addMember`

The system SHALL provide `addMember(member: CampaignMember): Promise<void>` that inserts a new membership record into `campaignMembers`.

#### Scenario: Successful add

- **Given** no membership exists for `(campaignId, userId)`
- **When** `addMember` is called with a valid `CampaignMember`
- **Then** the record is persisted and `listMembersForCampaign(campaignId)` includes it

#### Scenario: Duplicate rejected

- **Given** a membership already exists for `(campaignId, userId)`
- **When** `addMember` is called with the same pair
- **Then** `DuplicateMemberError` is thrown

### Requirement: ADDED `storage.updateMember`

The system SHALL provide `updateMember(campaignId: string, userId: string, role?: MemberRole, status?: MemberStatus): Promise<void>` that patches the `role` and/or `status` of an existing membership. If no matching record exists, the call is a no-op.

#### Scenario: Update status

- **Given** user U is a `pending` `player` in campaign C
- **When** `updateMember(C, U, undefined, 'active')` is called
- **Then** `listMembersForCampaign(C)` returns U with `status: 'active'` and `role: 'player'` unchanged

#### Scenario: Update role

- **Given** user U is a `active` `player` in campaign C
- **When** `updateMember(C, U, 'dm', undefined)` is called
- **Then** the member record shows `role: 'dm'`

#### Scenario: Non-existent member is a no-op

- **Given** user U is not a member of campaign C
- **When** `updateMember(C, U, 'player', 'active')` is called
- **Then** no error is thrown and no record is created

### Requirement: ADDED `storage.listMembersForCampaign`

The system SHALL provide `listMembersForCampaign(campaignId: string): Promise<CampaignMember[]>` that returns all membership records for a given campaign.

#### Scenario: Returns all members

- **Given** campaign C has members U1 (dm) and U2 (player)
- **When** `listMembersForCampaign(C)` is called
- **Then** both records are returned with correct fields

#### Scenario: Returns empty array for unknown campaign

- **Given** no members exist for campaign C
- **When** `listMembersForCampaign(C)` is called
- **Then** an empty array is returned

### Requirement: ADDED `storage.listCampaignsForMember`

The system SHALL provide `listCampaignsForMember(userId: string): Promise<CampaignMemberSummary[]>` that returns `{ id, name }` for every campaign the user is a member of, regardless of status or role.

#### Scenario: Returns campaigns for member

- **Given** user U is a member of campaigns C1 (name: "Alpha") and C2 (name: "Beta")
- **When** `listCampaignsForMember(U)` is called
- **Then** returns `[{ id: C1, name: 'Alpha' }, { id: C2, name: 'Beta' }]` (order not specified)

#### Scenario: Returns empty array for non-member

- **Given** user U has no membership records
- **When** `listCampaignsForMember(U)` is called
- **Then** an empty array is returned

### Requirement: ADDED DM membership seeding on campaign creation

The system SHALL automatically create an `active` `dm` membership record for the campaign owner immediately after a campaign is successfully saved, using the authenticated user's `userId` as both `userId` and `invitedBy`.

#### Scenario: Owner seeded as active DM

- **Given** an authenticated user U
- **When** `POST /api/campaigns` succeeds
- **Then** `listMembersForCampaign(newCampaignId)` returns exactly one record: `{ userId: U, role: 'dm', status: 'active' }`

#### Scenario: Campaign rolled back on seed failure

- **Given** `addMember` throws unexpectedly after `saveCampaign` succeeds
- **When** the POST handler catches the error
- **Then** the campaign is deleted and a 500 response is returned (no orphaned campaign without a DM)

## MODIFIED Requirements

### Requirement: MODIFIED Campaign creation route

The system SHALL, after saving a new campaign, also persist a DM membership for the creating user. Failure to persist the membership SHALL result in campaign deletion and a 500 error response.

#### Scenario: Creation still returns 201 with campaign body

- **Given** a valid campaign POST body
- **When** both `saveCampaign` and `addMember` succeed
- **Then** the response is `201` with the campaign JSON (unchanged from current behavior)

## REMOVED Requirements

None.

## Traceability

- Proposal: `CampaignMember` type with role enum → Requirement: ADDED CampaignMember type and role enum
- Proposal: Unique `{campaignId, userId}` index → Requirement: ADDED `campaignMembers` unique compound index
- Proposal: `DuplicateMemberError` → Requirement: ADDED `DuplicateMemberError`
- Proposal: Four storage methods → Requirements: ADDED `addMember`, `updateMember`, `listMembersForCampaign`, `listCampaignsForMember`
- Proposal: DM seeding at route call-site → Requirements: ADDED DM membership seeding, MODIFIED Campaign creation route
- Design Decision 1 (const tuple) → Requirement: ADDED CampaignMember type and role enum
- Design Decision 2 (`lib/errors.ts`) → Requirement: ADDED `DuplicateMemberError`
- Design Decision 3 (route boundary seeding) → Requirement: ADDED DM membership seeding
- Design Decision 4 (`CampaignMemberSummary`) → Requirement: ADDED `listCampaignsForMember`
- Design Decision 5 (named params) → Requirement: ADDED `updateMember`

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: No orphaned campaigns without DM members

- **Given** `saveCampaign` succeeds but `addMember` throws
- **When** the POST route handler catches the error
- **Then** `deleteCampaign` is called with the new campaign's id and a 500 response is returned

### Requirement: Security

#### Scenario: No PII leakage in `listCampaignsForMember`

- **Given** `listCampaignsForMember` is called
- **When** results are returned
- **Then** only `{ id, name }` fields are present — no `userId`, `email`, or other user fields

### Requirement: Performance

#### Scenario: Bounded queries

- **Given** a user with N campaign memberships (N < 1000)
- **When** `listCampaignsForMember` is called
- **Then** exactly two sequential DB queries are issued (no N+1 pattern)
