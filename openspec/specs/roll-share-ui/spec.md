## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-06-20-issue-317-roll-share-ui/design.md) document, not a replacement.

### Requirement: ADDED Dice pop-out trigger anchored to the chat dock

The system SHALL display a persistent d20 trigger icon/button anchored at the bottom of the chat dock, which opens/closes the dice pop-out on click.

#### Scenario: Trigger renders and is enabled when a session is active

- **Given** a campaign page where `activeSessionId` is a non-null string
- **When** the chat dock renders
- **Then** a button with accessible name matching `/roll|dice/i` is visible and enabled at the bottom of the chat dock

#### Scenario: Trigger is disabled when no active session

- **Given** a campaign page where `activeSessionId` is null
- **When** the chat dock renders
- **Then** the dice pop-out trigger button is disabled and, if opened previously, the pop-out is closed

#### Scenario: Clicking the trigger opens the pop-out

- **Given** the trigger is enabled and the pop-out is closed
- **When** the user clicks the trigger
- **Then** the dice pop-out becomes visible in the document

#### Scenario: Clicking the trigger again closes the pop-out

- **Given** the pop-out is open
- **When** the user clicks the trigger again
- **Then** the dice pop-out is removed from the document

---

### Requirement: ADDED Floating dice pop-out renders outside the chat dock's DOM subtree

The system SHALL render the dice pop-out via a React portal to a dedicated overlay root under `document.body`, positioned with `fixed` coordinates derived from the trigger button, independent of the chat dock's own layout and overflow constraints.

#### Scenario: Pop-out DOM node is not a descendant of the chat dock drawer

- **Given** the dice pop-out is open
- **When** the DOM is queried
- **Then** the pop-out's root element is found under a dedicated overlay container attached to `document.body`, and is NOT a descendant of the chat dock's `role="complementary"` drawer element

#### Scenario: Pop-out is not clipped by a constrained-height ancestor

- **Given** the chat dock drawer has a fixed height and `overflow` constraint (as it does today via `customHeight`/dock sizing)
- **When** the dice pop-out is open
- **Then** the pop-out renders fully visible, unclipped by the chat dock's height/overflow

#### Scenario: Pop-out closes on outside click

- **Given** the pop-out is open
- **When** the user clicks outside both the pop-out and the trigger
- **Then** the pop-out closes

#### Scenario: Pop-out closes on Escape

- **Given** the pop-out is open
- **When** the user presses Escape
- **Then** the pop-out closes

---

### Requirement: ADDED Dice staging pool

The system SHALL let the user add and remove dice of any supported size (d4, d6, d8, d10, d12, d20) to a staging pool within the pop-out, and edit a shared modifier, without issuing any roll or network request until the user explicitly commits.

#### Scenario: Adding a die increments its staged count

- **Given** the pop-out is open and the pool is empty
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

---

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

### Requirement: ADDED Roll feed item rendering

The system SHALL render roll events in the chat feed as a distinct visual item showing the roller's name, timestamp, visibility marker, formula, per-die breakdown, and total.

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

## MODIFIED Requirements

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

The always-visible roll-entry strip (six immediate-click die buttons, a modifier input, and a visibility selector, permanently rendered below the chat composer) is removed from the chat dock's default layout and replaced by the dice pop-out trigger (see "ADDED Dice pop-out trigger anchored to the chat dock"). The modifier input and visibility selector remain, relocated into the pop-out.

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

## REMOVED Requirements

### Requirement: REMOVED Immediate-click-to-roll behavior

Reason for removal: Superseded by the stage-then-commit model. The prior behavior (a single click on a die button immediately rolled and posted) is replaced by "ADDED Dice staging pool" and "ADDED Commit rolls the entire staged pool as one combined roll," which require an explicit "Roll" commit for every roll, including a pool of exactly one die.

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
