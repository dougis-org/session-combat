## MODIFIED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

---

### Requirement: MODIFIED `User.username` — now required

The system SHALL define `User.username` as `string` (not `string | undefined`).

#### Scenario: User construction requires username

- **Given** `lib/types.ts` exports `User`
- **When** a `User` object is constructed without a `username` field
- **Then** TypeScript compilation fails with a type error

---

## ADDED Requirements

### Requirement: ADDED `PublicUser` interface

The system SHALL export `PublicUser` with fields `id: string` and `username: string`.

#### Scenario: PublicUser shape is correct

- **Given** a `PublicUser` object
- **When** both `id` and `username` are present as strings
- **Then** TypeScript accepts the value without error

---

### Requirement: ADDED `storage.getUserById`

The system SHALL return a `PublicUser` (id + username only) for a valid userId, or `null` if not found.

#### Scenario: Found user returns PublicUser

- **Given** a user document exists in the `users` collection with a `username`
- **When** `storage.getUserById(userId)` is called with that user's id
- **Then** the result is `{ id: userId, username: <username> }`

#### Scenario: Unknown userId returns null

- **Given** no user document exists for the given userId
- **When** `storage.getUserById(userId)` is called
- **Then** the result is `null`

#### Scenario: Invalid ObjectId throws

- **Given** a non-ObjectId string is passed
- **When** `storage.getUserById("not-an-id")` is called
- **Then** an `InvalidUserIdError` (or equivalent) is thrown

---

### Requirement: ADDED `storage.getUsersByIds`

The system SHALL return a `Record<string, string>` mapping userId → username for a batch of userIds. UserIds with no matching document are omitted from the result.

#### Scenario: All users found

- **Given** three user documents exist for three userIds
- **When** `storage.getUsersByIds([id1, id2, id3])` is called
- **Then** the result is `{ [id1]: username1, [id2]: username2, [id3]: username3 }`

#### Scenario: Some users missing

- **Given** only two of three userIds have matching documents
- **When** `storage.getUsersByIds([id1, id2, id3])` is called
- **Then** the result contains only the two found users; the missing id is not present

#### Scenario: Empty array input

- **Given** an empty array is passed
- **When** `storage.getUsersByIds([])` is called
- **Then** the result is `{}`

---

### Requirement: ADDED `storage.listInvitationsForUser`

The system SHALL return all `CampaignMember` documents for a given userId where `status` is `"invited"`.

#### Scenario: Returns pending invitations

- **Given** a user has two `CampaignMember` documents with `status: "invited"` and one with `status: "active"`
- **When** `storage.listInvitationsForUser(userId)` is called
- **Then** only the two `"invited"` documents are returned

#### Scenario: Returns empty array when no invitations

- **Given** a user has no `CampaignMember` documents with `status: "invited"`
- **When** `storage.listInvitationsForUser(userId)` is called
- **Then** the result is `[]`

---

### Requirement: ADDED `PATCH /api/campaigns/[id]/members/me` — accept invitation

The system SHALL transition a `CampaignMember` from `"invited"` to `"active"` and append a history entry when the invited user sends `{ "action": "accept" }`.

#### Scenario: Successful accept

- **Given** an authenticated user with `status: "invited"` in campaign `[id]`
- **When** they PATCH `{ "action": "accept" }`
- **Then** the response is `200` with body `{ "status": "active" }`, and `updateMemberStatus` is called with `"active"`

---

### Requirement: ADDED `PATCH /api/campaigns/[id]/members/me` — decline invitation

The system SHALL transition a `CampaignMember` from `"invited"` to `"declined"` and append a history entry when the invited user sends `{ "action": "decline" }`.

#### Scenario: Successful decline

- **Given** an authenticated user with `status: "invited"` in campaign `[id]`
- **When** they PATCH `{ "action": "decline" }`
- **Then** the response is `200` with body `{ "status": "declined" }`, and `updateMemberStatus` is called with `"declined"`

---

### Requirement: ADDED `PATCH /api/campaigns/[id]/members/me` — idempotent repeat

The system SHALL return `200` with the current status and NOT call `updateMemberStatus` when the requested action matches the member's current status.

#### Scenario: Accept when already active (idempotent)

- **Given** an authenticated user with `status: "active"` in campaign `[id]`
- **When** they PATCH `{ "action": "accept" }`
- **Then** the response is `200` with body `{ "status": "active" }` and no DB write occurs

#### Scenario: Decline when already declined (idempotent)

- **Given** an authenticated user with `status: "declined"` in campaign `[id]`
- **When** they PATCH `{ "action": "decline" }`
- **Then** the response is `200` with body `{ "status": "declined" }` and no DB write occurs

---

### Requirement: ADDED `PATCH /api/campaigns/[id]/members/me` — conflict on mismatched action

The system SHALL return `409 Conflict` with a descriptive error message when the requested action conflicts with the member's current resolved status.

#### Scenario: Decline when already accepted

- **Given** an authenticated user with `status: "active"` in campaign `[id]`
- **When** they PATCH `{ "action": "decline" }`
- **Then** the response is `409` with body `{ "error": "You have already accepted this invitation" }`

#### Scenario: Accept when already declined

- **Given** an authenticated user with `status: "declined"` in campaign `[id]`
- **When** they PATCH `{ "action": "accept" }`
- **Then** the response is `409` with body `{ "error": "You have already declined this invitation" }`

---

### Requirement: ADDED `PATCH /api/campaigns/[id]/members/me` — not found

The system SHALL return `404` when the caller has no membership or has `status: "removed"` in the campaign.

#### Scenario: No membership

- **Given** an authenticated user with no `CampaignMember` document for campaign `[id]`
- **When** they PATCH `{ "action": "accept" }`
- **Then** the response is `404` with body `{ "error": "No invitation found" }`

#### Scenario: Removed member

- **Given** an authenticated user with `status: "removed"` in campaign `[id]`
- **When** they PATCH `{ "action": "accept" }`
- **Then** the response is `404` with body `{ "error": "No invitation found" }`

---

### Requirement: ADDED `PATCH /api/campaigns/[id]/members/me` — input validation

The system SHALL return `400` when the request body is missing or contains an invalid `action` value.

#### Scenario: Missing action field

- **Given** an authenticated invited user
- **When** they PATCH `{}` or an empty body
- **Then** the response is `400` with body `{ "error": "action must be \"accept\" or \"decline\"" }`

#### Scenario: Invalid action value

- **Given** an authenticated invited user
- **When** they PATCH `{ "action": "maybe" }`
- **Then** the response is `400` with body `{ "error": "action must be \"accept\" or \"decline\"" }`

---

### Requirement: ADDED `GET /api/me/invitations` — list pending invitations

The system SHALL return all pending (`"invited"`) campaign invitations for the authenticated caller, each including campaign name, inviter username, and invitation date.

#### Scenario: Returns pending invitations

- **Given** an authenticated user with two pending campaign invitations
- **When** they GET `/api/me/invitations`
- **Then** the response is `200` with body:
  ```json
  {
    "invitations": [
      {
        "id": "<memberId>",
        "campaignId": "<campaignId>",
        "campaignName": "<name>",
        "invitedBy": "<inviterUsername>",
        "invitedAt": "<ISO date string>"
      }
    ]
  }
  ```

#### Scenario: Returns empty array when no invitations

- **Given** an authenticated user with no pending invitations
- **When** they GET `/api/me/invitations`
- **Then** the response is `200` with body `{ "invitations": [] }`

#### Scenario: invitedBy and invitedAt use the last "invited" history entry

- **Given** a member who was invited, declined, and re-invited (two `"invited"` history entries)
- **When** they GET `/api/me/invitations`
- **Then** `invitedBy` and `invitedAt` reflect the most recent invitation (last `action: "invited"` entry)

#### Scenario: Missing inviter username falls back gracefully

- **Given** an invitation where the inviter's user document has been deleted
- **When** they GET `/api/me/invitations`
- **Then** the invitation is still returned with `invitedBy: "Unknown user"`

---

## REMOVED Requirements

None.

---

## Traceability

- Proposal element: `User.username` required → Requirement: MODIFIED `User.username`
- Proposal element: `PublicUser` interface → Requirement: ADDED `PublicUser`
- Proposal element: `storage.getUserById` → Requirement: ADDED `storage.getUserById`; Design Decision 4
- Proposal element: `storage.getUsersByIds` → Requirement: ADDED `storage.getUsersByIds`; Design Decision 3
- Proposal element: `storage.listInvitationsForUser` → Requirement: ADDED `storage.listInvitationsForUser`
- Proposal element: PATCH respond endpoint → Requirements: ADDED PATCH (accept, decline, idempotent, conflict, not-found, input validation); Design Decisions 1, 2
- Proposal element: GET invitations endpoint → Requirement: ADDED GET invitations; Design Decisions 3, 5
- Design Decision 5 (last history entry) → Requirement: GET invitations — re-invite scenario
- All PATCH requirements → Task: Add PATCH `/api/campaigns/[id]/members/me` route
- All GET requirements → Task: Add GET `/api/me/invitations` route
- All storage requirements → Task: Add storage methods + type changes

---

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: Unauthenticated PATCH rejected

- **Given** no authentication token
- **When** a PATCH is made to `/api/campaigns/[id]/members/me`
- **Then** the response is `401 Unauthorized`

#### Scenario: Unauthenticated GET rejected

- **Given** no authentication token
- **When** a GET is made to `/api/me/invitations`
- **Then** the response is `401 Unauthorized`

### Requirement: Reliability

#### Scenario: Storage error on PATCH surfaces as 500

- **Given** an authenticated invited user
- **When** `storage.getMember` throws an unexpected error
- **Then** the response is `500`; no internal error details are in the response body; the error is logged server-side

#### Scenario: Storage error on GET surfaces as 500

- **Given** an authenticated user
- **When** `storage.listInvitationsForUser` throws an unexpected error
- **Then** the response is `500`; no internal error details are in the response body

### Requirement: Performance

#### Scenario: Invitations list uses batch user lookup

- **Given** an authenticated user with N pending invitations
- **When** they GET `/api/me/invitations`
- **Then** exactly one `getUsersByIds` call is made (not N individual user lookups)
