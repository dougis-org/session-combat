---
name: tests
description: Tests for the campaign-session-journal change
---

# Tests

## Overview

All work follows strict TDD: write a failing test first, implement the minimum to pass, then refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** before any implementation code. Run it and confirm it fails.
2. **Write the minimum code** to make the test pass.
3. **Refactor** while keeping the test green.

## Test Cases

### Task A1–A2 — Party types + partySelection utility

- [ ] **A1-1** `expandPartyToCharacters` returns only members without `leftAt`
  - Spec: `specs/party-members.md` — "Active members derived correctly"
  - File: `tests/unit/utils/partySelection.test.ts`

- [ ] **A1-2** `expandPartyToCharacters` returns empty array for party with all members departed
  - Spec: `specs/party-members.md` — "Active members derived correctly"
  - File: `tests/unit/utils/partySelection.test.ts`

- [ ] **A1-3** `expandPartyToCharacters` handles party with no `members` array (guard against unmigrated docs reaching the utility)
  - Spec: `specs/party-members.md` — "Legacy party document loaded"
  - File: `tests/unit/utils/partySelection.test.ts`

### Task A3 — Lazy migration + cascade

- [ ] **A3-1** `loadParties()` with a document that has `characterIds` and no `members` returns derived `members` with `addedAt = party.createdAt`
  - Spec: `specs/party-members.md` — "Legacy party document loaded"
  - File: `tests/integration/api/parties.test.ts`

- [ ] **A3-2** `loadParties()` with a document that already has `members` returns it unchanged
  - Spec: `specs/party-members.md` — "Already-migrated party not re-migrated"
  - File: `tests/integration/api/parties.test.ts`

- [ ] **A3-3** `deleteCharacter()` sets `leftAt` on all active party memberships for that character
  - Spec: `specs/party-members.md` — "Character deleted sets leftAt on all party memberships"
  - File: `tests/integration/api/parties.test.ts`

- [ ] **A3-4** `deleteCharacter()` for a character not in any party succeeds without error
  - Spec: `specs/party-members.md` — "Deleting a character not in any party"
  - File: `tests/integration/api/parties.test.ts`

### Task A4 — Party POST route

- [ ] **A4-1** `POST /api/parties` with `characterIds` creates party with `members[]` where `addedAt` is set and no `characterIds` field stored
  - Spec: `specs/party-members.md` — "Party created with initial members"
  - File: `tests/integration/api/parties.test.ts`

- [ ] **A4-2** `POST /api/parties` with empty `characterIds` creates party with empty `members[]`
  - Spec: `specs/party-members.md` — "Party created with initial members"
  - File: `tests/integration/api/parties.test.ts`

### Task A5 — Party PUT route

- [ ] **A5-1** `PUT /api/parties/[id]` with a new characterId adds a member entry with `addedAt = now`
  - Spec: `specs/party-members.md` — "New member added to party"
  - File: `tests/integration/api/parties.test.ts`

- [ ] **A5-2** `PUT /api/parties/[id]` with a characterId removed from the list sets `leftAt = now` on that entry; entry remains in array
  - Spec: `specs/party-members.md` — "Member removed from party"
  - File: `tests/integration/api/parties.test.ts`

- [ ] **A5-3** `PUT /api/parties/[id]` with unchanged characterIds does not modify existing member timestamps
  - Spec: `specs/party-members.md` — "Member present in both old and new list"
  - File: `tests/integration/api/parties.test.ts`

### Task B1–B3 — Session log storage and API

- [ ] **B1-1** `getNextSessionNumber()` returns 1 when campaign has no sessions
  - Spec: `specs/session-log.md` — "Session number auto-increment on first session"
  - File: `tests/unit/storage/sessionLog.test.ts`

- [ ] **B1-2** `getNextSessionNumber()` returns `MAX + 1` when sessions exist
  - Spec: `specs/session-log.md` — "Create session log with required fields only"
  - File: `tests/unit/storage/sessionLog.test.ts`

- [ ] **B2-1** `POST /api/campaigns/[id]/sessions` with full body returns 201 and the created document
  - Spec: `specs/session-log.md` — "Create session log with all fields"
  - File: `tests/integration/api/sessions.test.ts`

- [ ] **B2-2** `POST /api/campaigns/[id]/sessions` without `datePlayed` returns 400
  - Spec: `specs/session-log.md` — "Create session log with missing datePlayed"
  - File: `tests/integration/api/sessions.test.ts`

- [ ] **B2-3** `POST /api/campaigns/[id]/sessions` without `sessionNumber` auto-increments correctly
  - Spec: `specs/session-log.md` — "Create session log with required fields only"
  - File: `tests/integration/api/sessions.test.ts`

- [ ] **B2-4** `GET /api/campaigns/[id]/sessions` returns sessions sorted by `sessionNumber` descending
  - Spec: `specs/session-log.md` — "List sessions sorted newest first"
  - File: `tests/integration/api/sessions.test.ts`

- [ ] **B2-5** `GET /api/campaigns/[id]/sessions` for campaign with no sessions returns empty array
  - Spec: `specs/session-log.md` — "List sessions for campaign with no entries"
  - File: `tests/integration/api/sessions.test.ts`

- [ ] **B3-1** `PATCH /api/campaigns/[id]/sessions/[sessionId]` updates specified fields and returns updated document
  - Spec: `specs/session-log.md` — "Update session title and summary"
  - File: `tests/integration/api/sessions.test.ts`

- [ ] **B3-2** `PATCH /api/campaigns/[id]/sessions/[sessionId]` for non-existent session returns 404
  - Spec: `specs/session-log.md` — "Update non-existent session log"
  - File: `tests/integration/api/sessions.test.ts`

- [ ] **B3-3** `DELETE /api/campaigns/[id]/sessions/[sessionId]` removes the log; subsequent GET returns 404
  - Spec: `specs/session-log.md` — "Delete existing session log"
  - File: `tests/integration/api/sessions.test.ts`

- [ ] **B3-4** All session endpoints return 401 without authentication
  - Spec: `specs/session-log.md` — "Session log CRUD requires authentication"
  - File: `tests/integration/api/sessions.test.ts`

- [ ] **B3-5** User B cannot read or modify user A's session logs
  - Spec: `specs/session-log.md` — "Session logs are user-scoped"
  - File: `tests/integration/api/sessions.test.ts`

- [ ] **B3-6** User B DELETE of user A's session returns 404
  - Spec: `specs/session-log.md` — "Delete session log belonging to another user"
  - File: `tests/integration/api/sessions.test.ts`

### Task C1–C2 — NPC auto-populate logic (unit)

- [ ] **C2-1** Given party members with `addedAt` in the time window, filter returns `npc_joined` events
  - Spec: `specs/npc-auto-capture.md` — "NPC joined since last session"
  - File: `tests/unit/utils/sessionEvents.test.ts`

- [ ] **C2-2** Given party members with `leftAt` in the time window, filter returns `npc_left` events
  - Spec: `specs/npc-auto-capture.md` — "NPC departed since last session"
  - File: `tests/unit/utils/sessionEvents.test.ts`

- [ ] **C2-3** Members outside the time window are excluded
  - Spec: `specs/npc-auto-capture.md` — "NPC member unchanged since last session"
  - File: `tests/unit/utils/sessionEvents.test.ts`

- [ ] **C2-4** No previous session date → all active members returned as `npc_joined`
  - Spec: `specs/npc-auto-capture.md` — "First session — no previous session date"
  - File: `tests/unit/utils/sessionEvents.test.ts`

- [ ] **C2-5** Mixed party: only 2 of 3 members are in window; exactly 2 events returned
  - Spec: `specs/npc-auto-capture.md` — "Auto-populate handles party with both active and departed members"
  - File: `tests/unit/utils/sessionEvents.test.ts`
