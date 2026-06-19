## Context

- Relevant architecture: Next.js App Router API routes; MongoDB via `lib/db.ts`; `lib/storage.ts` for data access; `lib/server/transport.ts` for SSE fan-out via `emitFiltered()`; `withAuthAndParams` middleware for auth + route params; `assertCampaignAccess` for membership checks.
- Dependencies: `activeSessionId` on `Campaign` (shipped in #400); `emitFiltered` + `CampaignStreamEvent` in `lib/server/transport.ts`; `CampaignMember` role/status from `storage.getMember()`.
- Interfaces/contracts touched: `lib/types.ts` (new types), `lib/storage.ts` (new methods), `lib/server/transport.ts` (`CampaignStreamEvent` union), `app/api/campaigns/[id]/rolls/route.ts` (new file).

## Goals / Non-Goals

### Goals

- Add `CampaignRoll` type and `RollVisibility` union to `lib/types.ts`
- Add `roll` variant to `CampaignStreamEvent`
- Add `canSeeRoll()` pure function in `lib/utils/campaignRolls.ts`
- Add `saveCampaignRoll()` and `listCampaignRolls()` to `lib/storage.ts`
- Implement `POST /api/campaigns/[id]/rolls` and `GET /api/campaigns/[id]/rolls?sessionId=<id>`
- Ensure `campaignRolls` index `{ campaignId, sessionId, createdAt }` is created at DB init

### Non-Goals

- Server-side dice rolling or formula validation
- `direct` visibility scope
- Roll editing or deletion
- UI integration (6b)
- Rate limiting

## Decisions

### Decision 1: Separate `RollVisibility` type

- Chosen: Define a new `RollVisibility = { scope: 'group' } | { scope: 'dm-only' }` in `lib/types.ts`, distinct from `MessageVisibility`.
- Alternatives considered: Reuse `MessageVisibility` directly; extract a shared base type.
- Rationale: Rolls intentionally omit the `direct` scope. A separate type encodes this constraint in the type system and prevents future callers from accidentally passing `direct` to roll handlers.
- Trade-offs: Minor duplication vs. `MessageVisibility`, but the semantic difference is worth the separation.

### Decision 2: GET requires explicit `sessionId` query param

- Chosen: `GET /api/campaigns/[id]/rolls?sessionId=<id>` — 400 if param is absent or empty.
- Alternatives considered: Default to `campaign.activeSessionId` when param is omitted.
- Rationale: Forces callers to be explicit about which session they want. Enables browsing historical sessions without ambiguity. Avoids a hidden dependency on live campaign state in a read path.
- Trade-offs: Caller must know the sessionId; not a problem since the UI will always have it (from the session open flow or session list).

### Decision 3: 409 for no active session on POST

- Chosen: Return `{ error: 'No active session' }` with status 409 when `campaign.activeSessionId` is absent.
- Alternatives considered: 422 Unprocessable Entity; 400 Bad Request.
- Rationale: 409 Conflict is semantically correct — the request is valid, but the server state (no open session) conflicts with it. Matches the pattern used in the `POST /sessions/active` handler for duplicate-open attempts. Client layer (6b) will surface a toast.
- Trade-offs: None significant.

### Decision 4: `canSeeRoll()` pure function pattern

- Chosen: Mirror `canSeeMessage()` from `lib/utils/campaignMessages.ts` — a pure function `canSeeRoll(roll: CampaignRoll, userId: string, members: CampaignMember[]): boolean` used by `emitFiltered()` for SSE fan-out. The GET path uses `storage.listCampaignRolls()` which applies an equivalent MongoDB query that mirrors the same rules — the query cannot call TypeScript functions directly, so the logic is mirrored (not shared) but tested in isolation.
- Alternatives considered: Inline visibility logic in the route handler.
- Rationale: `canSeeRoll()` is the authoritative rule definition. SSE uses it directly. GET uses a MongoDB query that mirrors it and is independently tested to guarantee they remain in sync.
- Trade-offs: The MongoDB query in storage mirrors rather than calls `canSeeRoll()`. This is unavoidable for DB-layer filtering; tests for both paths prevent divergence.

### Decision 5: Storage abstraction for all collection ops

- Chosen: Use `storage.saveCampaignRoll()` and `storage.listCampaignRolls()` for all `campaignRolls` operations. Both insert and list go through the storage layer.
- Alternatives considered: Use `getDatabase()` directly in the route handler for `insertOne` (messages pattern).
- Rationale: Having both insert and list in storage eliminates the inconsistency in the messages pattern and avoids dead code. Pre-commit code review flagged the direct insert as dead code since `storage.saveCampaignRoll()` was already defined; the route now uses it for consistency.
- Trade-offs: Slight deviation from the messages pattern (which uses direct insert), but yields a cleaner, fully-abstracted storage layer for rolls.

### Decision 6: Cursor pagination on GET matching messages

- Chosen: `before` cursor (ISO timestamp), `limit` capped at 100, `nextCursor` in response — identical to messages GET.
- Alternatives considered: Offset pagination; keyset on `id`.
- Rationale: Consistent with messages; time-based cursors are stable under concurrent inserts.
- Trade-offs: Cursors can become stale if rolls are inserted with backdated timestamps, but that's not possible here (server sets `createdAt`).

## Proposal to Design Mapping

- Proposal element: `CampaignRoll` type and `RollVisibility`
  - Design decision: Decision 1 (separate type)
  - Validation approach: TypeScript compilation; unit tests pass roll objects through `canSeeRoll()`

- Proposal element: POST validates and rejects when no active session
  - Design decision: Decision 3 (409)
  - Validation approach: Unit test with `campaign.activeSessionId = undefined`; integration test POSTing without opening a session

- Proposal element: GET requires `sessionId`
  - Design decision: Decision 2 (explicit param)
  - Validation approach: Unit test GET without param → 400; unit test with param → filtered results

- Proposal element: Visibility filtering identical for GET and SSE
  - Design decision: Decision 4 (`canSeeRoll()` shared function)
  - Validation approach: Unit tests for `canSeeRoll()` covering all combinations; route tests verify emitFiltered is called with correct predicate

- Proposal element: Follows messages pattern
  - Design decision: Decisions 4, 5, 6
  - Validation approach: Code review against messages route

## Functional Requirements Mapping

- Requirement: POST persists a roll against active session
  - Design element: Route reads `campaign.activeSessionId`, stamps it on roll, calls `insertOne`
  - Acceptance criteria reference: specs/rolls-api/spec.md
  - Testability notes: Unit test mocks `assertCampaignAccess` returning campaign with `activeSessionId` set; verifies `insertOne` called with correct `sessionId`

- Requirement: POST returns 409 with no active session
  - Design element: Guard on `campaign.activeSessionId` before insert
  - Acceptance criteria reference: specs/rolls-api/spec.md
  - Testability notes: Unit test with `activeSessionId: undefined`

- Requirement: `dm-only` roll invisible to other players
  - Design element: `canSeeRoll()` returns false for non-DM, non-roller on `dm-only`
  - Acceptance criteria reference: specs/rolls-api/spec.md
  - Testability notes: `canSeeRoll()` unit tests; GET integration test with player auth

- Requirement: GET scoped to session
  - Design element: `listCampaignRolls()` filters by `{ campaignId, sessionId }`
  - Acceptance criteria reference: specs/rolls-api/spec.md
  - Testability notes: Integration test with two sessions; verify rolls don't bleed across

- Requirement: SSE emits roll event to correct subscribers
  - Design element: `emitFiltered()` called with `canSeeRoll()` predicate
  - Acceptance criteria reference: specs/rolls-api/spec.md
  - Testability notes: Unit test spies on `emitFiltered`; verifies arguments

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: GET queries on large campaigns remain fast
  - Design element: Compound index `{ campaignId, sessionId, createdAt }` on `campaignRolls`
  - Acceptance criteria reference: Index created at DB init
  - Testability notes: Manual verification via `db.campaignRolls.getIndexes()`

- Requirement category: security
  - Requirement: No visibility leakage of `dm-only` rolls
  - Design element: `canSeeRoll()` enforced in both GET and SSE paths
  - Acceptance criteria reference: specs/rolls-api/spec.md
  - Testability notes: Unit tests cover all role/visibility combinations

- Requirement category: reliability
  - Requirement: No silent data loss on missing session
  - Design element: 409 guard before any DB write
  - Acceptance criteria reference: specs/rolls-api/spec.md
  - Testability notes: Unit + integration tests for no-active-session case

## Risks / Trade-offs

- Risk/trade-off: `canSeeRoll()` logic diverges from GET query filter over time
  - Impact: Visibility inconsistency between SSE and REST
  - Mitigation: Both use the same `canSeeRoll()` function. GET query is built from the same logic (or delegates to it). Test both paths.

- Risk/trade-off: Index not created if DB init path is missed
  - Impact: Slow queries at scale
  - Mitigation: Add index creation to the same `ensureIndexes()` block used by other collections; verify in integration test setup

## Rollback / Mitigation

- Rollback trigger: Production visibility bug (dm-only leakage) or data corruption
- Rollback steps: Drop route file (`app/api/campaigns/[id]/rolls/route.ts`); revert `lib/types.ts` and `lib/storage.ts` changes; `campaignRolls` collection can remain (no FK constraints)
- Data migration considerations: None — `campaignRolls` is append-only; rollback does not require data cleanup
- Verification after rollback: Confirm 404 on `POST/GET /api/campaigns/[id]/rolls`

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix failures before proceeding. No exceptions.
- If security checks fail: Block merge. Treat as P0. Escalate to maintainer same day.
- If required reviews are blocked/stale: Ping reviewer after 24h. After 48h, reassign or escalate.
- Escalation path and timeout: Maintainer (dougis) is final escalation. 48h timeout on stale reviews.

## Open Questions

No open questions remain. All design decisions were resolved during explore and proposal phases.
