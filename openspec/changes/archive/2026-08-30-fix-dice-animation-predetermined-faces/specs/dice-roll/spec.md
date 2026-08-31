## MODIFIED Requirements

This document details *changes* to requirements and is additive to the
[`design.md`](../../design.md) document, not a replacement.

### Requirement: MODIFIED Show visual representation of dice results in modal

The system SHALL render static SVG representations of rolled dice inside the
result modal, mapping over the individual dice rolled and superimposing their
values. The readout SHALL be plain DOM content, independent of the WebGL dice
canvas, and SHALL be present on every path that reveals the result modal:
animation completed, animation disabled, dice engine unsupported, fallback
timeout, and the face-mismatch path.

When the number of dice rolled exceeds the animation cap (`DICE_ANIM_CAP`, 15),
the readout SHALL render the first `DICE_ANIM_CAP` dice and an indicator of how
many further dice were rolled (e.g. `+105 more`); the roll total shown SHALL
remain the exact total for the entire pool.

#### Scenario: Visual result for standard dice pool

- **Given** a user has dispatched a roll of "2 d20" resulting in [14, 7]
- **When** the result modal renders
- **Then** two `DiceD20Icon` SVGs are displayed, one showing "14" and one showing
  "7" in their centers.

#### Scenario: Visual result for percentile roll

- **Given** a user has dispatched a percentile roll resulting in faces [70, 4]
- **When** the result modal renders
- **Then** two `DiceD10Icon` SVGs are displayed side-by-side, one showing "70"
  and one showing "4".

#### Scenario: Visual result for a pool larger than the animation cap

- **Given** a user has dispatched a roll of `120d6`
- **When** the result modal renders
- **Then** 15 die SVGs are displayed with their values
- **And** an indicator shows that 105 further dice were rolled
- **And** the total shown equals the exact total for all 120 dice

#### Scenario: Visual result is present on the non-animated reveal paths

- **Given** the resolved "Disable Animation" preference is `true`, or the dice
  animation status is `unsupported`
- **When** the user rolls a staged pool of `3d6` and the modal is shown
  immediately
- **Then** the modal includes the per-die visual readout for all three dice

## Traceability

- Proposal element "Add a `+N more` affordance to the existing per-die readout"
  -> Requirement "MODIFIED Show visual representation of dice results in modal" +
  design Decision 6.
