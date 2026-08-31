## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-08-30-enhance-dice-roll-modal/design.md) document, not a replacement.

### Requirement: ADDED Show visual representation of dice results in modal

The system SHALL render static SVG representations of rolled dice inside the result modal, mapping over the individual dice rolled and superimposing their values.

_(Modified 2026-08-30, `fix-dice-animation-predetermined-faces`.)_ The readout SHALL be plain DOM content, independent of the WebGL dice canvas, and SHALL be present on every path that reveals the result modal: animation completed, animation disabled, dice engine unsupported, fallback timeout, and the face-mismatch path. When the number of dice rolled exceeds the animation cap (`DICE_ANIM_CAP`, 15), the readout SHALL render the first `DICE_ANIM_CAP` dice and an indicator of how many further dice were rolled (e.g. `+105 more`); the roll total shown SHALL remain the exact total for the entire pool.

#### Scenario: Visual result for standard dice pool

- **Given** a user has dispatched a roll of "2 d20" resulting in [14, 7]
- **When** the result modal renders
- **Then** two `DiceD20Icon` SVGs are displayed, one showing "14" and one showing "7" in their centers.

#### Scenario: Visual result for percentile roll

- **Given** a user has dispatched a percentile roll resulting in faces [70, 4]
- **When** the result modal renders
- **Then** two `DiceD10Icon` SVGs are displayed side-by-side, one showing "70" and one showing "4".

#### Scenario: Visual result for a pool larger than the animation cap

_(Added 2026-08-30, `fix-dice-animation-predetermined-faces`.)_

- **Given** a user has dispatched a roll of `120d6`
- **When** the result modal renders
- **Then** 15 die SVGs are displayed with their values
- **And** an indicator shows that 105 further dice were rolled
- **And** the total shown equals the exact total for all 120 dice

#### Scenario: Visual result is present on the non-animated reveal paths

_(Added 2026-08-30, `fix-dice-animation-predetermined-faces`.)_

- **Given** the resolved "Disable Animation" preference is `true`, or the dice animation status is `unsupported`
- **When** the user rolls a staged pool of `3d6` and the modal is shown immediately
- **Then** the modal includes the per-die visual readout for all three dice

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
