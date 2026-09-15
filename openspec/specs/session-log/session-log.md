## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

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

### Requirement: Session number generation failure is surfaced explicitly

The system SHALL NOT silently number a new session `1` (or any other value) when the underlying session-number lookup fails due to a datastore error. When `storage.getNextSessionNumber` fails, both session-creation endpoints (`POST /api/campaigns/[id]/sessions` without an explicit `sessionNumber`, and `POST /api/campaigns/[id]/sessions/active`) SHALL respond with a distinct, identifiable failure rather than the generic error message used for other unrelated failures in the same handler, and SHALL NOT create a session log document.

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

### Requirement: ADDED Session log listing

The system SHALL return all session logs for a campaign sorted by `sessionNumber` descending.

#### Scenario: List sessions sorted newest first

- **Given** a campaign with session logs numbered 1, 3, 2 (inserted out of order)
- **When** a GET to `/api/campaigns/[id]/sessions` is called
- **Then** the response contains sessions in order: 3, 2, 1

#### Scenario: List sessions for campaign with no entries

- **Given** a campaign with no session logs
- **When** GET `/api/campaigns/[id]/sessions` is called
- **Then** the response is 200 with an empty array

### Requirement: ADDED Session log update

The system SHALL allow a DM to update any field of an existing session log entry.

#### Scenario: Update session title and summary

- **Given** an existing session log
- **When** a PATCH to `/api/campaigns/[id]/sessions/[sessionId]` is sent with `{ title: "New Title" }`
- **Then** the response is 200 with the updated document; only `title` and `updatedAt` have changed

#### Scenario: Update non-existent session log

- **Given** a valid campaign id
- **When** a PATCH is sent for a `sessionId` that does not exist
- **Then** the response is 404

### Requirement: ADDED Session log deletion

The system SHALL allow a DM to delete a session log entry by id.

#### Scenario: Delete existing session log

- **Given** an existing session log
- **When** a DELETE to `/api/campaigns/[id]/sessions/[sessionId]` is called
- **Then** the response is 200
- **And** a subsequent GET of that sessionId returns 404

#### Scenario: Delete session log belonging to another user

- **Given** user A owns a session log
- **When** user B sends DELETE for that session log
- **Then** the response is 404

### Requirement: ADDED Session journal UI

The system SHALL provide a page at `/campaigns/[id]/sessions` listing all session logs for the campaign with inline create/edit capability restricted to the campaign's active DM. Non-DM campaign members (including inactive/removed members and members whose DM status has not yet resolved) SHALL be able to view the list and expand any entry to read its summary and events, but SHALL NOT be shown the "+ New Session" button or any "Edit"/"Delete" controls.

#### Scenario: Empty state

- **Given** a campaign with no session logs
- **When** the DM navigates to `/campaigns/[id]/sessions`
- **Then** an empty state message is shown with a prompt to add the first session

#### Scenario: Create form shows NPC auto-populate events

- **Given** a campaign with a linked party that has members with `addedAt`/`leftAt` since the last session
- **When** the DM opens the "New Session" form
- **Then** `npc_joined` and `npc_left` events are pre-populated in the events list

#### Scenario: Summary textarea shows nudge placeholder

- **Given** the DM opens the "New Session" form
- **When** the summary field is empty and unfocused
- **Then** the placeholder text reads: "What happened this session? Include: key NPCs encountered, decisions made, plot threads advanced, combat outcomes."

#### Scenario: Milestone badge shown on entry with milestone: true

- **Given** a session log with `milestone: true` and `newLevel: 8`
- **When** the session list is rendered
- **Then** the entry shows a milestone badge displaying the new level

#### Scenario: Editing an existing session log

- **Given** a user is viewing a list of session logs for a campaign
- **When** the user clicks "Edit" on a specific session log
- **Then** the session log's card is replaced with the session edit form
- **And** the session edit form does not appear at the top of the page

#### Scenario: Creating a new session log

- **Given** a user is viewing a list of session logs for a campaign
- **When** the user clicks "+ New Session"
- **Then** the session edit form is rendered at the top of the page (above the list of existing logs)

#### Scenario: DM sees full create/edit/delete controls

- **Given** an authenticated campaign member whose role is `dm` and status is `active`
- **When** they navigate to `/campaigns/[id]/sessions`
- **Then** the "+ New Session" button is shown, and each session card shows "Edit" and "Delete" buttons

#### Scenario: Non-DM member sees no write controls

- **Given** an authenticated campaign member whose role is not `dm` (or whose status is not `active`)
- **When** they navigate to `/campaigns/[id]/sessions`
- **Then** the "+ New Session" button is not rendered
- **And** no session card renders an "Edit" or "Delete" button

#### Scenario: Non-DM member can still read session details

- **Given** an authenticated non-DM campaign member viewing `/campaigns/[id]/sessions`
- **When** they click a session card to expand it
- **Then** the card expands and shows its summary and events exactly as it would for a DM

#### Scenario: Write controls stay hidden while DM status is still resolving

- **Given** an authenticated campaign member whose DM-status check (`useIsDM`) has not yet resolved (still loading)
- **When** the page renders
- **Then** the "+ New Session" button and all "Edit"/"Delete" buttons are hidden, the same as for a confirmed non-DM member
- **And** if the member is confirmed as an active DM once the check resolves, the controls then appear without a page reload

### Requirement: ADDED Session Log link on campaign cards

The system SHALL show a "Session Log" link on each campaign card in the campaigns list.

#### Scenario: Session Log link navigates to journal

- **Given** the DM is on the campaigns list page
- **When** they click "Session Log" on a campaign card
- **Then** they are navigated to `/campaigns/[id]/sessions`

## MODIFIED Requirements

No existing requirements modified by this capability.

## REMOVED Requirements

No requirements removed by this capability.

## Traceability

- Proposal element (SessionLog collection) → Requirements: ADDED creation, listing, update, deletion
- Proposal element (session journal UI) → ADDED UI, ADDED campaign card link
- Design decision 1 (storage.ts pattern) → ADDED creation, listing, update, deletion
- Design decision 5 (session number MAX+1) → ADDED creation scenario (required fields only)
- Requirements → Tasks: session-log-storage, session-log-api, session-log-ui task groups in tasks.md
- Change `fix-get-next-session-number-fallback` (#527) → ADDED "Session number generation failure is surfaced explicitly"; MODIFIED "ADDED Session log creation" (throw-on-failure behavior for `getNextSessionNumber`)

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: Session logs are user-scoped

- **Given** user A has session logs for their campaigns
- **When** user B calls `GET /api/campaigns/[A's campaignId]/sessions`
- **Then** the response is 404 or empty (user B cannot see user A's data)

#### Scenario: Session log CRUD requires authentication

- **Given** an unauthenticated request
- **When** any session log endpoint is called
- **Then** the response is 401

### Requirement: Reliability

#### Scenario: Session number auto-increment on first session

- **Given** a campaign with no existing session logs
- **When** a POST is sent without `sessionNumber`
- **Then** the created entry has `sessionNumber: 1`
