## MODIFIED Requirements

### Requirement: MODIFIED Dice pop-out trigger anchored to the chat dock

The system SHALL display a persistent dice-pool trigger button anchored at the bottom of the chat dock, which opens/closes the dice pool panel on click. The trigger SHALL render the vendored d20 icon (see `dice-iconography` capability) instead of literal `d20` text, while keeping its existing accessible name (matching `/roll|dice/i`) unchanged.

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

#### Scenario: Trigger displays the d20 icon, not text

- **Given** the chat dock renders with an enabled trigger
- **When** the trigger button's contents are inspected
- **Then** it renders the vendored d20 icon component and does not render the literal text `d20`

---

### Requirement: MODIFIED Dice staging pool

The system SHALL let the user add and remove dice of any supported size (d4, d6, d8, d10, d12, d20) to a staging pool within the dice panel, and edit a shared modifier, without issuing any roll or network request until the user explicitly commits. Each die-size control SHALL display that die size's vendored icon (see `dice-iconography` capability) alongside its staged count, instead of a plain `d{sides}` text label.

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

#### Scenario: Each die-size control shows its matching icon

- **Given** the panel is open
- **When** the six die-size add/remove controls are inspected
- **Then** each control renders the icon from `DIE_ICONS` matching its own die size (e.g. the d20 control renders the d20 icon, not a d6 icon or plain text)

---

### Requirement: MODIFIED Roll feed item rendering

The system SHALL render roll events in the chat feed as a distinct visual item showing the roller's name, timestamp, visibility marker, formula, per-die breakdown, and total. The item's dice glyph SHALL be the vendored d20 icon (see `dice-iconography` capability) instead of the 🎲 emoji.

#### Scenario: Roll feed item shows formula breakdown and total

- **Given** a `CampaignRoll` with `formula: "1d20+3"`, `rolls: [17]`, `total: 20`, `rollerName: "thegm"`, `visibility: { scope: "dm-only" }`, `createdAt: <timestamp>`
- **When** the roll is rendered in the feed
- **Then** the item displays "thegm", a formatted timestamp, "[DM]" visibility marker, "1d20+3", the breakdown "[17]", and "20"

#### Scenario: Group-scoped roll shows no visibility marker

- **Given** a `CampaignRoll` with `visibility: { scope: "group" }`
- **When** the roll is rendered in the feed
- **Then** no visibility marker (such as "[DM]") appears on the item

#### Scenario: Roll feed item is visually distinct from a message item

- **Given** both a `CampaignMessage` and a `CampaignRoll` are in the feed
- **When** the feed renders
- **Then** the roll item has a visual treatment (e.g., dice icon, background tint, or border) that distinguishes it from adjacent message items

#### Scenario: Roll feed item glyph is the vendored icon, not the emoji

- **Given** a `CampaignRoll` is rendered in the feed
- **When** the item's glyph is inspected
- **Then** it renders the vendored d20 icon component and does not render the 🎲 emoji character

## ADDED Requirements

### Requirement: ADDED Dice panel renders as an in-flow flex sibling to the left of the chat dock

The system SHALL render the dice panel (staging pool, modifier, visibility selector, and commit control) as an in-flow flex sibling positioned to the left of the `CampaignChat` drawer, mounted only while the panel is open, rather than as a `position: fixed` overlay portaled to `document.body`. The panel SHALL match the drawer's current height so the two form one visually contiguous block.

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
- **Then** the panel renders fully visible, unclipped, matching the drawer's current height

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

### Requirement: ADDED Feed auto-scrolls to a roll the current user just posted

The system SHALL scroll the chat feed so a roll the current user just committed (via the dice panel's "Roll" control) is visible immediately after it is appended, without reordering the feed and without changing scroll position for feed items arriving from other sources.

#### Scenario: Committing a roll scrolls the feed to show it

- **Given** the feed is scrolled such that the bottom is not visible, and the dice panel is open with a non-empty staged pool
- **When** the user clicks "Roll" and the commit succeeds (POST returns 201)
- **Then** the feed container's scroll position moves so the newly-appended roll item is visible, without requiring the user to scroll manually

#### Scenario: A roll from another player does not trigger auto-scroll

- **Given** the feed is scrolled such that the bottom is not visible
- **When** an SSE `roll` event for a roll posted by a different user arrives and is appended to the feed
- **Then** the feed's scroll position does not change

#### Scenario: Auto-scroll does not reorder the feed

- **Given** the feed contains items in chronological order
- **When** the current user's roll is appended and the auto-scroll occurs
- **Then** the feed's item order is unchanged (the new roll remains the last item, appended in place; it is not moved to the top or re-sorted)

## REMOVED Requirements

### Requirement: REMOVED Floating dice pop-out renders outside the chat dock's DOM subtree

**Reason**: Superseded by "ADDED Dice panel renders as an in-flow flex sibling to the left of the chat dock". The `document.body`-portal mechanism (with its own overlay root and `fixed`-position coordinates computed from the trigger's `getBoundingClientRect()`) solved height-clipping but anchored the panel *above* the trigger, which still visually stacks it over the chat dock — the exact "opens over the top of it" problem raised in GitHub issue #512. The new flex-sibling approach achieves the original non-clipping goal through in-flow layout instead of positioned-overlay math, while also placing the panel beside (not over) the dock.

**Migration**: Any test or code asserting the dice panel is portaled to a `#dice-pool-overlay-root` node under `document.body`, or asserting it is positioned via `fixed` coordinates independent of the drawer's layout, must be updated to assert sibling placement instead — see "ADDED Dice panel renders as an in-flow flex sibling to the left of the chat dock".
