## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED `getMember` storage method

The system SHALL provide `storage.getMember(campaignId, userId)` returning the matching `CampaignMember` or `null`.

#### Scenario: Member exists

- **Given** a `campaignMembers` document exists with matching `campaignId` and `userId`
- **When** `getMember(campaignId, userId)` is called
- **Then** the normalized `CampaignMember` is returned with `_id` stripped

#### Scenario: Member does not exist

- **Given** no `campaignMembers` document matches the given `campaignId` and `userId`
- **When** `getMember(campaignId, userId)` is called
- **Then** `null` is returned

---

### Requirement: ADDED `loadCampaignByIdAny` storage method

The system SHALL provide `storage.loadCampaignByIdAny(id)` returning the campaign with that `id`, regardless of `userId`.

#### Scenario: Campaign exists

- **Given** a `campaigns` document exists with the given `id`
- **When** `loadCampaignByIdAny(id)` is called
- **Then** the normalized `Campaign` is returned

#### Scenario: Campaign does not exist

- **Given** no `campaigns` document matches the given `id`
- **When** `loadCampaignByIdAny(id)` is called
- **Then** `null` is returned

---

### Requirement: ADDED `assertCampaignAccess` utility

The system SHALL provide `assertCampaignAccess(campaignId, userId)` in `lib/utils/campaign.ts` that returns `{ campaign: Campaign; role: MemberRole }` for active members, or a `NextResponse` 404 for all denied cases.

#### Scenario: Active member gains access

- **Given** a `campaignMembers` record exists with `status: 'active'` for the given `campaignId` and `userId`
- **And** the campaign document exists
- **When** `assertCampaignAccess(campaignId, userId)` is called
- **Then** `{ campaign, role }` is returned where `role` matches the member's role

#### Scenario: Non-member is denied

- **Given** no `campaignMembers` record exists for the given `campaignId` and `userId`
- **When** `assertCampaignAccess(campaignId, userId)` is called
- **Then** a `NextResponse` with status 404 and body `{ error: 'Campaign not found' }` is returned

#### Scenario: Pending member is denied

- **Given** a `campaignMembers` record exists with `status: 'pending'`
- **When** `assertCampaignAccess(campaignId, userId)` is called
- **Then** a `NextResponse` with status 404 and body `{ error: 'Campaign not found' }` is returned

#### Scenario: Declined member is denied

- **Given** a `campaignMembers` record exists with `status: 'declined'`
- **When** `assertCampaignAccess(campaignId, userId)` is called
- **Then** a `NextResponse` with status 404 and body `{ error: 'Campaign not found' }` is returned

#### Scenario: Member record exists but campaign document is missing

- **Given** an active `campaignMembers` record exists but no matching campaign document
- **When** `assertCampaignAccess(campaignId, userId)` is called
- **Then** a `NextResponse` with status 404 and body `{ error: 'Campaign not found' }` is returned

---

### Requirement: ADDED `GET /api/campaigns/[id]` accessible to active members

The system SHALL allow any active campaign member (DM or player) to GET a campaign.

#### Scenario: Player member GET succeeds

- **Given** a user is an active `player` member of a campaign
- **When** `GET /api/campaigns/[id]` is called
- **Then** HTTP 200 is returned with the campaign JSON body

#### Scenario: DM member GET succeeds (existing owner behavior unchanged)

- **Given** a user is an active `dm` member of a campaign (the owner)
- **When** `GET /api/campaigns/[id]` is called
- **Then** HTTP 200 is returned with the campaign JSON body

#### Scenario: Non-member GET is denied

- **Given** a user has no membership record for the campaign
- **When** `GET /api/campaigns/[id]` is called
- **Then** HTTP 404 is returned with body `{ error: 'Campaign not found' }`

---

### Requirement: ADDED `GET /api/campaigns/[id]/sessions` accessible to active members

The system SHALL allow any active campaign member to GET session logs.

#### Scenario: Player sessions GET

- **Given** a user is an active `player` member of a campaign
- **When** `GET /api/campaigns/[id]/sessions` is called
- **Then** HTTP 200 is returned with the session log array

#### Scenario: Non-member sessions GET is denied

- **Given** a user has no membership record for the campaign
- **When** `GET /api/campaigns/[id]/sessions` is called
- **Then** HTTP 404 is returned with body `{ error: 'Campaign not found' }`

---

### Requirement: ADDED `GET /api/campaigns/[id]/combat-events` accessible to active members

The system SHALL allow any active campaign member to GET combat events. The underlying query filters by `auth.userId` so each member sees only their own events.

#### Scenario: Player combat events GET

- **Given** a user is an active `player` member of a campaign
- **When** `GET /api/campaigns/[id]/combat-events` is called
- **Then** HTTP 200 is returned with events filtered to that user's own combat states

#### Scenario: Non-member combat events GET is denied

- **Given** a user has no membership record for the campaign
- **When** `GET /api/campaigns/[id]/combat-events` is called
- **Then** HTTP 404 is returned with body `{ error: 'Campaign not found' }`

## MODIFIED Requirements

### Requirement: MODIFIED Campaign write routes are DM-only

The system SHALL restrict PATCH, DELETE on `/api/campaigns/[id]`, POST and sub-resource PATCH on `/api/campaigns/[id]/sessions/**` to members with `role: 'dm'`. Non-DM members (including active players) SHALL receive 404.

#### Scenario: DM PATCH succeeds

- **Given** a user is an active `dm` member of a campaign
- **When** `PATCH /api/campaigns/[id]` is called with valid body
- **Then** HTTP 200 is returned with the updated campaign

#### Scenario: Player PATCH is denied

- **Given** a user is an active `player` member of a campaign
- **When** `PATCH /api/campaigns/[id]` is called
- **Then** HTTP 404 is returned with body `{ error: 'Campaign not found' }`

#### Scenario: DM DELETE succeeds

- **Given** a user is an active `dm` member of a campaign
- **When** `DELETE /api/campaigns/[id]` is called
- **Then** HTTP 200 is returned

#### Scenario: Player DELETE is denied

- **Given** a user is an active `player` member of a campaign
- **When** `DELETE /api/campaigns/[id]` is called
- **Then** HTTP 404 is returned with body `{ error: 'Campaign not found' }`

#### Scenario: DM POST session succeeds

- **Given** a user is an active `dm` member of a campaign
- **When** `POST /api/campaigns/[id]/sessions` is called with valid body
- **Then** HTTP 201 is returned with the new session log

#### Scenario: Player POST session is denied

- **Given** a user is an active `player` member of a campaign
- **When** `POST /api/campaigns/[id]/sessions` is called
- **Then** HTTP 404 is returned with body `{ error: 'Campaign not found' }`

#### Scenario: DM PATCH session log succeeds

- **Given** a user is an active `dm` member of a campaign
- **When** `PATCH /api/campaigns/[id]/sessions/[sessionId]` is called with valid body
- **Then** HTTP 200 is returned with the updated session log (or 404 if sessionId not found)

#### Scenario: Player PATCH session log is denied

- **Given** a user is an active `player` member of a campaign
- **When** `PATCH /api/campaigns/[id]/sessions/[sessionId]` is called
- **Then** HTTP 404 is returned with body `{ error: 'Campaign not found' }`

## REMOVED Requirements

### Requirement: REMOVED `findCampaign` owner-only helper

Reason for removal: `findCampaign(id, userId)` in `app/api/campaigns/[id]/route.ts` is superseded by `assertCampaignAccess`. It is removed and replaced — not exported, so no external consumers exist.

## Traceability

- Proposal element: Player blocked by `{ id, userId }` query → Requirement: ADDED `loadCampaignByIdAny`, ADDED `assertCampaignAccess`
- Proposal element: Non-members get 404 → Requirement: ADDED `assertCampaignAccess` (denial scenarios), MODIFIED write routes (player denial scenarios)
- Proposal element: Writes DM-only → Requirement: MODIFIED Campaign write routes are DM-only
- Proposal element: Single access gate → Requirement: ADDED `assertCampaignAccess`
- Design Decision 1 (membership as sole gate) → ADDED `assertCampaignAccess`, ADDED `getMember`
- Design Decision 2 (return type) → ADDED `assertCampaignAccess` (return shape scenarios)
- Design Decision 3 (404 on denial) → all denial scenarios
- Design Decision 4 (new storage methods) → ADDED `getMember`, ADDED `loadCampaignByIdAny`
- Design Decision 5 (unified write pattern) → MODIFIED Campaign write routes
- Requirements → Tasks: all added/modified requirements map to tasks in `tasks.md`

## Non-Functional Acceptance Criteria

### Requirement: Security

All denial responses use HTTP 404 with body `{ error: 'Campaign not found' }` — never 403 and never a body that reveals campaign existence. This invariant is enforced by `assertCampaignAccess` and is covered by the denial scenarios in the functional requirements above (non-member denial, pending/declined member denial, player write denial).

### Requirement: Reliability

Orphaned membership records (member record exists but campaign document is missing) are handled gracefully. See the "Member record exists but campaign document is missing" scenario under the `assertCampaignAccess` functional requirement above.
