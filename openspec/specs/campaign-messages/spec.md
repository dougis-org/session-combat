## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-06-14-issue-314-campaign-messages/design.md) document, not a replacement.

### Requirement: ADDED CampaignMessage type and collection

The system SHALL persist campaign messages in a `campaignMessages` MongoDB collection with a compound index on `{campaignId, createdAt}`.

#### Scenario: Message document shape

- **Given** a valid POST to `/api/campaigns/[id]/messages`
- **When** the message is persisted
- **Then** the stored document contains `id`, `campaignId`, `senderId`, `senderName`, `text`, `visibility.scope`, `createdAt`, and optionally `visibility.toUserId` (for `direct` scope)

#### Scenario: Index exists at startup

- **Given** the application starts with a fresh MongoDB database
- **When** `initializeDatabase()` completes
- **Then** the `campaignMessages` collection has a compound index on `{campaignId: 1, createdAt: 1}`

---

### Requirement: ADDED POST /api/campaigns/[id]/messages — send a message

The system SHALL accept a POST request from an authenticated, active campaign member and persist the message with the specified visibility scope.

#### Scenario: Active member sends a group message

- **Given** an authenticated user who is an active member of campaign `C`
- **When** they POST `{ text: "Hello everyone", visibility: { scope: "group" } }` to `/api/campaigns/C/messages`
- **Then** the response is `201` with the persisted `CampaignMessage` document

#### Scenario: Active member sends a direct message

- **Given** an authenticated user who is an active member of campaign `C`, and user `B` is also an active member
- **When** they POST `{ text: "Whisper", visibility: { scope: "direct", toUserId: "B" } }` to `/api/campaigns/C/messages`
- **Then** the response is `201` with the persisted `CampaignMessage` document

#### Scenario: Active member sends a dm-only message

- **Given** an authenticated user who is an active member of campaign `C`
- **When** they POST `{ text: "DM note", visibility: { scope: "dm-only" } }` to `/api/campaigns/C/messages`
- **Then** the response is `201` with the persisted `CampaignMessage` document

#### Scenario: Non-member cannot send a message

- **Given** an authenticated user who is NOT a member of campaign `C`
- **When** they POST to `/api/campaigns/C/messages`
- **Then** the response is `403 Forbidden`

#### Scenario: Inactive member (invited/removed) cannot send a message

- **Given** an authenticated user whose `status` in campaign `C` is `"invited"` or `"removed"`
- **When** they POST to `/api/campaigns/C/messages`
- **Then** the response is `403 Forbidden`

#### Scenario: Missing required fields returns 400

- **Given** an authenticated active member of campaign `C`
- **When** they POST `{}` (no `text` or `visibility`) to `/api/campaigns/C/messages`
- **Then** the response is `400 Bad Request` with a descriptive error body

#### Scenario: Direct message without toUserId returns 400

- **Given** an authenticated active member of campaign `C`
- **When** they POST `{ text: "Whisper", visibility: { scope: "direct" } }` (missing `toUserId`)
- **Then** the response is `400 Bad Request`

---

### Requirement: ADDED GET /api/campaigns/[id]/messages — paginated visibility-filtered history

The system SHALL return a paginated list of messages the authenticated caller is permitted to see, ordered by `createdAt` descending.

#### Scenario: Active member retrieves group messages

- **Given** an authenticated active member (player) of campaign `C`, and 3 group messages exist
- **When** they GET `/api/campaigns/C/messages`
- **Then** the response is `200` with all 3 messages in descending order

#### Scenario: Player cannot retrieve direct messages not addressed to them

- **Given** player A and player B are both active members of campaign `C`, and a direct message from A to B exists
- **When** player C (a third player) GETs `/api/campaigns/C/messages`
- **Then** the response is `200` but the direct message is NOT included

#### Scenario: Player can retrieve direct messages addressed to them

- **Given** player A sends a direct message to player B in campaign `C`
- **When** player B GETs `/api/campaigns/C/messages`
- **Then** the response includes the direct message

#### Scenario: Player can retrieve their own sent direct messages

- **Given** player A sends a direct message to player B in campaign `C`
- **When** player A GETs `/api/campaigns/C/messages`
- **Then** the response includes their own sent direct message

#### Scenario: Player cannot retrieve dm-only messages

- **Given** player A sends a dm-only message in campaign `C`
- **When** player B (another player, not DM) GETs `/api/campaigns/C/messages`
- **Then** the dm-only message is NOT included in the response

#### Scenario: DM retrieves all messages including dm-only

- **Given** a DM of campaign `C`, and messages of all three scopes exist
- **When** the DM GETs `/api/campaigns/C/messages`
- **Then** the response includes group, direct, and dm-only messages visible to the DM

#### Scenario: Cursor-based pagination — first page

- **Given** 60 messages exist in campaign `C` (all group scope, caller can see all)
- **When** a member GETs `/api/campaigns/C/messages?limit=50`
- **Then** the response contains exactly 50 messages (the 50 most recent) and includes a `nextCursor` field

#### Scenario: Cursor-based pagination — second page

- **Given** 60 messages exist and the first page returned a `nextCursor` value
- **When** a member GETs `/api/campaigns/C/messages?limit=50&before=<nextCursor>`
- **Then** the response contains the remaining 10 messages and no `nextCursor`

#### Scenario: Non-member cannot read history

- **Given** an authenticated user who is NOT a member of campaign `C`
- **When** they GET `/api/campaigns/C/messages`
- **Then** the response is `403 Forbidden`

---

### Requirement: ADDED SSE stream emits message events to eligible subscribers

The system SHALL, on each successful POST, emit a `message` SSE event exclusively to campaign subscribers who are permitted to see the message per the same visibility predicate used by GET.

#### Scenario: Group message reaches all active subscribers

- **Given** player A, player B, and DM are all subscribed to campaign `C`'s SSE stream
- **When** player A POSTs a group message
- **Then** all three subscribers receive a `message` SSE event

#### Scenario: Direct message reaches only sender and recipient

- **Given** player A, player B, and player C are subscribed to campaign `C`'s SSE stream
- **When** player A POSTs a direct message to player B
- **Then** player A and player B each receive a `message` SSE event; player C does NOT

#### Scenario: dm-only message reaches DM and sender only

- **Given** player A (sender) and DM are subscribed; player B is also subscribed
- **When** player A POSTs a dm-only message
- **Then** player A and DM each receive a `message` SSE event; player B does NOT

#### Scenario: Multiple active DMs all receive dm-only

- **Given** DM-1 and DM-2 are both active DMs and subscribed; player A is the sender and also subscribed
- **When** player A POSTs a dm-only message
- **Then** DM-1, DM-2, and player A each receive a `message` SSE event

---

### Requirement: MODIFIED CampaignStreamEvent — message variant added

The `CampaignStreamEvent` union type SHALL include a `message` variant carrying the full `CampaignMessage` payload.

#### Scenario: Stream event shape

- **Given** a message is emitted via `emitFiltered`
- **When** a subscriber receives the SSE event
- **Then** the event has `type: "message"`, `campaignId`, and `data` containing the `CampaignMessage` fields the recipient is authorised to see

---

### Requirement: MODIFIED transport subscribe() — userId parameter

The `subscribe()` function in `lib/server/transport.ts` SHALL accept a `userId` parameter and associate it with the event handler in the registry.

#### Scenario: subscribe registers userId

- **Given** the transport module is imported
- **When** `subscribe(campaignId, userId, handler)` is called
- **Then** the handler is registered under both `campaignId` and `userId` in the registry

#### Scenario: unsubscribe removes userId entry

- **Given** a subscriber is registered
- **When** the returned teardown function is called
- **Then** the `userId` entry is removed from the registry; if no other subscribers remain for the campaign, the campaign entry is also removed

## REMOVED Requirements

_None._

## Traceability

- Proposal: "Server-side SSE filtering required" → Requirement: MODIFIED transport subscribe() + SSE stream emits message events
- Proposal: "Visibility identical in SSE and GET" → Design Decision 3 (canSeeMessage) → Scenarios: "Player cannot retrieve direct messages not addressed to them" + "Direct message reaches only sender and recipient"
- Proposal: "dm-only reaches all active DMs" → Design Decision 5 → Scenarios: "Multiple active DMs all receive dm-only" + "DM retrieves all messages including dm-only"
- Proposal: "Cursor pagination" → Design Decision 4 → Scenarios: "Cursor-based pagination — first page/second page"
- Design Decision 1 (userId registry) → Requirement: MODIFIED transport subscribe()
- Design Decision 2 (explicit emit) → Requirement: SSE stream emits message events
- Design Decision 3 (canSeeMessage) → All visibility filtering scenarios
- Requirement: POST send → Tasks: T1 (types), T3 (index), T5 (POST handler)
- Requirement: GET history → Tasks: T1 (types), T4 (canSeeMessage), T6 (GET handler)
- Requirement: SSE emit → Tasks: T2 (transport upgrade), T5 (emitFiltered call)

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: History GET latency with large dataset

- **Given** a campaign with 1,000 messages and the `{campaignId, createdAt}` compound index in place
- **When** an active member GETs `/api/campaigns/C/messages?limit=50`
- **Then** the response is returned in under 200ms on the development database

### Requirement: Security

> Access-control rejections are fully specified by functional scenarios:
> - "Non-member cannot send a message"
> - "Inactive member cannot send a message"
> - "Player cannot retrieve direct messages not addressed to them"
> - "Player cannot retrieve dm-only messages"
> - "Direct message reaches only sender and recipient"
> - "dm-only message reaches DM and sender only"
> - "Non-member cannot read history"

#### Scenario: Message body not leaked in 403 response

- **Given** an unauthenticated or non-member caller
- **When** they POST or GET `/api/campaigns/C/messages`
- **Then** the `403` response body contains no message content — only a generic error message

### Requirement: Reliability

#### Scenario: Message retrievable via GET even if SSE push did not fire

- **Given** the SSE emit call fails or no subscribers are connected at send time
- **When** a recipient later GETs `/api/campaigns/C/messages`
- **Then** the message appears in the history response (it was persisted before emit was attempted)
