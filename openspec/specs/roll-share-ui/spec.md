## Purpose

Define the in-chat dice-rolling UI: a staging pool of dice controls with visible labels, a standalone percentile (d%) control, an explicit commit that submits one combined roll through `/api/campaigns/[id]/rolls`, and an interleaved feed that renders roll history and streamed rolls alongside chat messages.

## Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-06-20-issue-317-roll-share-ui/design.md) document, not a replacement.

### Requirement: ADDED Commit rolls the entire staged pool as one combined roll

The system SHALL, on explicit commit ("Roll"), roll every staged die across all sizes plus the modifier as a single combined roll, and POST one request to `/api/campaigns/[id]/rolls` matching the existing API contract unchanged.

#### Scenario: Commit posts one combined formula, rolls, and total

- **Given** the pool has 2 staged d6, 2 staged d8, and modifier 3
- **When** the user clicks "Roll"
- **Then** exactly one POST to `/api/campaigns/[id]/rolls` is made with `formula: "2d6+2d8+3"`, `rolls` containing exactly 4 numeric values (each within its die's 1..sides range), `total` equal to the sum of `rolls` plus 3, and `visibility` matching the pop-out's current visibility selection

#### Scenario: Commit with zero modifier omits the modifier from formula

- **Given** the pool has 1 staged d20 and modifier is empty or 0
- **When** the user clicks "Roll"
- **Then** the POST is made with `formula: "1d20"` (no `+0` suffix)

#### Scenario: Commit with a single staged die still requires explicit commit

- **Given** the pool has exactly 1 staged d20 and no other dice
- **When** the user adds the d20 to the pool
- **Then** no roll occurs and no POST is made
- **And when** the user then clicks "Roll"
- **Then** exactly one POST is made for that single die

#### Scenario: Roll button is disabled when the pool is empty

- **Given** the pool has zero staged dice of any size
- **When** the pop-out renders
- **Then** the "Roll" commit control is disabled

#### Scenario: Roll button is disabled while a commit is in flight

- **Given** a roll POST is pending (awaiting server response)
- **When** the pop-out re-renders
- **Then** the "Roll" control and all pool add/remove controls are disabled until the POST resolves or rejects

#### Scenario: Successful commit clears the staged pool

- **Given** a commit POST resolves with status 201
- **When** the response is handled
- **Then** the staged pool returns to empty (all counts 0, modifier reset to 0) and the resulting roll is passed to the feed exactly as `RollFeedItem` renders rolls today

#### Scenario: 409 response (no active session race) shows inline error and preserves the staged pool

- **Given** the pop-out appears enabled (an active session existed when opened) but the server returns 409 on commit
- **When** the POST resolves with status 409
- **Then** an inline error message "No active session" is shown in the pop-out, no roll is added to the feed, and the staged pool, modifier, and visibility selection are NOT cleared (the user can retry once a session is active again)

---

### Requirement: ADDED Interleaved feed of messages and rolls

The system SHALL display messages and rolls in a single unified feed sorted by `createdAt` ascending.

#### Scenario: Messages and rolls interleave by timestamp

- **Given** a message at time T1, a roll at time T2 > T1, and a message at time T3 > T2 loaded from history
- **When** the feed renders
- **Then** items appear in order: message(T1), roll(T2), message(T3)

#### Scenario: Stream roll event appended after existing feed

- **Given** an existing feed with items up to time T
- **When** an SSE event of type "roll" with `createdAt` > T arrives
- **Then** the roll item is appended to the end of the feed without re-ordering existing items

#### Scenario: Duplicate roll id from stream is ignored

- **Given** a roll with id "roll-abc" was loaded from history into the feed
- **When** an SSE event of type "roll" arrives with the same id "roll-abc"
- **Then** the feed length does not increase and "roll-abc" appears only once

---

### Requirement: ADDED Roll history loaded on dock expand

The system SHALL fetch roll history for the active session when the chat dock is expanded, in parallel with message history.

#### Scenario: Roll history fetched with active sessionId on expand

- **Given** the dock is collapsed, `activeSessionId` is "session-xyz"
- **When** the user expands the dock
- **Then** a GET to `/api/campaigns/[id]/rolls?sessionId=session-xyz&limit=30` is made

#### Scenario: Roll history skipped when no active session

- **Given** the dock is collapsed, `activeSessionId` is null
- **When** the user expands the dock
- **Then** no GET to `/api/campaigns/[id]/rolls` is made; message history is still fetched normally

#### Scenario: History messages and rolls merged and sorted by createdAt

- **Given** message history returns items at T1 and T3, roll history returns an item at T2
- **When** both fetches resolve
- **Then** the feed displays items sorted T1, T2, T3

---

**Note (removed 2026-08-29, `decouple-dice-roll-capability`):** The requirement formerly
here — "ADDED CampaignChat submits externally-requested rolls through its existing commit
path" — was removed. `GlobalDiceFab` (and any future roll-triggering surface) now submits
directly via the shared `lib/dice/useRollSubmission.ts` capability (see
`dice-pool-shared-state` capability); there is no longer an "externally-requested roll"
concept for `CampaignChat` to receive, scope-check, or forward. Chat consumes every roll —
its own and everyone else's — purely via the SSE `'roll'` stream event. See this
capability's "MODIFIED Feed auto-scrolls on a new dice roll, consumed solely via the SSE
stream" requirement below for the current behavior.

---

### Requirement: MODIFIED CampaignChat accepts activeSessionId prop

The system SHALL accept an `activeSessionId: string | null` prop on `CampaignChat` and use it to gate roll history fetching and the dice pop-out trigger.

#### Scenario: activeSessionId null disables roll functionality

- **Given** `CampaignChat` is rendered with `activeSessionId={null}`
- **When** the dock is expanded
- **Then** the dice pop-out trigger is disabled, no roll history fetch is attempted, and the message feed loads normally

#### Scenario: activeSessionId non-null enables roll functionality

- **Given** `CampaignChat` is rendered with `activeSessionId="session-abc"`
- **When** the dock is expanded
- **Then** the dice pop-out trigger is enabled and roll history is fetched for "session-abc"

---

### Requirement: MODIFIED Roll-entry strip is replaced by the dice pop-out trigger and pool

The always-visible roll-entry strip (six immediate-click die buttons, a modifier input, and a visibility selector, permanently rendered below the chat composer) is removed from the chat dock's default layout and replaced by the dice pop-out trigger (see "MODIFIED Dice pop-out trigger anchored to the chat dock"). The modifier input and visibility selector remain, relocated into the pop-out.

#### Scenario: No always-visible die buttons remain in the chat dock body

- **Given** a campaign page where the chat dock is expanded and `activeSessionId` is non-null
- **When** the dock content renders
- **Then** no permanently-visible d4/d6/d8/d10/d12/d20 buttons are present in the chat dock's body outside of the (closed-by-default) pop-out

#### Scenario: Visibility selector defaults to group, now inside the pop-out

- **Given** the pop-out is first opened
- **When** no user interaction with the visibility control has occurred
- **Then** the visibility selector inside the pop-out shows "Group" as the selected value

#### Scenario: DM-only visibility sends correct scope

- **Given** the user has selected "DM-only" in the pop-out's visibility selector
- **When** the user commits a roll
- **Then** the POST body includes `visibility: { scope: "dm-only" }`

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

The system SHALL let the user add and remove dice of any supported size (d4, d6, d8, d10, d12, d20) to a staging pool within the dice panel, and edit a shared modifier, without issuing any roll or network request until the user explicitly commits. Each die-size control SHALL display that die size's vendored icon (see `dice-iconography` capability) at 21x21px alongside its staged count **and a persistent, visible `d{sides}` text label**. The previously-required per-control `title` tooltip is no longer required (the visible label supersedes it) and SHALL be removed.

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

#### Scenario: Each die-size control shows a persistent visible label

- **Given** the panel is open
- **When** the d20 add control is inspected
- **Then** the visible text `d20` is rendered within the control (not only in a `title` or `aria-label`), and analogously for d4, d6, d8, d10, d12

#### Scenario: Die-size controls carry no title tooltip

- **Given** the panel is open
- **When** any die-size add control is inspected
- **Then** it has no `title` attribute

---

### Requirement: ADDED Standalone percentile (d%) roll control

The dice panel SHALL provide a standalone percentile control, rendered inline in the same row as the pool die controls (as the last item), that on activation performs a single percentile roll. The control is not a poolable die: it has no staged count, no remove affordance, is not combined with staged dice, and does not apply the shared modifier. It SHALL render two `DiceD10Icon`s and the visible label `d%` (see `dice-iconography` capability).

A percentile roll SHALL be produced by two independent `rollDie(10)` results (`tensFace`, `onesFace`) decoded as:

- `tensDigit = tensFace % 10`, `onesDigit = onesFace % 10`
- `value = tensDigit * 10 + onesDigit`; when `value` is `0`, `value` is `100`

It SHALL be committed through `/api/campaigns/[id]/rolls` with the existing contract unchanged: `formula: "d%"`, `rolls: [value]` (a single integer, 1..100 — the decoded value), `total: value`, and `visibility` matching the panel's current selection.

#### Scenario: Percentile control renders with the d% glyph and no count

- **Given** the dice panel is open
- **When** the percentile control is inspected
- **Then** it renders two d10 icons and the visible label `d%`, has no staged-count badge, and has no remove control

#### Scenario: Activating the percentile control commits one roll

- **Given** the dice panel is open and a campaign session is active
- **When** the user activates the percentile control
- **Then** exactly one POST to `/api/campaigns/[id]/rolls` is made with `formula: "d%"`, `rolls` containing exactly one integer in 1..100, `total` equal to that integer, and `visibility` matching the panel's current selection
- **AND** the staged pool and modifier are unchanged

#### Scenario: Percentile decode covers the tabletop special case

- **Given** the two d10 results are `tensFace = 10` and `onesFace = 10`
- **When** the percentile value is decoded
- **Then** the value is `100`

#### Scenario: Percentile decode of a "00" tens with a non-zero ones

- **Given** the two d10 results are `tensFace = 10` and `onesFace = 9`
- **When** the percentile value is decoded
- **Then** the value is `9`

#### Scenario: Percentile control is unavailable without an active session

- **Given** the chat-dock dice panel and `activeSessionId` is null
- **When** the panel state is inspected
- **Then** the percentile control is disabled on the same terms as the pool "Roll" commit control

---

### Requirement: ADDED Roll feed renders a percentile roll through the existing formula path

The system SHALL render a persisted percentile `CampaignRoll` (`formula: "d%"`, single-element `rolls`) using the same roll-feed-item treatment as any other roll — roller name, timestamp, visibility marker, formula, breakdown, total — with no percentile-specific layout.

#### Scenario: Percentile roll feed item

- **Given** a `CampaignRoll` with `formula: "d%"`, `rolls: [97]`, `total: 97`
- **When** the roll is rendered in the feed
- **Then** the item displays `d%`, the breakdown `[97]`, and `97`, with the standard roll-item visual treatment

#### Scenario: Percentile roll feed item for the 100 result

- **Given** a `CampaignRoll` with `formula: "d%"`, `rolls: [100]`, `total: 100`
- **When** the roll is rendered in the feed
- **Then** the item displays `d%`, the breakdown `[100]`, and `100`

---

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

### Requirement: MODIFIED Feed auto-scrolls on a new dice roll, consumed solely via the SSE stream

_(Modified 2026-08-29, `decouple-dice-roll-capability`.)_ The system SHALL scroll the chat feed so the current user's own committed roll is always visible immediately after it is appended, and shall append every roll to the feed solely via the SSE `'roll'` stream event — there is no longer a separate local POST-response callback path that appends a roll to the feed ahead of, or independent from, the stream. For a roll committed by a different user, the system SHALL only auto-scroll if the feed was already within approximately 100px of the bottom immediately before the roll was appended — a user who has scrolled up to read history (or is at the top triggering an older-page load) is NOT auto-scrolled by another player's roll. Auto-scroll SHALL fire at most once per roll, determined by checking the ingested roll's `rollerId` against the current user, not by which code path appended it (since there is now only one). The feed's item order is unaffected. Auto-scroll does NOT apply to plain chat messages (unchanged from today: messages never auto-scroll).

#### Scenario: Committing a roll scrolls the feed to show it once ingested via the stream

- **Given** the feed is scrolled such that the bottom is not visible, and the dice panel
  (whether chat-docked or `GlobalDiceFab`, once sent to session chat) has just had a roll
  committed by the current user
- **When** the SSE `'roll'` event for that roll is received and appended to the feed
- **Then** the feed container's scroll position moves so the newly-appended roll item is
  visible, without requiring the user to scroll manually, and without any earlier
  optimistic append having already placed the item in the feed

#### Scenario: The roller is scrolled to their own roll even if they had scrolled away from the bottom

- **Given** the feed is scrolled such that the bottom is not visible, and the current user
  has just committed a roll (via either the chat-docked panel or `GlobalDiceFab`'s "send to
  session chat")
- **When** the SSE `'roll'` event for that roll arrives, identified as the current user's
  own roll via `rollerId === user.userId`
- **Then** the feed container's scroll position moves so the roll is visible, regardless of
  how far from the bottom the user had scrolled

#### Scenario: A roll from another player triggers auto-scroll when the user is already near the bottom

- **Given** the feed's scroll position is within 100px of the bottom
- **When** an SSE `roll` event for a roll posted by a different user arrives and is
  appended to the feed
- **Then** the feed container's scroll position moves so the newly-appended roll item is
  visible

#### Scenario: A roll from another player does not yank the feed when the user has scrolled away to read history

- **Given** the feed's scroll position is more than 100px from the bottom (e.g. the user
  scrolled up to read earlier messages, or is at the top to trigger the older-page load)
- **When** an SSE `roll` event for a roll posted by a different user arrives and is
  appended to the feed
- **Then** the feed container's scroll position does NOT change

#### Scenario: A roll submitted while chat was unmounted still scrolls the feed once ingested after chat mounts

- **Given** a roll was submitted via `GlobalDiceFab` while no `CampaignChat` instance was
  mounted, and the user subsequently opens/mounts chat
- **When** the feed loads that roll via history (on expand) or, if chat was already open
  when the roll landed, via the SSE stream
- **Then** the roll appears in the feed exactly as any other roll does, with the same
  rollerId-based auto-scroll rule applied if it arrives live via the stream

#### Scenario: Auto-scroll does not reorder the feed

- **Given** the feed contains items in chronological order
- **When** a roll is appended and the auto-scroll occurs
- **Then** the feed's item order is unchanged (the new roll remains the last item, appended
  in place; it is not moved to the top or re-sorted)

#### Scenario: A new chat message does not trigger auto-scroll

- **Given** the feed is scrolled such that the bottom is not visible
- **When** a new `message`-kind item (from either the composer's optimistic append or an
  SSE `message` event) is appended to the feed
- **Then** the feed's scroll position does not change

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

---

### Requirement: REMOVED Immediate-click-to-roll behavior

Reason for removal: Superseded by the stage-then-commit model. The prior behavior (a single click on a die button immediately rolled and posted) is replaced by "ADDED Dice staging pool" and "ADDED Commit rolls the entire staged pool as one combined roll," which require an explicit "Roll" commit for every roll, including a pool of exactly one die.

---

### Requirement: REMOVED Floating dice pop-out renders outside the chat dock's DOM subtree

**Reason**: Superseded by "ADDED Dice panel renders as an in-flow flex sibling to the left of the chat dock" (subsequently further modified — see "MODIFIED Dice panel renders as an in-flow flex sibling to the left of the chat dock"). The `document.body`-portal mechanism (with its own overlay root and `fixed`-position coordinates computed from the trigger's `getBoundingClientRect()`) solved height-clipping but anchored the panel *above* the trigger, which still visually stacks it over the chat dock — the exact "opens over the top of it" problem raised in GitHub issue #512. The new flex-sibling approach achieves the original non-clipping goal through in-flow layout instead of positioned-overlay math, while also placing the panel beside (not over) the dock.

**Migration**: Any test or code asserting the dice panel is portaled to a `#dice-pool-overlay-root` node under `document.body`, or asserting it is positioned via `fixed` coordinates independent of the drawer's layout, must be updated to assert sibling placement instead — see "MODIFIED Dice panel renders as an in-flow flex sibling to the left of the chat dock".

---

## Traceability

- Proposal element "Unified feed type replacing messages state" → Requirements: Interleaved feed of messages and rolls
- Proposal element "Roll feed item visually distinct" → Requirements: Roll feed item rendering
- Proposal element "SSE stream extended to consume roll events" → Requirements: Interleaved feed (stream scenario), Duplicate dedup scenario
- Proposal element "Roll history fetch on expand" → Requirements: Roll history loaded on dock expand
- Proposal element "activeSessionId as prop" → Requirements: MODIFIED CampaignChat accepts activeSessionId prop

- Design decision 1 (FeedItem local type) → Requirements: Interleaved feed of messages and rolls
- Design decision 2 (activeSessionId prop) → Requirements: MODIFIED CampaignChat accepts activeSessionId prop
- Design decision 3 (sorted insert) → Requirements: Interleaved feed — ordering scenarios
- Design decision 4 (parallel fetch) → Requirements: Roll history loaded on dock expand

- Requirements → Tasks: FeedItem/stream, RollFeedItem, history fetch, and campaign page prop requirements map to tasks in `openspec/changes/archive/2026-06-20-issue-317-roll-share-ui/tasks.md`

**From the `multi-dice-pool-popout` change (archived 2026-08-19):**

- Proposal element "Staging pool (add/remove dice of any size, shared modifier, explicit Roll commit)" → Requirements: ADDED Dice staging pool; ADDED Commit rolls the entire staged pool as one combined roll
- Proposal element "Floating pop-out outside the chat dock frame, triggered by a d20 icon" → Requirements: ADDED Dice pop-out trigger anchored to the chat dock; ADDED Floating dice pop-out renders outside the chat dock's DOM subtree
- Proposal element "RollEntryStrip removed" → Requirements: MODIFIED Roll-entry strip is replaced by the dice pop-out trigger and pool; REMOVED Immediate-click-to-roll behavior
- Requirements → Tasks: see `openspec/changes/archive/2026-08-19-multi-dice-pool-popout/tasks.md`

**From the `dice-roll-enhancements` change (archived 2026-08-20):**

- Proposal element "Vendor dice-face SVG icon set (d4-d20), replace text/emoji glyphs" → Requirements: MODIFIED Dice pop-out trigger anchored to the chat dock; MODIFIED Dice staging pool; MODIFIED Roll feed item rendering (see also the `dice-iconography` capability)
- Proposal element "Dice panel as flex sibling replacing the document.body portal" → Requirements: MODIFIED Dice panel renders as an in-flow flex sibling to the left of the chat dock; REMOVED Floating dice pop-out renders outside the chat dock's DOM subtree
- Proposal element "Auto-scroll feed to the user's own newly-posted roll" → Requirements: MODIFIED Feed auto-scrolls on a new dice roll, gated by bottom proximity for remote rolls
- Requirements → Tasks: see `openspec/changes/archive/2026-08-20-dice-roll-enhancements/tasks.md`

**From the `dice-panel-scroll-fixes` change (archived 2026-08-21):**

- Proposal element "Increase dice icon sizes by 50%" → Requirements: MODIFIED Dice pop-out trigger anchored to the chat dock; MODIFIED Dice staging pool
- Proposal element "Add native `title` tooltips" → Requirements: MODIFIED Dice pop-out trigger anchored to the chat dock (tooltip scenario); MODIFIED Dice staging pool (tooltip scenario)
- Proposal element "Remove the dice panel's forced height-match to the chat drawer" → Requirements: MODIFIED Dice panel renders as an in-flow flex sibling to the left of the chat dock
- Proposal element "Auto-scroll the feed to the bottom for every new dice roll, for every user" → Requirements: MODIFIED Feed auto-scrolls on a new dice roll, gated by bottom proximity for remote rolls (refined from unconditional to bottom-proximity-gated for remote rolls during PR review on PR #519 — the roller's own roll always scrolls regardless of proximity)
- Requirements → Tasks: see `openspec/changes/archive/2026-08-21-dice-panel-scroll-fixes/tasks.md`

**From the `decouple-dice-roll-capability` change (archived 2026-08-29):**

- Proposal "What Changes" (chat's optimistic roll append removed) → Requirements: MODIFIED
  Feed auto-scrolls on a new dice roll, consumed solely via the SSE stream
- Proposal "Scope" (external-roll-request path removed) → Requirements: REMOVED ADDED
  CampaignChat submits externally-requested rolls through its existing commit path
- Design decision 4 (`useChatFeed` owns SSE-only ingestion, `handleRollPosted` deleted) →
  Requirements: MODIFIED Feed auto-scrolls on a new dice roll, consumed solely via the SSE
  stream
- Requirements → Tasks: see `openspec/changes/archive/2026-08-29-decouple-dice-roll-capability/tasks.md`, "Remove optimistic roll append" and "Delete diceSessionBridge test coverage for externally-requested rolls" task groups

---

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Feed append does not re-sort on SSE roll event

- **Given** a feed with 50+ existing items
- **When** a single SSE roll event arrives
- **Then** the feed item is appended without a full array sort; no perceptible layout thrash occurs

### Requirement: Security

See functional scenarios: "DM-only visibility sends correct scope", "409 response (no active session race) shows inline error". Visibility enforcement is owned by the server (SSE fan-out in `emitFiltered`) and is not re-implemented in the UI beyond using `canSeeRoll` as a secondary guard for unexpected events.

### Requirement: Reliability

#### Scenario: Duplicate roll dedup across history and stream

See functional scenario: "Duplicate roll id from stream is ignored". The `seenIds` ref must be extended to cover roll ids in addition to message ids.

#### Scenario: No `document` access during server render for the dice pop-out

- **Given** the chat dock (including the dice pop-out trigger) is rendered in a Node.js (non-browser) environment
- **When** the module is imported and the component tree is server-rendered
- **Then** no `document`/overlay-root creation is attempted
