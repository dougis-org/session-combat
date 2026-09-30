## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Party-campaign link authorization

The system SHALL require that the caller linking, relinking, or unlinking a party to/from a campaign hold active DM membership on that target campaign, enforced inside `partyRepo.addPartyToCampaign` and `partyRepo.reassignPartyCampaign` (not only at the route layer).

#### Scenario: Active DM links a party to their own campaign

- **Given** a caller is an active member with `role: 'dm'` on campaign `camp-1`
- **When** the caller calls `POST /api/parties` with `campaignId: 'camp-1'` and valid `characterIds`
- **Then** the party is created and linked to `camp-1` (HTTP 201), and `partyRepo.addPartyToCampaign` is invoked without throwing

#### Scenario: Non-DM active campaign member is rejected

- **Given** a caller is an active member with `role: 'player'` on campaign `camp-1` (not a DM)
- **When** the caller calls `POST /api/parties` with `campaignId: 'camp-1'` and `characterIds` that pass the existing character-share check
- **Then** the request is rejected with HTTP 403, the party is not created (or, if created before the campaign-link step, is rolled back via the existing compensating `deleteParty`), and no link is written to campaign `camp-1`

#### Scenario: DM of a different campaign is rejected

- **Given** a caller is an active member with `role: 'dm'` on campaign `camp-2` but has no membership row on campaign `camp-1`
- **When** the caller calls `POST /api/parties` (or `PUT /api/parties/[id]`) with `campaignId: 'camp-1'`
- **Then** the request is rejected with HTTP 403 and no link is written to `camp-1`

#### Scenario: Active DM relinks an existing party to a different campaign they also DM

- **Given** an existing party linked to campaign `camp-1`, and the caller is an active DM of both `camp-1` and `camp-2`
- **When** the caller calls `PUT /api/parties/[id]` with `campaignId: 'camp-2'`
- **Then** the party is unlinked from `camp-1` and linked to `camp-2` (HTTP 200)

#### Scenario: Active DM explicitly unlinks a party from their campaign

- **Given** an existing party linked to campaign `camp-1`, and the caller is an active DM of `camp-1`
- **When** the caller calls `PUT /api/parties/[id]` with `campaignId: ''`
- **Then** the party is unlinked from `camp-1` (HTTP 200); `partyRepo.reassignPartyCampaign` authorizes the removal against `camp-1` (the currently-linked campaign) and performs no DM check on any "new" campaign (there is none to link)

#### Scenario: Non-DM cannot unlink a party from a campaign they don't run

- **Given** an existing party linked to campaign `camp-1`, and the caller is either not a member of `camp-1` at all, or is an active member with `role: 'player'` on `camp-1`, or is an active DM of a *different* campaign `camp-2`
- **When** the caller calls `PUT /api/parties/[id]` with `campaignId: ''`
- **Then** the request is rejected with HTTP 403, the party's link to `camp-1` is left unchanged, and `partyRepo.removePartyFromAllCampaigns` is never called

#### Scenario: Direct repository call bypassing the route is still authorized

- **Given** any caller of `partyRepo.addPartyToCampaign(campaignId, partyId, callerId)` where `callerId` is not an active DM of `campaignId`, or any caller of `partyRepo.reassignPartyCampaign(party, campaignId, existingCampaignId, callerId)` where `callerId` is not an active DM of `existingCampaignId`
- **When** the function is invoked directly (not through an HTTP route)
- **Then** it throws `PartyCampaignAuthorizationError` without writing any link and without removing any existing link

### Requirement: ADDED Reject non-string `campaignId`

The system SHALL reject a `campaignId` value that is present (not `undefined`) and not a string, in both `POST /api/parties` and `PUT /api/parties/[id]`, with HTTP 400 — without altering the existing meaning of `campaignId: undefined` (no change) or `campaignId: ''` (explicit unlink).

#### Scenario: Non-string campaignId is rejected

- **Given** a caller sends a request body where `campaignId` is `null`, a number, a boolean, an array, or an object
- **When** `POST /api/parties` or `PUT /api/parties/[id]` processes the body
- **Then** the response is HTTP 400 with a clear validation error, and no party is created/updated and no campaign link is written or removed

#### Scenario: Omitted campaignId means no change (PUT) / no link (POST)

- **Given** a request body that does not include a `campaignId` key at all
- **When** `PUT /api/parties/[id]` processes the body for an existing party linked to `camp-1`
- **Then** the party's existing campaign link to `camp-1` is left unchanged (HTTP 200), and no authorization check against any campaign is performed

#### Scenario: Empty-string campaignId still means explicit unlink

- **Given** a request body with `campaignId: ''`, sent by a caller with active DM membership on the party's currently-linked campaign
- **When** `PUT /api/parties/[id]` processes the body
- **Then** the party is unlinked from its campaign (HTTP 200) — this is unchanged from current behavior

### Requirement: ADDED Reject malformed PUT request body

The system SHALL reject a `PUT /api/parties/[id]` request whose parsed JSON body is not a non-null, non-array object, returning HTTP 400 before any field is destructured or any repository call is made.

#### Scenario: Non-object body is rejected with 400, not 500

- **Given** a `PUT /api/parties/[id]` request whose parsed JSON body is `null`, an array, a string, or a number
- **When** the route handler processes the request
- **Then** the response is HTTP 400 with a clear validation error, and no `console.error`-logged 500 is produced

#### Scenario: Valid object body proceeds normally

- **Given** a `PUT /api/parties/[id]` request whose parsed JSON body is a plain object (e.g. `{ name: 'Updated' }`)
- **When** the route handler processes the request
- **Then** processing proceeds as today (subject to the other requirements in this spec)

## Traceability

- Proposal element: "Linking is gated on active DM membership, enforced at the repository layer" -> Requirement: ADDED Party-campaign link authorization
- Proposal element: "A non-string, present campaignId is rejected with 400" -> Requirement: ADDED Reject non-string `campaignId`
- Proposal element: "PUT's body is validated as a non-null plain object before any field is destructured" -> Requirement: ADDED Reject malformed PUT request body
- Design decision: Decision 1 (repo-level authorization) -> Requirement: ADDED Party-campaign link authorization
- Design decision: Decision 2 (typed error mapped to 403) -> Requirement: ADDED Party-campaign link authorization (rejection scenarios)
- Design decision: Decision 3 (campaignId classification) -> Requirement: ADDED Reject non-string `campaignId`
- Requirement: ADDED Party-campaign link authorization -> Task(s): implement `PartyCampaignAuthorizationError` (Task 1), implement DM check in `addPartyToCampaign` (Task 3) and in `reassignPartyCampaign` for *both* the removal of `existingCampaignId` and the addition of a new campaign (Task 4), update both routes' error handling (Tasks 5-6), add unit tests including the negative unauthorized-unlink case (Task 8)
- Requirement: ADDED Reject non-string `campaignId` -> Task(s): implement `campaignId` classification helper, wire into both routes, add unit tests
- Requirement: ADDED Reject malformed PUT request body -> Task(s): add body-shape guard to `PUT`, add unit tests

## Non-Functional Acceptance Criteria

### Requirement: Security

See functional scenarios: "Non-DM active campaign member is rejected", "DM of a different campaign is rejected", "Direct repository call bypassing the route is still authorized". No additional non-functional security scenario beyond what is already covered functionally.

### Requirement: Reliability

#### Scenario: Malformed input never produces an unhandled 500

- **Given** any of the malformed-input cases in this spec (non-string `campaignId`, non-object `PUT` body)
- **When** the route handler processes the request
- **Then** the response is always a clear, typed 400 — never an uncaught exception surfaced as a generic 500 via the route's catch-all error handler
