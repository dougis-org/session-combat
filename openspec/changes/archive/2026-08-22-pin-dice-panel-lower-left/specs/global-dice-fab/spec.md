## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Instant Tooltips

The system SHALL provide immediate tooltip feedback when hovering over dice size buttons inside the global dice fab panel.

#### Scenario: Hovering a dice button
- **Given** the global dice panel is open
- **When** the user hovers the cursor over a specific dice button (e.g., d20)
- **Then** a tooltip with the dice name appears instantly without OS/browser delay

## MODIFIED Requirements

### Requirement: MODIFIED Global Dice Panel Positioning

The system SHALL anchor the global dice panel to the bottom-left corner over the trigger button instead of centering it on screen.

#### Scenario: Opening the global dice fab
- **Given** the user is viewing a page with the `GlobalDiceFab` trigger
- **When** the user clicks the dice trigger button
- **Then** the dice panel opens with its bottom-left corner overlaying the trigger button
- **And** the background dimming overlay is displayed

## REMOVED Requirements

None.

## Traceability

- Proposal element -> Requirement: Repositioning the GlobalDiceFab panel fixed to the bottom-left corner -> MODIFIED Global Dice Panel Positioning
- Proposal element -> Requirement: Replacing native title attributes with custom instant tooltips -> ADDED Instant Tooltips
- Design decision -> Requirement: Decision 1 (Panel Positioning strategy) -> MODIFIED Global Dice Panel Positioning
- Design decision -> Requirement: Decision 2 (Instant Tooltips implementation) -> ADDED Instant Tooltips
- Requirement -> Task(s): MODIFIED Global Dice Panel Positioning -> Task 2 (Update Layout)
- Requirement -> Task(s): ADDED Instant Tooltips -> Task 1 (Create Tooltip Component) and Task 3 (Replace titles)

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED). If a functional scenario already covers a given behavior (e.g., access-control rejection, error handling), cross-reference it here instead of repeating it. Only include NFAC scenarios that express genuinely new, non-functional behaviors (latency budgets, throughput limits, recovery SLOs, audit logging, etc.).

### Requirement: Performance

N/A.

### Requirement: Security

N/A.

### Requirement: Reliability

N/A.

### Requirement: Operability

#### Scenario: Closing the panel via background click
- **Given** the global dice panel is open
- **When** the user clicks the background dimming overlay outside the panel
- **Then** the global dice panel closes
