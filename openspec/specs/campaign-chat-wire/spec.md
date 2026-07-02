## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-06-18-issue-315-chat-dock-wire/design.md) document, not a replacement.

---

### Requirement: ADDED CampaignChat accepts campaignId prop and mounts in campaign layout

The system SHALL render `CampaignChat` only on campaign routes, receiving `campaignId` from the campaign `[id]` layout.

#### Scenario: Chat dock renders on campaign page

- **Given** a user navigates to `/campaigns/[id]` or any sub-route
- **When** the page renders
- **Then** a button with accessible name matching `/chat/i` is present in the document (dock is available)

#### Scenario: Chat dock does not render on non-campaign pages

- **Given** a user is on any route outside `/campaigns/[id]/…`
- **When** the page renders
- **Then** no element with accessible name matching `/chat/i` from `CampaignChat` is present (dock is absent)

---

### Requirement: ADDED CampaignChat connects to SSE stream for live messages

The system SHALL connect to `useCampaignStream(campaignId, onEvent)` and append incoming `"message"` events to the feed.

#### Scenario: Stream message event appends to feed

- **Given** the dock is expanded and the stream is open
- **When** a `{ type: "message", data: CampaignMessage }` event is received from the stream
- **Then** the message appears in the feed with the sender name and message text

#### Scenario: Duplicate stream event is ignored

- **Given** a message with id `"msg-1"` is already in the feed
- **When** a stream event arrives with `data.id = "msg-1"`
- **Then** the feed still contains exactly one copy of that message

#### Scenario: Non-message stream events do not affect feed

- **Given** the dock is expanded
- **When** a `{ type: "heartbeat" }` or `{ type: "change" }` stream event is received
- **Then** the message feed is unchanged

---

### Requirement: ADDED Message feed renders sender, timestamp, visibility marker, and text

The system SHALL display each message with its `senderName`, a human-readable `createdAt` timestamp, a visibility marker, and `text`.

#### Scenario: Group message renders without visibility marker

- **Given** the feed contains a message with `visibility.scope = "group"`
- **When** the feed is rendered
- **Then** the message displays `senderName`, timestamp, and text; no DM or whisper marker is shown

#### Scenario: DM-only message renders with DM marker

- **Given** the feed contains a message with `visibility.scope = "dm-only"`
- **When** the feed is rendered
- **Then** the message displays a visible DM-only marker (e.g., text `DM` or `dm-only` label)

#### Scenario: Direct (whisper) message renders with whisper marker

- **Given** the feed contains a message with `visibility.scope = "direct"` and `toUserId` set
- **When** the feed is rendered
- **Then** the message displays a whisper marker identifying the recipient username

---

### Requirement: ADDED History loads on dock open with infinite scroll

The system SHALL fetch `GET /api/campaigns/[id]/messages?page=1&perPage=30` when the dock first expands, and load older pages when the feed is scrolled to the top.

#### Scenario: History loads when dock opens

- **Given** the dock is collapsed and the user has not opened it this session
- **When** the user expands the dock
- **Then** `GET /api/campaigns/[id]/messages` is called with `page=1&perPage=30` and returned messages appear in the feed

#### Scenario: History is not fetched on mount (dock collapsed)

- **Given** the component has mounted with the dock in its collapsed initial state
- **When** no user interaction occurs
- **Then** `GET /api/campaigns/[id]/messages` has not been called

#### Scenario: Scroll to top triggers older page load

- **Given** the dock is expanded with `hasMore = true` and at least one page of history is loaded
- **When** the feed container is scrolled to the top (`scrollTop === 0`)
- **Then** `GET /api/campaigns/[id]/messages` is called with `page=2` and the returned messages are prepended to the feed

#### Scenario: No more pages — load more not triggered

- **Given** `hasMore = false` (the last fetch returned fewer than `perPage` items)
- **When** the feed container is scrolled to the top
- **Then** no additional `GET /api/campaigns/[id]/messages` request is made

#### Scenario: History messages are deduplicated against feed

- **Given** the feed already contains a live message with id `"msg-live"`
- **When** a history page is loaded that also contains a message with id `"msg-live"`
- **Then** the feed contains exactly one copy of that message

---

### Requirement: ADDED Unread badge on collapsed pill

The system SHALL display an unread count badge on the collapsed pill button when messages have arrived since the dock was last opened.

#### Scenario: Unread badge appears when dock is collapsed and new message arrives

- **Given** the dock is collapsed and `LocalStore` records a `campaign-chat-last-open-{campaignId}` timestamp
- **When** a stream `"message"` event arrives with `createdAt` after that timestamp
- **Then** the collapsed pill shows a non-zero unread count badge

#### Scenario: Unread badge clears when dock opens

- **Given** the collapsed pill shows an unread badge with count ≥ 1
- **When** the user expands the dock
- **Then** the unread badge is no longer visible and `LocalStore` is updated with the current timestamp

#### Scenario: Unread count does not increment while dock is open

- **Given** the dock is expanded
- **When** a stream `"message"` event arrives
- **Then** `unreadCount` remains 0 (message is immediately visible in the feed)

#### Scenario: LocalStore unavailable — unread count degrades gracefully

- **Given** `LocalStore.get` and `LocalStore.set` throw an exception
- **When** the component mounts and a stream message event arrives
- **Then** no uncaught exception occurs and the component renders without crashing (badge may show 0 or omit)

---

### Requirement: ADDED Members fetched for @mention autocomplete

The system SHALL fetch `GET /api/campaigns/[id]/members` once on mount and cache the result for `@mention` autocomplete.

#### Scenario: Members fetched on mount

- **Given** `CampaignChat` mounts with a valid `campaignId`
- **When** the component mounts
- **Then** `GET /api/campaigns/[id]/members` is called exactly once

#### Scenario: Members fetch failure does not crash composer

- **Given** `GET /api/campaigns/[id]/members` returns a non-OK response
- **When** the user types `@` in the composer
- **Then** no uncaught exception occurs and the mention dropdown is empty (or does not appear)

---

### Requirement: ADDED Composer with visibility selector

The system SHALL render a composer with a textarea, a visibility selector (Group / DM-only / Whisper), and a Send button.

#### Scenario: Composer renders visibility options

- **Given** the dock is expanded
- **When** the composer area is rendered
- **Then** the user can select among at least three visibility options: Group, DM-only, and Whisper (direct)

#### Scenario: Default visibility is Group

- **Given** the dock is expanded and no visibility has been selected
- **When** the composer is rendered
- **Then** the active visibility is `group`

#### Scenario: Composer is disabled when stream is not open

- **Given** the stream `status` is `"connecting"` or `"error"`
- **When** the composer is rendered
- **Then** the textarea and Send button are both `disabled`

---

### Requirement: ADDED @mention autocomplete for whisper targeting

The system SHALL detect `@word` in the composer textarea and display a dropdown of matching active campaign members; selecting one sets `visibility = { scope: "direct", toUserId }`.

#### Scenario: Typing @prefix shows member dropdown

- **Given** the dock is expanded, the stream is open, and members `["alice", "bob"]` are loaded
- **When** the user types `@al` into the composer textarea
- **Then** a dropdown appears containing `alice`

#### Scenario: Selecting a member sets direct visibility and closes dropdown

- **Given** the mention dropdown is open with `alice` as a match
- **When** the user selects `alice` from the dropdown
- **Then** the dropdown closes, `@al` in the textarea is replaced with `@alice`, and the visibility is set to `{ scope: "direct", toUserId: alice.userId }`

#### Scenario: No matching members — dropdown empty or hidden

- **Given** `@xyz` is typed and no member username starts with `xyz`
- **When** the dropdown is rendered
- **Then** no member items are shown (dropdown is empty or not rendered)

#### Scenario: Clearing @mention text resets visibility to Group

- **Given** a mention has been selected and visibility is `direct`
- **When** the user deletes the `@alice` text from the textarea
- **Then** visibility resets to `{ scope: "group" }` and the dropdown does not appear

#### Scenario: Second @mention replaces previous whisper target

- **Given** `@alice` has been selected as whisper target (`visibility.toUserId = alice.userId`)
- **When** the user types `@bo` and selects `bob` from the dropdown
- **Then** `visibility.toUserId` is updated to `bob.userId` and the textarea reflects `@bob`

---

### Requirement: ADDED Send message via POST

The system SHALL POST `{ text, visibility }` to `/api/campaigns/[id]/messages` when the user submits the composer, and optimistically append the message to the feed.

#### Scenario: Active member sends group message

- **Given** the dock is expanded, stream is open, and the user types `"Hello everyone"` with visibility `group`
- **When** the user clicks Send (or presses Enter)
- **Then** `POST /api/campaigns/[id]/messages` is called with body `{ text: "Hello everyone", visibility: { scope: "group" } }` and an optimistic copy of the message appears in the feed immediately

#### Scenario: Empty composer — Send does nothing

- **Given** the composer textarea is empty
- **When** the user clicks Send
- **Then** no POST request is made and the feed is unchanged

#### Scenario: Composer is cleared after successful send

- **Given** the user has typed text and clicked Send
- **When** the POST request succeeds
- **Then** the composer textarea is cleared and visibility resets to `group`

#### Scenario: Send button is disabled while a send is in progress

- **Given** a POST request is in flight
- **When** the composer is rendered
- **Then** the Send button and textarea are both `disabled`

---

## MODIFIED Requirements

### Requirement: MODIFIED CampaignChat dock shell renders globally

The system SHALL render `CampaignChat` on every campaign page (`/campaigns/[id]/…`) rather than on every page of the application. The component is now mounted in `app/campaigns/[id]/layout.tsx` and removed from `app/layout.tsx`.

#### Scenario: Pill present on campaign page initial render

- **Given** a user navigates to a campaign route (e.g., `/campaigns/abc123`)
- **When** the page renders
- **Then** a button with accessible name matching `/chat/i` is present in the document

#### Scenario: Pill absent on non-campaign pages

- **Given** a user is on the home page, parties page, or any route outside `/campaigns/[id]/…`
- **When** the page renders
- **Then** no `CampaignChat` pill is present in the document

---

## REMOVED Requirements

None. All existing dock shell behaviors (expand/collapse, pin, keyboard, LocalStore pin) are preserved.

---

## Traceability

- Proposal: "Move `CampaignChat` to campaign layout" → Requirement: MODIFIED CampaignChat dock shell renders globally
- Proposal: "Connect to `useCampaignStream`" → Requirement: ADDED CampaignChat connects to SSE stream
- Proposal: "Render feed" → Requirement: ADDED Message feed renders sender, timestamp, visibility marker, and text
- Proposal: "History loads on open + infinite scroll" → Requirement: ADDED History loads on dock open with infinite scroll
- Proposal: "Unread badge" → Requirement: ADDED Unread badge on collapsed pill
- Proposal: "Members fetch for @mention" → Requirement: ADDED Members fetched for @mention autocomplete
- Proposal: "Composer with visibility selector" → Requirement: ADDED Composer with visibility selector
- Proposal: "@mention autocomplete" → Requirement: ADDED @mention autocomplete for whisper targeting
- Proposal: "Send via POST" → Requirement: ADDED Send message via POST
- Design D1 → Requirement: MODIFIED CampaignChat dock shell renders globally
- Design D2 → Requirement: ADDED Members fetched for @mention autocomplete
- Design D3 → All state-driven scenarios
- Design D4 → Requirement: ADDED @mention autocomplete for whisper targeting
- Design D5 → Requirement: ADDED History loads on dock open with infinite scroll
- Design D6 → Requirement: ADDED Unread badge on collapsed pill
- Design D7 → Duplicate stream event / history deduplication scenarios
- Design D8 → Scenario: Active member sends group message (optimistic)
- Design D9 → Scenario: Composer is disabled when stream is not open
- Design D10 → All sub-component scenarios (ChatFeed, ChatComposer, MentionDropdown)
- Requirements → Tasks: see `tasks.md`

---

## Non-Functional Acceptance Criteria

### Requirement: Reliability — no layout regression

#### Scenario: Existing CampaignChat dock shell tests continue to pass

- **Given** the `CampaignChat.test.tsx` file is decomposed
- **When** the full unit test suite runs after this change
- **Then** all previously passing dock shell tests pass successfully across the decomposed files under `tests/unit/components/CampaignChat/`

### Requirement: Reliability — LocalStore failure does not crash

See functional scenario: **Scenario: LocalStore unavailable — unread count degrades gracefully**

### Requirement: Reliability — members fetch failure does not crash

See functional scenario: **Scenario: Members fetch failure does not crash composer**

### Requirement: Security — send requires open stream

See functional scenario: **Scenario: Composer is disabled when stream is not open**

> Note: Authorization enforcement (only active members may send) is handled server-side by the existing `POST /api/campaigns/[id]/messages` route (specified in issue-314 specs). No additional client-side auth enforcement is required beyond the disabled-state guard above.

### Requirement: Performance — history not fetched until dock opens

See functional scenario: **Scenario: History is not fetched on mount (dock collapsed)**

---

## MODIFIED Requirements (Decomposed Tests)

### Requirement: MODIFIED Test suite location for CampaignChat live-data wiring

The unit tests verifying the `CampaignChat` live-data wiring (SSE stream, message feed rendering, history, unread badge, members fetching, composer, and mentions) SHALL be split into focused test files under the `tests/unit/components/CampaignChat/` folder.

#### Scenario: Live-data unit tests run and pass in dedicated suites

- **Given** the `CampaignChat.test.tsx` file is decomposed
- **When** `npm run test:unit` is executed
- **Then** all tests pass successfully across the following files:
  - [`tests/unit/components/CampaignChat/CampaignChat.sse.test.tsx`](../../../tests/unit/components/CampaignChat/CampaignChat.sse.test.tsx) (6 tests)
  - [`tests/unit/components/CampaignChat/CampaignChat.history.test.tsx`](../../../tests/unit/components/CampaignChat/CampaignChat.history.test.tsx) (3 tests)
  - [`tests/unit/components/CampaignChat/CampaignChat.unread.test.tsx`](../../../tests/unit/components/CampaignChat/CampaignChat.unread.test.tsx) (4 tests)
  - [`tests/unit/components/CampaignChat/CampaignChat.members.test.tsx`](../../../tests/unit/components/CampaignChat/CampaignChat.members.test.tsx) (2 tests)
  - [`tests/unit/components/CampaignChat/CampaignChat.composer.test.tsx`](../../../tests/unit/components/CampaignChat/CampaignChat.composer.test.tsx) (11 tests)
  - [`tests/unit/components/CampaignChat/CampaignChat.visibility.test.tsx`](../../../tests/unit/components/CampaignChat/CampaignChat.visibility.test.tsx) (4 tests)
  - [`tests/unit/components/CampaignChat/CampaignChat.scene.test.tsx`](../../../tests/unit/components/CampaignChat/CampaignChat.scene.test.tsx) (6 tests)

## Traceability

- Proposal element: Decomposing tests into focused files -> Requirement: MODIFIED Test suite location
- Design decision: Centralized helpers.ts File -> Requirement: MODIFIED Test suite location
- Design decision: Deferring Imports in Hoisted Mocks using require() -> Requirement: MODIFIED Test suite location
- Design decision: Create Dedicated CampaignChat.composer.test.tsx -> Requirement: MODIFIED Test suite location
- Requirement -> Task(s): Decompose live-data wiring tests to focused suites
