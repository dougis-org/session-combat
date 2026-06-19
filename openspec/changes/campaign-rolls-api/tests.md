---
name: tests
description: Tests for the campaign-rolls-api change
---

# Tests

## Overview

All work follows strict TDD: write a failing test, implement the minimum code to pass, then refactor.

Test files:
- `tests/unit/utils/campaignRolls.test.ts` — `canSeeRoll()` unit tests
- `tests/unit/api/campaigns/[id]/rolls.route.test.ts` — route handler unit tests
- `tests/integration/campaigns/rolls.integration.test.ts` — end-to-end integration tests

Run commands:
- Unit: `npm run test:unit -- --testPathPattern='tests/unit'`
- Integration: `npm run build && npm run test:integration -- --testPathPattern='rolls'`

---

## Task 2 — `canSeeRoll()` (file: `tests/unit/utils/campaignRolls.test.ts`)

### Spec ref: "ADDED `canSeeRoll()` pure function"

- [ ] **DM sees `dm-only` roll** — given a `dm-only` roll and the DM's userId, `canSeeRoll()` returns `true`
- [ ] **Player cannot see another player's `dm-only` roll** — given a `dm-only` roll posted by player A, calling with player B (role: player) returns `false`
- [ ] **Roller always sees own `dm-only` roll** — given a `dm-only` roll posted by player A, calling with player A's userId returns `true` even though role is player
- [ ] **Any active member sees `group` roll** — given a `group` roll, calling with any member's userId returns `true`
- [ ] **DM sees own `group` roll** — sanity check that DM also sees group rolls

---

## Task 5 — Route handler unit tests (file: `tests/unit/api/campaigns/[id]/rolls.route.test.ts`)

### Spec ref: "ADDED `POST /api/campaigns/[id]/rolls`"

#### POST happy paths

- [ ] **Valid `group` roll → 201** — mock `assertCampaignAccess` returning campaign with `activeSessionId` set; verify response is 201, body contains correct `sessionId`, `rollerId`, `rollerName`, `formula`, `rolls`, `total`
- [ ] **Valid `dm-only` roll → 201** — same setup with `visibility: { scope: 'dm-only' }`; verify 201

#### POST validation failures

- [ ] **Missing `formula` → 400** — omit `formula` from body; expect 400
- [ ] **Empty `formula` → 400** — `formula: ''`; expect 400
- [ ] **Missing `rolls` → 400** — omit `rolls`; expect 400
- [ ] **`rolls` not an array → 400** — `rolls: 'foo'`; expect 400
- [ ] **Missing `total` → 400** — omit `total`; expect 400
- [ ] **`total` not a number → 400** — `total: 'big'`; expect 400
- [ ] **Invalid `visibility.scope` → 400** — `visibility: { scope: 'direct', toUserId: 'x' }`; expect 400
- [ ] **Missing `visibility` → 400** — omit `visibility`; expect 400

#### POST state failures

- [ ] **No active session → 409** — mock campaign with `activeSessionId: undefined`; expect 409 with `{ error: 'No active session' }`
- [ ] **Inactive member → 403** — mock `storage.getMember` returning `{ status: 'pending' }`; expect 403

#### POST side effects

- [ ] **`emitFiltered` called with `roll` event** — after successful POST, verify `emitFiltered` spy was called with `{ type: 'roll', campaignId, data: <roll> }` and a function predicate
- [ ] **Insert called with correct document** — verify `insertOne` receives roll doc with `sessionId` from `activeSessionId`

### Spec ref: "ADDED `GET /api/campaigns/[id]/rolls`"

#### GET validation

- [ ] **Missing `sessionId` → 400** — no query param; expect 400
- [ ] **Empty `sessionId` → 400** — `?sessionId=`; expect 400

#### GET visibility

- [ ] **DM gets all rolls** — mock list returning `group` + `dm-only` rolls; DM caller receives both
- [ ] **Player sees only own `dm-only` and `group`** — mock list returning filtered results; player does not see other player's `dm-only`

#### GET pagination

- [ ] **`nextCursor` returned when more results** — mock list returning `limit + 1` items; verify response has `nextCursor` and exactly `limit` items
- [ ] **No `nextCursor` when last page** — mock list returning `limit` items; verify no `nextCursor` in response

#### GET error handling

- [ ] **Inactive member → 403** — mock `getMember` returning inactive member; expect 403
- [ ] **DB error → 500** — mock `listCampaignRolls` throwing; expect 500 with structured error

---

## Task 6 — Integration tests (file: `tests/integration/campaigns/rolls.integration.test.ts`)

### Spec ref: all scenarios in `specs/rolls-api/spec.md`

- [ ] **POST persists roll against active session** — open a session via `POST /sessions/active`, then `POST /rolls`; verify 201 and roll is retrievable via GET
- [ ] **POST with no active session → 409** — do not open a session; POST a roll; expect 409
- [ ] **GET without `sessionId` → 400** — GET without param; expect 400
- [ ] **DM sees `dm-only` roll in GET** — player POSTs `dm-only` roll; DM GETs session rolls; roll is in results
- [ ] **Player does not see other player's `dm-only` roll in GET** — player A POSTs `dm-only`; player B GETs; roll is absent
- [ ] **Player sees own `dm-only` roll in GET** — player A POSTs `dm-only`; player A GETs; roll is present
- [ ] **Rolls scoped to session** — open session 1, post roll, close; open session 2, post roll; GET session 1 rolls returns only session 1 roll
- [ ] **Unauthenticated POST → 401** — no auth token; POST roll; expect 401
- [ ] **Unauthenticated GET → 401** — no auth token; GET rolls; expect 401
