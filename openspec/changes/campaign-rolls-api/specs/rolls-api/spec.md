## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED `CampaignRoll` type and `RollVisibility` union

The system SHALL define `RollVisibility` as `{ scope: 'group' } | { scope: 'dm-only' }` and `CampaignRoll` as a typed interface in `lib/types.ts`. The `CampaignStreamEvent` union SHALL include a `roll` variant `{ type: 'roll'; campaignId: string; data: CampaignRoll }`.

#### Scenario: Types compile without errors

- **Given** `RollVisibility`, `CampaignRoll`, and the updated `CampaignStreamEvent` are added to `lib/types.ts`
- **When** `npm run build` is executed
- **Then** TypeScript compilation succeeds with no errors

### Requirement: ADDED `canSeeRoll()` pure function

The system SHALL expose `canSeeRoll(roll: CampaignRoll, userId: string, members: CampaignMember[]): boolean` in `lib/utils/campaignRolls.ts`.

#### Scenario: DM can see `dm-only` roll

- **Given** a `dm-only` roll posted by any member
- **When** `canSeeRoll()` is called with the DM's userId
- **Then** it returns `true`

#### Scenario: Player cannot see another player's `dm-only` roll

- **Given** a `dm-only` roll posted by player A
- **When** `canSeeRoll()` is called with player B's userId (role: player)
- **Then** it returns `false`

#### Scenario: Roller can always see their own `dm-only` roll

- **Given** a `dm-only` roll posted by player A
- **When** `canSeeRoll()` is called with player A's userId
- **Then** it returns `true`

#### Scenario: Anyone active can see a `group` roll

- **Given** a `group` roll posted by any member
- **When** `canSeeRoll()` is called with any active member's userId
- **Then** it returns `true`

### Requirement: ADDED `POST /api/campaigns/[id]/rolls` — record a roll

The system SHALL accept a roll payload, validate it, stamp the active session, persist to `campaignRolls`, and emit a filtered SSE event.

#### Scenario: DM posts a valid `group` roll

- **Given** an authenticated DM with an active campaign session
- **When** `POST /api/campaigns/[id]/rolls` with `{ formula: "1d20", rolls: [15], total: 15, visibility: { scope: "group" } }`
- **Then** the response is `201` with the full `CampaignRoll` object including `sessionId` matching `campaign.activeSessionId`

#### Scenario: Player posts a valid `dm-only` roll

- **Given** an authenticated player who is an active campaign member, with an active session
- **When** `POST /api/campaigns/[id]/rolls` with `{ formula: "2d6+3", rolls: [4, 2], total: 9, label: "Stealth", visibility: { scope: "dm-only" } }`
- **Then** the response is `201` with the full `CampaignRoll` object

#### Scenario: POST with no active session returns 409

- **Given** an authenticated active member and a campaign with no `activeSessionId`
- **When** `POST /api/campaigns/[id]/rolls` with a valid payload
- **Then** the response is `409` with `{ error: 'No active session' }`

#### Scenario: POST with missing `formula` returns 400

- **Given** an authenticated active member with an active session
- **When** `POST /api/campaigns/[id]/rolls` with `formula` omitted
- **Then** the response is `400`

#### Scenario: POST with missing `rolls` returns 400

- **Given** an authenticated active member with an active session
- **When** `POST /api/campaigns/[id]/rolls` with `rolls` omitted or not an array
- **Then** the response is `400`

#### Scenario: POST with missing `total` returns 400

- **Given** an authenticated active member with an active session
- **When** `POST /api/campaigns/[id]/rolls` with `total` omitted or not a number
- **Then** the response is `400`

#### Scenario: POST with invalid `visibility.scope` returns 400

- **Given** an authenticated active member with an active session
- **When** `POST /api/campaigns/[id]/rolls` with `visibility: { scope: "direct" }`
- **Then** the response is `400`

#### Scenario: POST by inactive member returns 403

- **Given** an authenticated user who is a campaign member with `status: 'pending'`
- **When** `POST /api/campaigns/[id]/rolls` with a valid payload
- **Then** the response is `403`

#### Scenario: POST emits SSE event to correct subscribers

- **Given** a `dm-only` roll is successfully persisted
- **When** `emitFiltered()` is called
- **Then** it is called with a `{ type: 'roll' }` event and a predicate equivalent to `canSeeRoll()` for each subscriber

### Requirement: ADDED `GET /api/campaigns/[id]/rolls?sessionId=<id>` — list rolls for a session

The system SHALL return rolls for a given session, filtered by the caller's visibility, with cursor pagination.

#### Scenario: DM retrieves all rolls for a session

- **Given** an authenticated DM and a session containing `group` and `dm-only` rolls
- **When** `GET /api/campaigns/[id]/rolls?sessionId=<sessionId>`
- **Then** the response is `200` with all rolls (both `group` and `dm-only`) in descending `createdAt` order

#### Scenario: Player retrieves only visible rolls for a session

- **Given** an authenticated player and a session containing a `group` roll and a `dm-only` roll posted by a different player
- **When** `GET /api/campaigns/[id]/rolls?sessionId=<sessionId>`
- **Then** the response is `200` with only the `group` roll (the `dm-only` roll is excluded)

#### Scenario: Player can see their own `dm-only` roll in GET

- **Given** an authenticated player who posted a `dm-only` roll
- **When** `GET /api/campaigns/[id]/rolls?sessionId=<sessionId>`
- **Then** the response includes that player's own `dm-only` roll

#### Scenario: GET without `sessionId` param returns 400

- **Given** an authenticated active member
- **When** `GET /api/campaigns/[id]/rolls` with no `sessionId` query param
- **Then** the response is `400` with an error message

#### Scenario: GET returns empty list for session with no rolls

- **Given** an authenticated active member and a valid `sessionId` with no rolls recorded
- **When** `GET /api/campaigns/[id]/rolls?sessionId=<sessionId>`
- **Then** the response is `200` with `{ rolls: [] }`

#### Scenario: GET cursor pagination

- **Given** a session with more rolls than the page limit
- **When** `GET /api/campaigns/[id]/rolls?sessionId=<sessionId>&limit=2`
- **Then** the response includes `nextCursor` and exactly 2 rolls; a subsequent request with `before=<nextCursor>` returns the next page

#### Scenario: Rolls do not bleed across sessions

- **Given** two sessions, each with rolls
- **When** `GET /api/campaigns/[id]/rolls?sessionId=<session1Id>`
- **Then** the response contains only rolls from session 1

### Requirement: ADDED `campaignRolls` MongoDB collection with compound index

The system SHALL create a compound index `{ campaignId: 1, sessionId: 1, createdAt: -1 }` on the `campaignRolls` collection during database initialisation.

#### Scenario: Index exists after DB init

- **Given** a fresh database initialisation
- **When** `db.campaignRolls.getIndexes()` is called
- **Then** the compound index on `{ campaignId, sessionId, createdAt }` is present

## MODIFIED Requirements

### Requirement: MODIFIED `CampaignStreamEvent` union

The system SHALL extend `CampaignStreamEvent` with a `roll` variant without breaking existing `message` and `heartbeat` consumers.

#### Scenario: Existing SSE consumers are unaffected

- **Given** the `roll` variant is added to `CampaignStreamEvent`
- **When** `npm run build` is executed and all existing stream tests run
- **Then** no compilation errors and no test regressions occur

## REMOVED Requirements

None.

## Traceability

- Proposal: `CampaignRoll` type and `RollVisibility` → Requirement: ADDED `CampaignRoll` type
- Proposal: POST validates and rejects when no active session → Scenario: POST with no active session returns 409
- Proposal: Visibility filtering identical for GET and SSE → Requirement: ADDED `canSeeRoll()` + GET scenarios
- Proposal: GET requires `sessionId` → Scenario: GET without `sessionId` returns 400
- Design Decision 1 (separate `RollVisibility`) → Requirement: ADDED types; Scenario: POST with `direct` scope returns 400
- Design Decision 2 (explicit sessionId) → Scenario: GET without param returns 400
- Design Decision 3 (409 for no session) → Scenario: POST with no active session returns 409
- Design Decision 4 (`canSeeRoll()`) → Requirement: ADDED `canSeeRoll()` + SSE scenario
- Design Decision 6 (cursor pagination) → Scenario: GET cursor pagination
- Requirements → Tasks: All functional requirements map to tasks in `tasks.md`

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: GET query uses index

- **Given** the compound index `{ campaignId, sessionId, createdAt }` exists
- **When** `GET /api/campaigns/[id]/rolls?sessionId=<id>` is executed
- **Then** MongoDB uses the index (verifiable via `explain()` in integration/manual test)

### Requirement: Security

See functional scenarios: "POST by inactive member returns 403", "Player cannot see another player's `dm-only` roll", "Player retrieves only visible rolls for a session".

#### Scenario: Unauthenticated request is rejected

- **Given** no authentication token
- **When** `POST` or `GET` on `/api/campaigns/[id]/rolls`
- **Then** the response is `401`

### Requirement: Reliability

#### Scenario: DB insert failure returns 500

- **Given** the `campaignRolls` collection insert throws
- **When** `POST /api/campaigns/[id]/rolls` with a valid payload
- **Then** the response is `500` with a structured error; no partial data is emitted via SSE
