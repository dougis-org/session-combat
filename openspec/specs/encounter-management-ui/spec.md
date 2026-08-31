## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-08-30-encounter-inline-editing/design.md) document, not a replacement.

### Requirement: ADDED Inline Encounter Editing

The system SHALL render the `EncounterEditor` directly in place of the `EncounterCard` when a user edits an existing encounter.

#### Scenario: Editing an encounter opens the editor inline

- **Given** a user is viewing a list of encounters containing "Goblin Ambush"
- **When** the user clicks "Edit" on the "Goblin Ambush" encounter card
- **Then** the "Goblin Ambush" encounter card is replaced by the `EncounterEditor` in the exact same position within the list

#### Scenario: Canceling an edit restores the card

- **Given** a user is editing an encounter inline
- **When** the user clicks "Cancel" in the editor
- **Then** the editor is replaced by the original `EncounterCard`

#### Scenario: Saving an edit restores the card

- **Given** a user is editing an encounter inline
- **When** the user saves their changes
- **Then** the editor is replaced by the updated `EncounterCard`

## MODIFIED Requirements

### Requirement: MODIFIED Top-Level Editor

The system SHALL only render the top-level `EncounterEditor` when creating a new encounter.

#### Scenario: Creating a new encounter

- **Given** a user is viewing a list of encounters
- **When** the user clicks "Add New Encounter" or "Create New Encounter"
- **Then** the `EncounterEditor` appears at the top of the list, above the existing items

## REMOVED Requirements

### Requirement: REMOVED Top-Level Editor for Existing Encounters

Reason for removal: Editing existing encounters at the top of the list causes confusion when the user has scrolled down to a long list, as they cannot see the editor without scrolling up.

## Traceability

- Proposal element -> Requirement: Update global/campaign encounters page to render editor inline -> Inline Encounter Editing
- Design decision -> Requirement: Decision 1 (Inline conditional rendering) -> Inline Encounter Editing
- Requirement -> Task(s): Inline Encounter Editing -> Update app/encounters/page.tsx mapping, Update app/campaigns/[id]/encounters/page.tsx mapping

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED). If a functional scenario already covers a given behavior (e.g., access-control rejection, error handling), cross-reference it here instead of repeating it. Only include NFAC scenarios that express genuinely new, non-functional behaviors (latency budgets, throughput limits, recovery SLOs, audit logging, etc.).

### Requirement: Performance

#### Scenario: Layout stability

- **Given** a user is viewing a list of 50 encounters
- **When** they click "Edit" on the 25th encounter
- **Then** only the 25th encounter card is re-rendered into an editor, without causing the entire list of 50 items to unmount/remount (React `key` stability)

### Requirement: Security

> If access-control rejections are already fully specified by functional scenarios above, replace the scenario below with a cross-reference: "See functional scenarios: [scenario name(s)]". Only add a distinct scenario here if there is a security property not expressed by the functional requirements (e.g., audit log written, token not leaked in error body).

#### Scenario: Access control

- **Given** a non-DM user viewing a campaign encounter
- **When** they attempt to edit an encounter
- **Then** the UI does not show the "Edit" button (existing functionality, unmodified)

### Requirement: Reliability

#### Scenario: Recovery behavior

- **Given** an error occurs while saving an inline encounter
- **When** the network request fails
- **Then** the inline editor remains visible and displays the error message without replacing the entire list
