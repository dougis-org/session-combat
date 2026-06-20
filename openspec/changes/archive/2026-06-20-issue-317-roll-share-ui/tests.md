---
name: tests
description: Tests for issue-317-roll-share-ui (Roll-share UI in the chat dock)
---

# Tests

## Overview

All work follows strict TDD: write a failing test, write code to pass it, refactor.
Unit tests live under `tests/unit/` (required by project convention — never co-located with source).
Integration tests live under `tests/integration/`.

Test files:
- `tests/unit/components/CampaignChat.roll.test.tsx` — new file for all roll-related unit tests
- `tests/unit/components/CampaignChat.test.tsx` — extend existing file for prop/feed regression tests (if it exists; otherwise cover in the new file)

---

## Testing Steps

For each task in `tasks.md`, follow the TDD cycle:

1. **Write a failing test** capturing the requirement.
2. **Write the simplest code** to make it pass.
3. **Refactor** while keeping tests green.

---

## Test Cases

### Task 1 — `activeSessionId` prop

- [ ] **T1.1** `CampaignChat` renders without error when `activeSessionId` is null (smoke test; existing message feed renders normally)
  - Spec: "activeSessionId null disables roll functionality"
  - Type: Unit (render)

- [ ] **T1.2** `CampaignChat` renders without error when `activeSessionId` is a non-null string
  - Spec: "activeSessionId non-null enables roll functionality"
  - Type: Unit (render)

---

### Task 2 — FeedItem union and stream handler

- [ ] **T2.1** `onStreamEvent` with `{ type: 'roll', data: <CampaignRoll> }` appends a `{ kind: 'roll' }` FeedItem to the feed
  - Spec: "Stream roll event appended after existing feed"
  - Type: Unit (hook/handler)

- [ ] **T2.2** `onStreamEvent` with a roll whose id is already in `seenIds` does not add a duplicate to the feed
  - Spec: "Duplicate roll id from stream is ignored"
  - Type: Unit (handler)

- [ ] **T2.3** `onStreamEvent` with `{ type: 'message' }` still appends a `{ kind: 'message' }` FeedItem (regression)
  - Type: Unit (handler)

- [ ] **T2.4** `ChatFeed` renders a `RollFeedItem` for `{ kind: 'roll' }` items and a message item for `{ kind: 'message' }` items
  - Type: Unit (render)

---

### Task 3 — `RollFeedItem` rendering

- [ ] **T3.1** Given `CampaignRoll { formula: "1d20+3", rolls: [17], total: 20, rollerName: "thegm", visibility: { scope: "dm-only" } }`, the rendered item contains "thegm", "1d20+3", "[17]" (or equivalent breakdown), "20", and "[DM]"
  - Spec: "Roll feed item shows formula breakdown and total"
  - Type: Unit (render)

- [ ] **T3.2** Given `visibility: { scope: "group" }`, no "[DM]" marker appears in the rendered item
  - Spec: "Group-scoped roll shows no visibility marker"
  - Type: Unit (render)

- [ ] **T3.3** A roll item and a message item rendered side by side have visually different container classes (e.g., roll item has a background class that message item does not)
  - Spec: "Roll feed item is visually distinct from a message item"
  - Type: Unit (render)

- [ ] **T3.4** Roll item displays a dice indicator (icon element or text) not present on message items
  - Spec: "Roll feed item is visually distinct"
  - Type: Unit (render)

---

### Task 4 — `RollEntryStrip`

- [ ] **T4.1** When `activeSessionId` is null, all six die buttons, the modifier input, and the visibility select are disabled, and a "No active session" text is visible
  - Spec: "Roll strip is disabled when no active session"
  - Type: Unit (render)

- [ ] **T4.2** When `activeSessionId` is non-null and `streamStatus` is "open", die buttons, modifier input, and visibility select are enabled
  - Spec: "Roll strip renders when dock is expanded and session is active"
  - Type: Unit (render)

- [ ] **T4.3** Clicking the d20 button with modifier=3 and visibility=group triggers a `fetch` POST to `/api/campaigns/[id]/rolls` with body `{ formula: "1d20+3", rolls: [<number>], total: <number>, visibility: { scope: "group" } }`
  - Spec: "Clicking a die button posts a roll with correct formula and total"
  - Type: Unit (fetch mock)

- [ ] **T4.4** Clicking the d6 button with modifier=0 (or empty) sends `formula: "1d6"` with no `+0` suffix
  - Spec: "Clicking a die button with zero modifier omits the modifier from formula"
  - Type: Unit (fetch mock)

- [ ] **T4.5** Clicking the d8 button with modifier=−2 sends `formula: "1d8-2"` and `total: <roll - 2>`
  - Spec: "Clicking a die button with a negative modifier includes sign in formula"
  - Type: Unit (fetch mock)

- [ ] **T4.6** Visibility select defaults to "group" on first render
  - Spec: "Visibility selector defaults to group"
  - Type: Unit (render)

- [ ] **T4.7** Selecting "DM-only" then clicking a die button sends `visibility: { scope: "dm-only" }`
  - Spec: "DM-only visibility sends correct scope"
  - Type: Unit (fetch mock)

- [ ] **T4.8** While a roll POST is in flight (`isRolling=true`), all die buttons are disabled
  - Spec: "Roll button is disabled while a roll is in flight"
  - Type: Unit (render/state)

- [ ] **T4.9** When the POST responds with 409, an inline "No active session" error message is visible and `isRolling` returns to false
  - Spec: "409 response shows inline error"
  - Type: Unit (fetch mock)

- [ ] **T4.10** On a successful 201 response, `onRollPosted` is called with the returned `CampaignRoll` and `isRolling` returns to false
  - Spec: roll submission happy path
  - Type: Unit (fetch mock)

---

### Task 5 — Roll history fetch on expand

- [ ] **T5.1** When the dock expands and `activeSessionId` is "session-xyz", `fetch` is called with `/api/campaigns/[id]/rolls?sessionId=session-xyz&limit=30`
  - Spec: "Roll history fetched with active sessionId on expand"
  - Type: Unit (fetch mock)

- [ ] **T5.2** When `activeSessionId` is null and the dock expands, no `fetch` call to `/rolls` is made; the message history fetch still fires
  - Spec: "Roll history skipped when no active session"
  - Type: Unit (fetch mock)

- [ ] **T5.3** Message history at T1/T3 and roll history at T2 produce a feed in order T1, T2, T3 after the parallel fetch resolves
  - Spec: "History messages and rolls merged and sorted by createdAt"
  - Type: Unit (state)

- [ ] **T5.4** A roll id present in both history response and a prior stream event appears only once in the feed
  - Spec: dedup across history and stream
  - Type: Unit (state)

---

## Integration Test Cases

These require `npm run build` first (integration tests run against `next start`).

- [ ] **I1** POST `/api/campaigns/[id]/rolls` with a valid body while `activeSessionId` is set returns 201 and the roll appears in the SSE stream for group-visibility subscribers
  - Spec: "Clicking a die button posts a roll" (end-to-end)
  - Type: Integration

- [ ] **I2** POST `/api/campaigns/[id]/rolls` when `activeSessionId` is null returns 409
  - Spec: "409 response (no active session race)"
  - Type: Integration (existing API test — verify it still passes)

- [ ] **I3** GET `/api/campaigns/[id]/rolls?sessionId=<id>` returns only rolls for the specified session and respects dm-only visibility for non-DM callers
  - Spec: visibility enforcement (server-side)
  - Type: Integration (existing API test — verify it still passes)
