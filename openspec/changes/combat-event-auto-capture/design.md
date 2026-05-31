## Context

- **Relevant architecture:** Next.js App Router; MongoDB via `getDatabase()`; `withAuth` / `withAuthAndParams` middleware wrappers; `useCombat` hook owns all combat server state; `SessionLog.events[]` typed as `SessionEvent[]` with reserved `combat_completed` type.
- **Dependencies:** #215 closed (useCombat hook extracted, ActiveCombatView/CombatSetupView decomposed); #188 closed (SessionLog + SessionEvent types exist); `/campaigns/[id]/sessions` page exists and pre-populates NPC events.
- **Interfaces/contracts touched:**
  - `CombatState` (lib/types.ts)
  - `POST /api/combat` — create → switches from upsert to insert
  - `PUT /api/combat/[id]` — update → gains `completedAt` side-effect
  - `GET /api/combat` — fetch active → gains `isActive: true` filter
  - `DELETE /api/combat/[id]` — hard delete (unchanged behavior, new contract: also deletes completed combats)
  - `GET /api/campaigns/[id]/combat-events?since=` — new endpoint
  - `useCombat(options)` — gains `campaignId` param; splits POST (create) from PUT (update)
  - Session log create form — gains combat event pre-population

## Goals / Non-Goals

### Goals

- Every combat is its own persistent document associated to a campaign
- `GET /api/combat` always returns the active combat or `null` — never a completed historical record
- Ending a combat persists `completedAt` server-side before clearing client state
- Session log form pre-populates `combat_completed` events for the campaign window
- No regression in existing combat UI behavior

### Non-Goals

- Combat history browsing UI
- Retroactive migration of existing `combatStates` documents
- Soft-delete or summary preservation on delete
- Route removal of standalone `/combat` page

## Decisions

### Decision 1: POST creates, PUT updates — split the upsert

- **Chosen:** `POST /api/combat` inserts a new document. All subsequent state changes use `PUT /api/combat/[id]`. `useCombat` stores the `id` from the POST 201 response and uses it for all PUTs within that session.
- **Alternatives considered:** Keep POST as upsert but add `campaignId` to the filter key (`{ userId, campaignId }`). Rejected — still overwrites per-campaign, preventing history.
- **Rationale:** Insert-on-create + update-on-change is the correct REST semantics and is the only way to preserve history across combats for the same campaign.
- **Trade-offs:** `useCombat` must carry the server-assigned `id` through the session. If the page is refreshed mid-combat, the `GET /api/combat` response provides the `id` to resume with.

### Decision 2: `endCombat` calls PUT before clearing local state

- **Chosen:** `endCombat()` calls `PUT /api/combat/[id] { isActive: false }`, awaits success, then sets local state to null. On failure, it shows an error and does NOT clear local state (combat remains visible so DM can retry).
- **Alternatives considered:** Add a dedicated `DELETE`-like "complete" endpoint. Rejected — adds a route for no additional expressiveness.
- **Rationale:** Prevents desync between client (thinks combat is over) and server (still has `isActive: true`), which would block future combat creation.
- **Trade-offs:** `endCombat` becomes async; calling code must handle loading state.

### Decision 3: `campaignId` required in API body, optional in TypeScript type

- **Chosen:** `CombatState.campaignId` typed as `string` (required at the type level for new constructions). API validates presence and returns 400 if missing. Existing DB documents without `campaignId` are excluded from event queries by the `$exists: true` filter.
- **Alternatives considered:** Type as `string | undefined`. Rejected — makes the required-in-practice constraint invisible to TypeScript and creates defensive coding throughout.
- **Rationale:** Beta environment; no migration needed. New code should enforce the invariant clearly.
- **Trade-offs:** Any existing test fixtures that construct `CombatState` without `campaignId` will need updating.

### Decision 4: `GET /api/campaigns/[id]/combat-events` queries `combatStates` directly

- **Chosen:** New endpoint queries `combatStates` with `{ campaignId: id, completedAt: { $gte: since } }` and transforms records into `SessionEvent[]`. No separate events collection.
- **Alternatives considered:** Separate `combatEvents` collection populated on combat end. Rejected — duplicates data, adds write-path complexity.
- **Rationale:** Mirrors the existing NPC event pattern. The source-of-truth is the combat document itself.
- **Trade-offs:** If `combatStates` collection grows large, query performance depends on the `{ userId, campaignId, completedAt }` index. Index is included in this change.

### Decision 5: `since=` fallback is campaign `createdAt`

- **Chosen:** If no prior `SessionLog` exists for the campaign, the `since` parameter defaults to the campaign document's `createdAt` date, capturing all combats since campaign creation.
- **Alternatives considered:** Return all combats with no time filter. Rejected — could surface stale data if old combats exist.
- **Rationale:** Matches user expectation: "show me all combats for this campaign that haven't been logged yet."
- **Trade-offs:** Requires the session log create form to fetch the campaign's `createdAt` if no sessions exist (already available from campaign context).

### Decision 6: `/campaigns/[id]/combat` is a new thin page, standalone `/combat` is unchanged

- **Chosen:** Add `app/campaigns/[id]/combat/page.tsx` as a thin shell that calls `useCombat({ campaignId: params.id })`. The existing `/combat` page remains but removes its "Start Combat" capability (or is left as-is for backwards compat during beta).
- **Alternatives considered:** Redirect `/combat` to the campaign page. Rejected — requires knowing which campaign to redirect to; no campaign context at `/combat`.
- **Rationale:** Additive change with no regression risk. DMs learn the new entry point; the old route decays naturally.
- **Trade-offs:** Two entry points exist temporarily. Acceptable for beta.

### Decision 7: MongoDB index `{ userId: 1, campaignId: 1, completedAt: 1 }`

- **Chosen:** Add this compound index to `combatStates` to support "active combat for user" and "completed combats for campaign since date" queries efficiently.
- **Alternatives considered:** Separate indexes. Rejected — compound index covers both query shapes.
- **Rationale:** Without index, event queries do full collection scans as combat history grows.
- **Trade-offs:** Small write overhead per combat document; negligible at beta scale.

## Proposal to Design Mapping

- **`POST /api/combat` upsert → insert**
  - Design decision: Decision 1
  - Validation: Integration test — two POSTs create two documents; neither overwrites the other

- **`GET /api/combat` returns active only**
  - Design decision: Decision 1
  - Validation: Integration test — after inserting completed combat, GET returns null (no active)

- **`endCombat` persists `completedAt`**
  - Design decision: Decision 2
  - Validation: Unit test on `useCombat` — endCombat calls PUT with `isActive: false`; integration test — `completedAt` is set in DB

- **`campaignId` required**
  - Design decision: Decision 3
  - Validation: API integration test — POST without `campaignId` returns 400

- **`GET /api/campaigns/[id]/combat-events`**
  - Design decision: Decision 4
  - Validation: Integration test — returns only combats for that campaign in the given window

- **`since=` fallback**
  - Design decision: Decision 5
  - Validation: Integration test — no prior sessions → combats since campaign creation returned

- **Campaign-scoped route**
  - Design decision: Decision 6
  - Validation: E2E or integration — page renders; `campaignId` passed to `useCombat`

- **MongoDB index**
  - Design decision: Decision 7
  - Validation: Index present after migration script / first startup

## Functional Requirements Mapping

- **Requirement:** Completed combats are preserved (not overwritten)
  - Design element: Decision 1 — insert on POST
  - Acceptance criteria: specs/combat-history.md
  - Testability: Integration — two sequential POSTs; DB has two documents

- **Requirement:** Active combat query excludes completed records
  - Design element: Decision 1 — `isActive: true` filter on GET
  - Acceptance criteria: specs/combat-history.md
  - Testability: Integration — complete a combat, GET returns null

- **Requirement:** `completedAt` set when combat ends
  - Design element: Decision 2 — PUT sets `completedAt` server-side
  - Acceptance criteria: specs/combat-history.md
  - Testability: Integration — PUT with `isActive: false`; document has `completedAt`

- **Requirement:** `campaignId` required on new combats
  - Design element: Decision 3
  - Acceptance criteria: specs/combat-api.md
  - Testability: API test — POST without `campaignId` → 400

- **Requirement:** Session log pre-populates combat events
  - Design element: Decision 4 — new endpoint + form integration
  - Acceptance criteria: specs/session-journal-integration.md
  - Testability: Integration — create session log form shows combat events in window

## Non-Functional Requirements Mapping

- **Requirement category:** Reliability
  - Requirement: Ending combat must not leave DB in inconsistent state (active=true, client=null)
  - Design element: Decision 2 — endCombat awaits PUT success before clearing local state
  - Testability: Unit — PUT failure leaves combatState non-null; error shown

- **Requirement category:** Performance
  - Requirement: Combat event query scales as history grows
  - Design element: Decision 7 — compound index
  - Testability: Index presence verified via `db.combatStates.getIndexes()`

- **Requirement category:** Security
  - Requirement: Combat events only returned to authenticated user for their campaign
  - Design element: `withAuthAndParams` middleware + `userId` filter on all queries
  - Testability: Integration — unauthenticated request → 401; wrong user → 0 results

## Risks / Trade-offs

- **Risk:** `useCombat` state updates mid-session need the persisted `id` from the initial POST. If the POST 201 response `id` differs from the client-generated `crypto.randomUUID()`, updates could fail.
  - **Impact:** Combat updates lost if IDs mismatched.
  - **Mitigation:** Server echoes back the document with its `id`; `useCombat` updates local `combatState` from the 201 response body, using the server's `id` for all subsequent PUTs.

- **Risk:** Existing DB documents with `userId`-only upsert pattern leave "orphan" active combats (no `isActive` field).
  - **Impact:** `GET /api/combat` with `isActive: true` filter returns null even if DM was mid-combat.
  - **Mitigation:** Beta — acceptable. Orphan documents are excluded by the query. DMs start a fresh combat.

## Rollback / Mitigation

- **Rollback trigger:** Combat creation fails in production (POST returns error); or session log form crashes on combat event fetch.
- **Rollback steps:**
  1. Revert `POST /api/combat` to upsert-by-userId behavior
  2. Revert `GET /api/combat` to `findOne({ userId })`
  3. Remove `GET /api/campaigns/[id]/combat-events` endpoint
  4. Session log form combat event fetch degrades gracefully (empty list on error)
- **Data migration considerations:** No migration needed for rollback — inserted documents remain but are not served by reverted GET logic.
- **Verification after rollback:** DM can start and end a combat; session log form opens without error.

## Operational Blocking Policy

- **If CI checks fail:** Do not merge. Fix the failing check. No `--no-verify` bypasses.
- **If security checks fail:** Treat as a blocker. Do not deploy until resolved.
- **If required reviews are blocked/stale:** Re-request review after 24h. After 48h, escalate to repo owner.
- **Escalation path:** File a blocking note in the PR description and ping the reviewer directly.

## Open Questions

No open questions. All decisions resolved during exploration and proposal phases.
