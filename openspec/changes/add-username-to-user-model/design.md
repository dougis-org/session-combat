## Context

- Relevant architecture: MongoDB (via `lib/db.ts` `initializeDatabase`), TypeScript interface layer (`lib/types.ts`), standalone migration scripts (`scripts/`).
- Dependencies: None — this is the foundational sub-issue for Phase 1.
- Interfaces/contracts touched: `User` interface in `lib/types.ts`; `initializeDatabase` in `lib/db.ts`; new file `scripts/backfill-usernames.ts`.

## Goals / Non-Goals

### Goals

- Add `username?: string` to the `User` TypeScript interface
- Enforce sparse, case-sensitive uniqueness at the DB layer via a MongoDB index
- Provide a safe, idempotent one-shot backfill script for 4 existing prod users

### Non-Goals

- Username format validation (deferred to issue 1b)
- JWT/session changes (deferred)
- Frontend changes

## Decisions

### Decision 1: Sparse unique index, not partial index

- Chosen: `{ sparse: true, unique: true }` on `users.username`
- Alternatives considered: Partial index with `{ partialFilterExpression: { username: { $exists: true } } }`
- Rationale: Sparse is simpler to write and equivalent in effect — both skip documents where `username` is absent. The existing `email` index uses `{ unique: true }` (email is always present); sparse is the natural extension for an optional field.
- Trade-offs: Sparse index skips `null` in some MongoDB versions differently than absent — mitigated by never writing `null` (backfill uses `$set` with a string value, not `null`).

### Decision 2: Case-sensitive index (default collation)

- Chosen: Default MongoDB collation — no `collation: { locale: 'en', strength: 2 }` option
- Alternatives considered: Case-insensitive collation for friendlier uniqueness
- Rationale: User explicitly confirmed `Doug` and `doug` should be treated as distinct usernames.
- Trade-offs: User-visible confusion if someone registers `Doug` and another registers `doug`. Acceptable for now; issue 1b can add UI guidance.

### Decision 3: Index creation isolated in its own try/catch

- Chosen: Wrap `users.username` index creation in its own `try/catch` block, mirroring the `users.email` pattern
- Alternatives considered: Single try/catch for all index creation
- Rationale: Existing pattern in `initializeDatabase` isolates each index so a failure on one does not abort others. Consistency and resilience.
- Trade-offs: Slightly more verbose code; negligible.

### Decision 4: Backfill derives username from email local-part, de-dupes with `-2`/`-3` suffix

- Chosen: `email.split('@')[0]` as base; if taken, append `-2`, `-3`, etc.
- Alternatives considered: Hash suffix (e.g. `doug-a3f2`), full email slug
- Rationale: Email local-part is human-readable and predictable. With 4 users, collisions are unlikely; suffix strategy is simple and readable.
- Trade-offs: Cosmetically odd if local-part contains `+` or `.` — acceptable, issue 1b allows editing.

### Decision 5: Backfill is a standalone `ts-node` script, not wired into app startup

- Chosen: `scripts/backfill-usernames.ts`, run once manually via `npx ts-node`
- Alternatives considered: Auto-run inside `initializeDatabase`
- Rationale: Issue explicitly scopes this as a one-shot migration script. Auto-running in `initializeDatabase` would add complexity and risk to every startup path.
- Trade-offs: Requires manual execution; with 4 users this is not a concern.

## Proposal to Design Mapping

- Proposal element: `username?: string` on `User`
  - Design decision: Decision 1 (sparse index), Decision 2 (case-sensitive)
  - Validation approach: TypeScript compilation + integration test asserting field accepted

- Proposal element: Sparse unique index on `users.username`
  - Design decision: Decision 1, Decision 3 (isolated try/catch)
  - Validation approach: Integration test inserts two users with same username, expects duplicate key error

- Proposal element: Idempotent backfill script
  - Design decision: Decision 4 (local-part + suffix), Decision 5 (standalone script)
  - Validation approach: Unit test — mock DB, run twice, assert second run is a no-op; integration test — run against real DB, verify usernames assigned

## Functional Requirements Mapping

- Requirement: `User` type accepts optional `username` field
  - Design element: `username?: string` in `lib/types.ts`
  - Acceptance criteria reference: specs/username-type
  - Testability notes: TypeScript compilation confirms; unit test constructs a `User` object with and without the field

- Requirement: DB rejects duplicate usernames (case-sensitive)
  - Design element: Sparse unique index in `lib/db.ts`
  - Acceptance criteria reference: specs/username-index
  - Testability notes: Integration test inserts conflicting usernames, asserts MongoDB duplicate key error (code 11000)

- Requirement: Backfill assigns usernames to existing users without one
  - Design element: `scripts/backfill-usernames.ts`
  - Acceptance criteria reference: specs/backfill
  - Testability notes: Integration test seeds users without username, runs backfill, asserts all users have username set

- Requirement: Backfill is idempotent
  - Design element: `$exists: false` filter in backfill query
  - Acceptance criteria reference: specs/backfill
  - Testability notes: Run backfill twice; assert no errors and usernames unchanged on second run

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Index creation failure must not crash app startup
  - Design element: Isolated try/catch per index (Decision 3)
  - Acceptance criteria reference: specs/username-index
  - Testability notes: Unit test mocks `createIndex` to throw, asserts `initializeDatabase` resolves without rethrowing

- Requirement category: operability
  - Requirement: Backfill safe to re-run without side effects
  - Design element: `{ username: { $exists: false } }` query in backfill (Decision 4)
  - Acceptance criteria reference: specs/backfill
  - Testability notes: Run script twice against seeded DB, verify counts and values unchanged

## Risks / Trade-offs

- Risk/trade-off: Sparse index and explicit `null` storage
  - Impact: Two documents with `username: null` could collide depending on MongoDB version
  - Mitigation: Backfill only uses `$set: { username: <string> }`; never writes `null`

- Risk/trade-off: Email local-part contains special characters (`+`, `.`)
  - Impact: Username looks odd but is valid
  - Mitigation: Accepted; issue 1b adds editing capability

## Rollback / Mitigation

- Rollback trigger: Corrupt data, index causing unexpected startup failures, or unresolvable CI block
- Rollback steps:
  1. Drop the `users.username` index manually: `db.users.dropIndex("username_1")`
  2. Revert `lib/types.ts` and `lib/db.ts` changes
  3. The `username` field on existing documents is harmless even if the index is dropped — no data loss
- Data migration considerations: No documents are deleted; `username` is additive. Backfill can be re-run after any rollback and re-apply.
- Verification after rollback: Run integration test suite; confirm app starts cleanly.

## Operational Blocking Policy

- If CI checks fail: Fix the root cause. Do not use `--no-verify` or bypass branch protection.
- If security checks fail: Treat as blocking. Investigate before merging.
- If required reviews are blocked/stale: Re-request review. Do not self-merge or use admin override.
- Escalation path and timeout: Ping reviewer after 24h; escalate to maintainer after 48h.

## Open Questions

No open questions — all design decisions were confirmed during proposal exploration.
