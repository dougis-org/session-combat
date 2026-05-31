---
name: tests
description: Test plan for combat-event-auto-capture
---

# Tests

## Overview

Test plan for the `combat-event-auto-capture` change. All work follows strict TDD: write a failing test → make it pass → refactor.

All test file paths are relative to the project root. Unit tests run via `npm run test:unit`; integration tests via `npm run test:integration`.

---

## T1 — CombatState type (lib/types.ts)

Covered by TypeScript compiler — no runtime tests needed. Verified by `npx tsc --noEmit`.

- [ ] Fixture `tests/unit/fixtures/combatHelpers.ts` `makeCombatState` includes `campaignId: 'test-campaign'`
- [ ] All existing unit tests that use `makeCombatState` pass after fixture update

---

## T2 — POST /api/combat — insert, require campaignId

**File:** `tests/integration/api/combat.test.ts` (new or existing)

- [ ] **Test: POST without campaignId returns 400**
  - Arrange: authenticated user, body without `campaignId`
  - Act: POST /api/combat
  - Assert: HTTP 400; no document inserted in DB

- [ ] **Test: POST with valid body inserts a new document**
  - Arrange: authenticated user, body with `campaignId: 'camp-1'`, `encounterId: 'enc-1'`
  - Act: POST /api/combat
  - Assert: HTTP 201; `combatStates` collection has exactly 1 document; response body includes `id`, `campaignId: 'camp-1'`

- [ ] **Test: Two sequential POSTs create two documents (no overwrite)**
  - Arrange: authenticated user
  - Act: POST /api/combat twice (different `campaignId` or same)
  - Assert: `combatStates` collection has 2 documents; first document unchanged

---

## T3 — PUT /api/combat/[id] — completedAt on deactivation

**File:** `tests/integration/api/combat-id.test.ts` (new or existing)

- [ ] **Test: PUT with isActive: false sets completedAt**
  - Arrange: active combat document in DB (`isActive: true`)
  - Act: PUT /api/combat/[id] with `{ isActive: false }`
  - Assert: document has `isActive: false`; `completedAt` is a Date within 5 seconds of now

- [ ] **Test: PUT without isActive change does not set completedAt**
  - Arrange: active combat document
  - Act: PUT /api/combat/[id] with `{ currentRound: 3 }`
  - Assert: `completedAt` is not set; `isActive` remains `true`

- [ ] **Test: PUT sets completedAt only once (idempotent)**
  - Arrange: already completed combat (`isActive: false`, `completedAt: T1`)
  - Act: PUT /api/combat/[id] with `{ isActive: false }` again
  - Assert: `completedAt` is still T1 (not overwritten)

---

## T4 — GET /api/combat — isActive: true filter

**File:** `tests/integration/api/combat.test.ts`

- [ ] **Test: GET returns null when no active combat**
  - Arrange: one completed combat in DB (`isActive: false`) for user
  - Act: GET /api/combat
  - Assert: HTTP 200; body is `null`

- [ ] **Test: GET returns active combat when one exists**
  - Arrange: one completed and one active combat in DB for user
  - Act: GET /api/combat
  - Assert: HTTP 200; body is the active combat document

- [ ] **Test: GET returns null when no combat documents exist**
  - Arrange: empty `combatStates` collection for user
  - Act: GET /api/combat
  - Assert: HTTP 200; body is `null`

---

## T5 — useCombat hook refactor

**File:** `tests/unit/hooks/useCombat.test.ts`

- [ ] **Test: startCombat passes campaignId to POST body**
  - Arrange: `useCombat({ campaignId: 'camp-1' })`; mock `fetch` to return 201 with a combat doc
  - Act: call `startCombat()`
  - Assert: `fetch` called with POST /api/combat; body includes `campaignId: 'camp-1'`

- [ ] **Test: state updates after creation use PUT, not POST**
  - Arrange: active combat in state (id: 'combat-abc'); mock `fetch`
  - Act: call `nextTurn()` (or any state-changing action)
  - Assert: `fetch` called with PUT /api/combat/combat-abc; POST /api/combat NOT called again

- [ ] **Test: endCombat calls PUT with isActive: false before clearing state**
  - Arrange: active combat in state; mock `fetch` to return 200 on PUT
  - Act: call `endCombat()` (mock `window.confirm` to return true)
  - Assert: `fetch` called with PUT /api/combat/[id] `{ isActive: false }`; `combatState` becomes null after

- [ ] **Test: endCombat preserves state on PUT failure**
  - Arrange: active combat in state; mock `fetch` to return 500 on PUT
  - Act: call `endCombat()`
  - Assert: `combatState` remains non-null; error state is set

- [ ] **Test: page refresh resumes with correct id from GET response**
  - Arrange: mock GET /api/combat to return `{ id: 'combat-server-id', isActive: true, ... }`
  - Act: `useCombat` loads
  - Assert: subsequent `nextTurn()` call uses PUT /api/combat/combat-server-id

---

## T6 — /campaigns/[id]/combat page

**File:** `tests/unit/components/CampaignCombatPage.test.tsx` (new)

- [ ] **Test: campaign combat page renders combat UI**
  - Arrange: mock `useCombat`; render `app/campaigns/[id]/combat/page.tsx` with `params: { id: 'camp-1' }`
  - Act: render
  - Assert: `useCombat` called with `{ campaignId: 'camp-1' }`; combat UI rendered

---

## T7 — GET /api/campaigns/[id]/combat-events

**File:** `tests/integration/api/campaigns-combat-events.test.ts` (new)

- [ ] **Test: returns combat_completed events in the window**
  - Arrange: two completed combats for campaign `camp-1`: one at T1 (before since), one at T2 (after since)
  - Act: GET /api/campaigns/camp-1/combat-events?since=T1+1s
  - Assert: HTTP 200; array of length 1; event has `type: 'combat_completed'`, `campaignId: 'camp-1'`, `completedAt: T2`

- [ ] **Test: returns empty array when no completed combats in window**
  - Arrange: campaign with no completed combats after since
  - Act: GET /api/campaigns/camp-1/combat-events?since=now
  - Assert: HTTP 200; `[]`

- [ ] **Test: excludes active combats (no completedAt)**
  - Arrange: one active combat, one completed combat for campaign
  - Act: GET /api/campaigns/camp-1/combat-events?since=epoch
  - Assert: array length 1 (only completed)

- [ ] **Test: excludes combats from other campaigns**
  - Arrange: completed combats for camp-1 and camp-2 (same user)
  - Act: GET /api/campaigns/camp-1/combat-events?since=epoch
  - Assert: only camp-1 combats in result

- [ ] **Test: unauthenticated returns 401**
  - Act: GET /api/campaigns/camp-1/combat-events without auth
  - Assert: HTTP 401

- [ ] **Test: event description uses encounterDescription and rounds**
  - Arrange: completed combat with `encounterDescription: 'Goblin Ambush'`, `currentRound: 4`
  - Act: GET /api/campaigns/[id]/combat-events?since=epoch
  - Assert: event `description` is `"Combat: Goblin Ambush (3 rounds)"`

- [ ] **Test: event description degrades when no encounterDescription**
  - Arrange: completed combat with no `encounterDescription`
  - Act: GET /api/campaigns/[id]/combat-events?since=epoch
  - Assert: event `description` is `"Combat: Unnamed encounter (N rounds)"`

---

## T8 — Session journal form pre-population

**File:** `tests/unit/components/SessionForm.test.tsx` (new or existing)

- [ ] **Test: form pre-populates combat events from API**
  - Arrange: mock GET /api/campaigns/[id]/combat-events to return 1 combat event
  - Act: render session log create form for campaign
  - Assert: combat event appears in the pre-populated events list

- [ ] **Test: since defaults to campaign createdAt when no prior sessions**
  - Arrange: campaign with `createdAt: T0`; no session logs; mock combat-events fetch
  - Act: render form
  - Assert: combat-events fetch called with `since=T0` (campaign createdAt)

- [ ] **Test: since uses last session's datePlayed when sessions exist**
  - Arrange: campaign with one session log at T1
  - Act: render form
  - Assert: combat-events fetch called with `since=T1`

- [ ] **Test: form loads normally if combat-events fetch fails**
  - Arrange: mock GET /api/campaigns/[id]/combat-events to return 500
  - Act: render form
  - Assert: form renders without crash; no combat events pre-populated; no unhandled error

- [ ] **Test: combat events and NPC events both appear in events list**
  - Arrange: mock returns 1 combat event; NPC events pre-populated separately
  - Act: render form
  - Assert: both event types visible in the list

---

## T9 — MongoDB index

Verified by integration test infrastructure:

- [ ] **Test: combatStates index exists**
  - Arrange: call `db.collection('combatStates').indexes()`
  - Assert: result includes an index with keys `{ userId: 1, campaignId: 1, completedAt: 1 }`
