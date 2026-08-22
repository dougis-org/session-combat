---
name: tests
description: Tests for the decouple-dice-panel-from-chat change
---

# Tests

## Overview

This document outlines the tests for the `decouple-dice-panel-from-chat` change. All work should follow a strict TDD (Test-Driven Development) process: write a failing test capturing the requirement, write the minimal code to pass it, then refactor.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task 1 — `lib/dice/diceSessionBridge.ts` (new: `tests/unit/dice/diceSessionBridge.test.ts`)

- [ ] Announcing presence notifies a registered `onPresenceChange` subscriber with `{campaignId, sessionId}` — maps to `dice-session-bridge` § "Announcing presence notifies current subscribers"
- [ ] Clearing presence notifies a registered subscriber with `null` — maps to `dice-session-bridge` § "Clearing presence notifies current subscribers with null"
- [ ] A newly-registered `onPresenceChange` subscriber is immediately invoked with the current presence value — maps to `dice-session-bridge` § "A newly-registered subscriber immediately receives the current presence value"
- [ ] Calling the unsubscribe function returned by `onPresenceChange` stops further notifications — maps to `dice-session-bridge` § "Unsubscribing stops further notifications"
- [ ] `requestRoll(...)` notifies a registered `onRollRequested` subscriber with the exact payload — maps to `dice-session-bridge` § "Requesting a roll notifies current subscribers with the full scoped payload"
- [ ] `requestRoll(...)` with zero subscribers does not throw and has no observable side effect — maps to `dice-session-bridge` § "A roll request with no subscribers is a silent no-op"
- [ ] `resetDiceSessionBridge()` clears all listeners and presence state between tests — maps to `dice-session-bridge` NFAC "Bridge state does not leak between test cases"

### Task 2 — `CampaignChat` bridge wiring (extend `tests/unit/components/CampaignChat/CampaignChat.dicePool.test.tsx` and/or a new `CampaignChat.diceBridge.test.tsx`)

- [ ] Mounting `CampaignChat` with `campaignId="c1"`, `activeSessionId="s1"`, open stream calls `announcePresence({campaignId: "c1", sessionId: "s1"})` — maps to `dice-session-bridge` § "Mounting with an active session announces presence"
- [ ] `activeSessionId` transitioning from `"s1"` to `null` calls `clearPresence()` — maps to `dice-session-bridge` § "Session ending clears presence"
- [ ] Unmounting `CampaignChat` while presence is announced calls `clearPresence()` — maps to `dice-session-bridge` § "Unmounting clears presence"
- [ ] Mounting with `activeSessionId={null}` never calls `announcePresence` — maps to `dice-session-bridge` § "Mounting with no active session never announces presence"
- [ ] A matching roll request (`campaignId`/`sessionId` equal to the mounted instance's) results in a POST to `/api/campaigns/c1/rolls` with the request's formula/rolls/total/visibility, and on 201 the roll appears in the feed — maps to `dice-session-bridge` § "Matching payload is submitted through the existing roll-persistence path" and `roll-share-ui` § "Externally-requested roll appears in the feed identically to an in-chat roll"
- [ ] A roll request with a mismatched `campaignId` results in no POST and no feed mutation — maps to `dice-session-bridge` § "Payload for a different campaign is ignored"
- [ ] A roll request with a stale `sessionId` (after `activeSessionId` changed) results in no POST and no feed mutation — maps to `dice-session-bridge` § "Payload for a stale/mismatched session is ignored"
- [ ] A matching roll request that resolves 409 shows the existing inline "No active session" handling and does not mutate the feed — maps to `roll-share-ui` § "409 (no active session race) on an externally-requested roll surfaces the same inline handling"
- [ ] A matching roll request that is successfully committed scrolls the feed per the "own committed roll always scrolls" rule regardless of scroll position — maps to `roll-share-ui` § "Externally-requested roll triggers the same auto-scroll rule as a self-committed roll"
- [ ] **Regression:** existing `CampaignChat.dicePool*.test.tsx`, `CampaignChat.roll.test.tsx`, `CampaignChat.resize.test.tsx` suites pass unmodified — maps to `roll-share-ui` § "In-chat dice pool trigger and behavior are unaffected" and proposal AC 9

### Task 3 — `GlobalDiceFab` (new: `tests/unit/components/GlobalDiceFab.test.tsx` + `GlobalDiceFab.ssr.test.tsx`)

- [ ] Fab renders with an accessible name matching `/roll|dice/i` when `useAuth()` returns an authenticated user — maps to `global-dice-fab` § "Fab renders for an authenticated user on any page"
- [ ] Fab is absent from the document when `useAuth()` returns `user: null` — maps to `global-dice-fab` § "Fab is absent for an unauthenticated user"
- [ ] Clicking the fab opens a center-screen modal containing add/remove controls for all six die sizes and a modifier input — maps to `global-dice-fab` § "Opening the fab shows a center-screen modal"
- [ ] Rolling with no presence announced computes and displays a result via `rollDicePool()` and makes no HTTP request — maps to `global-dice-fab` § "Rolling with no active-session presence produces a local result and no network call"
- [ ] The roll control is disabled when every die size has a staged count of 0 — maps to `global-dice-fab` § "Empty pool cannot be rolled"
- [ ] Pressing Escape while the modal is open removes it from the document — maps to `global-dice-fab` § "Escape closes the modal"
- [ ] Clicking outside the modal (and outside the fab trigger) removes it from the document — maps to `global-dice-fab` § "Outside click closes the modal"
- [ ] No `setTimeout`/`setInterval`-driven close path exists; modal stays open absent Escape/outside-click — maps to `global-dice-fab` § "Modal remains open indefinitely absent Escape or outside click"
- [ ] With no presence announced, no "send to session chat" control is shown after rolling — maps to `global-dice-fab` § "Option hidden with no presence"
- [ ] After `announcePresence({campaignId, sessionId})` is called (simulated in the test), the modal shows "send to session chat" after rolling — maps to `global-dice-fab` § "Option shown once presence is announced"
- [ ] Clicking "send to session chat" calls `requestRoll` with the current presence's `campaignId`/`sessionId` and the just-rolled `formula`/`rolls`/`total`/`visibility` — maps to `global-dice-fab` § "Choosing to send emits a scoped roll request"
- [ ] Server-rendering the component (`renderToString`) in a Node environment does not access `document` or attempt portal creation — maps to `global-dice-fab` NFAC "No `document` access during server render"
- [ ] The modal DOM subtree does not exist before the fab is first clicked — maps to `global-dice-fab` NFAC "Modal mounts only while open"

### Task 4 — Root layout mount (manual + smoke test)

- [ ] Smoke test: rendering `app/layout.tsx`'s tree (or an integration-level render) with an authenticated user includes both `NavBar` and the dice fab — maps to `global-dice-fab` § "Fab renders for an authenticated user on any page"
- [ ] Manual check (recorded in PR description, not automated): fab visible and non-overlapping on a non-campaign page, a campaign page with no active session, and a campaign page with an active session; "send to session chat" appears/disappears correctly when navigating between the latter two

### Regression / route safety net (no code change expected)

- [ ] Existing tests for `app/api/campaigns/[id]/rolls/route.ts` (auth, membership, `assertCampaignAccess`, active-session 409, payload validation) run unmodified and pass — maps to proposal AC 10 and design.md's Decision 4 / Operational Blocking Policy (any diff to this route during this change is unexpected and must be explained before proceeding)

## Traceability Summary

- Every scenario in `openspec/changes/decouple-dice-panel-from-chat/specs/dice-session-bridge/spec.md` → Task 1 and Task 2 test cases above.
- Every scenario in `openspec/changes/decouple-dice-panel-from-chat/specs/global-dice-fab/spec.md` → Task 3 test cases above.
- Every scenario in `openspec/changes/decouple-dice-panel-from-chat/specs/roll-share-ui/spec.md` (delta) → Task 2 test cases above.
- Proposal acceptance criteria 1–10 → covered across Tasks 1–4 and the regression/route safety net section as annotated inline above.
