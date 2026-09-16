## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Pinned Initiative Modal Overlay

The system SHALL render the `InitiativeEntry` UI as an absolute-positioned modal overlay anchored to the target `CombatantCard`.

#### Scenario: User clicks to set initiative
- **Given** an active combat session with combatants in the list
- **When** the DM clicks the "Initiative" section in the header of a `CombatantCard`
- **Then** a modal opens pinned to the top-left corner of that specific card containing the `InitiativeEntry` UI.

#### Scenario: User clicks outside the modal
- **Given** the Initiative modal is open over a `CombatantCard`
- **When** the DM clicks on the background overlay (outside the modal)
- **Then** the modal closes and the `initiativeEditId` state is cleared.

### Requirement: ADDED Auto-Advance Initiative Prompt

The system SHALL automatically open the modal for the next combatant requiring an initiative roll when an initiative roll is successfully saved.

#### Scenario: Saving initiative auto-advances
- **Given** multiple combatants have an initiative of 0 (unrolled)
- **When** the DM saves the initiative for the currently active modal combatant
- **Then** the modal seamlessly updates its position and targets the next combatant in the list that has not rolled yet.

#### Scenario: Auto-advance stops when all rolled
- **Given** there is only one combatant left with an initiative of 0
- **When** the DM saves the initiative for that final combatant
- **Then** the modal closes and the combatant list is fully sorted by rolled initiative.

## MODIFIED Requirements

### Requirement: MODIFIED Single Unified Combatant List

The system SHALL render a single, unified list of combatants at all times, with unrolled combatants sorted to the top.

#### Scenario: Pre-initiative combat view
- **Given** a combat encounter has just started and no one has rolled initiative
- **When** the DM views the combat tracker
- **Then** there is only one unified list of combatants (no separate "Party" and "Enemies" groupings).
- **And** all combatants are present in the list, sorted by type (Players > Monsters > Lairs) and Name.

#### Scenario: Partially rolled combat view
- **Given** combat has started and one combatant has an initiative of 18, while two combatants have not rolled
- **When** the combat tracker list is displayed
- **Then** the two unrolled combatants appear at the very top of the list
- **And** the combatant who rolled 18 appears below them.

## REMOVED Requirements

### Requirement: REMOVED Separate zeroInitiative block

Reason for removal: UX streamlining. The separate block at the top containing inline `InitiativeEntry` elements is removed in favor of the pinned modal on the main unified list.

## Traceability

- Proposal element -> Requirement: Pinned modal overlay -> ADDED Pinned Initiative Modal Overlay
- Proposal element -> Requirement: Un-rolled combatants sort to the top -> MODIFIED Single Unified Combatant List
- Proposal element -> Requirement: Auto-advance modal -> ADDED Auto-Advance Initiative Prompt
- Design decision -> Requirement: Decision 1 -> MODIFIED Single Unified Combatant List
- Design decision -> Requirement: Decision 2 -> ADDED Pinned Initiative Modal Overlay
- Design decision -> Requirement: Decision 3 -> ADDED Auto-Advance Initiative Prompt
- Requirement -> Task(s): To be mapped in tasks.md.

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED). If a functional scenario already covers a given behavior (e.g., access-control rejection, error handling), cross-reference it here instead of repeating it. Only include NFAC scenarios that express genuinely new, non-functional behaviors (latency budgets, throughput limits, recovery SLOs, audit logging, etc.).

### Requirement: Performance

#### Scenario: UI Layout Jumps
- **Given** a combatant list with 20 entries
- **When** the modal auto-advances from index 0 to index 1
- **Then** the overall page scroll position does not violently shift (the modal absolute positioning should prevent reflows of the main list elements).

### Requirement: Security

See functional scenarios. (No new security boundaries modified).

### Requirement: Reliability

#### Scenario: Recovery behavior from missing DOM node
- **Given** a race condition where the `initiativeEditId` points to an ID that no longer exists in the DOM
- **When** the modal attempts to anchor itself
- **Then** it should gracefully default to center of the screen or close automatically, avoiding a hard crash.
