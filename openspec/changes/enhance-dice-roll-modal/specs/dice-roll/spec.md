## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Show visual representation of dice results in modal

The system SHALL render static SVG representations of rolled dice inside the result modal, mapping over the individual dice rolled and superimposing their values.

#### Scenario: Visual result for standard dice pool

- **Given** a user has dispatched a roll of "2 d20" resulting in [14, 7]
- **When** the result modal renders
- **Then** two `DiceD20Icon` SVGs are displayed, one showing "14" and one showing "7" in their centers.

#### Scenario: Visual result for percentile roll

- **Given** a user has dispatched a percentile roll resulting in faces [70, 4]
- **When** the result modal renders
- **Then** two `DiceD10Icon` SVGs are displayed side-by-side, one showing "70" and one showing "4".

## MODIFIED Requirements

### Requirement: MODIFIED Increase font size of roll formula

The system SHALL display the roll formula in the result modal at a highly visible font size.

#### Scenario: Roll formula display

- **Given** a user triggers a roll
- **When** the result modal appears
- **Then** the label indicating the formula (e.g., "1 d20") is displayed with a `text-xl` or `text-2xl` sizing, rather than `text-xs`.

### Requirement: MODIFIED Reset dice pool on roll

The system SHALL clear the dice pool selection immediately upon rolling.

#### Scenario: Dice pool clears after roll

- **Given** a user has staged a pool of "2 d6 + 2" in the global dice panel
- **When** the user clicks "Roll"
- **Then** the roll is dispatched AND the dice pool panel instantly resets to 0 selected dice and a 0 modifier.

## REMOVED Requirements

None

## Traceability

- Proposal element -> Requirement: Show visual representation of dice results -> ADDED Show visual representation of dice results in modal
- Design decision -> Requirement: Decision 1 & 2 -> ADDED Show visual representation of dice results in modal
- Proposal element -> Requirement: Increase font size of formula label -> MODIFIED Increase font size of roll formula
- Design decision -> Requirement: Update Tailwind classes -> MODIFIED Increase font size of roll formula
- Proposal element -> Requirement: Reset dice pool on roll -> MODIFIED Reset dice pool on roll
- Design decision -> Requirement: Decision 3 -> MODIFIED Reset dice pool on roll
- Requirement -> Task(s): (To be linked in tasks.md)

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED). If a functional scenario already covers a given behavior (e.g., access-control rejection, error handling), cross-reference it here instead of repeating it. Only include NFAC scenarios that express genuinely new, non-functional behaviors (latency budgets, throughput limits, recovery SLOs, audit logging, etc.).

### Requirement: Performance

#### Scenario: Rendering large pools does not block

- **Given** a user rolls a very large pool (e.g. 20 dice)
- **When** the modal renders the SVGs
- **Then** the UI remains responsive and the container wraps the items cleanly.

### Requirement: Security

See functional scenarios: none

### Requirement: Reliability

See functional scenarios: none
