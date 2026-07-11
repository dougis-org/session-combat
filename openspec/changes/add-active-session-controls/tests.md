---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `add-active-session-controls` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### T1 — `lib/hooks/useIsDM.ts` (new file: `tests/unit/hooks/useIsDM.test.ts`)

- [x] T1-1: Given `/api/campaigns/:id/members/me` returns the current user as `{ role: 'dm', status: 'active' }`, `useIsDM` returns `{ isDM: true, loading: false }`. — Task: T1. Spec: ADDED "Non-DM members do not see the session control" (negative-case complement).
- [x] T1-2: Given the current user's membership is `{ role: 'player', status: 'active' }`, `useIsDM` returns `{ isDM: false, loading: false }`. — Task: T1. Spec: ADDED "Non-DM members do not see the session control" — Scenario "Non-DM member does not see the control".
- [x] T1-3: Given the current user's membership is `{ role: 'dm', status: 'invited' }` (not yet active), `useIsDM` returns `{ isDM: false, loading: false }`. — Task: T1. Spec: same as T1-2 (edge case of DM gate).
- [x] T1-4: Given `/api/campaigns/:id/members/me` returns 404 (current user is not a member), `useIsDM` returns `{ isDM: false, loading: false }`. — Task: T1. Spec: same as T1-2 (edge case of DM gate).
- [x] T1-5: Before the `/members/me` fetch resolves, `useIsDM` returns `{ isDM: false, loading: true }`. — Task: T1. Spec: supports "renders nothing while loading" behavior consumed by T2.

### T2 — `lib/components/SessionControl.tsx` (new file: `tests/unit/components/SessionControl.test.tsx`)

- [x] T2-1: Given `useIsDM` resolves `isDM: false`, `SessionControl` renders `null` (no button, no text). — Task: T2. Spec: ADDED "Non-DM members do not see the session control" — Scenario "Non-DM member does not see the control".
- [x] T2-2: Given `useIsDM` is still `loading: true`, `SessionControl` renders `null`. — Task: T2. Spec: same requirement, loading edge case.
- [x] T2-3: Given `isDM: true` and `activeSessionId: null`, `SessionControl` renders a "Start Session" button and no "End Session"/"Force end" affordance. — Task: T2. Spec: ADDED "DM can start an active session from the campaign layout header".
- [x] T2-4: Given `isDM: true` and `activeSessionId: null`, clicking "Start Session" calls `fetch('/api/campaigns/{campaignId}/sessions/active', { method: 'POST' })`; on a 201 response with `{ id: 'log-1', ... }`-shaped body, `onSessionChange('log-1')` is called exactly once. — Task: T2. Spec: ADDED "DM can start an active session from the campaign layout header" — Scenario "DM starts a session".
- [x] T2-5: Given the `POST` above returns a 409, `SessionControl` issues `fetch('/api/campaigns/{campaignId}')`, and on that response's `activeSessionId` value calls `onSessionChange` with the fetched value; no inline error text is rendered. — Task: T2. Spec: ADDED "Concurrent session start/end races are reconciled without a user-facing error" — Scenario "Race with another DM tab is reconciled silently".
- [x] T2-6: Given the `POST` above returns a 500, `SessionControl` renders an inline error message and does not call `onSessionChange`; the button returns to enabled, non-busy "Start Session" state. — Task: T2. Spec: ADDED "DM can start an active session from the campaign layout header" — Scenario "Start Session request fails unexpectedly".
- [x] T2-7: Given `isDM: true` and `activeSessionId: 'log-1'`, `SessionControl` renders an "End Session" button and a distinct, separately-clickable "Force end (recovery)" affordance. — Task: T2. Spec: ADDED "DM can end an active session from the campaign layout header"; ADDED "DM can recover from a stale/stuck active session".
- [x] T2-8: Given `isDM: true` and `activeSessionId: 'log-1'`, clicking "End Session" calls `fetch('/api/campaigns/{campaignId}/sessions/active', { method: 'DELETE' })` with no `force` query param; on a 200 response, `onSessionChange(null)` is called exactly once. — Task: T2. Spec: ADDED "DM can end an active session from the campaign layout header" — Scenario "DM ends a session".
- [x] T2-9: Given the `DELETE` above returns a 404, `SessionControl` calls `onSessionChange(null)` directly (no extra fetch needed, per Decision 4) and renders no inline error text. — Task: T2. Spec: ADDED "Concurrent session start/end races are reconciled without a user-facing error" — Scenario "End Session race is reconciled silently".
- [x] T2-10: Given the `DELETE` above returns a 500, `SessionControl` renders an inline error message and does not call `onSessionChange`; the button returns to enabled, non-busy "End Session" state. — Task: T2. Spec: ADDED "DM can end an active session from the campaign layout header" — Scenario "End Session request fails unexpectedly".
- [x] T2-11: Given `activeSessionId: 'log-1'`, clicking "Force end (recovery)" calls `fetch('/api/campaigns/{campaignId}/sessions/active?force=true', { method: 'DELETE' })`; on success, `onSessionChange(null)` is called. — Task: T2. Spec: ADDED "DM can recover from a stale/stuck active session" — Scenario "DM force-resets a stale session".
- [x] T2-12: While a `POST`/`DELETE` request from T2-4/T2-8/T2-11 is in flight, the relevant button(s) are disabled (`busy: true`) to prevent duplicate submissions. — Task: T2. Spec: supports NFAC "Performance" — Scenario "Latency budget" (no extra round-trips from double-submission).

### T3 — `app/campaigns/[id]/layout.tsx` wiring (extend `tests/unit/app/campaigns/[id]/layout.test.tsx` or equivalent existing layout test file)

- [x] T3-1: `CampaignLayout` renders `SessionControl` inside the header for the compact (non-`isLarge`) branch, receiving `campaignId`, `activeSessionId`, and `onSessionChange={setActiveSessionId}` matching the props already passed to `CampaignChat`. — Task: T3. Spec: ADDED "DM can start an active session from the campaign layout header" (location requirement); Design Decision 1.
- [x] T3-2: `CampaignLayout` renders `SessionControl` inside the header for the `isLarge` (side-by-side chat) branch as well. — Task: T3. Spec: same as T3-1 (every-tab/every-layout requirement).
- [x] T3-3: Given `SessionControl`'s `onSessionChange` is invoked with a session id (simulated the same way the existing `CampaignChat.onSessionChange` callback already is in this test file), `CampaignLayout`'s `activeSessionId` state updates and is passed through to `CampaignChat` (asserted via `CampaignChat`'s received prop, consistent with existing layout tests). — Task: T3. Spec: ADDED "Session control state stays reactive across tabs, devices, and server instances" — NFAC "Control state matches RollEntryStrip state".

### T4 — Reactive SSE integration coverage (extend `tests/unit/components/CampaignChat/CampaignChat.scene.test.tsx`-style harness or a new `tests/unit/integration/SessionControlReactive.test.tsx`)

- [x] T4-1: Given `CampaignLayout` (or an equivalent harness wiring `SessionControl` + `CampaignChat` to shared `activeSessionId` state) starts with `activeSessionId: null`, and a `session` stream event with `{ activeSessionId: 'log-2' }` is delivered through the existing `useCampaignStream`/`onSessionChange` path, `SessionControl` flips from "Start Session" to "End Session" state and `RollEntryStrip` becomes enabled — both driven by the same state update, with no additional fetch issued by `SessionControl`. — Task: T4. Spec: ADDED "Session control state stays reactive across tabs, devices, and server instances" — Scenario "Control updates reactively on session SSE event"; NFAC "Control state matches RollEntryStrip state".
- [x] T4-2: Repeat T4-1 in reverse (`session` event delivers `activeSessionId: null` while a session was active) and confirm `SessionControl` flips to "Start Session" and `RollEntryStrip` becomes disabled in the same update. — Task: T4. Spec: same as T4-1.

### T5 — Acceptance criteria coverage check (no new test file — traceability audit)

- [x] T5-1: Manually cross-check every scenario in `openspec/changes/add-active-session-controls/specs/session-controls/spec.md` against the test cases above (and record the mapping already present in each test case's "Spec:" annotation); confirm no scenario is left without at least one corresponding automated test before marking Execution tasks complete. — Task: T5.
