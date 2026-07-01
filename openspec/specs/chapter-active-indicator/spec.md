## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-07-01-campaign-chapter-active-indicator/design.md) document, not a replacement.

### Requirement: ADDED Display-only current chapter block

The system SHALL display the active chapter's name as non-interactive text above the chapter list when chapters exist.

#### Scenario: Active chapter name is shown in display block

- **Given** a campaign with chapters and `currentChapterId` set to an existing chapter
- **When** the Campaign edit screen renders the Chapters section
- **Then** a display element with `data-testid="current-chapter-display"` shows "Ch. N: <title>" matching the active chapter, with no `<select>` in the DOM

#### Scenario: Placeholder shown when no active chapter is set

- **Given** a campaign with chapters and `currentChapterId` undefined or not set
- **When** the Campaign edit screen renders the Chapters section
- **Then** `data-testid="current-chapter-display"` shows "-- No active chapter --" in dimmed, italic styling

#### Scenario: Display block absent when no chapters exist

- **Given** a campaign with no chapters defined
- **When** the Campaign edit screen renders the Chapters section
- **Then** `data-testid="current-chapter-display"` is not present in the DOM

### Requirement: ADDED Active chapter row indicator

The system SHALL render a visible "ACTIVE" pill on the chapter row that is currently the active chapter.

#### Scenario: ACTIVE pill appears on the active chapter row

- **Given** a campaign with multiple chapters and `currentChapterId` set to chapter X
- **When** the chapter list renders
- **Then** `data-testid="active-chapter-indicator-{X.id}"` is present on chapter X's row
- **And** no other chapter row has an `active-chapter-indicator` test ID

#### Scenario: No ACTIVE pill when no chapter is active

- **Given** a campaign with chapters and `currentChapterId` undefined
- **When** the chapter list renders
- **Then** no element with a `data-testid` matching `active-chapter-indicator-*` is present

### Requirement: ADDED Per-row activate button for inactive chapters

The system SHALL render a 🚩 activate button on every chapter row that is not currently active.

#### Scenario: Activate button appears on inactive chapter rows

- **Given** a campaign with multiple chapters and `currentChapterId` set to chapter X
- **When** the chapter list renders
- **Then** every chapter row except X has a button with `data-testid="activate-chapter-{ch.id}"` and `title="Mark as current chapter"`
- **And** chapter X's row does not have an `activate-chapter-*` button

#### Scenario: Clicking activate button sets that chapter as active

- **Given** a campaign with chapters where chapter A is active and chapter B is not
- **When** the user clicks `activate-chapter-{B.id}`
- **Then** `current-chapter-display` updates to show chapter B's name
- **And** `active-chapter-indicator-{B.id}` appears on chapter B's row
- **And** `active-chapter-indicator-{A.id}` is no longer present
- **And** `activate-chapter-{A.id}` now appears on chapter A's row

#### Scenario: Activate button is disabled while saving

- **Given** the Campaign editor is in a saving state
- **When** the chapter list renders
- **Then** all activate buttons are disabled

## MODIFIED Requirements

### Requirement: MODIFIED Chapter row layout includes status control

The chapter row layout is updated from `[Ch.N] [title] [▲][▼] [Remove]` to `[Ch.N] [title] [ACTIVE pill OR 🚩 button] [▲][▼] [Remove]`.

#### Scenario: Active chapter row layout

- **Given** chapter X is the active chapter
- **When** its row renders
- **Then** the row contains: chapter number label, title input, ACTIVE pill (`active-chapter-indicator-{X.id}`), ▲ button, ▼ button, Remove button — in that order
- **And** no activate button is present on this row

#### Scenario: Inactive chapter row layout

- **Given** chapter Y is not the active chapter
- **When** its row renders
- **Then** the row contains: chapter number label, title input, 🚩 activate button (`activate-chapter-{Y.id}`), ▲ button, ▼ button, Remove button — in that order
- **And** no ACTIVE pill is present on this row

## REMOVED Requirements

### Requirement: REMOVED Interactive current-chapter select dropdown

The `<select data-testid="current-chapter-select">` control is removed from the Campaign editor UI.

Reason for removal: Replaced by the display-only block (Decision 1) and per-row activate buttons (Decision 3) as specified in `design.md`. The select required users to scroll away from the chapter list to change the active chapter; the new design makes activation inline.

## Traceability

- Proposal: "Replace `<select>` with display-only block" → Requirement: ADDED Display-only current chapter block; REMOVED Interactive current-chapter select dropdown
- Proposal: "Green ACTIVE pill per active row" → Requirement: ADDED Active chapter row indicator
- Proposal: "🚩 activate button per inactive row" → Requirement: ADDED Per-row activate button for inactive chapters
- Design Decision 1 → Requirement: ADDED Display-only current chapter block
- Design Decision 2 → Requirement: ADDED Active chapter row indicator
- Design Decision 3 → Requirement: ADDED Per-row activate button for inactive chapters
- Design Decision 4 → Requirement: MODIFIED Chapter row layout
- Requirements → Tasks: all requirements map to Task 1 (JSX changes) and Task 2 (test updates) in `tasks.md`

## Non-Functional Acceptance Criteria

### Requirement: Performance

No latency budget applies — this change is purely client-side React state rendering with no new network requests.

### Requirement: Security

See functional scenarios above. No new access-control surface is introduced. The activate button calls `setCurrentChapterId` (local state only); no privileged API calls are involved.

### Requirement: Reliability

#### Scenario: Active chapter deleted while set as current

- **Given** chapter X is the active chapter
- **When** the user clicks Remove on chapter X's row
- **Then** `currentChapterId` is cleared (existing behavior via `handleRemoveChapter`)
- **And** `current-chapter-display` shows "-- No active chapter --"
- **And** no orphaned ACTIVE pill remains in the list
