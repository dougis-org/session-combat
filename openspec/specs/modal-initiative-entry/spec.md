## Purpose

Defines how the DM sets and reviews per-combatant initiative during active combat: a single unified combatant list (unrolled entries sorted to the top), a card-anchored, viewport-clamped `InitiativeEntry` modal that opens on click or automatically for unrolled combatants, and a visible "N/A" readout for combatants who haven't rolled yet.

## Requirements

### Requirement: Pinned Initiative Modal Overlay

The system SHALL render the `InitiativeEntry` UI as a viewport-fixed modal dialog centered in the viewport over a faint dim backdrop, independent of the position of the target `CombatantCard`, with its width sized to its content and capped at the viewport width minus a 16px margin on each side.

#### Scenario: User clicks to set initiative
- **Given** an active combat session with combatants in the list
- **When** the DM clicks the "Initiative" section in the header of a `CombatantCard`
- **Then** a modal dialog opens centered in the viewport over the dim backdrop, containing the `InitiativeEntry` UI for that combatant.

#### Scenario: User clicks outside the modal
- **Given** the Initiative modal is open
- **When** the DM clicks on the dim backdrop (outside the dialog)
- **Then** the modal closes and the `initiativeEditId` state is cleared.

#### Scenario: Modal never overflows the viewport
- **Given** any viewport size, including a narrow one
- **When** the initiative modal opens
- **Then** the dialog's rendered width never exceeds the viewport width minus 16px on each side, and it is centered regardless of which card is targeted or where the page is scrolled.

### Requirement: Initiative entry controls are never visually clipped

The system SHALL render the `InitiativeEntry` inputs (dice roll, total, flat bonus) so that their full border and focus indicator are visible on every side while focused, and SHALL provide vertical scrolling for tall content on the backdrop rather than on an inner container.

#### Scenario: Focused entry input shows its full border

- **Given** the initiative modal is open in "Enter Dice Roll" or "Enter Total" mode
- **When** the DM focuses the entry input
- **Then** the controls column has padding on all four sides (`p-1`), so the input's border/focus ring is not clipped at the bottom, top or left.

#### Scenario: Tall content still scrolls

- **Given** the modal content is taller than the viewport
- **When** the modal renders
- **Then** the backdrop has `overflow-y-auto`
- **And** the controls column has no `overflow-y-auto` or `max-h-[70vh]` (so it cannot create a horizontal scrollbar).

### Requirement: Entry row spans the available width

The system SHALL render the dice-roll and total entry rows at the full width of the controls column, with the input growing to fill the space left of the "Set" button, while keeping the row's horizontal (`flex` row) direction.

#### Scenario: Dice mode fills the width

- **Given** the modal is open in "Enter Dice Roll" mode
- **When** the modal renders
- **Then** the entry row has `w-full min-w-0`, the input has `min-w-0 flex-1`, and the row is not `flex-col`.

#### Scenario: Total mode fills the width

- **Given** the modal is open in "Enter Total" mode
- **When** the modal renders
- **Then** the same width classes apply as in dice mode.

### Requirement: Auto-Advance Initiative Prompt

The system SHALL automatically open the modal for the next combatant requiring an initiative roll when an initiative roll is successfully saved.

#### Scenario: Saving initiative auto-advances
- **Given** multiple combatants have an initiative of 0 (unrolled)
- **When** the DM saves the initiative for the currently active modal combatant
- **Then** the modal (and its backdrop) stay open and update to target the next combatant in the list that has not rolled yet.

#### Scenario: Auto-advance stops when all rolled
- **Given** there is only one combatant left with an initiative of 0
- **When** the DM saves the initiative for that final combatant
- **Then** the modal and backdrop close and the combatant list is fully sorted by rolled initiative.

### Requirement: Auto-Open on Unset Initiative

The system SHALL automatically open the initiative modal for the first combatant with no initiative roll, without requiring the DM to click the card's Initiative control — both when the combat view first renders and whenever a newly added combatant has no initiative roll.

#### Scenario: Auto-opens on initial combat view render
- **Given** an active combat session where one or more combatants have no `initiativeRoll` set and no initiative modal has yet been shown this session
- **When** the combat tracker view renders
- **Then** the initiative modal opens automatically for the first such combatant, without any click.

#### Scenario: Auto-opens for a newly added combatant
- **Given** the combat tracker is displayed and every existing combatant already has an `initiativeRoll`
- **When** the DM adds a new combatant (party member or enemy) that has no `initiativeRoll`
- **Then** the initiative modal opens automatically for the newly added combatant.

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

The combatant list SHALL NOT visibly reflow or shift page scroll position when the initiative modal opens, closes, or auto-advances between combatants, and the modal SHALL NOT register JavaScript layout-measurement listeners (resize, scroll, `ResizeObserver`) while open.

#### Scenario: UI Layout Jumps
- **Given** a combatant list with 20 entries
- **When** the modal auto-advances from index 0 to index 1
- **Then** the overall page scroll position does not shift (the modal is `fixed` and out of the list's layout flow).

#### Scenario: No layout listeners
- **Given** the modal is open
- **When** the viewport is resized or scrolled
- **Then** the dialog stays centered through CSS alone and the hook has registered no `resize`/`scroll` listeners or `ResizeObserver` for the modal.

### Requirement: Reliability

The system SHALL recover gracefully, without crashing or leaving the modal stuck open, if the initiative modal's target combatant is removed while the modal is open.

#### Scenario: Recovery behavior from missing DOM node
- **Given** the modal is open for a combatant (set by auto-open or manual click)
- **When** that combatant is removed from the combat, so its id no longer resolves to a combatant
- **Then** the modal and backdrop close automatically, `initiativeEditId` is cleared so auto-open can fire for others, and focus is restored.

### Requirement: Dimmed Backdrop

The system SHALL render a faint full-viewport dim backdrop behind the initiative modal whenever it is open, covering the main screen while leaving the content behind it visible, and SHALL NOT render the backdrop when the modal is closed. The backdrop SHALL stay mounted (no flash) while the modal auto-advances from one combatant to the next, and SHALL prevent the page behind it from scrolling.

#### Scenario: Backdrop dims the screen when the modal is open

- **Given** an active combat session with a combatant that has no `initiativeRoll`
- **When** the initiative modal opens
- **Then** an element with `data-testid="initiative-modal-backdrop"` is rendered as a `fixed inset-0` layer behind the dialog with a partially transparent black background (`bg-black/40`), so the combatant list remains visible through it.

#### Scenario: Backdrop is absent when the modal is closed

- **Given** every combatant has an `initiativeRoll`
- **When** the combat tracker renders
- **Then** no `initiative-modal-backdrop` element exists in the document.

#### Scenario: Backdrop persists across auto-advance

- **Given** the modal is open for combatant A and combatant B is also unrolled
- **When** the DM saves A's initiative and the modal advances to B
- **Then** the same backdrop element remains mounted (it is not removed and re-added)
- **And** the dialog now shows B.

#### Scenario: Page behind the modal does not scroll

- **Given** the modal is open
- **When** the backdrop is mounted
- **Then** `document.body.style.overflow` is `hidden`
- **And** when the modal closes, the previous `overflow` value is restored.

### Requirement: Content-Sized Centered Dialog

The system SHALL center the initiative dialog in the viewport (horizontally and vertically) and SHALL size its width to its content, up to the viewport width minus a 16px margin on each side, using CSS layout rather than JavaScript measurement. The dialog SHALL NOT show a horizontal scrollbar for any combatant name length.

#### Scenario: Dialog is centered and content-sized

- **Given** the modal is open
- **When** the dialog renders
- **Then** the backdrop is a flex container with `p-4` padding and the dialog centers itself with `m-auto` (not `items-center`/`justify-center`, which would clip the top of a dialog taller than the viewport)
- **And** the dialog has `w-max max-w-full`
- **And** the dialog has no inline `top`, `left`, `width`, or `transform` style.

#### Scenario: Long name does not create a scrollbar

- **Given** a combatant whose name is long enough to need more than half of the viewport width (issue #807)
- **When** the initiative modal opens for that combatant
- **Then** the dialog grows to fit the name (up to the viewport minus 16px per side)
- **And** neither the dialog nor the entry controls column has a horizontal scrollbar (`scrollWidth <= clientWidth`)
- **And** if the name is wider than the available space it wraps instead of overflowing.

#### Scenario: Tall dialog scrolls inside the backdrop

- **Given** the dialog is taller than the viewport (e.g. "Enter Dice Roll" mode on a short screen)
- **When** the modal renders
- **Then** the backdrop has `overflow-y-auto` so the DM can scroll to every control
- **And** the page behind does not scroll.

### Requirement: Accessible Dialog and Focus Management

The system SHALL expose the initiative modal as an accessible modal dialog and SHALL manage keyboard focus: focus moves into the dialog on open, Tab and Shift+Tab cycle within the dialog while it is open, focus returns to the previously focused element on close, and the dialog is re-focused on its first control when the modal advances to a different combatant.

#### Scenario: Dialog semantics

- **Given** the modal is open for a combatant named "Orc"
- **When** the dialog is queried by role
- **Then** an element with `role="dialog"` and `aria-modal="true"` exists
- **And** its accessible name is derived (via `aria-labelledby`) from the "Set Initiative" heading and the combatant's name heading, e.g. "Set Initiative Orc".

#### Scenario: Focus moves into the dialog on open

- **Given** focus is on the combatant card's Initiative control
- **When** the DM clicks it and the modal opens
- **Then** `document.activeElement` is inside the dialog (its first tabbable control).

#### Scenario: Tab wraps within the dialog

- **Given** the modal is open and focus is on the last tabbable control in the dialog
- **When** the DM presses Tab
- **Then** focus moves to the first tabbable control in the dialog, not to the page behind
- **And** Shift+Tab from the first control moves focus to the last.

#### Scenario: Focus is restored on close

- **Given** the modal was opened from the card's Initiative control, which had focus
- **When** the modal closes (Set on the last combatant, close button, Escape, or click on the backdrop)
- **Then** focus returns to that control if it is still in the document.

#### Scenario: Auto-advance refocuses the dialog

- **Given** the modal is open for combatant A and combatant B is also unrolled
- **When** the DM saves A's initiative and the modal advances to B
- **Then** focus is inside the dialog on its first tabbable control (it does not drop to `<body>` and is not restored to the page behind).
