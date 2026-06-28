---
name: tests
description: Tests for the fix-dice-roll-session-event change
---

# Tests

## Overview

Tests for the `fix-dice-roll-session-event` change. All work follows strict TDD: write a failing test first, then write the minimum code to make it pass, then refactor.

Existing related test files:
- `tests/unit/components/CampaignChat.test.tsx` — component tests
- `tests/unit/components/CampaignChat.roll.test.tsx` — roll strip tests
- `tests/unit/api/campaigns/[id]/sessions/active.route.test.ts` — sessions/active route tests
- `tests/integration/campaigns/rolls.integration.test.ts` — rolls integration tests

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** — Before writing any implementation code, write a test that captures the requirement. Run it and confirm it fails.
2. **Write code to pass the test** — Write the minimum code to make the test pass.
3. **Refactor** — Improve quality while keeping the test green.

## Test Cases

### Task 1 — `CampaignStreamEvent` session variant

File: `tests/unit/types.session-event.test.ts` (new)

- [ ] **TC-1.1: TypeScript accepts session event with non-null activeSessionId**
  - Spec scenario: "Session event shape is valid when session starts"
  - Verify: `const e: CampaignStreamEvent = { type: 'session', campaignId: 'c1', data: { activeSessionId: 'abc' } }` compiles without error (type-level test, exercised by `npm run type-check`)

- [ ] **TC-1.2: TypeScript accepts session event with null activeSessionId**
  - Spec scenario: "Session event shape is valid when session ends"
  - Verify: `const e: CampaignStreamEvent = { type: 'session', campaignId: 'c1', data: { activeSessionId: null } }` compiles without error

### Task 2 — `sessions/active` route emits `session` event

File: `tests/unit/api/campaigns/[id]/sessions/active.route.test.ts` (extend existing)

- [ ] **TC-2.1: POST handler calls `emitFiltered` with session-start event**
  - Spec scenario: "session event reaches all active subscribers on start"
  - Setup: Mock `emitFiltered` from `lib/server/transport`; mock storage to allow session claim
  - Action: Call POST handler with valid DM auth
  - Assert: `emitFiltered` called once with `(campaignId, { type: 'session', campaignId, data: { activeSessionId: <logId> } }, <fn>)`; the predicate returns `true` for any userId

- [ ] **TC-2.2: POST handler does NOT call `emitFiltered` when session already exists (409)**
  - Spec scenario: "No session event emitted when session start fails"
  - Setup: Mock `campaign.activeSessionId` as already set
  - Action: Call POST handler
  - Assert: Returns 409; `emitFiltered` not called

- [ ] **TC-2.3: DELETE handler calls `emitFiltered` with session-end event**
  - Spec scenario: "session event reaches all active subscribers on end"
  - Setup: Mock `emitFiltered`; mock storage with an active session
  - Action: Call DELETE handler with valid DM auth
  - Assert: `emitFiltered` called once with `(campaignId, { type: 'session', campaignId, data: { activeSessionId: null } }, <fn>)`

### Task 3 — `CampaignChat` forwards `session` events via `onSessionChange`

File: `tests/unit/components/CampaignChat.test.tsx` (extend existing)

- [ ] **TC-3.1: `onSessionChange` called with new session ID on `session` event**
  - Spec scenario: "onSessionChange called with new session ID on start event"
  - Setup: Render `CampaignChat` with `campaignId`, `activeSessionId={null}`, and `onSessionChange` spy; mock `useCampaignStream` to capture the event handler
  - Action: Fire a `session` event with `data.activeSessionId = "abc"` via the captured handler
  - Assert: `onSessionChange` spy called once with `"abc"`

- [ ] **TC-3.2: `onSessionChange` called with null on end event**
  - Spec scenario: "onSessionChange called with null on end event"
  - Action: Fire a `session` event with `data.activeSessionId = null`
  - Assert: `onSessionChange` spy called once with `null`

- [ ] **TC-3.3: No error when `onSessionChange` prop is omitted**
  - Spec scenario: "No error when onSessionChange is not provided"
  - Setup: Render `CampaignChat` without `onSessionChange`
  - Action: Fire a `session` event via the captured stream handler
  - Assert: No thrown error; component remains stable

### Task 4 — Layout updates `activeSessionId` reactively

File: `tests/unit/components/CampaignLayout.session.test.tsx` (new)

- [ ] **TC-4.1: Roll strip enables when session event arrives after page load**
  - Spec scenario: "Roll strip enables when session starts after page load"
  - Setup: Render the layout with a mock `CampaignChat` that exposes `onSessionChange`; initial fetch returns `activeSessionId: null`
  - Action: Invoke `onSessionChange("abc")` (simulating a session event received by `CampaignChat`)
  - Assert: `activeSessionId` prop passed to `CampaignChat` updates to `"abc"`

- [ ] **TC-4.2: Roll strip disables when session end event arrives**
  - Spec scenario: "Roll strip disables when session ends"
  - Setup: Initial fetch returns `activeSessionId: "existing"`
  - Action: Invoke `onSessionChange(null)`
  - Assert: `activeSessionId` prop passed to `CampaignChat` updates to `null`

- [ ] **TC-4.3: Static case — session already active on initial load**
  - Spec scenario: "Roll strip renders correctly when session is already active on initial load"
  - Setup: Mock fetch to return `{ activeSessionId: "existing-id" }`
  - Action: Render the layout
  - Assert: `CampaignChat` receives `activeSessionId="existing-id"` from the initial fetch (no `session` event needed)

### Task 5 — Regression: existing event types unaffected

File: `tests/unit/components/CampaignChat.test.tsx` (extend existing)

- [ ] **TC-5.1: `message` events still processed normally**
  - Spec scenario: "Existing event types are unaffected"
  - Action: Fire a `message` event; assert it appears in the feed as before

- [ ] **TC-5.2: `roll` events still processed normally**
  - Action: Fire a `roll` event; assert it appears in the feed as before

- [ ] **TC-5.3: `heartbeat` events do not affect `onSessionChange`**
  - Action: Fire a `heartbeat` event with `onSessionChange` spy present; assert spy not called
