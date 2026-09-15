## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Semantic Layout Wrapping

The system SHALL group the combatant card header UI elements into semantic `div` wrappers.

#### Scenario: Visual DOM Structure
- **Given** a rendered `CombatantCard`
- **When** the DOM is inspected
- **Then** the header section contains elements grouped inside `div`s with semantic `data-card-section` attributes for identity-stats, hp-controls, quick-rolls, and initiative.

## MODIFIED Requirements

### Requirement: MODIFIED Horizontal Scrolling on Mobile

The system SHALL wrap combatant card elements instead of overflowing horizontally.

#### Scenario: Small Screen Layout

- **Given** a combat screen loaded on a mobile resolution (e.g. 400px width)
- **When** viewing a CombatantCard
- **Then** the semantic UI groups (identity, hp-controls, initiative) wrap onto subsequent lines, keeping all inputs and data visible without horizontal scrolling.

## REMOVED Requirements

None.

## Traceability

- Proposal element -> Requirement: Prevent horizontal scrolling -> MODIFIED Horizontal Scrolling on Mobile
- Proposal element -> Requirement: Prepare placeholder for D20 roll -> ADDED Semantic Layout Wrapping
- Design decision -> Requirement: Implement semantic div wrapping -> ADDED Semantic Layout Wrapping
- Requirement -> Task(s): (Will map in tasks.md)

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED). If a functional scenario already covers a given behavior (e.g., access-control rejection, error handling), cross-reference it here instead of repeating it. Only include NFAC scenarios that express genuinely new, non-functional behaviors (latency budgets, throughput limits, recovery SLOs, audit logging, etc.).

### Requirement: Performance

N/A - UI structural change only.

### Requirement: Security

N/A

### Requirement: Reliability

N/A
