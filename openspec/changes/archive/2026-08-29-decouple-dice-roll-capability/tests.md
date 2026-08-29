---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `decouple-dice-roll-capability` change. Existing
dice-pool/chat coverage was re-verified passing (unchanged) at each extraction step before
proceeding to the next; new/updated test cases below cover the behavior that actually
changed.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task group 1 — Shared dice hooks (`tests/unit/lib/dice/useDicePoolState.test.ts`, `useRollSubmission.test.ts`)

- [x] `useDicePoolState`: adding a die increments its staged count
- [x] `useDicePoolState`: cannot add a die past `MAX_PER_DIE`
- [x] `useDicePoolState`: removing a die cannot go below zero
- [x] `useDicePoolState`: `poolTotal` sums all staged dice
- [x] `useDicePoolState`: modifier is clamped to `MAX_MODIFIER` in `buildRoll()`'s output
- [x] `useDicePoolState`: outside click closes the panel
- [x] `useDicePoolState`: Escape closes the panel
- [x] `useDicePoolState`: `buildRoll()` produces a `{formula, rolls, total}` shape from the current pool
- [x] `useDicePoolState`: `reset()` clears the pool and modifier
- [x] `useRollSubmission`: 201 response resolves to `'success'`
- [x] `useRollSubmission`: 409 response resolves to `'conflict'`
- [x] `useRollSubmission`: other non-2xx status resolves to `'error'`
- [x] `useRollSubmission`: a thrown network error resolves to `'error'`
- [x] `useRollSubmission`: a bodyless 201 response still resolves to `'success'` (response body is never parsed) — added during review after Verity flagged the previously-unused `res.json()` call as capable of turning a successful roll into a false failure if parsing threw
- [x] `useRollSubmission`: URL-encodes the campaign id when building the request path — added during review after Verity flagged unencoded identifier interpolation

### Task group 3 — Wire CampaignChat to shared hooks (regression gate)

- [x] Full existing dice-pool suite (`CampaignChat.dicePool.ui.test.tsx`,
      `CampaignChat.dicePool.commit.test.tsx`, `CampaignChat.dicePool.scroll.test.tsx`,
      `CampaignChat.dicePool.ssr.test.tsx`) re-run and confirmed passing unchanged before
      proceeding to task group 4

### Task group 4 — Remove optimistic roll-append + bridge round-trip

- [x] `diceSessionBridge.test.ts`: presence-channel coverage retained; all `requestRoll`/
      `onRollRequested` coverage removed
- [x] `CampaignChat.diceSessionBridge.test.tsx` deleted in its entirety (covered only the
      removed request/response path)
- [x] `CampaignChat.dicePool.scroll.test.tsx` updated: scroll assertions that relied on the
      removed optimistic append now simulate the SSE echo of the committed roll (own-roll
      force-scroll, duplicate-id-via-SSE dedup, feed-order-after-append)
- [x] Full CampaignChat + dice suite (168 tests) re-run and confirmed passing after the
      removal

### Task group 5 — GlobalDiceFab submits directly

- [x] `GlobalDiceFab.test.tsx` rewritten: bridge-round-trip assertions replaced with direct
      `fetch` mocking for the submission call
- [x] New case: choosing to send submits directly to the *current* presence campaign at
      click time (presence changed between roll and send)
- [x] New case: sending succeeds with presence set but no `CampaignChat` mounted in the test
      tree at all — the concrete bug-fix scenario this change exists to deliver
- [x] Pending/sent/failed (409)/failed (network error) `sendState` transitions all re-covered
      against the direct-submission path

### Task group 6 — Split CampaignChat.tsx into submodules

- [x] Full CampaignChat suite (13 files) re-run unchanged after the split and passing
- [x] `tsc --noEmit` and `eslint` clean across every new submodule

### Hardening added during Verity gate review (not originally itemized in tasks.md)

- [x] `CampaignChat.history.test.tsx`: a failed history fetch retries on the next expand
      instead of permanently suppressing retries (`historyLoadedRef` is reset on a failed/
      empty response) — added after Verity flagged the stuck-ref bug
- [x] Manual verification (typecheck + full suite): `useChatFeed`'s campaign-scoped state
      (feed, seenIds, pagination, unread) resets and in-flight history requests are
      generation-guarded when `campaignId` changes, so a stale response for a prior campaign
      cannot write into a newly switched campaign's feed — defense-in-depth alongside the
      existing `key={campaignId}` remount at the call site; no dedicated new test added since
      the current call site already remounts on `campaignId` change, but the hook itself is
      now safe to reuse without a key
- [x] Manual verification: `GlobalDiceFab` no longer registers duplicate outside-click/
      Escape-to-close listeners on top of `useDicePoolState`'s own handling — existing
      modal-close-behavior tests (`Escape closes the modal`, `outside click closes the
      modal`) re-run and confirmed still passing after the consolidation

### Task group 7 — Verification

- [x] `npm run test:unit` — full suite (2988 tests) passes
- [x] `tsc --noEmit` — no errors
- [x] `npm run build` — succeeds
- [x] All files under `lib/components/CampaignChat/` and `lib/dice/` measured well under the
      Verity size threshold that flagged the original 1054-line file (largest is
      `index.tsx` at ~215 lines)
- [ ] Manual browser smoke check (drawer collapse/expand/pin/drag-resize; rolling from chat
      and from `GlobalDiceFab` across mounted/collapsed/unmounted chat states) — not
      performed in this session (no browser available); tracked as an open item in
      `tasks.md` task 7.3
