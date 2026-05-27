## Context

- Relevant architecture: `lib/scripts/` contains three imperative Node.js scripts that run against MongoDB or the filesystem. They are not imported by any application code — they are CLI-only tools. The integration test suite uses `@testcontainers/mongodb` (already wired via `tests/integration/global.setup.ts`). Unit tests live in `tests/unit/lib/`.
- Dependencies: `jest.integration.config.js` (testcontainers, 120s timeout), `jest.config.js` (unit), `lib/db.ts` (`getDatabase`), `lib/constants.ts` (`GLOBAL_USER_ID`), `lib/types.ts` (`MonsterTemplate`).
- Interfaces/contracts touched: `lib/scripts/migrateGlobalMonsters.ts` and `lib/scripts/populateMonstersByType.js` gain exports. No application code imports these files today; adding exports is purely additive.

## Goals / Non-Goals

### Goals

- Make `migrateGlobalMonsters` importable and integration-testable
- Make `populateMonstersByType` pure functions importable and unit-testable
- Achieve ≥ 70% statement coverage for `lib/scripts/` (issue #246 AC)

### Non-Goals

- Testing `seedCampaignTemplates.ts`
- Testing network fetch or disk-write paths in `populateMonstersByType.js`
- Modifying how scripts are invoked in production

## Decisions

### Decision 1: require.main guard pattern

- Chosen: Wrap the top-level auto-execute call in `if (require.main === module)` (CommonJS) for both files. `migrateGlobalMonsters.ts` uses TypeScript/CommonJS output; `populateMonstersByType.js` is already plain CJS.
- Alternatives considered: `process.env.JEST_WORKER_ID` guard; separate runner file; no guard (use `jest --testEnvironment` tricks).
- Rationale: `require.main === module` is the canonical Node.js pattern. It is zero-overhead, universally understood, and does not add a test-only env var dependency.
- Trade-offs: Slightly changes the runtime shape of the module, but since no application code imports these files, there is no regression risk.

### Decision 2: Export pure functions from populateMonstersByType.js

- Chosen: Add named exports for `normalizeType`, `getCRExperience`, `transformMonster`, `generateTypeFile` at the bottom of the file.
- Alternatives considered: Separate `lib/scripts/populateMonstersByType.helpers.js` module.
- Rationale: The functions are already defined in the file; adding `module.exports` at the bottom is the minimal change. A separate helpers file would require refactoring the `main()` function's calls and adds indirection for no benefit.
- Trade-offs: None significant — the functions are pure and have no circular dependencies.

### Decision 3: Integration test placement for migrateGlobalMonsters

- Chosen: `tests/integration/scripts/migrateGlobalMonsters.integration.test.ts`, using the existing testcontainers MongoDB instance (environment variables `MONGODB_URI` / `MONGODB_DB` set by global setup).
- Alternatives considered: Unit test with a mocked `getDatabase` — rejected because the point of the test is to verify the MongoDB query filter and `updateMany` semantics, which are only meaningful against a real driver.
- Rationale: testcontainers is already running for all integration tests. This test just seeds a few documents and runs one function — minimal overhead.
- Trade-offs: Integration test suite runtime increases slightly (negligible — 2 DB operations).

### Decision 4: generateTypeFile tested on string output only

- Chosen: Call `generateTypeFile` with a temp directory (Node's `os.tmpdir()` + `fs.mkdtempSync`) and assert on the written file's string content.
- Alternatives considered: `memfs` mock; assert only on return value (but it returns `fileName` not content).
- Rationale: Writing to a real temp dir is simpler than wiring `memfs` and avoids mocking `fs`. The temp dir is cleaned up in `afterEach`.
- Trade-offs: Tiny amount of real disk I/O in unit tests — acceptable given the alternative complexity.

## Proposal to Design Mapping

- Proposal element: `require.main === module` guard on both scripts
  - Design decision: Decision 1
  - Validation approach: Import the modules in tests — if auto-execute were still wired, the test suite would hang or fail on DB connection
- Proposal element: Export pure functions from `populateMonstersByType.js`
  - Design decision: Decision 2
  - Validation approach: Unit tests import and call them directly
- Proposal element: Integration test for `migrateGlobalMonsters` (pre/post, idempotency)
  - Design decision: Decision 3
  - Validation approach: Seed known documents into containerized MongoDB, call function, assert `source` field and `modifiedCount`
- Proposal element: Unit tests for `transformMonster` with missing optional fields
  - Design decision: Decision 2 + Decision 4
  - Validation approach: Call with minimal API response object, assert no thrown error and correct defaults

## Functional Requirements Mapping

- Requirement: `migrateGlobalMonsters` sets `source: "SRD"` only on untagged global monsters
  - Design element: Integration test — seed tagged + untagged docs, verify only untagged are updated
  - Acceptance criteria reference: specs/migrate-global-monsters.md
  - Testability notes: MongoDB `find` after migration verifies field values

- Requirement: `migrateGlobalMonsters` is idempotent
  - Design element: Integration test — run function twice, assert `modifiedCount === 0` on second run
  - Acceptance criteria reference: specs/migrate-global-monsters.md
  - Testability notes: `modifiedCount` returned by the function

- Requirement: `normalizeType` maps swarm variants to "beast"
  - Design element: Unit test — several swarm string variants
  - Acceptance criteria reference: specs/populate-monsters-by-type.md
  - Testability notes: Pure function, no side effects

- Requirement: `transformMonster` handles missing optional fields gracefully
  - Design element: Unit test — minimal API response with only required fields
  - Acceptance criteria reference: specs/populate-monsters-by-type.md
  - Testability notes: Assert no thrown error; assert default values for ac, senses, languages

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Scripts must still execute correctly when run directly via CLI
  - Design element: `require.main === module` guard preserves direct execution
  - Testability notes: Manual smoke test; guard condition is structurally verified by the fact that tests can import without side effects

- Requirement category: operability
  - Requirement: No new test infrastructure dependencies
  - Design element: Uses existing `jest.integration.config.js` testcontainers setup and existing `jest.config.js` unit runner
  - Testability notes: `npm run test:unit` and `npm run test:integration` must both pass

## Risks / Trade-offs

- Risk/trade-off: `generateTypeFile` temp-dir I/O is technically not "pure unit" test
  - Impact: Negligible — temp dirs are cleaned up; no CI flakiness expected
  - Mitigation: `afterEach` cleanup; use `os.tmpdir()` which is always writable in CI

## Rollback / Mitigation

- Rollback trigger: New tests introduce flakiness or break existing test suite
- Rollback steps: Revert test files and the export additions; the `require.main` guards are safe to leave in place permanently
- Data migration considerations: None — no schema changes
- Verification after rollback: `npm run test:unit` and `npm run test:integration` pass

## Operational Blocking Policy

- If CI checks fail: Investigate test output; do not merge with failing tests
- If security checks fail: N/A — no new dependencies introduced
- If required reviews are blocked/stale: Re-request review after 24h; escalate to repo owner
- Escalation path and timeout: Tag `dougis` in PR after 48h without review

## Open Questions

No open questions. All decisions confirmed during exploration session.
