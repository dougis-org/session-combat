## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED `MemberStatus` values `"invited"` and `"removed"`

The system SHALL define `MemberStatus` as `"active" | "invited" | "declined" | "removed"`.

#### Scenario: All status values are valid TypeScript

- **Given** `lib/types.ts` exports `MemberStatus`
- **When** a variable is assigned each of `"active"`, `"invited"`, `"declined"`, `"removed"`
- **Then** TypeScript compilation succeeds with no type errors

---

### Requirement: ADDED `MemberHistoryEntry` interface

The system SHALL export `MemberHistoryEntry` with fields `action: MemberStatus`, `by: string`, `at: Date`.

#### Scenario: History entry shape is correct

- **Given** a `MemberHistoryEntry` object
- **When** all three fields are present with correct types
- **Then** TypeScript accepts the value without error

---

### Requirement: MODIFIED `CampaignMember` — history replaces flat fields

The system SHALL store membership transitions in `history: MemberHistoryEntry[]` and SHALL NOT include `invitedBy`, `invitedAt`, or `respondedAt` as top-level fields.

#### Scenario: DM owner seed populates history

- **Given** a new campaign is created
- **When** `storage.addMember` is called for the DM owner
- **Then** the stored document has `status: "active"` and `history` containing one entry `{ action: "active", by: <dmUserId>, at: <Date> }`, with no `invitedBy`, `invitedAt`, or `respondedAt` fields

---

### Requirement: ADDED `storage.updateMemberStatus`

The system SHALL atomically update `status` and append a `MemberHistoryEntry` to `history` in a single `updateOne` call when `updateMemberStatus(campaignId, userId, status, actorId)` is invoked.

#### Scenario: Status and history updated atomically

- **Given** a `CampaignMember` document exists with `status: "declined"`
- **When** `updateMemberStatus(campaignId, userId, "invited", dmId)` is called
- **Then** the document's `status` field is `"invited"` and `history` has a new tail entry `{ action: "invited", by: dmId, at: <Date> }`, and the previous history entries are preserved

#### Scenario: No-op if member not found

- **Given** no `CampaignMember` exists for the given `campaignId` / `userId` pair
- **When** `updateMemberStatus` is called
- **Then** the call completes without error and no document is modified

---

### Requirement: ADDED `POST /api/campaigns/[id]/members` — successful invite

The system SHALL create a new `CampaignMember` with `status: "invited"` and a single history entry when a DM invites a valid, uninvited user.

#### Scenario: Successful new invite

- **Given** an authenticated user who is an `active` DM of campaign `[id]`
- **When** they POST `{ userId: "<targetId>" }` where `targetId` ≠ callerId and target has no existing membership
- **Then** the response is `201` with body `{ id: "<memberId>", status: "invited" }`, and a `CampaignMember` is persisted with `status: "invited"` and `history: [{ action: "invited", by: <callerId>, at: <Date> }]`

---

### Requirement: ADDED `POST /api/campaigns/[id]/members` — re-invite (upsert)

The system SHALL reset a `declined` or `removed` member back to `invited` status (appending a new history entry) when a DM re-invites them.

#### Scenario: Re-invite a declined member

- **Given** an authenticated DM and an existing member with `status: "declined"`
- **When** the DM POSTs `{ userId: "<targetId>" }`
- **Then** the response is `201` with `{ id, status: "invited" }`, and the member document's `status` is `"invited"` with a new history entry appended

#### Scenario: Re-invite a removed member

- **Given** an authenticated DM and an existing member with `status: "removed"`
- **When** the DM POSTs `{ userId: "<targetId>" }`
- **Then** the response is `201` with `{ id, status: "invited" }`, and the member document's `status` is `"invited"` with a new history entry appended

---

### Requirement: ADDED `POST /api/campaigns/[id]/members` — guard: non-DM rejected

The system SHALL reject invite attempts by users who are not an `active` DM of the campaign.

#### Scenario: Caller is not a member of the campaign

- **Given** an authenticated user with no membership in campaign `[id]`
- **When** they POST `{ userId: "<targetId>" }`
- **Then** the response is `403 Forbidden`

#### Scenario: Caller is a player (not DM)

- **Given** an authenticated user who is an `active` member with `role: "player"`
- **When** they POST `{ userId: "<targetId>" }`
- **Then** the response is `403 Forbidden`

#### Scenario: Unauthenticated request

- **Given** no authentication token
- **When** a POST is made to the endpoint
- **Then** the response is `401 Unauthorized`

---

### Requirement: ADDED `POST /api/campaigns/[id]/members` — guard: self-invite rejected

The system SHALL reject requests where the `userId` in the body matches the authenticated caller's userId.

#### Scenario: Self-invite rejected

- **Given** an authenticated DM
- **When** they POST `{ userId: "<their own userId>" }`
- **Then** the response is `400 Bad Request`

---

### Requirement: ADDED `POST /api/campaigns/[id]/members` — guard: duplicate rejected

The system SHALL reject invite attempts targeting a user who already has `active` or `invited` membership.

#### Scenario: Already-active member rejected

- **Given** an authenticated DM and a target user with `status: "active"` in the campaign
- **When** the DM POSTs `{ userId: "<targetId>" }`
- **Then** the response is `409 Conflict`

#### Scenario: Already-invited member rejected

- **Given** an authenticated DM and a target user with `status: "invited"` in the campaign
- **When** the DM POSTs `{ userId: "<targetId>" }`
- **Then** the response is `409 Conflict`

---

### Requirement: ADDED `POST /api/campaigns/[id]/members` — guard: missing body field

The system SHALL reject requests with a missing or non-string `userId` field.

#### Scenario: Missing userId

- **Given** an authenticated DM
- **When** they POST `{}` or an empty body
- **Then** the response is `400 Bad Request`

---

## MODIFIED Requirements

### Requirement: MODIFIED `storage.addMember` — callers pass `history`

The system SHALL require all `addMember` callers to supply a populated `history: MemberHistoryEntry[]` array. The `invitedBy`, `invitedAt`, and `respondedAt` fields SHALL NOT be passed.

#### Scenario: Campaign creation seeds DM with history

- **Given** the campaign creation handler at `app/api/campaigns/route.ts`
- **When** a new campaign is created
- **Then** `addMember` is called with `history: [{ action: "active", by: <userId>, at: <Date> }]` and no `invitedBy` / `invitedAt` fields

---

## REMOVED Requirements

### Requirement: REMOVED `storage.updateMember`

Reason for removal: Replaced by `storage.updateMemberStatus` which atomically updates both `status` and `history`. The old method had no application call sites.

### Requirement: REMOVED `CampaignMember.invitedBy`, `.invitedAt`, `.respondedAt`

Reason for removal: Superseded by `history: MemberHistoryEntry[]`. These fields could not represent re-invite cycles.

### Requirement: REMOVED `MemberStatus` value `"pending"`

Reason for removal: Renamed to `"invited"` to match phase documentation. No existing data.

---

## Traceability

- Proposal element: `MemberStatus` change → Requirement: ADDED `MemberStatus` values
- Proposal element: `MemberHistoryEntry` interface → Requirement: ADDED `MemberHistoryEntry`
- Proposal element: `CampaignMember` schema change → Requirement: MODIFIED `CampaignMember`
- Proposal element: Replace `updateMember` → Requirements: ADDED `updateMemberStatus`, REMOVED `updateMember`
- Proposal element: Update DM owner seed → Requirement: MODIFIED `storage.addMember` callers
- Proposal element: New route POST `/api/campaigns/[id]/members` → Requirements: ADDED POST route (all scenarios)
- Design Decision 1 → Requirement: ADDED `MemberStatus` values
- Design Decision 2 → Requirement: MODIFIED `CampaignMember`
- Design Decision 3 → Requirement: ADDED `MemberHistoryEntry`
- Design Decision 4 → Requirements: ADDED `updateMemberStatus`, REMOVED `updateMember`
- Design Decision 5 → Requirements: ADDED POST route (upsert scenarios)
- Design Decision 6 → Requirement: ADDED POST route (response shape)
- All ADDED POST route requirements → Task: Add POST `/api/campaigns/[id]/members` route
- ADDED/MODIFIED storage requirements → Task: Update types and storage layer

---

## Non-Functional Acceptance Criteria

### Requirement: Security

Access control scenarios (unauthenticated → 401, non-DM → 403) are specified in the functional requirements:
- See: *ADDED `POST /api/campaigns/[id]/members` — guard: non-DM rejected* (covers both unauthenticated and non-DM callers)

### Requirement: Reliability

#### Scenario: Concurrent duplicate invite race

- **Given** two simultaneous invite requests for the same `(campaignId, userId)` pair, neither member existing yet
- **When** both reach `addMember` after `getMember` returned null
- **Then** one succeeds with `201`; the other receives a `DuplicateMemberError` which the route maps to `409`; no data corruption occurs

### Requirement: Operability

#### Scenario: Storage error surfaces as 500

- **Given** an authenticated DM with a valid request
- **When** the storage layer throws an unexpected error
- **Then** the response is `500`; the error is logged server-side; no internal details are leaked in the response body
