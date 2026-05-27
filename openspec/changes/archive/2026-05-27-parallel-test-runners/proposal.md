## GitHub Issues

- #233
- #220 (resolved: port conflict isolation — prerequisite for this change)

## Why

- Problem statement: Integration tests run with `maxWorkers: 1` (fully sequential) and E2E tests default to 1 worker locally, causing unnecessarily long feedback loops during local development and CI runs.
- Why now: Issue #220 shipped the djb2-based `getDirectoryPort()` system that gives each agent directory a unique port range. The original reason for `maxWorkers: 1` — port conflicts between concurrent Jest processes — is now resolved. The blocker is gone.
- Business/user impact: Developers and CI agents wait longer than necessary for test feedback. With parallel runners, wall-clock time for integration and E2E suites can drop significantly (estimated 50–75% reduction for integration, 40–60% for E2E).

## Problem Space

- Current behavior:
  - `jest.integration.config.js` has `maxWorkers: 1` with a comment about port conflicts (stale since #220)
  - `playwright.config.ts` defaults workers to `1` when `REGRESSION_WORKERS` is unset (local runs)
  - CI sets `REGRESSION_WORKERS: '2'` for E2E, but no equivalent knob exists for integration tests
  - Unit tests already run in parallel (no restriction)
- Desired behavior:
  - Integration tests use multiple workers locally and in CI, configurable via `INTEGRATION_WORKERS` env var
  - E2E tests use Playwright's smart default locally (half CPUs, bounded by spec file count) when `REGRESSION_WORKERS` is unset
  - CI sets `INTEGRATION_WORKERS: '4'` and `REGRESSION_WORKERS: '4'`
- Constraints:
  - Integration tests share one Next.js server and one MongoDB container (started in `globalSetup`) — workers must not each try to spin up their own server
  - Port conflicts between different agent directories are already solved by #220; within a single Jest run, all workers share the same server URL via `TEST_BASE_URL`
- Assumptions:
  - All integration tests are already data-isolated: `createTestUser()` generates `${prefix}-${timestamp}-${random}@example.com` unique emails
  - `permissions.test.ts` `afterAll` only closes a `MongoClient` connection — no shared collection mutations
  - E2E `isolation.ts` already namespaces by `workerIndex + retry + title`, making workers safe to run concurrently
- Edge cases considered:
  - Invalid/non-numeric `INTEGRATION_WORKERS` value → fall back to Jest default with a console warning (mirrors existing `REGRESSION_WORKERS` validation)
  - `INTEGRATION_WORKERS=1` → behaves the same as current behavior (escape hatch)
  - E2E spec files with shared `beforeAll` that creates cross-test state → not found; each test creates its own user identity

## Scope

### In Scope

- `jest.integration.config.js`: replace `maxWorkers: 1` with `INTEGRATION_WORKERS` env var, remove stale comment
- `playwright.config.ts`: change `return 1` fallback to `return undefined` so Playwright's default applies locally
- `.github/workflows/build-test.yml`: add `INTEGRATION_WORKERS: '4'` to integration job; bump `REGRESSION_WORKERS: '2'` → `'4'` in regression job
- `package.json` scripts: no changes needed (scripts already accept env vars)

### Out of Scope

- Enabling `fullyParallel: true` in Playwright (tests within a spec file stay sequential — some spec files like `combat.spec.ts` are large and may have implicit ordering)
- Sharding integration tests across multiple CI jobs (horizontal scaling across runners, not just vertical within one runner)
- Unit test parallelism (already unrestricted)
- Changing test isolation patterns (already sufficient)

## What Changes

- `jest.integration.config.js`: `maxWorkers` reads `INTEGRATION_WORKERS` env var; validates and warns on invalid values; defaults to `'50%'` (half logical CPUs) explicitly when unset
- `playwright.config.ts`: workers IIFE returns `undefined` instead of `1` when `REGRESSION_WORKERS` is not set
- `.github/workflows/build-test.yml`: two env var additions/updates

## Risks

- Risk: A parallel integration test that mutates shared DB state could cause flaky failures
  - Impact: Medium — test failures that are hard to reproduce locally
  - Mitigation: Verified all integration tests use unique-per-run user identities; `permissions.test.ts` `afterAll` only closes a connection. No collection-level mutations found.

- Risk: Increased worker count in CI could exhaust GitHub Actions runner resources (memory, CPU)
  - Impact: Medium — Next.js server + MongoDB are already running; Jest workers are full Node.js processes that load ts-jest and compile TypeScript, making them resource-intensive on standard 2-core GitHub runners
  - Mitigation: Start with 4 workers in CI (conservative); can tune `INTEGRATION_WORKERS` / `REGRESSION_WORKERS` without code changes

- Risk: A future test added without proper isolation could silently fail when parallelism is on
  - Impact: Low — flaky, not silent; will surface quickly
  - Mitigation: The `createTestUser` pattern is established and documented in `auth.test.helpers.ts`

## Open Questions

No unresolved ambiguity. All questions from exploration were answered:
- Port conflicts: resolved by #220 ✓
- `permissions.test.ts` `afterAll`: confirmed safe (connection close only) ✓
- E2E isolation: confirmed via `isolation.ts` worker-indexed namespacing ✓
- `fullyParallel`: explicitly out of scope by user decision ✓

## Non-Goals

- Making test setup faster (MongoDB container startup, Next.js build time)
- Distributing tests across multiple CI machines/shards
- Changing how tests are written or organized

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
