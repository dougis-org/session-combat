## Context

- Relevant architecture: Jest integration test suite (`jest.integration.config.js`), Playwright e2e suite (`playwright.config.ts`), `tests/integration/helpers/server.ts` (current per-file server lifecycle), `tests/integration/utils/port.ts` (current TOCTOU port probe).
- Dependencies: `@testcontainers/mongodb`, `next`, `mongodb` (npm), `JEST_WORKER_ID` (Jest runtime env var).
- Interfaces/contracts touched:
  - `tests/integration/helpers/server.ts` — `startTestServer`, `setupTestServer`, `registerAndGetCookie` deprecated/removed.
  - All integration test files — `beforeAll` / `afterAll` server wiring replaced.
  - `jest.integration.config.js` — adds `globalSetup` / `globalTeardown`.
  - `playwright.config.ts` — `testPort` derivation.

## Goals / Non-Goals

### Goals

- Eliminate port collisions between agents running in different directories.
- Eliminate per-test-file MongoDB container + Next.js startup (3× → 1× per run).
- Make test data creation parallel-safe without coordination or lock files.
- Leave environment fully clean after each run (global wipe on setup and teardown).
- Emit a `[port-select]` log line usable as a CI observable.

### Non-Goals

- Enabling `maxWorkers > 1` (this change makes it safe; enabling is a separate decision).
- Eliminating the MongoDB container requirement.
- Per-test DB isolation beyond unique naming.
- Implementing resource DELETE endpoints.

## Decisions

### Decision 1: Directory-derived port via djb2 hash

- Chosen: `getDirectoryBasePort()` in `tests/shared/port.ts` — djb2 hash of `process.cwd()`, result mapped to range 20000–50000 via `20000 + (hash % 30000)`.
- Alternatives considered: (a) Lock file + port registry — requires stale-lock cleanup, shared filesystem coordination. (b) OS port 0 binding — truly race-free but cannot pre-commit a port before Playwright's `webServer` config is evaluated. (c) Random port per run — no collision guarantee, no determinism.
- Rationale: Deterministic per directory, zero coordination, works for both Jest (globalSetup) and Playwright (config evaluation time). Same directory always yields same port, making logs predictable.
- Trade-offs: Hash collision possible but negligible at realistic scale. Not suitable if same-directory parallel runs are ever needed (out of scope).

### Decision 2: Jest globalSetup / globalTeardown for shared server

- Chosen: Single MongoDB container + Next.js process for the entire integration test run, managed via `tests/integration/global.setup.ts` and `tests/integration/global.teardown.ts`. Server info (`TEST_BASE_URL`, `MONGODB_URI`) passed to workers via `process.env` set in globalSetup (Jest propagates env to workers).
- Alternatives considered: Per-file `beforeAll` / `afterAll` (current) — 3× startup cost, port race between files. Jest `setupFilesAfterFramework` writing to a temp file — works but `process.env` propagation is simpler.
- Rationale: Mirrors the pattern already used by the e2e suite (`tests/e2e/global.setup.ts`). Env propagation is documented Jest behaviour. Single startup eliminates the dominant cost of integration test runs.
- Trade-offs: Test files no longer have an isolated fresh DB per file. Mitigated by global wipe at setup start and unique naming per worker.

### Decision 3: DB lifecycle — wipe at start, drop at end

- Chosen: `global.setup.ts` drops the entire test database before starting the server. `global.teardown.ts` drops it again after stopping. No per-worker cleanup.
- Alternatives considered: Per-worker `afterAll` DELETE via API — no DELETE endpoints exist. Per-file `beforeAll` collection drop — dangerous if workers ever run in parallel on the same collection.
- Rationale: Ephemeral environment contract: every run starts and ends clean. Workers create freely and never need to track or clean up what they made. Eliminates the need for DELETE endpoints entirely.
- Trade-offs: If a run is killed mid-way, the DB is not dropped at teardown. Acceptable — the next run's setup wipe handles it.

### Decision 4: JEST_WORKER_ID + module counter for unique identifiers

- Chosen: `tests/integration/helpers/users.ts` exports `uniqueEmail(prefix)` using `${prefix}-w${JEST_WORKER_ID ?? '0'}-${++counter}@example.com`. Counter is module-level, increments per call. `createTestUser(baseUrl, prefix)` wraps registration and returns `{ email, password, cookie, userId }`.
- Alternatives considered: `crypto.randomUUID()` — collision-free but non-deterministic (harder to reproduce failures). `Date.now()` — already in use elsewhere, single-millisecond collision risk under parallelism.
- Rationale: Deterministic, debuggable email addresses. Worker ID scopes the counter to a process. Multiple calls within the same test file produce distinct users. Supports future `maxWorkers > 1` without changes.
- Trade-offs: Counter resets if a worker module is re-evaluated (Jest `resetModules`). Acceptable — reset produces new unique values regardless.

### Decision 5: dedupeEngine exclusion

- Chosen: `tests/integration/import/dedupeEngine.integration.test.ts` is explicitly excluded from shared server migration. A comment block is added to the file documenting this. See issue #224.
- Rationale: The file manages its own `MongoDBContainer`, imports library code directly (no HTTP), and uses `deleteMany({})` in `beforeEach` — incompatible with the shared DB contract. Forcing it into the shared server would require a full rewrite of an otherwise self-contained test.

## Proposal to Design Mapping

- Proposal element: Port isolation (cross-agent)
  - Design decision: Decision 1 — `getDirectoryBasePort()` djb2 hash
  - Validation approach: Two test runs from different directories log different `[port-select]` ports; neither fails with EADDRINUSE.

- Proposal element: Shared server (integration tests)
  - Design decision: Decision 2 — Jest globalSetup/globalTeardown
  - Validation approach: Integration suite logs one MongoDB container start and one Next.js start per run (not per test file).

- Proposal element: Global DB wipe, no per-worker cleanup
  - Design decision: Decision 3 — wipe at setup start + drop at teardown
  - Validation approach: DB is empty at the start of each run; all records created during the run are gone after teardown.

- Proposal element: Worker uniqueness
  - Design decision: Decision 4 — JEST_WORKER_ID + counter
  - Validation approach: Email addresses in logs are distinct across workers; no duplicate-email registration errors under parallel runs.

- Proposal element: E2E port
  - Design decision: Decision 1 (shared utility) applied in `playwright.config.ts`
  - Validation approach: `playwright.config.ts` uses `getDirectoryBasePort()`; port in use matches `[port-select]` log from integration run if both run from same directory.

## Functional Requirements Mapping

- Requirement: Two agents in different directories must not collide on ports.
  - Design element: `getDirectoryBasePort()` — deterministic per cwd.
  - Acceptance criteria reference: specs/port-isolation.
  - Testability notes: Run integration suite from two different directories simultaneously; verify no EADDRINUSE errors.

- Requirement: Integration test suite must start one server per run, not one per test file.
  - Design element: `global.setup.ts` / `global.teardown.ts` + `jest.integration.config.js`.
  - Acceptance criteria reference: specs/shared-server.
  - Testability notes: Count "Starting MongoDB container" log lines per run — must be exactly 1.

- Requirement: Test data creation must be unique per worker and per call.
  - Design element: `uniqueEmail()` in `tests/integration/helpers/users.ts`.
  - Acceptance criteria reference: specs/user-factory.
  - Testability notes: Run suite with `maxWorkers: 2` (temporarily); assert no duplicate-email errors in registration responses.

- Requirement: DB must be clean at the start and end of every run.
  - Design element: Decision 3 — DB drop in setup and teardown.
  - Acceptance criteria reference: specs/db-lifecycle.
  - Testability notes: Inspect DB before first test and after last test; both must show empty collections.

- Requirement: Port selection must be observable in CI logs.
  - Design element: `console.log("[port-select] cwd=... port=...")` in `global.setup.ts`.
  - Acceptance criteria reference: specs/observability.
  - Testability notes: Grep CI output for `[port-select]`; line must appear exactly once per run and include the cwd and port.

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: Integration suite startup time must decrease (3× server starts → 1×).
  - Design element: Single shared server via globalSetup.
  - Acceptance criteria reference: Informational — no hard SLA, but regression would be visible.
  - Testability notes: Compare wall-clock time before and after.

- Requirement category: reliability
  - Requirement: No test failure caused by port conflict between agents.
  - Design element: Directory-derived port, 30 000-slot range.
  - Acceptance criteria reference: specs/port-isolation.
  - Testability notes: Run N agents in parallel from different directories; all suites complete without EADDRINUSE.

- Requirement category: operability
  - Requirement: Port in use must be discoverable from logs without instrumenting the test binary.
  - Design element: `[port-select]` log line.
  - Acceptance criteria reference: specs/observability.
  - Testability notes: Human-readable grep of stdout.

## Risks / Trade-offs

- Risk/trade-off: Shared DB across test files within a run.
  - Impact: Dirty data from one file visible to another if naming is non-unique.
  - Mitigation: Unique naming (Decision 4) prevents overlap. Global wipe at setup prevents carry-over from prior runs.

- Risk/trade-off: `dedupeEngine` accidentally included in shared server glob.
  - Impact: `deleteMany({})` in its `beforeEach` would wipe shared collections mid-run.
  - Mitigation: Explicit exclusion comment in file + issue #224 tracking formal separation.

## Rollback / Mitigation

- Rollback trigger: Integration tests fail in CI after migration (non-port-related regressions).
- Rollback steps: Revert `jest.integration.config.js` (remove `globalSetup`/`globalTeardown`), revert individual test files to `startTestServer`/`registerAndGetCookie`. `tests/shared/port.ts` and `tests/integration/helpers/users.ts` can remain (no harm).
- Data migration considerations: None — test infrastructure only.
- Verification after rollback: Integration suite green on main branch CI.

## Operational Blocking Policy

- If CI checks fail: Investigate before merging. Do not merge with failing integration tests.
- If security checks fail: Block merge; escalate to repo owner.
- If required reviews are blocked/stale: Ping reviewer after 24 hours; escalate to repo owner after 48 hours.
- Escalation path and timeout: Repo owner (@dougis) is final decision-maker. No automated merge override.

## Open Questions

No open questions. All decisions confirmed during exploration with the requester.
