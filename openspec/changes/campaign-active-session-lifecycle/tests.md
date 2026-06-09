---
name: tests
description: Tests for the campaign-active-session-lifecycle change
---

# Tests

## Overview

Tests for `campaign-active-session-lifecycle`. All work follows strict TDD: write a failing test first, then implement the minimum code to pass it, then refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** — capture the requirement before writing implementation. Run the test; confirm it fails.
2. **Write code to pass the test** — simplest code that makes the test green.
3. **Refactor** — improve quality while keeping the test green.

---

## Test Cases

### Task 2 — `setActiveCampaignSession` storage method

- [ ] **T2.1** — `setActiveCampaignSession(campaignId, sessionId)` calls `updateOne` with `{ $set: { activeSessionId: sessionId, updatedAt: <Date> } }` and does NOT call `replaceOne` or `findOneAndReplace`.
  - Spec: Requirement: ADDED `Campaign.activeSessionId` field / Concurrent write safety
  - File: storage unit test

- [ ] **T2.2** — `setActiveCampaignSession(campaignId, null)` calls `updateOne` with `{ $set: { activeSessionId: null, updatedAt: <Date> } }`.
  - Spec: Scenario: "Field is null after session closed"
  - File: storage unit test

- [ ] **T2.3** — `setActiveCampaignSession` updates `updatedAt` to approximately `Date.now()`.
  - Spec: Design Decision 2
  - File: storage unit test

---

### Task 3 — `normalizeCampaign` pass-through

- [ ] **T3.1** — `normalizeCampaign({ ...campaignWithoutActiveSessionId })` returns an object without `activeSessionId` key.
  - Spec: Scenario: "Normalization pass-through for absent field"
  - File: storage unit test

- [ ] **T3.2** — `normalizeCampaign({ ...campaignWithActiveSessionIdNull })` returns object with `activeSessionId: null`.
  - Spec: Scenario: "Normalization pass-through for null value"
  - File: storage unit test

---

### Task 4 — `POST /api/campaigns/:id/sessions/active`

- [ ] **T4.1** — POST by DM on campaign with no active session returns 201 and a valid `SessionLog` body.
  - Spec: Scenario: "DM opens session successfully"
  - File: `app/api/campaigns/[id]/sessions/active/route.test.ts`

- [ ] **T4.2** — POST by DM: returned `SessionLog.datePlayed` is within 5 seconds of `Date.now()`.
  - Spec: Scenario: "DM opens session successfully" (datePlayed ≈ Date.now())
  - File: route integration test

- [ ] **T4.3** — POST by DM: after success, `GET /api/campaigns/:id` returns `activeSessionId` equal to returned `SessionLog.id`.
  - Spec: Scenario: "Field present after session opened"
  - File: route integration test

- [ ] **T4.4** — POST by DM when `activeSessionId` already set returns 409 `{ error: 'A session is already active' }` and does NOT modify `activeSessionId`.
  - Spec: Scenario: "Conflict — session already active"
  - File: route integration test

- [ ] **T4.5** — POST by player (non-DM) member returns 404.
  - Spec: Scenario: "Non-DM member is rejected" (POST)
  - File: route integration test

- [ ] **T4.6** — POST without auth returns 401.
  - Spec: Scenario: "Unauthenticated request rejected" (POST)
  - File: route integration test

---

### Task 4 — `DELETE /api/campaigns/:id/sessions/active`

- [ ] **T4.7** — DELETE by DM with active session returns 200 `{ sessionId: "<id>" }`.
  - Spec: Scenario: "DM closes active session successfully"
  - File: route integration test

- [ ] **T4.8** — DELETE by DM: after success, `GET /api/campaigns/:id` returns `activeSessionId: null`.
  - Spec: Scenario: "Field is null after session closed"
  - File: route integration test

- [ ] **T4.9** — DELETE by DM with no active session (no `?force`) returns 404.
  - Spec: Scenario: "No active session — 404"
  - File: route integration test

- [ ] **T4.10** — DELETE by player (non-DM) returns 404.
  - Spec: Scenario: "Non-DM member is rejected" (DELETE)
  - File: route integration test

- [ ] **T4.11** — DELETE without auth returns 401.
  - Spec: Scenario: "Unauthenticated request rejected" (DELETE)
  - File: route integration test

- [ ] **T4.12** — `DELETE ?force=true` with stale `activeSessionId` returns 200 and `GET` shows `activeSessionId: null`.
  - Spec: Scenario: "Force-reset clears stale `activeSessionId`"
  - File: route integration test

- [ ] **T4.13** — `DELETE ?force=true` with no active session returns 200 and `GET` shows `activeSessionId: null`.
  - Spec: Scenario: "Force-reset when no active session is a no-op success"
  - File: route integration test

- [ ] **T4.14** — After `DELETE ?force=true`, subsequent `POST` returns 201 (not 409).
  - Spec: Scenario: "After force-reset, DM can open a new session"
  - File: route integration test

---

### Task 6 — SessionLog persists after close

- [ ] **T6.1** — After `DELETE /active`, `GET /api/campaigns/:id/sessions` still includes the closed `SessionLog`.
  - Spec: Scenario: "Session log remains after close"
  - File: route integration test
