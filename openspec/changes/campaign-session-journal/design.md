## Context

- **Relevant architecture:** Next.js App Router; MongoDB via `lib/db.ts`; all persistence in `lib/storage.ts` (no ORM/model layer); auth via `withAuth`/`withAuthAndParams` middleware in `lib/middleware.ts`; types in `lib/types.ts`
- **Dependencies:** #182 Campaign Management (campaigns must exist); Party API at `app/api/parties/`; existing `withAuth` middleware; MongoDB driver (not Mongoose)
- **Interfaces/contracts touched:** `Party` type (breaking change: `characterIds` removed); `lib/storage.ts` (new CRUD functions + character-delete cascade); party API routes; new session API routes; `app/campaigns/page.tsx` (add Session Log link); new `app/campaigns/[id]/sessions/page.tsx`

## Goals / Non-Goals

### Goals

- Replace `Party.characterIds` with `Party.members: PartyMember[]` tracking join and departure times
- Persist session log entries scoped to a campaign
- Auto-populate NPC join/departure events when creating a session log
- Provide a journal UI with inline create/edit, milestone tracking, and expandable entries
- All storage and API follows existing patterns in the codebase

### Non-Goals

- Combat event auto-capture (deferred to #206)
- Prompt Builder or Dashboard integration (deferred to #184/#186)
- Multi-party campaigns

## Decisions

### Decision 1: Storage pattern — lib/storage.ts, no model files

- **Chosen:** Add session log CRUD functions directly to `lib/storage.ts`; use the `sessionLogs` MongoDB collection
- **Alternatives considered:** Create `lib/server/models/SessionLog.ts` as suggested in the original issue
- **Rationale:** No model layer exists in this project. Every other entity (campaigns, parties, characters, encounters) uses `lib/storage.ts` directly. Introducing a model file for one feature adds inconsistency.
- **Trade-offs:** `lib/storage.ts` grows; offset by the consistency gain and zero new patterns to learn

### Decision 2: Party member tracking — replace characterIds with members array

- **Chosen:** Remove `Party.characterIds: string[]`; replace with `Party.members: PartyMember[]` where each entry has `{ characterId, addedAt, leftAt? }`. Active members = `members.filter(m => !m.leftAt)`.
- **Alternatives considered:** Keep `characterIds` and add a parallel `memberHistory` array
- **Rationale:** Two sources of truth for the same data is fragile. Since the project is in alpha, a clean replacement is acceptable. All callers are within this repo (6 files).
- **Trade-offs:** Breaking change to the `Party` type; existing documents need migration; small risk of missed callsite

### Decision 3: Party PUT diff-and-timestamp

- **Chosen:** `PUT /api/parties/[id]` accepts `characterIds[]` from the client (unchanged client API). Server computes the diff: new members get `addedAt = now`; removed members get `leftAt = now`.
- **Alternatives considered:** Accept `members[]` directly from the client
- **Rationale:** Zero client-side changes. The diff logic is entirely server-side. Simpler rollout.
- **Trade-offs:** Clients cannot set explicit `addedAt`/`leftAt` timestamps (not needed for current use cases)

### Decision 4: Character-delete cascade — set leftAt instead of $pull

- **Chosen:** When a character is soft-deleted, set `leftAt = now` on all active `members` entries across all parties via MongoDB array filter update
- **Alternatives considered:** Continue to `$pull` from `characterIds` (incompatible with new schema)
- **Rationale:** Preserves the membership history. A deleted character should appear as "departed" in the session journal, not as if they never existed.
- **Trade-offs:** Slightly more complex MongoDB update (positional array filter); one integration test required

### Decision 5: Session number — MAX+1 with client override

- **Chosen:** `POST /api/campaigns/[id]/sessions` queries `MAX(sessionNumber)` for the campaign and defaults to `MAX + 1`. Client may pass an explicit `sessionNumber` to override.
- **Alternatives considered:** Strict server-side sequence (reject duplicates)
- **Rationale:** DMs backfill sessions, correct numbers, and generally prefer control. Single DM per campaign means no race condition.
- **Trade-offs:** Duplicate session numbers are possible if DM overrides; acceptable for this use case

### Decision 6: NPC auto-populate — time window query against party.members

- **Chosen:** On session create form load, fetch the campaign's party and filter `members` where `addedAt` or `leftAt` falls between `lastSession.datePlayed` and now. Pre-populate as `npc_joined`/`npc_left` events.
- **Alternatives considered:** A separate `CampaignEvent` collection (push model)
- **Rationale:** The party `members` array is already the authoritative record of membership history. A separate events collection duplicates data. The time-window query is simple and correct.
- **Trade-offs:** If the party has no `campaignId`, no events are auto-populated. DM must add custom events manually. Shown with a UI notice.

### Decision 7: Migration — lazy with fallback default

- **Chosen:** Existing party documents with `characterIds` are migrated on first read in `loadParties()`: if `members` is absent, derive it from `characterIds` with `addedAt = party.createdAt`.
- **Alternatives considered:** One-time startup migration script
- **Rationale:** Alpha project; lazy migration is lower risk and simpler to deploy. No downtime window needed.
- **Trade-offs:** First read of each unmigrated party is slightly slower; acceptable at alpha scale

## Proposal to Design Mapping

- Proposal element: Replace `Party.characterIds` with `Party.members`
  - Design decision: Decision 2 (members array), Decision 3 (PUT diff), Decision 4 (cascade), Decision 7 (migration)
  - Validation approach: Unit test diff logic; integration test PUT adds/removes; integration test character-delete sets leftAt

- Proposal element: SessionLog collection
  - Design decision: Decision 1 (storage.ts pattern), Decision 5 (session number)
  - Validation approach: Integration tests for all 4 CRUD routes

- Proposal element: NPC auto-populate on journal create
  - Design decision: Decision 6 (time-window query)
  - Validation approach: Unit test filtering logic; integration test that events are returned for the correct time window

- Proposal element: Combat auto-capture deferred
  - Design decision: N/A — `events[]` schema reserves `combat_completed` type; no implementation this change
  - Validation approach: N/A

## Functional Requirements Mapping

- **Requirement:** DM can create a session log with number, title, date, summary, events, milestone
  - Design element: `POST /api/campaigns/[id]/sessions`; `SessionLog` type; `saveSessionLog()` in storage
  - Acceptance criteria reference: specs/session-log.md
  - Testability notes: Integration test POST with full body; assert 201 + returned document

- **Requirement:** Session list sorted by sessionNumber descending
  - Design element: `GET /api/campaigns/[id]/sessions`; MongoDB sort `{ sessionNumber: -1 }`
  - Acceptance criteria reference: specs/session-log.md
  - Testability notes: Seed 3 sessions out of order; assert GET returns them sorted

- **Requirement:** NPC join/departure events pre-populated on journal create
  - Design element: Client fetches party members filtered by time window before rendering form
  - Acceptance criteria reference: specs/npc-auto-capture.md
  - Testability notes: Seed party with known `addedAt`/`leftAt`; assert returned events match

- **Requirement:** Active party members derived correctly after Party refactor
  - Design element: `members.filter(m => !m.leftAt)` everywhere `characterIds` was used
  - Acceptance criteria reference: specs/party-members.md
  - Testability notes: Unit test `expandPartyToCharacters` with mixed active/departed members

- **Requirement:** Character soft-delete sets `leftAt` on party memberships
  - Design element: Updated cascade in `lib/storage.ts` using MongoDB array filter
  - Acceptance criteria reference: specs/party-members.md
  - Testability notes: Integration test delete character; assert `leftAt` set on all party memberships

## Non-Functional Requirements Mapping

- **Requirement category:** reliability
  - Requirement: Existing party data must not be lost during `characterIds` → `members` migration
  - Design element: Lazy migration in `loadParties()` preserves all existing character references
  - Acceptance criteria reference: specs/party-members.md
  - Testability notes: Seed a party document without `members`; assert it loads correctly with derived members

- **Requirement category:** security
  - Requirement: Session logs are scoped to the authenticated user's campaigns only
  - Design element: All session routes use `withAuth`; queries include `userId` filter; `campaignId` ownership verified before returning sessions
  - Acceptance criteria reference: specs/session-log.md
  - Testability notes: Integration test: user A cannot read/modify user B's sessions

- **Requirement category:** operability
  - Requirement: No downtime migration
  - Design element: Lazy migration on read; no startup script required
  - Acceptance criteria reference: N/A (operational)
  - Testability notes: Integration test that unmigrated party document loads correctly

## Risks / Trade-offs

- Risk: Callsite missed during `characterIds` → `members` refactor
  - Impact: Runtime error or silent data loss on party reads
  - Mitigation: TypeScript compiler catches `party.characterIds` references after type change; grep for `characterIds` post-refactor

- Risk: MongoDB array filter update syntax for cascade is error-prone
  - Impact: Characters not properly marked as departed from parties on delete
  - Mitigation: Integration test covers this path specifically; test before and after delete

- Risk: Party with no `campaignId` silently produces no auto-capture events
  - Impact: DM confused why events aren't pre-populated
  - Mitigation: UI shows a notice "No linked party found for this campaign" with a link to assign one

## Rollback / Mitigation

- **Rollback trigger:** Party data loss, session log data loss, or broken party membership in combat setup
- **Rollback steps:**
  1. Revert the `Party` type change and all 6 impacted files to use `characterIds`
  2. Run a one-time script to flatten `members[].characterId` back to `characterIds[]` on all party documents
  3. Drop the `sessionLogs` collection (no data loss concern — feature is new)
- **Data migration considerations:** The lazy migration writes nothing until a party is saved. If rollback happens before any party is updated, no migration has occurred. If parties were updated with the new schema, the flatten script handles recovery.
- **Verification after rollback:** Party members visible in combat setup; existing tests pass

## Operational Blocking Policy

- **If CI checks fail:** Do not merge. Investigate the failure. Fix the root cause. Never use `--no-verify` or `--admin` bypass.
- **If security checks fail:** Do not merge. Treat as a blocking bug. Address Codacy/security findings before re-submitting.
- **If required reviews are blocked/stale:** Ping the reviewer in the PR after 24 hours. After 48 hours, escalate to the next available reviewer.
- **Escalation path and timeout:** If blocked >72 hours with no review, reassign or pair-review synchronously.

## Open Questions

No open questions. All decisions resolved during exploration session on 2026-05-22.
