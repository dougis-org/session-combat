## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Batch Monster Initiative Rolling

The system SHALL allow batch rolling of initiative for all unrolled monsters via the `InitiativeEntry` UI when at least one monster lacks an initiative roll.

#### Scenario: Multiple unrolled monsters

- **Given** an encounter has started with 3 unrolled monsters and 2 unrolled players
- **When** the DM clicks "Roll d20 for all 3 unrolled Monsters" in the initiative modal for the first monster
- **Then** all 3 monsters receive an initiative roll, the combatants list re-sorts, and the modal snaps to the first unrolled player

#### Scenario: Applying advantage and flat bonus to batch

- **Given** the modal for the first unrolled monster has "Advantage" checked and a flat bonus of "+2" entered
- **When** the DM clicks the batch roll button
- **Then** every unrolled monster is rolled with advantage and a +2 flat bonus applied to their respective dexterity modifier

## MODIFIED Requirements

### Requirement: MODIFIED Unrolled Combatant Sorting

The system SHALL prioritize sorting unrolled monsters above unrolled players when determining the Initiative Order list and modal auto-pop target.

#### Scenario: Encounter Start Sorting

- **Given** an encounter has started with unrolled monsters and unrolled players
- **When** the combatants list is rendered
- **Then** all unrolled monsters appear at the top of the list, followed by all unrolled players

## REMOVED Requirements

### Requirement: REMOVED Global `rollInitiative` Function

Reason for removal: The existing `rollInitiative` function overwrote existing rolls and rolled for players, which was a dangerous bug risk and unused by any component.

## Traceability

- Proposal element -> Requirement: Grouping unrolled monsters -> MODIFIED Unrolled Combatant Sorting
- Proposal element -> Requirement: Delete dangerous `rollInitiative` -> REMOVED Global `rollInitiative` Function
- Proposal element -> Requirement: UI for batch rolling -> ADDED Batch Monster Initiative Rolling
- Design decision -> Requirement: Decision 1 -> MODIFIED Unrolled Combatant Sorting
- Design decision -> Requirement: Decision 2 -> REMOVED Global `rollInitiative` Function, ADDED Batch Monster Initiative Rolling
- Design decision -> Requirement: Decision 3 -> ADDED Batch Monster Initiative Rolling

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED). If a functional scenario already covers a given behavior (e.g., access-control rejection, error handling), cross-reference it here instead of repeating it. Only include NFAC scenarios that express genuinely new, non-functional behaviors (latency budgets, throughput limits, recovery SLOs, audit logging, etc.).

### Requirement: Performance

#### Scenario: Latency budget

- **Given** a combat with 20 unrolled monsters
- **When** the batch roll button is clicked
- **Then** the UI updates and re-sorts within 100ms without perceptible lag
