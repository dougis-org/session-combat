## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Last Session card (conditional, non-blocking)

The system SHALL render a Last Session card within each active campaign card when session data is available, and omit it when no session data exists. The fetch for session data SHALL NOT block the main dashboard render.

#### Scenario: Last Session card renders when data is present

- **Given** `GET /api/campaigns/[id]/sessions?limit=1` returns a session with `sessionNumber: 11`, `title: "The Betrayer Revealed"`, `datePlayed: 2026-05-14`, `milestone: false`
- **When** the secondary useEffect resolves
- **Then** the Last Session card displays "Session 11 — The Betrayer Revealed" and the formatted date; no milestone badge is shown

#### Scenario: Milestone badge shown when session has milestone

- **Given** the most recent session has `milestone: true`
- **When** the Last Session card renders
- **Then** a milestone badge is visible on the card

#### Scenario: Last Session card absent when no session data

- **Given** `GET /api/campaigns/[id]/sessions?limit=1` returns an empty array or 404
- **When** the secondary useEffect resolves
- **Then** the Last Session card area is absent from the campaign card; no error state is shown

#### Scenario: Main dashboard renders before session fetch resolves

- **Given** the session fetch is pending
- **When** the page first renders after the main Promise.all resolves
- **Then** campaign cards, party sub-cards, and CharacterRosterCard entries are all visible; the Last Session card area is simply absent (not loading/spinner)

#### Scenario: Session fetch failure is silent

- **Given** `GET /api/campaigns/[id]/sessions?limit=1` returns a network error or 500
- **When** the secondary useEffect catches the error
- **Then** the Last Session card is absent for that campaign; no error boundary triggered; other content unaffected

## MODIFIED Requirements

No existing session-related requirements are modified (session journal feature #188 is a separate change).

## REMOVED Requirements

No requirements removed.

## Traceability

- Proposal: "Most recent session log entry is surfaced per campaign (conditional)" → Requirement: Last Session card
- Proposal: "Main dashboard render is not blocked by this fetch" → Requirement: non-blocking (performance scenario)
- Design Decision 4 (lazy secondary useEffect) → Requirement: Last Session card (all scenarios)
- Requirements → Tasks: tasks.md — Task 5 (session fetch + card)

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Session fetch does not delay page interactivity

- **Given** the main Promise.all has resolved and the dashboard is rendered
- **When** the session fetch fires asynchronously
- **Then** the page remains interactive; no loading state blocks the campaign cards or party sub-cards

### Requirement: Reliability

#### Scenario: Recovery when session API is temporarily unavailable

- **Given** the session API returns a 503
- **When** the secondary useEffect processes the failure
- **Then** the session card area is silently absent; the DM can still view all campaign and party data
