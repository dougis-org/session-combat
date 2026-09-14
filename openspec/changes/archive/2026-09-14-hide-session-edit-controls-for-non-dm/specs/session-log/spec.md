## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

None. This change modifies the existing "Session journal UI" requirement only; see MODIFIED Requirements below.

## MODIFIED Requirements

### Requirement: MODIFIED Session journal UI

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

## REMOVED Requirements

No requirements removed by this capability.

## Traceability

- Proposal element (gate "+ New Session" behind DM status) → MODIFIED Session journal UI: "DM sees full create/edit/delete controls", "Non-DM member sees no write controls"
- Proposal element (gate "Edit"/"Delete" per card behind DM status) → MODIFIED Session journal UI: "DM sees full create/edit/delete controls", "Non-DM member sees no write controls"
- Proposal element (leave read/expand unchanged for all roles) → MODIFIED Session journal UI: "Non-DM member can still read session details"
- Design decision 4 (fail-closed default while `useIsDM` loading) → MODIFIED Session journal UI: "Write controls stay hidden while DM status is still resolving"
- Requirements → Tasks: see tasks.md, task group for `app/campaigns/[id]/sessions/page.tsx` DM gating

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: Client-side control visibility is not the access-control boundary

See functional scenario: "Non-DM member sees no write controls" (this spec). The server-side enforcement (`role !== 'dm' → 404` on `POST`/`PATCH`/`DELETE` session-log routes) already exists and is unchanged by this capability; it is documented under the existing "ADDED Session log creation", "ADDED Session log update", and "ADDED Session log deletion" requirements in this same capability file.

### Requirement: Reliability

#### Scenario: DM-detection failure fails closed

- **Given** the `useIsDM` member-role fetch fails (network error or non-2xx response other than a confirmed non-member 404)
- **When** the Session Journal page renders
- **Then** the viewer is treated as non-DM and no write controls are shown, consistent with "Write controls stay hidden while DM status is still resolving"
