## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Auto-Open on Unset Initiative

The system SHALL automatically open the initiative modal, anchored to the target `CombatantCard`, for the first combatant with no initiative roll, without requiring the DM to click the card's Initiative control — both when the combat view first renders and whenever a newly added combatant has no initiative roll.

#### Scenario: Auto-opens on initial combat view render

- **Given** an active combat session where one or more combatants have no `initiativeRoll` set and no initiative modal has yet been shown this session
- **When** the combat tracker view renders
- **Then** the initiative modal opens automatically, anchored to the first such combatant's card, without any click

#### Scenario: Auto-opens for a newly added combatant

- **Given** the combat tracker is displayed and every existing combatant already has an `initiativeRoll`
- **When** the DM adds a new combatant (party member or enemy) that has no `initiativeRoll`
- **Then** the initiative modal opens automatically, anchored to the newly added combatant's card

#### Scenario: Does not auto-open when everyone has rolled

- **Given** every combatant in the combat has an `initiativeRoll` set
- **When** the combat tracker view renders
- **Then** no initiative modal is shown automatically

### Requirement: ADDED Dismiss Suppresses Auto-Reopen For That Combatant

The system SHALL NOT automatically reopen the initiative modal for a combatant whose auto-opened modal the DM has already manually dismissed (via close button, Escape, or clicking outside), for as long as the combat view remains mounted, even though that combatant's initiative is still unset. The DM MAY still open the modal for that combatant manually via the card's Initiative control.

#### Scenario: Dismissed auto-opened modal does not reopen itself

- **Given** the initiative modal has auto-opened for a combatant with no `initiativeRoll`
- **When** the DM dismisses the modal (close button, Escape, or clicking outside) without setting an initiative
- **Then** the modal closes
- **And** the modal does not automatically reopen for that same combatant afterward, while other view state (e.g. adding a different combatant) changes

#### Scenario: Dismissed combatant remains manually openable

- **Given** the DM has dismissed the auto-opened modal for a combatant that still has no `initiativeRoll`
- **When** the DM clicks that combatant's card Initiative control
- **Then** the initiative modal opens for that combatant as normal

### Requirement: ADDED Unset Initiative Readout

The system SHALL render a combatant's card Initiative readout as "N/A" in a distinct warning color when that combatant has no `initiativeRoll`, instead of a numeric value, and SHALL render the numeric total in the normal style once an `initiativeRoll` is set.

#### Scenario: Unrolled combatant shows N/A in warning color

- **Given** a combatant with no `initiativeRoll`
- **When** the combatant's card is displayed
- **Then** the Initiative readout shows "N/A" styled in the warning/red color

#### Scenario: Rolled combatant shows its numeric total in normal style

- **Given** a combatant with an `initiativeRoll` whose total is `0` or any other number
- **When** the combatant's card is displayed
- **Then** the Initiative readout shows the numeric total in the normal (non-warning) style

## MODIFIED Requirements

### Requirement: MODIFIED Pinned Initiative Modal Overlay

The system SHALL render the `InitiativeEntry` UI as an absolute-positioned modal overlay anchored to the target `CombatantCard`'s own bounding rect (not an inner control's rect), clamped so the modal's actual rendered bounding box stays fully within the viewport with at least a 16px margin.

#### Scenario: User clicks to set initiative

- **Given** an active combat session with combatants in the list
- **When** the DM clicks the "Initiative" section in the header of a `CombatantCard`
- **Then** a modal opens pinned to the top-left corner of that specific card containing the `InitiativeEntry` UI

#### Scenario: User clicks outside the modal

- **Given** the Initiative modal is open over a `CombatantCard`
- **When** the DM clicks on the background overlay (outside the modal)
- **Then** the modal closes and the `initiativeEditId` state is cleared

#### Scenario: Modal never overflows the viewport

- **Given** the target `CombatantCard` is positioned such that anchoring the modal directly to its top-left corner would render the modal partially or fully outside the visible viewport (e.g. card near the right edge on a narrow viewport)
- **When** the initiative modal opens for that card
- **Then** the modal's rendered position is adjusted so its entire bounding box remains within the viewport, with at least a 16px margin on every side

## Traceability

- Proposal element -> Requirement: Auto-open on mount/new combatant -> ADDED Auto-Open on Unset Initiative
- Proposal element -> Requirement: Dismiss stays closed -> ADDED Dismiss Suppresses Auto-Reopen For That Combatant
- Proposal element -> Requirement: N/A red readout -> ADDED Unset Initiative Readout
- Proposal element -> Requirement: Card-anchored, non-overflowing positioning -> MODIFIED Pinned Initiative Modal Overlay
- Design decision -> Requirement: Decision 1 (dismissed-set effect) -> ADDED Auto-Open on Unset Initiative, ADDED Dismiss Suppresses Auto-Reopen For That Combatant
- Design decision -> Requirement: Decision 2 (measure-then-clamp anchoring) -> MODIFIED Pinned Initiative Modal Overlay
- Design decision -> Requirement: Decision 3 (N/A readout) -> ADDED Unset Initiative Readout
- Requirement -> Task(s): To be mapped in tasks.md.

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED). If a functional scenario already covers a given behavior (e.g., access-control rejection, error handling), cross-reference it here instead of repeating it. Only include NFAC scenarios that express genuinely new, non-functional behaviors (latency budgets, throughput limits, recovery SLOs, audit logging, etc.).

### Requirement: Performance

#### Scenario: UI Layout Jumps

- **Given** a combatant list with 20 entries
- **When** the modal auto-advances from index 0 to index 1
- **Then** the overall page scroll position does not violently shift (the modal absolute positioning should prevent reflows of the main list elements)

### Requirement: Security

See functional scenarios above. (No new security boundaries introduced by this change.)

### Requirement: Reliability

#### Scenario: Recovery behavior from missing DOM node

- **Given** a race condition where the `initiativeEditId` (whether set by auto-open or manual click) points to an id that no longer exists in the DOM (e.g. the combatant was removed)
- **When** the modal attempts to anchor itself to that combatant's card
- **Then** it gracefully closes automatically (position resolves to `null`) rather than crashing or rendering unanchored
