## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Entry controls sit below mode buttons, left-aligned

The system SHALL render the initiative entry controls (value input, Set button, and result readout) in the same column as the mode buttons, below them, so their left edge aligns with the left edge of the "Roll d20" button and they never overflow to the right of the panel.

#### Scenario: Entry controls sit below mode buttons

- **Given** `InitiativeEntry` is rendered in "Enter Dice Roll" mode
- **When** the component mounts
- **Then** the dice input and Set button share a parent container with the "Roll d20" button, appear after the mode-button row in document order, and are not siblings of the identity (name) block

#### Scenario: Total mode uses the same placement

- **Given** `InitiativeEntry` is rendered and the user clicks "Enter Total"
- **When** the total input and Set button appear
- **Then** they are in the same controls column, after the mode-button row

#### Scenario: Mobile stacks left-aligned

- **Given** a viewport below the `md` breakpoint
- **When** the component renders
- **Then** the content container uses a single-column grid (`grid-cols-1`) and the two-column layout is applied only via the `md:` variant

## MODIFIED Requirements

### Requirement: MODIFIED Existing initiative entry behavior is preserved

The system SHALL keep all existing mode, validation, advantage, flat-bonus, close, and Escape behavior unchanged by the layout change.

#### Scenario: Existing behavior preserved

- **Given** the existing `InitiativeEntry` unit tests
- **When** they run against the restructured component
- **Then** all pass without modification

## REMOVED Requirements

### Requirement: REMOVED None

Reason for removal: No requirements removed.

## Traceability

- Proposal element -> Requirement: Restructure into grid / entry below buttons -> ADDED Entry controls sit below mode buttons; Mobile preserved -> mobile scenario; no behavior change -> MODIFIED preserved.
- Design decision -> Requirement: Decisions 1, 2 -> ADDED requirement; Decision 3 -> mobile scenario; Decision 2 -> MODIFIED requirement.
- Requirement -> Task(s): ADDED -> tasks 2.1–2.3; MODIFIED -> tasks 2.4, 3.1.

## Non-Functional Acceptance Criteria

### Requirement: Operability

#### Scenario: No regressions or new dependencies

- **Given** the change is complete
- **When** the unit suite, type check, and build run
- **Then** all pass and `package.json` dependencies are unchanged

### Requirement: Security

See functional scenarios: none apply — presentational change only; no input handling or access control is touched.

### Requirement: Performance

Not affected.
