## Purpose

Define how the campaign chat dock renders rolls: an interleaved feed that shows roll history and streamed rolls alongside chat messages, roll-feed-item rendering (including percentile rolls), and rollerId-based feed auto-scroll on a streamed roll. The staging pool of dice controls, the standalone percentile (d%) control, and the explicit commit that submits one combined roll through `/api/campaigns/[id]/rolls` are no longer part of the chat dock — they live only in `GlobalDiceFab` (see `global-dice-fab` and `dice-pool-shared-state` capabilities). Removed by `remove-chat-docked-dice` (2026-08-30).

## Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-06-20-issue-317-roll-share-ui/design.md) document, not a replacement.

**Note (removed 2026-08-30, `remove-chat-docked-dice`):** The requirement formerly here —
"ADDED Commit rolls the entire staged pool as one combined roll" — was removed. The chat
dock no longer hosts a dice staging pool or a "Roll" commit control; building and
committing a combined pool roll is provided solely by `GlobalDiceFab`, which composes the
roll via `dice-pool-shared-state` (`buildRoll`) and submits it through `useRollSubmission`.
The `/api/campaigns/[id]/rolls` contract is unchanged. See "Historical removals".

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

The system SHALL accept an `activeSessionId: string | null` prop on `CampaignChat` and use
it to gate roll-history fetching and dice-session presence announcement (see
`dice-session-bridge` capability). It SHALL NOT gate any dice-rolling control, because the
chat dock no longer renders one; all dice rolling is provided by `GlobalDiceFab` (see
`global-dice-fab` capability).

#### Scenario: activeSessionId null disables roll history and presence, feed still loads

- **Given** `CampaignChat` is rendered with `activeSessionId={null}`
- **When** the dock is expanded
- **Then** no roll-history fetch to `/api/campaigns/[id]/rolls` is attempted
- **And** no dice-session presence is announced
- **And** the message feed loads normally
- **And** the "No active session" footer is shown (see "ADDED Chat dock shows a no-active-session footer instead of a dice bar")

#### Scenario: activeSessionId non-null enables roll history and presence

- **Given** `CampaignChat` is rendered with `activeSessionId="session-abc"`
- **When** the dock is expanded
- **Then** roll history is fetched for "session-abc"
- **And** dice-session presence `{ campaignId, sessionId: "session-abc" }` is announced while the component owns that active session
- **And** no dice control is rendered in the drawer

---

### Requirement: ADDED Chat dock shows a no-active-session footer instead of a dice bar

The chat dock's drawer SHALL render a footer strip **only when** `activeSessionId` is
`null`, containing exactly the text "No active session" and no interactive controls. When
`activeSessionId` is a non-null string the drawer SHALL render no footer strip at all (the
chat feed and composer fill the drawer). No dice pop-out trigger, dice panel, or dice-pool
control SHALL be rendered in the drawer under any condition (see "Historical removals").

#### Scenario: Footer message shown when no session is active

- **Given** `CampaignChat` is rendered expanded with `activeSessionId={null}`
- **When** the drawer content renders
- **Then** the visible text "No active session" is present in the drawer
- **And** no button with an accessible name matching `/roll|dice/i` is present in the drawer
- **And** no element with `title="Dice Rolls for main screen pop out"` is present

#### Scenario: No footer strip when a session is active

- **Given** `CampaignChat` is rendered expanded with `activeSessionId="session-abc"`
- **When** the drawer content renders
- **Then** the text "No active session" is not present
- **And** no dice trigger, dice panel, or dice-pool control is present in the drawer
- **And** the chat feed region remains the flex-growing element of the drawer

#### Scenario: Footer appears and disappears as the active session changes while open

- **Given** the drawer is expanded with `activeSessionId="session-abc"` and no footer strip
- **When** the same `CampaignChat` instance re-renders with `activeSessionId={null}`
- **Then** the "No active session" footer strip becomes present
- **And when** it re-renders again with `activeSessionId="session-xyz"`
- **Then** the footer strip is removed and no error is raised

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

**Note (removed 2026-08-30, `remove-chat-docked-dice`):** The requirement formerly here —
"MODIFIED Dice panel renders as an in-flow flex sibling to the left of the chat dock" — was
removed. There is no dice panel in the chat dock to position; `GlobalDiceFab`'s modal owns
its own anchoring per the `global-dice-fab` capability. The `CampaignChat` flex-row wrapper
is retained but now has the drawer as its only child. See "Historical removals".

---

### Requirement: MODIFIED Feed auto-scrolls on a new dice roll, consumed solely via the SSE stream

_(Modified 2026-08-29, `decouple-dice-roll-capability`; 2026-08-30, `remove-chat-docked-dice` — rolls now originate entirely from `GlobalDiceFab`.)_ The system SHALL scroll the chat feed so the current user's own committed roll is always visible immediately after it is appended, and shall append every roll to the feed solely via the SSE `'roll'` stream event — there is no longer a separate local POST-response callback path that appends a roll to the feed ahead of, or independent from, the stream. For a roll committed by a different user, the system SHALL only auto-scroll if the feed was already within approximately 100px of the bottom immediately before the roll was appended — a user who has scrolled up to read history (or is at the top triggering an older-page load) is NOT auto-scrolled by another player's roll. Auto-scroll SHALL fire at most once per roll, determined by checking the ingested roll's `rollerId` against the current user, not by which code path appended it (since there is now only one). The feed's item order is unaffected. Auto-scroll does NOT apply to plain chat messages (unchanged from today: messages never auto-scroll).

#### Scenario: Committing a roll scrolls the feed to show it once ingested via the stream

- **Given** the feed is scrolled such that the bottom is not visible, and the current user
  has just committed a roll via `GlobalDiceFab`'s "send to session chat"
- **When** the SSE `'roll'` event for that roll is received and appended to the feed
- **Then** the feed container's scroll position moves so the newly-appended roll item is
  visible, without requiring the user to scroll manually, and without any earlier
  optimistic append having already placed the item in the feed

#### Scenario: The roller is scrolled to their own roll even if they had scrolled away from the bottom

- **Given** the feed is scrolled such that the bottom is not visible, and the current user
  has just committed a roll via `GlobalDiceFab`'s "send to session chat"
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

## Historical removals

These requirements were removed by earlier changes; the full rationale lives in the
corresponding archived changes. They are retained here only as a pointer.

- **Immediate-click-to-roll behavior** — superseded by the stage-then-commit model
  (`multi-dice-pool-popout`, archived 2026-08-19).
- **Floating dice pop-out renders outside the chat dock's DOM subtree** — superseded by
  the in-flow flex-sibling panel (`dice-roll-enhancements`, archived 2026-08-20).
- **The entire chat-docked dice UI** — the dice pop-out trigger anchored to the chat dock
  (`DiceTriggerButton`, `title="Dice Rolls for main screen pop out"`), the dice staging
  pool (`DicePoolPanel`), the standalone in-chat percentile (d%) control, the "Roll" commit
  that submitted one combined pooled roll, the flex-sibling panel positioning, and the
  roll-entry-strip replacement — all removed by `remove-chat-docked-dice` (2026-08-30,
  issue #585). `GlobalDiceFab` is now the sole staging-pool + percentile + commit surface
  (see `global-dice-fab` and `dice-pool-shared-state` capabilities); it submits through
  the unchanged `/api/campaigns/[id]/rolls` contract and its rolls reach chat only via the
  SSE `'roll'` stream. The chat drawer renders no roll-entry affordance of any kind.

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

### Performance

#### Scenario: Feed append does not re-sort on SSE roll event

- **Given** a feed with 50+ existing items
- **When** a single SSE roll event arrives
- **Then** the feed item is appended without a full array sort; no perceptible layout thrash occurs

### Security

See functional scenarios: "DM-only visibility sends correct scope", "409 response (no active session race) shows inline error". Visibility enforcement is owned by the server (SSE fan-out in `emitFiltered`) and is not re-implemented in the UI beyond using `canSeeRoll` as a secondary guard for unexpected events.

### Reliability

#### Scenario: Duplicate roll dedup across history and stream

See functional scenario: "Duplicate roll id from stream is ignored". The `seenIds` ref must be extended to cover roll ids in addition to message ids.

#### Scenario: No `document` access during server render for the dice pop-out

- **Given** the chat dock (including the dice pop-out trigger) is rendered in a Node.js (non-browser) environment
- **When** the module is imported and the component tree is server-rendered
- **Then** no `document`/overlay-root creation is attempted
