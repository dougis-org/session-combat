## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Session Log button in Active Campaigns action row

The system SHALL always render a "Session Log" link in the Active Campaigns Dashboard action button row for each active campaign, regardless of whether any sessions exist.

#### Scenario: Session Log button present with sessions

- **Given** the user is on the `/campaigns` page
- **When** at least one active campaign exists with one or more sessions logged
- **Then** the Active Campaigns Dashboard card for that campaign displays a "Session Log" button linking to `/campaigns/${campaignId}/sessions`

#### Scenario: Session Log button present with no sessions

- **Given** the user is on the `/campaigns` page
- **When** an active campaign exists but has no sessions logged
- **Then** the Active Campaigns Dashboard card for that campaign still displays a "Session Log" button linking to `/campaigns/${campaignId}/sessions`

---

### Requirement: ADDED Session section always renders on Active Campaign card

The system SHALL render a session section on every Active Campaigns Dashboard card: showing the last session details when sessions exist, or a "Log First Session" CTA when none exist.

#### Scenario: Last session shown when sessions exist

- **Given** the user is on the `/campaigns` page
- **When** an active campaign has at least one session (the most recent has `sessionNumber` N and optional `title`)
- **Then** the session section displays "Session #N" with the session title (if any), the date played, and a "View all sessions →" link to `/campaigns/${campaignId}/sessions`

#### Scenario: Empty state CTA shown when no sessions exist

- **Given** the user is on the `/campaigns` page
- **When** an active campaign has no sessions logged (`lastSession` is null)
- **Then** the session section displays "No sessions logged yet." and a "Log First Session →" link to `/campaigns/${campaignId}/sessions`

#### Scenario: Milestone badge shown on milestone sessions

- **Given** the user is on the `/campaigns` page
- **When** an active campaign's last session has `milestone: true`
- **Then** the session section displays a "Milestone" badge alongside the session info

## MODIFIED Requirements

### Requirement: MODIFIED Active Campaign card action row

The system SHALL include "Session Log" as a permanent entry in the action row (Members | Session Log | Prompt Builder | Library | Start Encounter), consistently with the "Session Log" button already present in the all-campaigns grid below.

#### Scenario: Action row contains Session Log

- **Given** the user is on the `/campaigns` page
- **When** the Active Campaigns Dashboard renders with one or more active campaigns
- **Then** each campaign card's action row contains a "Session Log" link

## REMOVED Requirements

No requirements removed.

## Traceability

- Proposal element "Session section always renders" → Requirement: ADDED Session section always renders
- Proposal element "Session Log button in action row" → Requirement: MODIFIED Active Campaign card action row
- Design decision 1 (session section always renders) → ADDED Session section always renders
- Design decision 2 (Session Log button in action row) → MODIFIED Active Campaign card action row
- Requirements → Tasks: task-1 (update app/campaigns/page.tsx session section), task-2 (add Session Log button to action row)

## Non-Functional Acceptance Criteria

### Requirement: Performance

No additional network requests introduced by this change.

#### Scenario: No extra fetch for session section empty state

- **Given** an active campaign with no sessions
- **When** the Active Campaigns Dashboard renders
- **Then** no additional fetch calls are made beyond the existing `?limit=1` session fetch (which returns an empty array, already handled)

### Requirement: Security

See functional scenarios above — no new access-controlled endpoints are introduced. All links point to existing protected routes.

### Requirement: Reliability

#### Scenario: Session fetch failure degrades gracefully

- **Given** the `/api/campaigns/${id}/sessions?limit=1` fetch fails or returns an error
- **When** the Active Campaigns Dashboard renders
- **Then** `lastSession` is `null` and the empty state CTA renders (same as no-sessions case); no unhandled error is thrown
