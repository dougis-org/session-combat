## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Expand toggle — compact to large mode

The system SHALL provide a square expand icon button in the chat header that toggles the panel between compact (33vh fixed overlay) and large (calc(100vh - 60px) side-by-side) modes.

#### Scenario: User expands chat from compact mode

- **Given** the chat panel is in compact (33vh) mode
- **When** the user clicks the expand icon button
- **Then** the panel height becomes `calc(100vh - 60px)`, the panel enters the document flow (no longer a fixed overlay), and campaign content is rendered in a flex row beside the chat

#### Scenario: User collapses chat from large mode

- **Given** the chat panel is in large mode
- **When** the user clicks the expand icon button again (acting as a toggle)
- **Then** the panel returns to compact mode with fixed positioning, campaign content returns to full width, and the height reverts to `customHeight` if set, otherwise `33vh`

#### Scenario: Expand overrides custom drag height

- **Given** the user has dragged the panel to a custom height of 400px
- **When** the user clicks the expand button
- **Then** the panel renders at `calc(100vh - 60px)` regardless of the saved 400px value
- **And** clicking expand again returns to 400px (custom height is preserved)

---

### Requirement: ADDED Drag-to-resize handle

The system SHALL render a drag handle at the top edge of the chat panel in compact mode, allowing the user to drag vertically to set a custom height.

#### Scenario: User drags handle upward to increase height

- **Given** the chat panel is in compact mode at 33vh
- **When** the user mousedowns on the drag handle, moves the mouse upward by 100px, then releases
- **Then** the chat panel height increases by approximately 100px (clamped to window bounds)

#### Scenario: User drags handle below minimum height

- **Given** the chat panel is in compact mode
- **When** the user drags the handle to a position that would result in less than 150px height
- **Then** the panel height is clamped to 150px (minimum enforced)

#### Scenario: Drag handle is not shown in large mode

- **Given** the chat panel is in large mode
- **When** the user views the chat header
- **Then** no drag handle is rendered (drag resize is unavailable in full-height mode)

---

### Requirement: ADDED Custom height persistence with screen guard

The system SHALL persist the user's custom drag height to localStorage and restore it on reload, discarding the saved value if the screen dimensions differ by more than 100px in either dimension.

#### Scenario: Custom height restored on same screen

- **Given** the user dragged the chat to 450px on a screen of 1920×1080
- **When** the user reloads the page on the same screen
- **Then** the chat panel renders at 450px

#### Scenario: Custom height discarded on different screen

- **Given** the user dragged the chat to 450px on a screen of 1920×1080
- **When** the user reloads the page on a screen of 1280×800 (difference >100px)
- **Then** the chat panel renders at the default 33vh height

#### Scenario: localStorage error does not crash chat

- **Given** localStorage is unavailable or throws on read
- **When** the chat panel mounts
- **Then** the panel renders at the default 33vh height with no error thrown

---

### Requirement: ADDED Side-by-side layout in large mode

The system SHALL render campaign content and the large chat panel in a horizontal flex layout so campaign content remains fully visible alongside the chat.

#### Scenario: Campaign content reflows beside large chat

- **Given** the chat is in large mode
- **When** the campaign page renders
- **Then** campaign content occupies the remaining horizontal space (`flex-1`) beside the `w-80` chat panel

#### Scenario: Campaign content returns to full width on collapse

- **Given** the chat is in large mode (side-by-side)
- **When** the user collapses the chat to compact mode
- **Then** campaign content returns to full width and the chat renders as a fixed overlay

## MODIFIED Requirements

### Requirement: MODIFIED CampaignChat accepts onSizeChange prop

The system SHALL support an optional `onSizeChange?: (isLarge: boolean) => void` prop on `CampaignChat` so parent layouts can respond to large/compact transitions.

#### Scenario: Parent layout notified on expand

- **Given** `CampaignChat` is rendered with an `onSizeChange` callback
- **When** the user clicks the expand button
- **Then** `onSizeChange(true)` is called

#### Scenario: Parent layout notified on collapse from large mode

- **Given** `CampaignChat` is in large mode with an `onSizeChange` callback
- **When** the user clicks the expand button to collapse
- **Then** `onSizeChange(false)` is called

## REMOVED Requirements

No requirements are removed by this change.

## Traceability

- Proposal element "expand button" → Requirement: expand toggle
- Proposal element "drag-to-resize" → Requirement: drag-to-resize handle
- Proposal element "persist height with screen guard" → Requirement: custom height persistence
- Proposal element "side-by-side in large mode" → Requirement: side-by-side layout
- Design decision 1 (DockState extension) → Requirements: expand toggle, drag-to-resize handle
- Design decision 2 (onSizeChange prop) → Requirement: CampaignChat onSizeChange prop, side-by-side layout
- Design decision 3 (height resolution order) → Requirement: expand toggle (expand overrides drag scenario)
- Design decision 4 (drag handle) → Requirement: drag-to-resize handle
- Design decision 5 (localStorage persistence) → Requirement: custom height persistence
- Design decision 6 (150px minimum) → Requirement: drag-to-resize handle (minimum height scenario)
- All requirements → Task: implement-chat-window-resize (tasks.md)

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Drag does not trigger excessive re-renders

- **Given** the user drags the resize handle continuously
- **When** the mousemove events fire
- **Then** React state is only updated on mouseup (not on every pixel of movement), keeping re-renders to one per drag gesture

### Requirement: Security

See functional scenario: "localStorage error does not crash chat" — localStorage reads are wrapped in existing `safeGet` helpers that prevent error propagation. No sensitive data is stored. No new XSS vectors are introduced (no user-supplied content written to DOM; height is a numeric value from a drag gesture).

### Requirement: Reliability

#### Scenario: Event listeners cleaned up on unmount during drag

- **Given** the user has started a drag gesture (mousedown on handle, not yet released)
- **When** the `CampaignChat` component unmounts (e.g., navigation away)
- **Then** the `mousemove` and `mouseup` document listeners are removed and no state updates fire after unmount
