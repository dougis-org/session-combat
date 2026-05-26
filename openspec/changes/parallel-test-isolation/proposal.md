## GitHub Issues

- #220

## Why

- Problem statement: Multiple agents working in parallel on the same machine produce port conflicts when running integration or e2e tests, causing test failures that are unrelated to code correctness.
- Why now: Parallel agent workflows are in active use; port conflicts are a recurring source of noise that blocks agents and wastes CI time.
- Business/user impact: Failed tests from port collisions require manual retries, slow down development velocity, and erode confidence in the test suite.

## Problem Space

- Current behavior: Integration tests call `findAvailablePort(3000)` (TOCTOU probe), and e2e tests hardcode `PORT=3000`. Every agent on the machine races for the same ports. Each integration test file also spins up its own MongoDB container + Next.js server, multiplying startup cost.
- Desired behavior: Each agent derives a unique port from its working directory path. Integration tests share a single server for the entire Jest run. E2E tests use the same derived port. No agent can collide with another running in a different directory.
- Constraints: Agents always work in different directories. No shared coordination file, daemon, or lock mechanism should be required. No DELETE API endpoints exist for test resource cleanup.
- Assumptions: Port range 20000–50000 provides sufficient space (30 000 slots) for realistic agent counts with negligible collision probability.
- Edge cases considered:
  - Hash collisions between directories: statistically negligible at realistic agent counts (~0.17% for 10 agents).
  - Multiple Jest workers within a single run: `JEST_WORKER_ID` + module counter guarantees unique identifiers without coordination.
  - `dedupeEngine.integration.test.ts` manages its own MongoDB container and must remain excluded from the shared server.

## Scope

### In Scope

- New `tests/shared/port.ts`: `getDirectoryBasePort()` — djb2 hash of `process.cwd()` mapped to 20000–50000.
- New `tests/integration/global.setup.ts`: drops DB, starts MongoDBContainer + Next.js on derived port, sets `process.env.TEST_BASE_URL` and `MONGODB_URI`, logs `[port-select]` line for CI observability.
- New `tests/integration/global.teardown.ts`: drops DB, stops Next.js, stops MongoDBContainer.
- New `tests/integration/helpers/users.ts`: `uniqueEmail(prefix)` (JEST_WORKER_ID + counter) and `createTestUser(baseUrl, prefix)` returning `{ email, password, cookie, userId }`. Designed to be called multiple times per test file.
- Update `jest.integration.config.js` to wire `globalSetup` / `globalTeardown`.
- Migrate all integration test files from `startTestServer` / `registerAndGetCookie` to the shared server + `createTestUser` (excluding `dedupeEngine`).
- Update `playwright.config.ts`: replace hardcoded port 3000 with `getDirectoryBasePort()`.
- Document exclusion of `dedupeEngine.integration.test.ts` (see issue #224).

### Out of Scope

- Implementing DELETE endpoints for test resources (no cleanup needed; global wipe handles it).
- Centralizing the admin-promotion helper (tracked in issue #223).
- Extending the user factory to a fully shared helper across auth tests (tracked in issue #222).
- Increasing `maxWorkers` beyond 1 (this change makes it safe to do so later; enabling it is a separate decision).
- `dedupeEngine.integration.test.ts` migration.

## What Changes

- `tests/shared/port.ts` — new file, `getDirectoryBasePort()`.
- `tests/integration/global.setup.ts` — new file, shared server lifecycle.
- `tests/integration/global.teardown.ts` — new file, teardown + DB drop.
- `tests/integration/helpers/users.ts` — new file, parallel-safe user factory.
- `jest.integration.config.js` — add `globalSetup`, `globalTeardown`.
- `tests/integration/helpers/server.ts` — `startTestServer` / `setupTestServer` / `registerAndGetCookie` removed or deprecated.
- All integration test files (excluding `dedupeEngine`) — migrate to shared server + `createTestUser`.
- `playwright.config.ts` — `testPort` default derived from `getDirectoryBasePort()`.

## Risks

- Risk: Shared MongoDB state between test files (no per-file fresh container).
  - Impact: A test file that corrupts shared collections could affect subsequent files in the same run.
  - Mitigation: Global DB wipe at setup start guarantees a clean slate. Unique naming (`JEST_WORKER_ID` + counter) prevents cross-worker record collision. No test file uses `deleteMany({})` on shared collections (the only file that does, `dedupeEngine`, is excluded).

- Risk: Hash collision between two agent directories.
  - Impact: Port conflict identical to the current problem.
  - Mitigation: 30 000-slot range makes this statistically negligible. The `[port-select]` log line makes detection trivial in CI.

- Risk: `JEST_WORKER_ID` not set in some environments.
  - Impact: Counter uniqueness degrades to single-worker behaviour (no actual collision, just loses the worker-ID component).
  - Mitigation: Factory defaults to `'0'` when env var is absent — still unique within a single worker.

- Risk: Migration introduces regressions in individual test files.
  - Impact: Tests that relied on per-file fresh DB state may see unexpected data.
  - Mitigation: Global wipe at setup provides equivalent isolation at the run level. Unique email/ID naming prevents cross-test bleed.

## Open Questions

No unresolved ambiguity. All design decisions were made during exploration and confirmed by the requester:
- Port range: 20000–50000 ✓
- Cleanup strategy: global wipe at setup + teardown, no per-worker cleanup ✓
- Worker uniqueness: `JEST_WORKER_ID` + module counter ✓
- User factory must support multiple calls per test file ✓
- `dedupeEngine` excluded ✓

## Non-Goals

- Making tests runnable without Docker (MongoDB container is still required).
- Supporting same-directory parallel agent runs.
- Per-test database isolation beyond what unique naming provides.
- CI pipeline changes beyond the observable `[port-select]` log line.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
