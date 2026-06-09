## Context

- Relevant architecture: Next.js App Router API routes, MongoDB via `lib/storage.ts`, `withAuthAndParams` auth wrapper, `assertCampaignAccess` role helper, `SessionLog` and `Campaign` types in `lib/types.ts`.
- Dependencies: `lib/storage.ts` (MongoDB), `lib/types.ts`, `lib/utils/campaign.ts` (`assertCampaignAccess`), existing sessions route at `app/api/campaigns/[id]/sessions/route.ts`.
- Interfaces/contracts touched: `Campaign` interface (new field), `IStorage` (new method), new route file.

## Goals / Non-Goals

### Goals

- Add `activeSessionId` to `Campaign` type and persist it atomically.
- Expose POST/DELETE endpoints to open and close an active session.
- Provide a force-reset escape hatch for stale `activeSessionId`.
- Ensure `GET /api/campaigns/:id` reflects `activeSessionId` without code changes to the GET handler.

### Non-Goals

- UI controls for open/close/reset.
- Automatic session expiry or timeout.
- Real-time presence or WebSocket events.

## Decisions

### Decision 1: `null` over `$unset` for clearing `activeSessionId`

- Chosen: `$set: { activeSessionId: null }` when closing a session.
- Alternatives considered: `$unset: { activeSessionId: 1 }` to remove the field from the document.
- Rationale: `GET /api/campaigns/:id` returns the full `Campaign` object. Using `null` means the field is always present and explicitly signals "no active session," matching the TypeScript `activeSessionId?: string` type (absent = undefined in new docs, null = explicitly cleared). Avoids ambiguity between "field never set" and "field was cleared."
- Trade-offs: `null` is a valid string-ish value in some contexts; callers must check `!= null` not just `!= undefined`. Acceptable given the field is typed `string | undefined` and stored as `string | null` in Mongo.

### Decision 2: `setActiveCampaignSession` atomic `updateOne`

- Chosen: `db.collection("campaigns").updateOne({ id: campaignId }, { $set: { activeSessionId: sessionId ?? null, updatedAt: new Date() } })`.
- Alternatives considered: Reuse `saveCampaign` full-upsert.
- Rationale: Full upsert risks clobbering concurrent field changes (e.g., a DM editing campaign notes mid-session). Targeted `updateOne` on a single field is safe under concurrent writes.
- Trade-offs: Adds one new storage method; minimal overhead.

### Decision 3: Force-reset via `DELETE ?force=true`

- Chosen: `DELETE /api/campaigns/:id/sessions/active?force=true` skips the "nothing to close" 404 check and unconditionally calls `setActiveCampaignSession(campaignId, null)`.
- Alternatives considered: Separate `POST .../active/reset` endpoint; `PATCH` endpoint.
- Rationale: DELETE is semantically correct (you are deleting the active session pointer). `?force=true` is a minimal, discoverable escape hatch without adding a new route. Keeps the surface small.
- Trade-offs: Callers must know to use `?force=true`; no UI currently surfaces this. Acceptable because this is an operator/DM escape hatch, not a normal flow.

### Decision 4: `POST` creates `SessionLog` with `datePlayed: new Date()`

- Chosen: Auto-set `datePlayed` to the current timestamp at open time. DM patches it post-session via existing `PATCH /api/campaigns/:id/sessions/:sessionId`.
- Alternatives considered: Require `datePlayed` in the POST body (as existing manual session creation does).
- Rationale: "Open session now" is a real-time action; the date is known. Requiring a body field adds friction for a live-session workflow.
- Trade-offs: If the DM opens at 11:50 PM and plays until 2 AM, the `datePlayed` is technically "the previous day." The PATCH corrects this.

### Decision 5: 409 guard on concurrent POST

- Chosen: If `campaign.activeSessionId` is already set (non-null), return 409 with `{ error: 'A session is already active' }`.
- Alternatives considered: Silently overwrite (unsafe), return 200 with existing session.
- Rationale: A stale open session means something went wrong. Silent overwrite would orphan the previous `activeSessionId` and leave rolls potentially stamped against a ghost session. 409 forces the DM to explicitly close first.
- Trade-offs: Requires the force-reset escape hatch (Decision 3) for recovery.

## Proposal to Design Mapping

- Proposal element: `null` over `$unset` for clearing
  - Design decision: Decision 1
  - Validation approach: Unit test — after DELETE, `GET /api/campaigns/:id` returns `activeSessionId: null`.

- Proposal element: Atomic targeted updater
  - Design decision: Decision 2
  - Validation approach: Storage unit test — `setActiveCampaignSession` calls `updateOne` with correct `$set` payload.

- Proposal element: Force-reset for stale sessions
  - Design decision: Decision 3
  - Validation approach: Integration test — POST to set, crash without DELETE, POST again hits 409, then `DELETE ?force=true` clears, then POST succeeds.

- Proposal element: `datePlayed` defaults to now
  - Design decision: Decision 4
  - Validation approach: Integration test — returned `SessionLog.datePlayed` is close to `Date.now()`.

- Proposal element: 409 guard
  - Design decision: Decision 5
  - Validation approach: Integration test — double POST returns 409.

## Functional Requirements Mapping

- Requirement: `Campaign` type includes `activeSessionId?: string`
  - Design element: `lib/types.ts` Campaign interface
  - Acceptance criteria reference: AC-1 (type compiles)
  - Testability notes: TypeScript compile check; no runtime test needed.

- Requirement: POST creates SessionLog and sets `activeSessionId`
  - Design element: POST handler, `setActiveCampaignSession`, `storage.saveSessionLog`
  - Acceptance criteria reference: AC-2
  - Testability notes: Integration test — POST 201, then GET campaign shows `activeSessionId` equal to returned session id.

- Requirement: Double POST returns 409
  - Design element: POST handler 409 guard (Decision 5)
  - Acceptance criteria reference: AC-3
  - Testability notes: Integration test — two consecutive POSTs, second returns 409.

- Requirement: DELETE clears `activeSessionId`
  - Design element: DELETE handler, `setActiveCampaignSession(id, null)`
  - Acceptance criteria reference: AC-4
  - Testability notes: Integration test — after DELETE, GET campaign shows `activeSessionId: null`.

- Requirement: DELETE with no active session returns 404
  - Design element: DELETE handler null-check
  - Acceptance criteria reference: AC-5
  - Testability notes: Integration test — DELETE on fresh campaign returns 404.

- Requirement: Non-DM gets 404
  - Design element: `assertCampaignAccess` + role check in both handlers
  - Acceptance criteria reference: AC-6
  - Testability notes: Integration test with member role token.

- Requirement: Unauthenticated gets 401
  - Design element: `withAuthAndParams` wrapper
  - Acceptance criteria reference: AC-7
  - Testability notes: Integration test — no auth header → 401.

- Requirement: Closed SessionLog remains retrievable
  - Design element: DELETE only clears pointer, does not delete `SessionLog` document
  - Acceptance criteria reference: AC-8
  - Testability notes: After DELETE, `GET /api/campaigns/:id/sessions` still includes the session.

- Requirement: Force-reset clears stale `activeSessionId`
  - Design element: `DELETE ?force=true` bypass (Decision 3)
  - Acceptance criteria reference: AC-9
  - Testability notes: Integration test — POST, then `DELETE ?force=true`, then POST succeeds (not 409).

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: `setActiveCampaignSession` must not clobber concurrent field writes.
  - Design element: Atomic `updateOne $set` (Decision 2)
  - Acceptance criteria reference: Implicit (no data loss)
  - Testability notes: Code review; targeted update verified in storage unit test.

- Requirement category: operability
  - Requirement: Stale open sessions must be recoverable without manual DB intervention.
  - Design element: `DELETE ?force=true` escape hatch (Decision 3)
  - Acceptance criteria reference: AC-9
  - Testability notes: Integration test for force-reset path.

## Risks / Trade-offs

- Risk/trade-off: `null` vs `undefined` ambiguity for callers reading `activeSessionId`
  - Impact: Callers may use `if (campaign.activeSessionId)` safely (null and undefined are both falsy), but strict `=== undefined` checks would break.
  - Mitigation: TypeScript type is `string | undefined`; Mongo stores `string | null`. Document the distinction in the storage method. Callers should use `!= null` for explicit checks.

- Risk/trade-off: `active` literal segment vs `[sessionId]` dynamic segment routing
  - Impact: If Next.js resolves `active` as a session ID, the wrong handler fires.
  - Mitigation: Next.js prefers literal segments; confirmed no conflict. Covered by integration tests.

## Rollback / Mitigation

- Rollback trigger: POST/DELETE returns 500 in production; `activeSessionId` stuck in bad state.
- Rollback steps:
  1. Deploy previous build (removes new endpoints — they return 404).
  2. Manually clear `activeSessionId` via MongoDB shell: `db.campaigns.updateOne({ id: "<id>" }, { $unset: { activeSessionId: 1 } })`.
- Data migration considerations: `activeSessionId` is additive and optional. No migration needed for existing documents.
- Verification after rollback: `GET /api/campaigns/:id` no longer returns `activeSessionId` in the response (field absent from type after rollback).

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing check. No bypass with `--no-verify` or skip flags.
- If security checks fail: Do not merge. Investigate and resolve before proceeding.
- If required reviews are blocked/stale: Ping reviewer after 24 hours. Escalate to team lead after 48 hours.
- Escalation path and timeout: If blocked > 48 hours with no response, escalate to project maintainer.

## Open Questions

No open questions. All decisions resolved during exploration phase. See proposal.md for decision rationale.
