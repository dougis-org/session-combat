---
name: tests
description: Tests for issue-314-campaign-messages
---

# Tests

## Overview

Test plan for the `issue-314-campaign-messages` change. All work follows strict TDD: write a failing test, implement the minimum to pass, refactor.

Each test case maps to a task in `tasks.md` and one or more acceptance scenarios in `specs/campaign-messages/spec.md`.

## Testing Steps

For each task:

1. **Write a failing test** — capture the requirement before touching implementation code. Run it; confirm it fails.
2. **Write code to pass the test** — minimal implementation only.
3. **Refactor** — improve structure; confirm test still passes.

---

## T1 — Types (`lib/types.ts`)

These are compile-time checks; no runtime test file is needed. TypeScript must pass after each type addition.

- [ ] **T1.1** — `MessageVisibility` union is exhaustive: assigning `{ scope: 'unknown' }` causes a TS error.
- [ ] **T1.2** — `CampaignMessage` accepts all three visibility shapes without TS error.
- [ ] **T1.3** — `CampaignStreamEvent` now accepts `{ type: 'message', campaignId: 'x', data: <CampaignMessage> }`.
- [ ] **T1.4** — Assigning `{ type: 'message' }` without `data` causes a TS error.

**Spec ref:** "Stream event shape" scenario.

---

## T2 — Transport upgrade (`lib/server/transport.ts`)

**File:** Unit tests are covered by the existing stream integration suite; add targeted unit tests for `emitFiltered`.

- [ ] **T2.1** — `emitFiltered` calls handler for userId where `canReceive(userId)` returns `true`.
- [ ] **T2.2** — `emitFiltered` does NOT call handler for userId where `canReceive(userId)` returns `false`.
- [ ] **T2.3** — `emitFiltered` with no subscribers for a campaignId is a no-op (no throw).
- [ ] **T2.4** — Handler error inside `emitFiltered` does not propagate; remaining handlers still called.
- [ ] **T2.5** — After teardown, `emitFiltered` no longer calls the torn-down handler.
- [ ] **T2.6** — Two concurrent subscribers: one receives, one does not (canReceive discriminates).

**Spec ref:** "subscribe registers userId" + "unsubscribe removes userId entry" scenarios.

---

## T3 — Stream route (`app/api/campaigns/[id]/stream/route.ts`)

- [ ] **T3.1** — Existing SSE connection test still passes after `userId` is threaded into `subscribe()`.
- [ ] **T3.2** — TypeScript compile check: `subscribe(id, auth.userId, handler)` matches updated signature.

**Spec ref:** Existing stream transport spec (regression).

---

## T4 — Database index (`lib/db.ts`)

- [ ] **T4.1** — `initializeDatabase()` creates index on `campaignMessages.{campaignId, createdAt}` without throwing.
- [ ] **T4.2** — Calling `initializeDatabase()` a second time (index already exists) does not throw (idempotent).

**Spec ref:** "Index exists at startup" scenario.

---

## T5 — `canSeeMessage` predicate (`lib/utils/campaignMessages.ts`)

**File:** `tests/unit/utils/campaignMessages.test.ts`

- [ ] **T5.1** — `group` message: active player returns `true`.
- [ ] **T5.2** — `group` message: active DM returns `true`.
- [ ] **T5.3** — `group` message: inactive member (status `"removed"`) returns `false`.
- [ ] **T5.4** — `direct` message: recipient (`toUserId`) returns `true`.
- [ ] **T5.5** — `direct` message: sender returns `true`.
- [ ] **T5.6** — `direct` message: unrelated active player returns `false`.
- [ ] **T5.7** — `dm-only` message: sender returns `true` (sender is a player).
- [ ] **T5.8** — `dm-only` message: DM (not sender) returns `true`.
- [ ] **T5.9** — `dm-only` message: unrelated active player (not DM, not sender) returns `false`.
- [ ] **T5.10** — `dm-only` message: co-DM (second active DM, not sender) returns `true`.
- [ ] **T5.11** — User not in members list at all returns `false` for any scope.

**Spec ref:** All visibility filtering scenarios.

---

## T6 — POST handler (`app/api/campaigns/[id]/messages/route.ts`)

**File:** `tests/integration/campaignMessages.test.ts`

- [ ] **T6.1** — Active player POSTs group message → `201` with `CampaignMessage` document (id, campaignId, senderId, text, visibility, createdAt present).
- [ ] **T6.2** — Active player POSTs direct message with valid `toUserId` → `201`.
- [ ] **T6.3** — Active player POSTs dm-only message → `201`.
- [ ] **T6.4** — Non-member POSTs → `403`.
- [ ] **T6.5** — Member with status `"invited"` POSTs → `403`.
- [ ] **T6.6** — Member with status `"removed"` POSTs → `403`.
- [ ] **T6.7** — Missing `text` field → `400` with error body (no message content leaked).
- [ ] **T6.8** — Missing `visibility` field → `400`.
- [ ] **T6.9** — `visibility.scope: "direct"` without `toUserId` → `400`.
- [ ] **T6.10** — Successful POST: document is retrievable via GET by sender immediately after.

**Spec ref:** All POST scenarios.

---

## T7 — GET handler (`app/api/campaigns/[id]/messages/route.ts`)

**File:** `tests/integration/campaignMessages.test.ts` (continued)

- [ ] **T7.1** — Active member GETs campaign with 3 group messages → `200` with all 3, sorted descending by `createdAt`.
- [ ] **T7.2** — Player C GETs campaign where player A sent a direct to player B → player C's response does not include the direct message.
- [ ] **T7.3** — Player B GETs → response includes the direct message addressed to B.
- [ ] **T7.4** — Player A GETs → response includes A's own sent direct message.
- [ ] **T7.5** — Player GETs campaign with dm-only messages → dm-only messages absent.
- [ ] **T7.6** — DM GETs → response includes group, direct (addressed to DM or sent by DM), and dm-only messages.
- [ ] **T7.7** — Pagination: 60 group messages; GET with `?limit=50` returns 50 messages and a non-null `nextCursor`.
- [ ] **T7.8** — Pagination: GET with `?limit=50&before=<nextCursor>` returns 10 messages and no `nextCursor`.
- [ ] **T7.9** — Non-member GETs → `403`.
- [ ] **T7.10** — `limit` exceeds 100 → capped at 100 (no error).

**Spec ref:** All GET scenarios + pagination scenarios.

---

## T8 — SSE emission (`tests/integration/campaignMessages.test.ts`)

- [ ] **T8.1** — Group message POST: all three active SSE subscribers receive a `message` event with `type: "message"`.
- [ ] **T8.2** — Direct message POST (A → B): subscriber A and B each receive the event; subscriber C (unrelated player) does NOT.
- [ ] **T8.3** — dm-only message POST by player A: subscriber A and all active DM subscribers receive the event; other player subscribers do NOT.
- [ ] **T8.4** — dm-only message POST: two co-DM subscribers both receive the event.
- [ ] **T8.5** — POST with no SSE subscribers connected: does not throw; message is still persisted and retrievable via GET.
- [ ] **T8.6** — SSE event `data` field matches the persisted `CampaignMessage` document.

**Spec ref:** All SSE emission scenarios + "Message retrievable via GET even if SSE push did not fire".

---

## Non-Functional Tests

- [ ] **NFT-1 (Performance)** — GET with 1,000 messages and `?limit=50` completes in under 200ms against the test DB (manual verification or Jest timer assertion).
- [ ] **NFT-2 (Security: 403 body)** — GET and POST by non-member return `403` bodies with no message content — only a generic error string.

**Spec ref:** NFAC scenarios.
