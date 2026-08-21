## MODIFIED Requirements

### Requirement: MODIFIED Dice panel renders as an in-flow flex sibling to the left of the chat dock

The system SHALL render the dice panel (staging pool, modifier, visibility selector, and commit control) as an in-flow flex sibling positioned to the left of the `CampaignChat` drawer, mounted only while the panel is open, rather than as a `position: fixed` overlay portaled to `document.body`. The panel SHALL size its height to its own content (not to the drawer's height); the panel and drawer are no longer required to share the same height.

#### Scenario: Dice panel DOM node is a sibling of the drawer, not a document.body portal

- **Given** the dice panel is open
- **When** the DOM is queried
- **Then** the panel's root element is found as a sibling of the chat dock's `role="complementary"` drawer element (both children of the same flex-row wrapper), and is NOT rendered under a separate `document.body`-attached overlay root

#### Scenario: Dice panel appears to the left of the chat drawer

- **Given** the dice panel is open
- **When** the bounding positions of the panel and the drawer are compared
- **Then** the panel's horizontal position is entirely to the left of the drawer's horizontal position (the panel does not overlap the drawer)

#### Scenario: Dice panel is not clipped by the drawer's height/overflow constraint

- **Given** the chat dock drawer has a fixed height and `overflow` constraint (as it does today via `customHeight`/dock sizing)
- **When** the dice panel is open
- **Then** the panel renders fully visible and unclipped, at its own content-driven height, independent of the drawer's current height

#### Scenario: Dice panel height matches its content, not the drawer's height

- **Given** the dice panel is open and the chat drawer's current height is substantially taller than the panel's content (e.g. the drawer has been drag-resized to a large height)
- **When** the panel's rendered height is measured
- **Then** the panel's height reflects only its own content (the die controls, modifier/visibility row, and Roll button, plus any inline error text) and does not extend to match the drawer's height

#### Scenario: Dice panel closes on outside click

- **Given** the panel is open
- **When** the user clicks outside both the panel and the trigger
- **Then** the panel closes

#### Scenario: Dice panel closes on Escape

- **Given** the panel is open
- **When** the user presses Escape
- **Then** the panel closes

#### Scenario: Dice panel is absent from the DOM when closed

- **Given** the panel is closed
- **When** the DOM is queried
- **Then** no dice panel element is present, and no overlay-root DOM node is created for it

---

### Requirement: MODIFIED Feed auto-scrolls on a new dice roll, gated by bottom proximity for remote rolls

The system SHALL scroll the chat feed so the current user's own committed roll is always visible immediately after it is appended, regardless of whether the local POST-response callback or the SSE echo of that same roll is the code path that appends it to the feed. For a roll committed by a different user, the system SHALL only auto-scroll if the feed was already within approximately 100px of the bottom immediately before the roll was appended — a user who has scrolled up to read history (or is at the top triggering an older-page load) is NOT auto-scrolled by another player's roll. Auto-scroll SHALL fire at most once per roll. The feed's item order is unaffected. Auto-scroll does NOT apply to plain chat messages (unchanged from today: messages never auto-scroll).

#### Scenario: Committing a roll scrolls the feed to show it

- **Given** the feed is scrolled such that the bottom is not visible, and the dice panel is open with a non-empty staged pool
- **When** the user clicks "Roll" and the commit succeeds (POST returns 201)
- **Then** the feed container's scroll position moves so the newly-appended roll item is visible, without requiring the user to scroll manually

#### Scenario: The roller is scrolled to their own roll even if they had scrolled away from the bottom

- **Given** the feed is scrolled such that the bottom is not visible, and the current user has just committed a roll
- **When** the commit succeeds and the roll is appended to the feed
- **Then** the feed container's scroll position moves so the roll is visible, regardless of how far from the bottom the user had scrolled

#### Scenario: A roll from another player triggers auto-scroll when the user is already near the bottom

- **Given** the feed's scroll position is within 100px of the bottom
- **When** an SSE `roll` event for a roll posted by a different user arrives and is appended to the feed
- **Then** the feed container's scroll position moves so the newly-appended roll item is visible

#### Scenario: A roll from another player does not yank the feed when the user has scrolled away to read history

- **Given** the feed's scroll position is more than 100px from the bottom (e.g. the user scrolled up to read earlier messages, or is at the top to trigger the older-page load)
- **When** an SSE `roll` event for a roll posted by a different user arrives and is appended to the feed
- **Then** the feed container's scroll position does NOT change

#### Scenario: The current user's own roll scrolls the feed even if the SSE echo of it arrives before the POST response

- **Given** the feed is scrolled such that the bottom is not visible, and the current user has just committed a roll
- **When** the SSE broadcast of that same roll (identified by its id, and identifiable as the current user's own roll via `rollerId`) is delivered to the current user's own connection before, at the same time as, or after the local POST-response callback for that roll
- **Then** the feed still scrolls to show the roll exactly once, regardless of the order in which the two events are processed

#### Scenario: Auto-scroll does not reorder the feed

- **Given** the feed contains items in chronological order
- **When** a roll is appended and the auto-scroll occurs
- **Then** the feed's item order is unchanged (the new roll remains the last item, appended in place; it is not moved to the top or re-sorted)

#### Scenario: A new chat message does not trigger auto-scroll

- **Given** the feed is scrolled such that the bottom is not visible
- **When** a new `message`-kind item (from either the composer's optimistic append or an SSE `message` event) is appended to the feed
- **Then** the feed's scroll position does not change

---

### Requirement: MODIFIED Dice pop-out trigger anchored to the chat dock

The system SHALL display a persistent dice-pool trigger button anchored at the bottom of the chat dock, which opens/closes the dice pool panel on click. The trigger SHALL render the vendored d20 icon (see `dice-iconography` capability) at 24x24px (a 50% increase from the icon size shipped by `dice-roll-enhancements`), instead of literal `d20` text, while keeping its existing accessible name (matching `/roll|dice/i`) unchanged. The trigger SHALL carry a `title` attribute of "Dice Rolls for main screen pop out".

#### Scenario: Trigger renders and is enabled when a session is active

- **Given** a campaign page where `activeSessionId` is a non-null string
- **When** the chat dock renders
- **Then** a button with accessible name matching `/roll|dice/i` is visible and enabled at the bottom of the chat dock

#### Scenario: Trigger is disabled when no active session

- **Given** a campaign page where `activeSessionId` is null
- **When** the chat dock renders
- **Then** the dice pool trigger button is disabled and, if opened previously, the panel is closed

#### Scenario: Clicking the trigger opens the panel

- **Given** the trigger is enabled and the panel is closed
- **When** the user clicks the trigger
- **Then** the dice panel becomes visible in the document

#### Scenario: Clicking the trigger again closes the panel

- **Given** the panel is open
- **When** the user clicks the trigger again
- **Then** the dice panel is removed from the document

#### Scenario: Trigger displays the d20 icon at the increased size, not text

- **Given** the chat dock renders with an enabled trigger
- **When** the trigger button's contents are inspected
- **Then** it renders the vendored d20 icon component at 24x24px and does not render the literal text `d20`

#### Scenario: Trigger exposes a tooltip on hover

- **Given** the chat dock renders with an enabled trigger
- **When** the trigger button's `title` attribute is inspected
- **Then** it equals "Dice Rolls for main screen pop out"

---

### Requirement: MODIFIED Dice staging pool

The system SHALL let the user add and remove dice of any supported size (d4, d6, d8, d10, d12, d20) to a staging pool within the dice panel, and edit a shared modifier, without issuing any roll or network request until the user explicitly commits. Each die-size control SHALL display that die size's vendored icon (see `dice-iconography` capability) at 21x21px (a 50% increase from the icon size shipped by `dice-roll-enhancements`) alongside its staged count, instead of a plain `d{sides}` text label, and SHALL carry a `title` attribute matching its die size (e.g. `"d20"`).

#### Scenario: Adding a die increments its staged count

- **Given** the panel is open and the pool is empty
- **When** the user adds a d6 twice and a d8 twice
- **Then** the pool shows a staged count of 2 for d6 and 2 for d8, and 0 for all other sizes
- **AND** no network request has been made

#### Scenario: Removing a die decrements its staged count

- **Given** the pool has a staged count of 2 for d6
- **When** the user removes one d6
- **Then** the pool shows a staged count of 1 for d6

#### Scenario: Staged count cannot go below zero

- **Given** the pool has a staged count of 0 for d10
- **When** the user attempts to remove a d10
- **Then** the staged count for d10 remains 0 and no error is raised

#### Scenario: Modifier is editable independent of staged dice

- **Given** the pool is empty
- **When** the user sets the modifier to -2
- **Then** the modifier value is -2 and no die counts change

#### Scenario: Each die-size control shows its matching icon at the increased size

- **Given** the panel is open
- **When** the six die-size add/remove controls are inspected
- **Then** each control renders the icon from `DIE_ICONS` matching its own die size at 21x21px (e.g. the d20 control renders the d20 icon, not a d6 icon or plain text)

#### Scenario: Each die-size control exposes a tooltip naming its die size

- **Given** the panel is open
- **When** the `title` attribute of the d20 add control is inspected
- **Then** it equals "d20" (and analogously for d4, d6, d8, d10, d12)

---

## Traceability

- Proposal element "Increase dice icon sizes by 50%" → Requirements: MODIFIED Dice pop-out trigger anchored to the chat dock; MODIFIED Dice staging pool
- Proposal element "Add native `title` tooltips" → Requirements: MODIFIED Dice pop-out trigger anchored to the chat dock (tooltip scenario); MODIFIED Dice staging pool (tooltip scenario)
- Proposal element "Remove the dice panel's forced height-match to the chat drawer" → Requirements: MODIFIED Dice panel renders as an in-flow flex sibling to the left of the chat dock
- Proposal element "Auto-scroll the feed to the bottom for every new dice roll, for every user" → Requirements: MODIFIED Feed auto-scrolls on a new dice roll, gated by bottom proximity for remote rolls
- Design decision D1 (icon size is a call-site prop change) → Requirements: MODIFIED Dice pop-out trigger anchored to the chat dock; MODIFIED Dice staging pool
- Design decision D2 (native `title`, no tooltip component) → Requirements: MODIFIED Dice pop-out trigger anchored to the chat dock; MODIFIED Dice staging pool
- Design decision D3 (content-driven panel height) → Requirements: MODIFIED Dice panel renders as an in-flow flex sibling to the left of the chat dock
- Design decision D4 (scrollToBottom called from both append paths, no ref race; refined during PR review to gate remote rolls behind bottom proximity) → Requirements: MODIFIED Feed auto-scrolls on a new dice roll, gated by bottom proximity for remote rolls
