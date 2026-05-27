## Context

- Relevant architecture: Three test layers — unit (Jest, unrestricted), integration (Jest + `jest.integration.config.js`, single global Next.js server + MongoDB container), E2E (Playwright, single Next.js server + MongoDB service in CI)
- Dependencies: `jest.integration.config.js`, `playwright.config.ts`, `.github/workflows/build-test.yml`, `tests/shared/port.ts` (djb2 port allocation, already done)
- Interfaces/contracts touched: `INTEGRATION_WORKERS` env var (new), `REGRESSION_WORKERS` env var (existing, value change in CI only)

## Goals / Non-Goals

### Goals

- Integration tests run with multiple workers, configurable via `INTEGRATION_WORKERS`
- E2E tests use Playwright's smart CPU-based default locally when `REGRESSION_WORKERS` is unset
- CI runs integration with 4 workers and E2E with 4 workers
- Invalid env var values produce a warning and fall back gracefully

### Non-Goals

- `fullyParallel: true` for Playwright (within-file parallelism)
- Sharding across multiple CI runners/machines
- Changing test isolation patterns or test code

## Decisions

### Decision 1: INTEGRATION_WORKERS env var pattern

- Chosen: Read `process.env.INTEGRATION_WORKERS` in `jest.integration.config.js`; parse as integer; warn and fall back to `undefined` (Jest default = 50% CPUs) if missing or invalid; pass directly to `maxWorkers`
- Alternatives considered: (a) hardcode a specific number like 4; (b) use Jest's `--maxWorkers` CLI flag at the npm script level
- Rationale: Mirrors the existing `REGRESSION_WORKERS` pattern in `playwright.config.ts` exactly — consistent, overridable per environment, no CLI flag pollution in `package.json`
- Trade-offs: Slightly more config than hardcoding; worth it for per-environment control without code changes

### Decision 2: Playwright local worker default

- Chosen: Return `undefined` instead of `1` in the workers IIFE when `REGRESSION_WORKERS` is not set — let Playwright apply its own default (half logical CPUs, bounded by spec file count)
- Alternatives considered: (a) hardcode `4`; (b) read `os.cpus().length` and compute manually
- Rationale: Playwright's built-in default is already well-tuned; it caps at the number of spec files (currently 4: auth, characters, combat, parties) so it self-limits. No maintenance burden.
- Trade-offs: Behavior depends on machine CPU count; on a 2-core machine you get 1 worker (same as before). Acceptable — low-core machines benefit less but don't regress.

### Decision 3: CI worker counts

- Chosen: `INTEGRATION_WORKERS: '4'` for integration job; `REGRESSION_WORKERS: '4'` for regression job (up from 2)
- Alternatives considered: `2`, `8`, `'50%'`
- Rationale: GitHub Actions standard runners have 4 vCPUs. 4 workers saturates available CPUs without oversubscribing. `'50%'` is not supported by Jest's env-var path (requires parsing).
- Trade-offs: If runner resources are constrained, 4 workers could slow things. Env var can be dropped to `2` or `1` without code changes.

## Proposal to Design Mapping

- Proposal element: Remove stale `maxWorkers: 1` in integration config
  - Design decision: Decision 1 (INTEGRATION_WORKERS env var)
  - Validation approach: Run `INTEGRATION_WORKERS=4 npm run test:integration` and verify multiple workers in output

- Proposal element: E2E defaults to 1 worker locally
  - Design decision: Decision 2 (return `undefined` from workers IIFE)
  - Validation approach: Run `npm run test:regression` locally without env var set; confirm Playwright logs show >1 worker on multi-core machine

- Proposal element: CI env var configuration
  - Design decision: Decision 3 (CI counts)
  - Validation approach: CI run shows `Regression workers: 4` in job output (already logged by the finish() trap); integration job log shows parallel test execution

## Functional Requirements Mapping

- Requirement: Integration tests run in parallel when `INTEGRATION_WORKERS` > 1
  - Design element: `maxWorkers` reads env var (Decision 1)
  - Acceptance criteria reference: specs/integration-parallelism.md
  - Testability notes: Run with `INTEGRATION_WORKERS=4`, observe Jest output showing `Test Suites: N` completing non-sequentially

- Requirement: Invalid `INTEGRATION_WORKERS` value falls back gracefully
  - Design element: Parse + validate + warn pattern (mirrors existing Playwright pattern)
  - Acceptance criteria reference: specs/integration-parallelism.md
  - Testability notes: Set `INTEGRATION_WORKERS=banana`, expect warning in stderr and tests proceed with default workers

- Requirement: Playwright uses smart default locally
  - Design element: `return undefined` in workers IIFE (Decision 2)
  - Acceptance criteria reference: specs/e2e-parallelism.md
  - Testability notes: On a 4-vCPU machine with `REGRESSION_WORKERS` unset, Playwright should report 2 workers (min of half CPUs and 4 spec files)

- Requirement: CI uses 4 workers for both suites
  - Design element: Decision 3 env var additions to build-test.yml
  - Acceptance criteria reference: specs/ci-configuration.md
  - Testability notes: CI job output lines "Regression workers: 4" (already instrumented) and Jest worker count visible in output

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Parallel tests must not produce flaky failures from data contention
  - Design element: No change to isolation patterns — existing uniqueness guarantees are sufficient
  - Acceptance criteria reference: specs/integration-parallelism.md (no new test failures vs baseline)
  - Testability notes: Run integration suite 3x with `INTEGRATION_WORKERS=4`; all runs green

- Requirement category: operability
  - Requirement: Easy to reduce parallelism if CI runner is resource-constrained
  - Design element: All worker counts controlled by env vars, no code change needed to tune
  - Acceptance criteria reference: N/A (operational)
  - Testability notes: Manual verification — change env var in CI, re-run

- Requirement category: performance
  - Requirement: Wall-clock time for integration + E2E suites measurably reduced
  - Design element: Decisions 1, 2, 3 collectively
  - Acceptance criteria reference: N/A (no hard SLA; directional improvement expected)
  - Testability notes: Compare CI job duration before/after (GitHub Actions timing)

## Risks / Trade-offs

- Risk/trade-off: Future integration test written without user isolation breaks when parallelism is on
  - Impact: Flaky test, not silent; easy to diagnose
  - Mitigation: Existing `createTestUser` pattern is the norm; no policy enforcement needed

- Risk/trade-off: Low-CPU CI runner (<4 cores) gets oversubscribed with `INTEGRATION_WORKERS=4`
  - Impact: Slower runs, possible OOM
  - Mitigation: Env var can be reduced; standard GitHub runners have 4 vCPUs

## Rollback / Mitigation

- Rollback trigger: Consistent test failures after merge that don't reproduce with `INTEGRATION_WORKERS=1`
- Rollback steps: Set `INTEGRATION_WORKERS: '1'` in CI workflow and `REGRESSION_WORKERS: '2'`; no code revert needed
- Data migration considerations: None
- Verification after rollback: Re-run CI; tests pass

## Operational Blocking Policy

- If CI checks fail: Investigate whether failure is isolation-related (set `INTEGRATION_WORKERS=1` to reproduce); fix root cause before re-enabling parallelism
- If security checks fail: Not applicable to this change (config-only, no new dependencies)
- If required reviews are blocked/stale: Standard PR review process applies; no special escalation
- Escalation path and timeout: If tests are persistently flaky after 2 days, revert env var values via PR; root-cause analysis separately

## Open Questions

No open questions. All design decisions finalized during exploration session.
