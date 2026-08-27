## ADDED Requirements

### Requirement: Session number generation failure is surfaced explicitly

The system SHALL NOT silently number a new session `1` (or any other value)
when the underlying session-number lookup fails due to a datastore error.
When `storage.getNextSessionNumber` fails, both session-creation endpoints
(`POST /api/campaigns/[id]/sessions` without an explicit `sessionNumber`, and
`POST /api/campaigns/[id]/sessions/active`) SHALL respond with a distinct,
identifiable failure rather than the generic error message used for other
unrelated failures in the same handler, and SHALL NOT create a session log
document.

#### Scenario: Datastore failure while creating a session without an explicit number

- **Given** an authenticated DM with an existing campaign that already has a session numbered `1`
- **And** the datastore is unavailable when `storage.getNextSessionNumber` queries for the latest session
- **When** a POST to `/api/campaigns/[id]/sessions` is sent with `{ datePlayed: "2026-05-20", summary: "..." }` (no `sessionNumber`)
- **Then** the response is not 201, no `SessionLog` document is created, and the response body/status is distinguishable from the generic "Failed to create session log" 500 response used for other failures in this handler

#### Scenario: Datastore failure while opening an active session

- **Given** an authenticated DM with an existing campaign with no currently active session
- **And** the datastore is unavailable when `storage.getNextSessionNumber` queries for the latest session
- **When** a POST to `/api/campaigns/[id]/sessions/active` is sent
- **Then** the response is not 201, no `SessionLog` document is created, the campaign's `activeSessionId` remains unclaimed (unchanged from before the request), and the response body/status is distinguishable from the generic "Failed to open active session" 500 response used for other failures in this handler

#### Scenario: Explicit sessionNumber bypasses the lookup entirely

- **Given** an authenticated DM with an existing campaign
- **And** the datastore is unavailable when `storage.getNextSessionNumber` would query for the latest session
- **When** a POST to `/api/campaigns/[id]/sessions` is sent with an explicit valid `sessionNumber` (e.g. `{ sessionNumber: 5, datePlayed: "2026-05-20" }`)
- **Then** `getNextSessionNumber` is never invoked and the request succeeds or fails based only on `saveSessionLog`'s outcome, unaffected by this requirement

## MODIFIED Requirements

### Requirement: ADDED Session log creation

The system SHALL allow a DM to create a session log entry scoped to a campaign, recording: session number, optional title, date played, freeform summary, structured events, and optional milestone + new level. When `sessionNumber` is omitted, it SHALL be computed as `MAX(existing sessionNumber for this campaign) + 1` via `storage.getNextSessionNumber`, which SHALL throw rather than return a numeric sentinel if that computation cannot be completed due to a datastore failure (see "Session number generation failure is surfaced explicitly").

#### Scenario: Create session log with all fields

- **Given** an authenticated user with an existing campaign
- **When** a POST to `/api/campaigns/[id]/sessions` is sent with `{ sessionNumber: 5, title: "The Siege", datePlayed: "2026-05-20", summary: "...", events: [], milestone: true, newLevel: 7 }`
- **Then** the response is 201 with the created `SessionLog` document including a generated `id`

#### Scenario: Create session log with required fields only

- **Given** an authenticated user with an existing campaign
- **When** a POST is sent with only `{ datePlayed: "2026-05-20", summary: "Short session." }`
- **Then** the response is 201; `sessionNumber` is auto-set to `MAX(existing) + 1`; `milestone` defaults to `false`

#### Scenario: Create session log with missing datePlayed

- **Given** an authenticated user
- **When** a POST is sent without `datePlayed`
- **Then** the response is 400 with an error message indicating `datePlayed` is required

## REMOVED Requirements

No requirements removed by this change.

## Traceability

- Proposal element ("throws a StorageError... instead of returning a numeric
  sentinel") -> Requirement: ADDED Session number generation failure is
  surfaced explicitly; Requirement: MODIFIED ADDED Session log creation
- Proposal element ("both callers handle the thrown error appropriately... no
  unhandled 500 masking") -> Requirement: ADDED Session number generation
  failure is surfaced explicitly (scenarios for both endpoints)
- Design decision 1 (`runStorageOp` with no `isEmpty` classifier) ->
  Requirement: MODIFIED ADDED Session log creation (unchanged happy-path
  scenarios; failure behavior now delegated to the new ADDED requirement)
- Design decision 2 (dedicated try/catch per call site, distinct status) ->
  Requirement: ADDED Session number generation failure is surfaced explicitly
- Design decision 3 (explicit `sessionNumber` bypasses the lookup, untouched)
  -> Requirement: ADDED Session number generation failure is surfaced
  explicitly (bypass scenario)
