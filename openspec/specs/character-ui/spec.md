## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-08-22-character-ui-update/design.md) document, not a replacement.

### Requirement: ADDED Character Card Expansion

The system SHALL allow users to toggle the display of full character details inline within the character listing.

#### Scenario: Expanding character details

- **Given** a user is viewing the character list
- **When** the user clicks "Expand" on a character card
- **Then** the card expands to show the full `CreatureStatBlock` for that character
- **And** the "Expand" button changes to "Collapse"

#### Scenario: Collapsing character details

- **Given** a user has expanded a character card
- **When** the user clicks "Collapse"
- **Then** the card collapses to hide the `CreatureStatBlock`
- **And** the "Collapse" button changes to "Expand"

### Requirement: ADDED Dedicated Character Detail View

The system SHALL provide a dedicated route to view and edit a single character.

#### Scenario: Navigating to detail view

- **Given** a user is viewing the character list
- **When** the user clicks on a character's name or the "View Character" link
- **Then** the user is navigated to `/characters/[id]`
- **And** the page displays the full stats for that specific character

#### Scenario: Editing from detail view

- **Given** a user is on the `/characters/[id]` page
- **When** the user clicks "Edit" and submits changes
- **Then** the character is updated via the API and the view reflects the new data

## MODIFIED Requirements

### Requirement: MODIFIED Character Listing Display

The system SHALL display a compact summary of each character by default rather than the full stat block.

#### Scenario: Viewing default character list

- **Given** a user navigates to `/characters`
- **When** the page loads
- **Then** each character card displays only the name, class/level, race, HP, and AC
- **And** the full `CreatureStatBlock` is hidden by default

## REMOVED Requirements

### Requirement: REMOVED Inline editor component definition

Reason for removal: The `CharacterEditor` component is being extracted to a shared module to allow reuse across multiple pages.

## Traceability

- Proposal element -> Requirement: Character listing shows summary by default -> MODIFIED Character Listing Display
- Proposal element -> Requirement: Details expandable inline -> ADDED Character Card Expansion
- Proposal element -> Requirement: Dedicated view for each character -> ADDED Dedicated Character Detail View
- Proposal element -> Requirement: Editing allowed in both places -> ADDED Dedicated Character Detail View
- Design decision -> Requirement: Extract `CharacterEditor` -> REMOVED Inline editor component definition
- Requirement -> Task(s): Will map directly to implementation tasks (extract editor, create card component, modify list page, create detail page).

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED). If a functional scenario already covers a given behavior (e.g., access-control rejection, error handling), cross-reference it here instead of repeating it. Only include NFAC scenarios that express genuinely new, non-functional behaviors (latency budgets, throughput limits, recovery SLOs, audit logging, etc.).

### Requirement: Performance

#### Scenario: Client-side rendering efficiency

- **Given** a user with 50 characters
- **When** navigating to the `/characters` list
- **Then** the initial render omits the complex `CreatureStatBlock` DOM nodes for all collapsed cards, improving time-to-interactive.

### Requirement: Security

> See functional scenarios: Access control is handled natively by the existing `ProtectedRoute` and `/api/characters/[id]` endpoint ownership checks.

### Requirement: Reliability

#### Scenario: Graceful handling of invalid character ID

- **Given** a user navigates to `/characters/invalid-id`
- **When** the page attempts to fetch the character
- **Then** the page displays a "Character not found" error state rather than crashing.
