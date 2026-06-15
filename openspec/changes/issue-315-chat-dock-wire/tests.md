---
name: tests
description: Tests for issue-315-chat-dock-wire (wire CampaignChat to stream + send)
---

# Tests

## Overview

All implementation work follows strict TDD: write a failing test, write the minimum code to pass it, then refactor.

Test file: `tests/unit/components/CampaignChat.test.tsx` (extend existing file).

Mock setup required for all tests:
- `useCampaignStream` — mock via `jest.mock('@/lib/hooks/useCampaignStream')`; expose a `triggerEvent(e: CampaignStreamEvent)` helper via the mock.
- `fetch` — `jest.spyOn(global, 'fetch')` returning mocked responses.
- `LocalStore` — `jest.mock('@/lib/offline/LocalStore')`.

---

## T1 — Campaign layout and prop threading

### Test cases

- [ ] **T1.1** `CampaignChat` accepts `campaignId` prop without TypeScript error (type-level; enforced by `tsc --noEmit`).
- [ ] **T1.2** Rendering `<CampaignChat campaignId="camp-1" />` does not throw.
- [ ] **T1.3** `app/campaigns/[id]/layout.tsx` renders `{children}` — assert child content is present in DOM.
- [ ] **T1.4** `app/layout.tsx` does NOT import or render `CampaignChat` (static analysis / grep in test or separate lint rule).

Spec: MODIFIED Requirement — CampaignChat dock shell renders globally.
Tasks: T1a–T1d.

---

## T2 — Stream connection and message accumulation

### Test cases

- [ ] **T2.1** On mount, `useCampaignStream` is called with `campaignId` as the first argument.
- [ ] **T2.2** When stream fires `{ type: "message", data: msg }`, the message's `text` appears in the rendered feed.
- [ ] **T2.3** When stream fires a `"message"` event with an `id` already in the feed, the feed length does not increase (deduplication).
- [ ] **T2.4** When stream fires `{ type: "heartbeat" }`, the feed is unchanged (no crash, no new item).
- [ ] **T2.5** When stream fires `{ type: "change" }`, the feed is unchanged.

Spec: ADDED Requirement — CampaignChat connects to SSE stream.
Tasks: T2a–T2e.

---

## T3 — Member fetch on mount

### Test cases

- [ ] **T3.1** On mount, `GET /api/campaigns/camp-1/members` is called exactly once.
- [ ] **T3.2** After successful fetch returning `[{ userId: "u1", username: "alice", role: "player", status: "active" }]`, the member is available for `@mention` autocomplete (assert downstream in T7 tests).
- [ ] **T3.3** When `GET /api/campaigns/[id]/members` returns a non-OK response (e.g., 403), the component does not throw and `members` remains `[]`.

Spec: ADDED Requirement — Members fetched for @mention autocomplete.
Tasks: T3a–T3c.

---

## T4 — History load + infinite scroll

### Test cases

- [ ] **T4.1** On initial mount (dock collapsed), `GET /api/campaigns/camp-1/messages` is NOT called.
- [ ] **T4.2** When dock expands for the first time, `GET /api/campaigns/camp-1/messages?page=1&perPage=30` is called.
- [ ] **T4.3** Messages returned by history fetch appear in the feed after expansion.
- [ ] **T4.4** When history returns 30 items, `hasMore` is `true`; when it returns fewer than 30, `hasMore` is `false` and no further scroll-triggered fetch occurs.
- [ ] **T4.5** Simulating `scrollTop = 0` on the feed container (when `hasMore = true`) triggers `GET /api/campaigns/camp-1/messages?page=2&perPage=30`.
- [ ] **T4.6** Messages from page 2 are prepended to the feed without duplicating messages whose IDs are already present.
- [ ] **T4.7** When `isLoadingHistory = true`, a loading indicator is present in the feed.

Spec: ADDED Requirement — History loads on dock open with infinite scroll.
Tasks: T4a–T4d.

---

## T5 — Unread badge

### Test cases

- [ ] **T5.1** On mount, `LocalStore.get('campaign-chat-last-open-camp-1')` is called.
- [ ] **T5.2** When dock is collapsed and a stream `"message"` event arrives with `createdAt` after the stored timestamp, the collapsed pill renders a badge element with a count ≥ 1.
- [ ] **T5.3** When dock is expanded, incoming stream `"message"` events do NOT increment `unreadCount` (badge stays at 0).
- [ ] **T5.4** When the dock expands, `LocalStore.set('campaign-chat-last-open-camp-1', <ISO string>)` is called and the badge is no longer rendered.
- [ ] **T5.5** When `LocalStore.get` throws, the component mounts without throwing and renders normally.
- [ ] **T5.6** When `LocalStore.set` throws on dock open, the component does not throw.

Spec: ADDED Requirement — Unread badge on collapsed pill.
Tasks: T5a–T5f.

---

## T6 — Composer and visibility selector

### Test cases

- [ ] **T6.1** When dock is expanded, a `<textarea>` is present in the document.
- [ ] **T6.2** Three visibility options are available: Group, DM-only, and Whisper (or equivalent labels covering `group`, `dm-only`, `direct`).
- [ ] **T6.3** Default visibility is `group` on initial render.
- [ ] **T6.4** Selecting DM-only sets `visibility.scope = "dm-only"` (assert via Send call or state inspection).
- [ ] **T6.5** When stream `status = "error"`, the textarea has `disabled` attribute.
- [ ] **T6.6** When stream `status = "connecting"`, the Send button has `disabled` attribute.
- [ ] **T6.7** A status line with text matching `/reconnecting/i` is present when stream is not open.

Spec: ADDED Requirement — Composer with visibility selector.
Tasks: T6a–T6e.

---

## T7 — @mention autocomplete

### Test cases

- [ ] **T7.1** When user types `@al` into the textarea (with members `[alice, bob]` loaded), a dropdown appears containing `alice` and not `bob`.
- [ ] **T7.2** When user types `@` with no following characters, all active members appear in the dropdown.
- [ ] **T7.3** When user types `@xyz` with no matching members, the dropdown is not rendered (or is empty).
- [ ] **T7.4** Clicking `alice` in the dropdown: textarea value contains `@alice`, `visibility = { scope: "direct", toUserId: "u-alice" }`, and the dropdown is closed.
- [ ] **T7.5** After selecting `@alice`, typing `@bo` and selecting `bob`: `visibility.toUserId` updates to `"u-bob"` and the textarea reflects `@bob`.
- [ ] **T7.6** After selecting `@alice`, deleting the `@alice` text from the textarea: `visibility` resets to `{ scope: "group" }`.
- [ ] **T7.7** Pressing Escape while the dropdown is open: dropdown closes, textarea retains current text.
- [ ] **T7.8** Blurring the textarea while the dropdown is open: dropdown closes.

Spec: ADDED Requirement — @mention autocomplete for whisper targeting.
Tasks: T7a–T7h.

---

## T8 — Send message

### Test cases

- [ ] **T8.1** Typing text and clicking Send calls `POST /api/campaigns/camp-1/messages` with `{ text, visibility }`.
- [ ] **T8.2** The request body matches exactly: `{ text: "Hello", visibility: { scope: "group" } }` for a group message.
- [ ] **T8.3** An optimistic message with the typed text appears in the feed immediately (before the POST resolves).
- [ ] **T8.4** After a successful POST, the textarea is cleared and visibility resets to `group`.
- [ ] **T8.5** Clicking Send with an empty textarea does NOT call `POST /api/campaigns/[id]/messages`.
- [ ] **T8.6** While a POST is in flight (`isSending = true`), the Send button has `disabled` attribute.
- [ ] **T8.7** Pressing Enter (without Shift) in the textarea triggers Send.
- [ ] **T8.8** Pressing Shift+Enter in the textarea does NOT trigger Send (inserts newline).

Spec: ADDED Requirement — Send message via POST.
Tasks: T8a–T8e.

---

## T9 — Message feed render

### Test cases

- [ ] **T9.1** A message with `visibility.scope = "group"` renders `senderName`, timestamp, and text; no DM or whisper marker is present.
- [ ] **T9.2** A message with `visibility.scope = "dm-only"` renders a visible DM marker (text matching `/dm/i` or `/dm-only/i`).
- [ ] **T9.3** A message with `visibility.scope = "direct"` and `toUserId = "u-alice"` (with alice in members) renders a whisper marker containing `alice`.
- [ ] **T9.4** A message with `visibility.scope = "direct"` and an unknown `toUserId` falls back to displaying the raw `toUserId` in the marker.
- [ ] **T9.5** `createdAt` is rendered as a human-readable timestamp (not ISO string; e.g., locale time).
- [ ] **T9.6** When `isLoadingHistory = true`, a loading indicator element is present above the feed items.

Spec: ADDED Requirement — Message feed renders sender, timestamp, visibility marker, and text.
Tasks: T9a–T9d.

---

## Regression — Existing dock shell tests

- [ ] **R1** All existing scenarios in `tests/unit/components/CampaignChat.test.tsx` continue to pass after prop is added (fixtures updated to pass `campaignId="camp-test"`):
  - Pill present on initial render
  - Drawer absent on initial render
  - Expand by clicking pill
  - Collapse by clicking close button
  - Collapse via Escape key
  - Escape does nothing when already collapsed
  - Pin button toggles pressed state
  - Unpinning does not collapse drawer
  - Dock opens on mount when pin stored
  - Dock starts collapsed when pin not stored
  - No localStorage access during server render
