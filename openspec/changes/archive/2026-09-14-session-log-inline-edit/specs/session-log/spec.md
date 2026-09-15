## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

*(None)*

## MODIFIED Requirements

### Requirement: MODIFIED Inline session editing

The system SHALL render the session edit form inline in the log list instead of at the top of the page.

#### Scenario: Editing an existing session log

- **Given** a user is viewing a list of session logs for a campaign
- **When** the user clicks "Edit" on a specific session log
- **Then** the session log's card is replaced with the session edit form
- **And** the session edit form does not appear at the top of the page

#### Scenario: Creating a new session log

- **Given** a user is viewing a list of session logs for a campaign
- **When** the user clicks "+ New Session"
- **Then** the session edit form is rendered at the top of the page (above the list of existing logs)

## REMOVED Requirements

*(None)*

## Traceability

- Proposal element -> Requirement: Render `<SessionForm>` inline for editing existing sessions -> MODIFIED Inline session editing
- Proposal element -> Requirement: Keep "New Session" form at the top -> MODIFIED Inline session editing
- Design decision -> Requirement: Decision 1 (Inline Form Rendering) & Decision 2 (Top-Level Form Condition) -> MODIFIED Inline session editing
- Requirement -> Task(s): TBD in tasks.md

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED). If a functional scenario already covers a given behavior (e.g., access-control rejection, error handling), cross-reference it here instead of repeating it. Only include NFAC scenarios that express genuinely new, non-functional behaviors (latency budgets, throughput limits, recovery SLOs, audit logging, etc.).

### Requirement: Performance

*(No changes to performance criteria)*

### Requirement: Security

*(No changes to security criteria)*

### Requirement: Reliability

*(No changes to reliability criteria)*
