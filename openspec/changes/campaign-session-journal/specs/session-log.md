## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Session log creation

The system SHALL allow a DM to create a session log entry scoped to a campaign, recording: session number, optional title, date played, freeform summary, structured events, and optional milestone + new level.

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

The system SHALL provide a page at `/campaigns/[id]/sessions` listing all session logs for the campaign with inline create/edit capability.

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
