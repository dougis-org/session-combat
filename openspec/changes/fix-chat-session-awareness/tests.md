---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `fix-chat-session-awareness` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### T1/T2 — `useActiveSessionId` hook (new: `tests/unit/hooks/useActiveSessionId.test.tsx`)

- [ ] Initial fetch resolves `activeSessionId` from `GET /api/campaigns/:id` when no stream event has occurred → maps to `specs/session-controls/spec.md`: "An already-active session is visible without a prior stream event"
- [ ] A `session` stream event updates `activeSessionId` after the initial value is already known → maps to `specs/session-controls/spec.md`: "A stream event updates both components independently and consistently"
- [ ] `setActiveSessionId(id)` updates `activeSessionId` immediately, synchronously with the call → maps to `specs/session-controls/spec.md`: "An optimistic update is not reverted by a stale in-flight fetch" (setup half)
- [ ] A fetch that resolves *after* `setActiveSessionId` was already called does not overwrite the optimistic value → maps to `specs/session-controls/spec.md`: "An optimistic update is not reverted by a stale in-flight fetch"
- [ ] A fetch that resolves *after* a `session` stream event was already received does not overwrite the stream-driven value → maps to `specs/session-controls/spec.md`: "An already-active session is visible without a prior stream event" (race variant) / Decision 1 in `design.md`
- [ ] A `session` stream event confirming the same value as a prior optimistic `setActiveSessionId` call causes no additional state change/flicker (assert render count or value stability) → maps to `specs/session-controls/spec.md`: "A duplicate confirming stream event does not revert an optimistic update"
- [ ] Changing `campaignId` on a mounted hook instance resets `activeSessionId` to `undefined` and triggers a fresh fetch/subscription scoped to the new id, with no leaked value from the previous campaign → maps to `specs/session-controls/spec.md`: "Hook state resets when campaignId changes"
- [ ] Hook does not open more than one `EventSource`/`useCampaignStream` subscription per mount, and issues no polling — maps to `specs/session-controls/spec.md` NFAC: "No new SSE connections or polling introduced"

### T3/T4 — `SessionControl` new contract (`tests/unit/components/SessionControl.test.tsx`, `tests/unit/components/SessionControlReactive.test.tsx`)

- [ ] `SessionControl` rendered with only `{ campaignId }` (no `initialSessionId` prop exists on the type) renders nothing while the mocked `useActiveSessionId` reports `activeSessionId: undefined` → maps to `specs/session-controls/spec.md`: "Component initialization with no props beyond campaignId"
- [ ] Once the mocked hook resolves a value, `SessionControl` renders "Start Session" (`null`) or "End Session" (non-null) accordingly — regression check for existing `session-controls` requirements (`ADDED DM can start/end an active session`)
- [ ] `handleStart` success (201) calls the hook's `setActiveSessionId` with the new session id — maps to `specs/session-controls/spec.md`: "Start/end/force-end actions use the hook's setter"
- [ ] `handleEnd`/`handleForceEnd` success calls the hook's `setActiveSessionId(null)` — same mapping
- [ ] `reconcileFromCampaign` (409/404 races) calls the hook's `setActiveSessionId` with the reconciled value, preserving existing `session-controls` "Concurrent session start/end races are reconciled without a user-facing error" behavior
- [ ] Existing `SessionControlReactive.test.tsx` scenarios (control updates on SSE event received via the hook) continue to pass with `useActiveSessionId` mocked instead of a direct `useCampaignStream` mock

### T5 — `SessionControl` call sites (`app/campaigns/[id]/layout.tsx`, `app/campaigns/[id]/sessions/page.tsx`, `tests/unit/components/SessionsPage.test.tsx`, `tests/unit/campaignLayoutNav.test.tsx`)

- [ ] `tests/unit/components/SessionsPage.test.tsx` asserts `SessionControl` is rendered with `{ campaignId }` and no `initialSessionId` prop
- [ ] `tests/unit/campaignLayoutNav.test.tsx` (if it asserts on `SessionControl` props) is updated to the new contract; otherwise confirm no assertion needs changing

### T6/T7/T8 — `CampaignChat` new contract (`tests/unit/components/CampaignChat/**`)

- [ ] `CampaignChat` rendered with only `{ campaignId, onSizeChange }` (no `activeSessionId`/`onSessionChange` on the prop type) reflects a mocked `useActiveSessionId` returning a non-null `activeSessionId` on first render, with no stream event required → maps to `specs/roll-share-ui/spec.md`: "An already-active session is reflected without an external prop" (regression guard for GitHub issue #721; adapted from deleted `TC-3.11`)
- [ ] `activeSessionId === null` from the mocked hook disables roll-history fetch and dice-session presence, shows "No active session" footer, feed still loads → maps to `specs/roll-share-ui/spec.md`: "activeSessionId null disables roll history and presence, feed still loads" (unchanged scenario, new data source)
- [ ] `activeSessionId` non-null from the mocked hook enables roll-history fetch and dice-session presence announcement → maps to `specs/roll-share-ui/spec.md`: "activeSessionId non-null enables roll history and presence" (unchanged scenario, new data source)
- [ ] Simulating the mocked hook's `activeSessionId` transitioning from non-null to `null` (session end) updates `CampaignChat`'s rendered footer/gating without remount → adapted from deleted `TC-3.12`
- [ ] `useChatFeed`'s `onStreamEvent` no longer has a `session`-type branch and accepts no `onSessionChange` param (type-level check / unit test asserting a `session` event passed to `useChatFeed`'s internal handler, if reachable in isolation, does not throw and has no observable side effect on the feed)

### T9/T10 — `CampaignLayout` simplified wiring (`tests/unit/components/CampaignLayout.test.tsx`)

- [ ] `CampaignLayout` renders `<SessionControl campaignId={id} />` — assert the captured props contain no `initialSessionId`, `activeSessionId`, or `onSessionChange` key → maps to `specs/session-event/spec.md`: "REMOVED layout updates `activeSessionId` reactively from `session` events" (confirms the removal) and replaces deleted `T3-3`
- [ ] `CampaignLayout` renders `<CampaignChat campaignId={id} onSizeChange={...} />` — assert the captured props contain no `activeSessionId` or `onSessionChange` key → replaces deleted `TC-3.11`/`TC-3.12` with a "props never existed to begin with" assertion rather than a "propagation works" assertion
- [ ] `CampaignLayout`'s `campaignName` fetch/display behavior is unaffected (regression check that removing `initialSessionId` state didn't disturb the adjacent `campaignName` state in the same effect)

### T11 — Repo-wide confirmation sweep

- [ ] `grep -rn "<CampaignChat" --include="*.tsx" --include="*.ts" . | grep -v tests/ | grep -v node_modules` returns exactly one match (`app/campaigns/[id]/layout.tsx`) using the new prop contract
- [ ] `grep -rn "<SessionControl" --include="*.tsx" . | grep -v tests/ | grep -v node_modules` returns exactly the two known matches (`app/campaigns/[id]/layout.tsx`, `app/campaigns/[id]/sessions/page.tsx`), both using the new prop contract

## Acceptance Scenario Coverage Cross-Check

Every scenario below (from this change's spec deltas) must have at least one test case above mapped to it before Validation is considered complete:

- `specs/session-controls/spec.md`: all 5 ADDED scenarios + both MODIFIED scenarios + both NFAC scenarios → covered by T1/T2, T3/T4 test cases above
- `specs/session-event/spec.md`: REMOVED requirements have no scenarios to test (their absence is what T9/T10's "no `onSessionChange`/`initialSessionId` key" assertions confirm); MODIFIED "session event type" scenario is a no-op confirmation, not independently testable by this change (covered by pre-existing server-side tests, unaffected)
- `specs/roll-share-ui/spec.md`: all 3 scenarios under "MODIFIED CampaignChat accepts activeSessionId prop" → covered by T6/T7/T8 test cases above
