## Context

- Relevant architecture: `lib/db.ts` owns a process-cached `MongoClient`/`Db` pair behind `connectToDatabase()`/`getDatabase()`. All storage-layer modules (`lib/storage/*Repo.ts`, `lib/storage.ts`) consume the `Db`/`Collection` types returned from there without importing `mongodb` directly. Five files import `mongodb` directly: `app/api/auth/password/reset/route.ts`, `app/api/campaigns/[id]/members/route.ts`, `lib/gridfs.ts`, `lib/permissions.ts`, `lib/server/transport.ts`.
- Dependencies: `mongodb` `^6.3.0` (direct), `@testcontainers/mongodb` `^12.1.0` (dev, backs the testcontainers integration suite).
- Interfaces/contracts touched: `MongoClientOptions` (via `lib/db.ts`), `GridFSBucket`/`GridFSBucketReadStream` (via `lib/gridfs.ts`), `ChangeStream`/`Db.watch()` (via `lib/server/transport.ts`), `Collection.find()`/`.findOne()` (broadly, via typed `Db`/`Collection` generics). No public API contract of this app changes — this is an internal dependency swap.

## Goals / Non-Goals

### Goals

- Land `mongodb` `^7.x` with zero functional/behavioral change to the app.
- Confirm `@testcontainers/mongodb` provisions a server version compatible with driver v7 before relying on it for the new tests.
- Close the specific gaps the official v7 changelog leaves open (GridFS silence, undocumented error name/code stability) with runtime evidence, not documentation review alone.
- Keep the diff minimal: touch only what v7 actually requires plus the new test coverage.

### Non-Goals

- Redesigning `lib/server/transport.ts`'s replica-set-detection or change-stream-recovery strategy.
- Restoring pre-v7 cursor `batchSize` default behavior.
- Migrating AWS auth, `.stream({transform})` usage, or other v7-changed surfaces this codebase doesn't use.
- Bumping any other #594 dependency.

## Decisions

### Decision 1: Upgrade `mongodb` and `@testcontainers/mongodb` together, testcontainers-version-check first

- Chosen: Before touching any application code, verify (and bump if needed) `@testcontainers/mongodb` for v7-driver compatibility, as a standalone first step.
- Alternatives considered: Bump `mongodb` alone and let integration-test failures reveal a testcontainers mismatch reactively.
- Rationale: A testcontainers/server-version mismatch would produce integration-test failures indistinguishable from a real driver-compatibility bug, wasting debugging effort. Sequencing the check first removes that ambiguity.
- Trade-offs: One extra up-front research step; negligible cost given the alternative's debugging risk.

### Decision 2: Treat the 5 direct-import call sites as the adaptation surface, but audit `Db`/`Collection` generic typing across the whole codebase via `tsc --noEmit`

- Chosen: Application-code changes (if any) are scoped to the 5 files that import `mongodb` directly. Type-level fallout in the ~20 `lib/storage/*Repo.ts` files that consume `Db`/`Collection` types transitively is caught by running `tsc --noEmit` project-wide, not by manually re-reading every file.
- Alternatives considered: Manually review every file that calls `.find()`/`.findOne()`/etc. against a `Db`/`Collection` type.
- Rationale: `tsc --noEmit` is authoritative for type-shape breaks and is already part of the issue's required gate; manual review of ~20 files with no `mongodb` import and no v7-affected API usage (confirmed by grep in the proposal's exploration) would be redundant effort for the same guarantee.
- Trade-offs: Relies on TypeScript's structural typing catching every relevant break. This is why Decision 3 exists — behavioral changes that don't manifest as type errors (like the GridFS and error-matching risks) are explicitly not covered by this decision and get dedicated runtime tests instead.

### Decision 3: Add 4 targeted testcontainers integration tests instead of a general "upgrade and see" approach

- Chosen: Write the 4 tests identified in the proposal's Risks section (replica-set detection, change-stream invalidation recovery, `$changeStream` pipeline validation, GridFS round-trip) as explicit, named test cases inside the existing testcontainers-backed integration suite, run before declaring the upgrade complete.
- Alternatives considered: Rely on the existing integration/e2e suite's incidental coverage to surface any breakage.
- Rationale: All 4 risks are specifically about error-matching logic and undocumented API behavior — categories of bug that a green existing test suite would not reliably catch, since they depend on exact error shapes/names under specific failure conditions (standalone mode, stream invalidation) that the existing suite likely doesn't deliberately trigger. Named tests make the coverage intentional and legible for future driver upgrades, not just this one.
- Trade-offs: 4 new test cases to write and maintain; justified by being the direct mitigation for 4 identified, non-speculative risks.

### Decision 4: No `lib/db.ts` connection-option changes

- Chosen: Leave `lib/db.ts`'s `connectToDatabase()` options (`{ maxPoolSize: 10 }`) untouched.
- Alternatives considered: Proactively add v7-recommended options (e.g. explicit timeouts) while in the file.
- Rationale: Proposal scope is "no functionality change." The current options contain no removed/renamed v7 fields (confirmed against the official changelog during exploration — v7 only removed `additionalDriverInfo`/`metadata`/`extendedMetadata`, none of which are set here). Adding new options would be an unrelated behavior change riding on a dependency-bump PR.
- Trade-offs: None identified — this is the minimal-diff choice consistent with the proposal's explicit scope boundary.

## Proposal to Design Mapping

- Proposal element: Bump `mongodb` `^6.3.0` → `^7.x`, verify `@testcontainers/mongodb` compatibility
  - Design decision: Decision 1
  - Validation approach: `npm ls`/testcontainers changelog check, then full gate (`lint && typecheck && test:unit && test:integration && test:e2e`) green
- Proposal element: Review/adapt 5 direct call sites for v7 API compatibility
  - Design decision: Decision 2
  - Validation approach: `tsc --noEmit` clean; manual read-through of the 2 previously-unreviewed route files
- Proposal element: `detectReplicaSet()` error-matching risk (standalone-mode detection)
  - Design decision: Decision 3, test 1
  - Validation approach: Integration test forcing standalone MongoDB, asserting error still matches one of the 4 existing conditions
- Proposal element: `ChangeStreamInvalidatedError` recovery risk
  - Design decision: Decision 3, test 2
  - Validation approach: Integration test forcing stream invalidation on a replica-set testcontainer, asserting `err.name` and reopen behavior
- Proposal element: `$changeStream` server-side validation risk
  - Design decision: Decision 3, test 3
  - Validation approach: Integration test opening the existing `.watch()` pipeline against v7 + testcontainers, asserting clean open
- Proposal element: GridFS undocumented-risk
  - Design decision: Decision 3, test 4
  - Validation approach: Integration test performing full upload → find → download → delete round-trip, asserting byte/metadata correctness
- Proposal element: `lib/db.ts` connection options out of scope
  - Design decision: Decision 4
  - Validation approach: Diff review — confirm no changes to `connectToDatabase()` options beyond what `tsc`/runtime forces

## Functional Requirements Mapping

- Requirement: App behavior is unchanged after the upgrade (no functionality change)
  - Design element: Decisions 1-4, minimal-diff scoping
  - Acceptance criteria reference: specs/mongodb-driver-upgrade/spec.md — "Scenario: Application behavior unchanged post-upgrade"
  - Testability notes: Existing unit/integration/e2e suites passing unchanged is the primary signal; no new user-facing behavior to assert.
- Requirement: Real-time campaign event stream continues to correctly detect replica-set vs. standalone MongoDB and recover from change-stream invalidation
  - Design element: Decision 3, tests 1-2
  - Acceptance criteria reference: specs/mongodb-driver-upgrade/spec.md — "Scenario: Standalone MongoDB falls back to polling" / "Scenario: Change-stream invalidation triggers automatic reopen"
  - Testability notes: Directly testable via testcontainers by provisioning standalone vs. replica-set MongoDB instances and forcing invalidation.
- Requirement: GridFS attachment upload/download/delete continues to work correctly
  - Design element: Decision 3, test 4
  - Acceptance criteria reference: specs/mongodb-driver-upgrade/spec.md — "Scenario: GridFS attachment round-trip"
  - Testability notes: Directly testable end-to-end against a real testcontainers MongoDB instance.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: No silent degradation of the real-time event stream's fallback/recovery logic under the new driver major version
  - Design element: Decision 3, tests 1-2
  - Acceptance criteria reference: specs/mongodb-driver-upgrade/spec.md — replica-set/invalidation scenarios
  - Testability notes: These are exactly the failure modes that would otherwise degrade silently (no exception surfaced to a user, just missing real-time updates); tests must assert on internal error-matching behavior, not just "no crash."
- Requirement category: operability
  - Requirement: The upgrade must not require infrastructure changes (Node version, connection config) beyond the dependency bump itself
  - Design element: Decision 4; proposal's confirmation that `engines.node >=24.0.0` already exceeds v7's `>=20.19.0` minimum
  - Acceptance criteria reference: specs/mongodb-driver-upgrade/spec.md — "Scenario: No infrastructure changes required"
  - Testability notes: Verified by inspection (no `.nvmrc`/`engines` diff needed) rather than a runtime test.

## Risks / Trade-offs

- Risk/trade-off: Scoping type-level verification to `tsc --noEmit` (Decision 2) rather than manual file-by-file review could miss a behavioral (non-type) change in a storage-repo file that happens to still type-check.
  - Impact: A subtle runtime behavior difference in a `lib/storage/*Repo.ts` file goes undetected until it surfaces as a test failure or, worse, a production issue.
  - Mitigation: The existing `test:unit`/`test:integration`/`test:e2e` suites already exercise the storage layer extensively (per prior project work on `lib/storage/*Repo.ts` — see `[[project_active_and_setup_view_tests]]`-style prior test investment); a real behavioral break is very likely to surface there even without a dedicated new test, since these tests already assert on data returned by `.find()`/`.findOne()`.
- Risk/trade-off: Writing 4 new named integration tests (Decision 3) adds testcontainers runtime to the suite (spinning up standalone-mode and invalidation-forcing scenarios).
  - Impact: Slightly longer integration-test wall-clock time.
  - Mitigation: These tests are one-time additions that pay for themselves on every future driver upgrade, not just this one; acceptable trade-off given the alternative (undetected silent breakage in production).

## Rollback / Mitigation

- Rollback trigger: The gate (`lint && typecheck && test:unit && test:integration && test:e2e`) fails in a way that can't be resolved within the change's scope, or a genuine v7 behavioral break is found that would require redesigning `lib/server/transport.ts` or `lib/gridfs.ts` beyond a like-for-like adaptation.
- Rollback steps: Revert the `package.json`/lockfile bump back to `mongodb ^6.3.0` (and any `@testcontainers/mongodb` bump); revert any application-code adaptations made in the 5 call-site files; keep the 4 new integration tests only if they can be made to pass against v6 as regression coverage, otherwise revert them too since they were written against v7-specific concerns.
- Data migration considerations: None — this is a client-driver change only; no data-at-rest format changes (BSON wire format is unaffected for the operations this app performs).
- Verification after rollback: Full gate green against the reverted `mongodb ^6.3.0` state, confirming the revert didn't leave a partial adaptation in place.

## Operational Blocking Policy

- If CI checks fail: Fix the underlying cause per this repo's standing policy — do not bypass with `--admin` merges or skip hooks. If a failure is a testcontainers/server-version mismatch (Decision 1's concern) rather than an application bug, resolve by bumping `@testcontainers/mongodb` further, not by weakening the test.
- If security checks fail: Investigate whether the failure is genuinely introduced by the `mongodb ^7.x` bump (e.g. a new transitive dependency) versus pre-existing; do not waive without a human-approved reason per this repo's `verity waive` policy (CLAUDE.md).
- If required reviews are blocked/stale: Follow standard PR process — do not merge with `--admin`; escalate to the repo owner (doug) if a review has been outstanding beyond a normal review cycle.
- Escalation path and timeout: If the 4 targeted integration tests (Decision 3) reveal a genuine, non-trivial v7 behavioral break in `lib/server/transport.ts` or `lib/gridfs.ts` that requires more than a like-for-like fix, pause implementation and return to proposal/design update per the Change Control note in proposal.md, rather than expanding scope silently mid-implementation.

## Open Questions

- None blocking design. Confirmed during the originating explore session and reaffirmed here: no infrastructure, connection-option, or auth changes are needed; the 4 identified risks are the only areas requiring new runtime validation.
