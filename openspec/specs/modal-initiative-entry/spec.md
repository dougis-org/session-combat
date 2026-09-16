## Purpose

Defines how the DM sets and reviews per-combatant initiative during active combat: a single unified combatant list (unrolled entries sorted to the top), a card-anchored, viewport-clamped `InitiativeEntry` modal that opens on click or automatically for unrolled combatants, and a visible "N/A" readout for combatants who haven't rolled yet.

## Requirements

### Requirement: Pinned Initiative Modal Overlay

The system SHALL render the `InitiativeEntry` UI as an absolute-positioned modal overlay anchored to the target `CombatantCard`'s own bounding rect (not an inner control's rect), matching that card's width and left edge exactly (not a fixed pixel width) so it reads as directly attached to the card, clamped so the modal's actual rendered bounding box stays fully within the viewport with at least a 16px margin.

#### Scenario: User clicks to set initiative
- **Given** an active combat session with combatants in the list
- **When** the DM clicks the "Initiative" section in the header of a `CombatantCard`
- **Then** a modal opens directly below that specific card, matching its width and left edge, containing the `InitiativeEntry` UI.

#### Scenario: User clicks outside the modal
- **Given** the Initiative modal is open over a `CombatantCard`
- **When** the DM clicks on the background overlay (outside the modal)
- **Then** the modal closes and the `initiativeEditId` state is cleared.

#### Scenario: Modal never overflows the viewport
- **Given** the target `CombatantCard` is positioned such that anchoring the modal directly to its top-left corner would render the modal partially or fully outside the visible viewport (e.g. card near the right edge on a narrow viewport)
- **When** the initiative modal opens for that card
- **Then** the modal's rendered position is adjusted so its entire bounding box remains within the viewport, with at least a 16px margin on every side.

### Requirement: Auto-Advance Initiative Prompt

The system SHALL automatically open the modal for the next combatant requiring an initiative roll when an initiative roll is successfully saved.

#### Scenario: Saving initiative auto-advances
- **Given** multiple combatants have an initiative of 0 (unrolled)
- **When** the DM saves the initiative for the currently active modal combatant
- **Then** the modal seamlessly updates its position and targets the next combatant in the list that has not rolled yet.

#### Scenario: Auto-advance stops when all rolled
- **Given** there is only one combatant left with an initiative of 0
- **When** the DM saves the initiative for that final combatant
- **Then** the modal closes and the combatant list is fully sorted by rolled initiative.

### Requirement: Auto-Open on Unset Initiative

The system SHALL automatically open the initiative modal, anchored to the target `CombatantCard`, for the first combatant with no initiative roll, without requiring the DM to click the card's Initiative control — both when the combat view first renders and whenever a newly added combatant has no initiative roll.

#### Scenario: Auto-opens on initial combat view render
- **Given** an active combat session where one or more combatants have no `initiativeRoll` set and no initiative modal has yet been shown this session
- **When** the combat tracker view renders
- **Then** the initiative modal opens automatically, anchored to the first such combatant's card, without any click.

#### Scenario: Auto-opens for a newly added combatant
- **Given** the combat tracker is displayed and every existing combatant already has an `initiativeRoll`
- **When** the DM adds a new combatant (party member or enemy) that has no `initiativeRoll`
- **Then** the initiative modal opens automatically, anchored to the newly added combatant's card.

#### Scenario: Does not auto-open when everyone has rolled
- **Given** every combatant in the combat has an `initiativeRoll` set
- **When** the combat tracker view renders
- **Then** no initiative modal is shown automatically.

### Requirement: Dismiss Suppresses Auto-Reopen For That Combatant

The system SHALL NOT automatically reopen the initiative modal for a combatant whose auto-opened modal the DM has already manually dismissed (via close button, Escape, or clicking outside), for as long as the combat view remains mounted, even though that combatant's initiative is still unset. The DM MAY still open the modal for that combatant manually via the card's Initiative control.

#### Scenario: Dismissed auto-opened modal does not reopen itself
- **Given** the initiative modal has auto-opened for a combatant with no `initiativeRoll`
- **When** the DM dismisses the modal (close button, Escape, or clicking outside) without setting an initiative
- **Then** the modal closes
- **And** the modal does not automatically reopen for that same combatant afterward, while other view state (e.g. adding a different combatant) changes.

#### Scenario: Dismissed combatant remains manually openable
- **Given** the DM has dismissed the auto-opened modal for a combatant that still has no `initiativeRoll`
- **When** the DM clicks that combatant's card Initiative control
- **Then** the initiative modal opens for that combatant as normal.

### Requirement: Unset Initiative Readout

The system SHALL render a combatant's card Initiative readout as "N/A" in a distinct warning color when that combatant has no `initiativeRoll`, instead of a numeric value, and SHALL render the numeric total in the normal style once an `initiativeRoll` is set.

#### Scenario: Unrolled combatant shows N/A in warning color
- **Given** a combatant with no `initiativeRoll`
- **When** the combatant's card is displayed
- **Then** the Initiative readout shows "N/A" styled in the warning/red color.

#### Scenario: Rolled combatant shows its numeric total in normal style
- **Given** a combatant with an `initiativeRoll` whose total is `0` or any other number
- **When** the combatant's card is displayed
- **Then** the Initiative readout shows the numeric total in the normal (non-warning) style.

### Requirement: Single Unified Combatant List

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

### Requirement: Performance

The combatant list SHALL NOT visibly reflow or shift page scroll position when the initiative modal opens, closes, or auto-advances between combatants.

#### Scenario: UI Layout Jumps
- **Given** a combatant list with 20 entries
- **When** the modal auto-advances from index 0 to index 1
- **Then** the overall page scroll position does not violently shift (the modal absolute positioning should prevent reflows of the main list elements).

### Requirement: Reliability

The system SHALL recover gracefully, without crashing, if the initiative modal's target combatant card is not present in the DOM when the modal attempts to anchor itself.

#### Scenario: Recovery behavior from missing DOM node
- **Given** a race condition where the `initiativeEditId` (whether set by auto-open or manual click) points to an id that no longer exists in the DOM (e.g. the combatant was removed)
- **When** the modal attempts to anchor itself to that combatant's card
- **Then** it gracefully closes automatically (position resolves to `null`) rather than crashing or rendering unanchored.
