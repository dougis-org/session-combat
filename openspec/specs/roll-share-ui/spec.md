## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-06-20-issue-317-roll-share-ui/design.md) document, not a replacement.

### Requirement: ADDED Roll-entry strip in the chat dock

The system SHALL display a roll-entry strip below the chat composer when the chat dock is expanded, containing die buttons (d4, d6, d8, d10, d12, d20), a modifier number input, and a visibility selector (Group / DM-only).

#### Scenario: Roll strip renders when dock is expanded and session is active

- **Given** a campaign page where `activeSessionId` is a non-null string and the chat dock is expanded
- **When** the dock content renders
- **Then** six die buttons labelled d4, d6, d8, d10, d12, and d20 are visible and enabled, the modifier input is enabled, and the visibility selector is enabled

#### Scenario: Roll strip is disabled when no active session

- **Given** a campaign page where `activeSessionId` is null and the chat dock is expanded
- **When** the dock content renders
- **Then** all six die buttons are disabled, the modifier input is disabled, the visibility selector is disabled, and a "No active session" label is visible in the strip

#### Scenario: Clicking a die button posts a roll with correct formula and total

- **Given** the roll strip is enabled, modifier is 3, visibility is "group"
- **When** the user clicks the d20 button
- **Then** a POST to `/api/campaigns/[id]/rolls` is made with `formula: "1d20+3"`, `rolls: [<result>]`, `total: <result + 3>`, and `visibility: { scope: "group" }`

#### Scenario: Clicking a die button with zero modifier omits the modifier from formula

- **Given** the roll strip is enabled and modifier input is empty or 0
- **When** the user clicks the d6 button
- **Then** a POST is made with `formula: "1d6"` (no `+0` suffix)

#### Scenario: Clicking a die button with a negative modifier includes sign in formula

- **Given** the roll strip is enabled and modifier input is −2
- **When** the user clicks the d8 button
- **Then** a POST is made with `formula: "1d8-2"` and `total: <roll - 2>`

#### Scenario: Visibility selector defaults to group

- **Given** the roll strip is first rendered
- **When** no user interaction has occurred
- **Then** the visibility selector shows "Group" as the selected value

#### Scenario: DM-only visibility sends correct scope

- **Given** the user has selected "DM-only" in the visibility selector
- **When** the user clicks any die button
- **Then** the POST body includes `visibility: { scope: "dm-only" }`

#### Scenario: Roll button is disabled while a roll is in flight

- **Given** a roll POST is pending (awaiting server response)
- **When** the roll strip re-renders
- **Then** all die buttons are disabled until the POST resolves or rejects

#### Scenario: 409 response (no active session race) shows inline error

- **Given** the strip appears enabled (activeSessionId was non-null) but the server returns 409
- **When** the POST resolves with status 409
- **Then** an inline error message "No active session" is shown in the strip and no roll is added to the feed

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

The system SHALL accept an `activeSessionId: string | null` prop on `CampaignChat` and use it to gate roll history fetching and the roll-entry strip.

#### Scenario: activeSessionId null disables roll functionality

- **Given** `CampaignChat` is rendered with `activeSessionId={null}`
- **When** the dock is expanded
- **Then** the roll strip is fully disabled, no roll history fetch is attempted, and the message feed loads normally

#### Scenario: activeSessionId non-null enables roll functionality

- **Given** `CampaignChat` is rendered with `activeSessionId="session-abc"`
- **When** the dock is expanded
- **Then** the roll strip is enabled and roll history is fetched for "session-abc"

---

## REMOVED Requirements

None.

---

## Traceability

- Proposal element "Roll-entry strip with die buttons, modifier, visibility, disabled state" → Requirements: Roll-entry strip in the chat dock
- Proposal element "Unified feed type replacing messages state" → Requirements: Interleaved feed of messages and rolls
- Proposal element "Roll feed item visually distinct" → Requirements: Roll feed item rendering
- Proposal element "SSE stream extended to consume roll events" → Requirements: Interleaved feed (stream scenario), Duplicate dedup scenario
- Proposal element "Roll history fetch on expand" → Requirements: Roll history loaded on dock expand
- Proposal element "activeSessionId as prop" → Requirements: MODIFIED CampaignChat accepts activeSessionId prop

- Design decision 1 (FeedItem local type) → Requirements: Interleaved feed of messages and rolls
- Design decision 2 (activeSessionId prop) → Requirements: MODIFIED CampaignChat accepts activeSessionId prop
- Design decision 3 (sorted insert) → Requirements: Interleaved feed — ordering scenarios
- Design decision 4 (parallel fetch) → Requirements: Roll history loaded on dock expand
- Design decision 5 (client-side rolling) → Requirements: Roll-entry strip — POST body scenarios
- Design decision 6 (strip placement) → Requirements: Roll-entry strip — render and disabled scenarios

- Requirements → Tasks: all requirements map to Task 2 (FeedItem/stream), Task 3 (RollFeedItem), Task 4 (RollEntryStrip), Task 5 (history fetch), Task 6 (campaign page prop) — see `tasks.md`

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
