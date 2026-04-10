## Context

- Relevant architecture: ESLint 9 flat config system; Next.js 16 with `eslint-config-next` v16; GitHub Actions `build-test.yml` with three test jobs (`unit-tests`, `integration-tests`, `regression-tests`) and one finalization job (`finalize-coverage`).
- Dependencies: `eslint` ^9.39.2, `eslint-config-next` ^16.2.2 (already in `devDependencies`). No new packages required.
- Interfaces/contracts touched: `package.json` (lint script), `eslint.config.mjs` (flat config), `.eslintrc.json` (deleted), `.github/workflows/build-test.yml` (new job + `needs` wiring).

## Goals / Non-Goals

### Goals

- `npm run lint` runs cleanly with ESLint 9 flat config
- Lint covers all `.js`, `.jsx`, `.ts`, `.tsx` project source and test files
- Lint excludes `node_modules/`, `.next/`, `coverage/`, `coverage-e2e/`, `playwright-report/`
- A CI `lint` job runs before all test jobs; test jobs do not start if lint fails
- No legacy config files remain in the repo

### Non-Goals

- Adding lint rules beyond `eslint-config-next/core-web-vitals`
- Fixing existing lint violations (separate concern)
- Adding a pre-commit hook for lint

## Decisions

### Decision 1: ESLint flat config structure

- Chosen: Spread `nextCoreWebVitals` into an array export, append a global `ignores` config object.
- Alternatives considered: Direct re-export (`export default nextCoreWebVitals`) — already present but provides no ignore control and may not work if `nextCoreWebVitals` is not an array.
- Rationale: ESLint 9 flat config expects an array. Spreading accommodates both array and single-object exports from `eslint-config-next`. An explicit `ignores` entry is the flat-config way to exclude directories.
- Trade-offs: If `eslint-config-next` v16 exports an array already, the spread is a no-op and safe. If it exports a plain object, the spread still works (spreads object keys). No downside.

### Decision 2: Remove `--ext` flag from lint script

- Chosen: `"lint": "eslint ."` — no `--ext` flag.
- Alternatives considered: Keeping `--ext` — ESLint 9 does not support this flag in flat config mode; it is either ignored or causes an error.
- Rationale: File extension filtering belongs in `eslint.config.mjs` via `files:` globs. `eslint-config-next` already configures appropriate file patterns internally.
- Trade-offs: Slightly less explicit in `package.json`, but the config file is the authoritative source of truth for what gets linted.

### Decision 3: Delete `.eslintrc.json`

- Chosen: Delete the file entirely.
- Alternatives considered: Leave it in place — ESLint 9 ignores `.eslintrc.*` when a flat config exists, so it is functionally harmless but creates confusion about which config is active.
- Rationale: Dead files are liabilities. Removing it makes the config story unambiguous.
- Trade-offs: None. The flat config provides equivalent and superseding configuration.

### Decision 4: Standalone `lint` CI job gating test jobs

- Chosen: New `lint` job in `build-test.yml`; `unit-tests`, `integration-tests`, and `regression-tests` each add `needs: [lint]`. `finalize-coverage` already `needs` the test jobs so is implicitly gated.
- Alternatives considered: Add lint as a step inside each test job — repetitive, doesn't fail fast (all three jobs spin up before any lint error is surfaced).
- Rationale: One lint run is enough. A standalone job surfaces lint failures in seconds before expensive build/test work begins. The `needs` chain guarantees ordering without duplication.
- Trade-offs: Adds one extra job to the workflow run. Cost is negligible (lint is fast); benefit is fast feedback on lint regressions.

## Proposal to Design Mapping

- Proposal element: Fix `eslint.config.mjs`
  - Design decision: Decision 1 — spread + ignores pattern
  - Validation approach: `npm run lint` exits 0; spec acceptance criteria

- Proposal element: Remove `--ext` from lint script
  - Design decision: Decision 2 — `eslint .` only
  - Validation approach: Script runs without ESLint flag error

- Proposal element: Delete `.eslintrc.json`
  - Design decision: Decision 3 — file removed
  - Validation approach: File does not exist in repo

- Proposal element: Add `lint` CI job gating test jobs
  - Design decision: Decision 4 — standalone job with `needs` wiring
  - Validation approach: CI workflow graph shows lint as prerequisite; lint failure prevents test jobs from starting

## Functional Requirements Mapping

- Requirement: `npm run lint` completes without error on a clean checkout
  - Design element: Decision 1 + Decision 2
  - Acceptance criteria reference: `specs/lint-config/spec.md` — FR1
  - Testability notes: Run `npm ci && npm run lint` from repo root; expect exit 0

- Requirement: Lint covers all `.js/.jsx/.ts/.tsx` source and test files, not generated output
  - Design element: Decision 1 (`ignores` block)
  - Acceptance criteria reference: `specs/lint-config/spec.md` — FR2
  - Testability notes: Verify `.next/` and `node_modules/` are not in lint output; verify `tests/` files are processed

- Requirement: No legacy ESLint config files remain
  - Design element: Decision 3
  - Acceptance criteria reference: `specs/lint-config/spec.md` — FR3
  - Testability notes: `ls .eslintrc*` returns nothing

- Requirement: CI lint job gates all test jobs
  - Design element: Decision 4
  - Acceptance criteria reference: `specs/ci-lint-gate/spec.md` — FR1
  - Testability notes: Introduce a deliberate lint error on a branch; confirm test jobs do not start

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: Lint runs in under 30 seconds locally on a developer machine
  - Design element: Decision 2 (no unnecessary file scanning)
  - Acceptance criteria reference: `specs/lint-config/spec.md` — NFR1
  - Testability notes: Time `npm run lint` on a cold run

- Requirement category: reliability
  - Requirement: CI lint job does not flake (no external service dependencies)
  - Design element: Decision 4 — lint job is pure npm + eslint, no network calls beyond `npm ci`
  - Acceptance criteria reference: `specs/ci-lint-gate/spec.md` — NFR1
  - Testability notes: Observe CI runs; lint job should be deterministic

## Risks / Trade-offs

- Risk/trade-off: Existing lint violations in the codebase cause the new CI gate to block all PRs immediately.
  - Impact: All open or future PRs blocked until violations are resolved.
  - Mitigation: Run `npm run lint` locally after implementing this change. Fix any violations in the same PR or create a tracked follow-up. Do not merge this change until `npm run lint` exits 0.

- Risk/trade-off: `eslint-config-next` v16 flat config export shape is unexpected.
  - Impact: `eslint.config.mjs` fails on startup.
  - Mitigation: Verify locally after `npm install`. If spread fails, adjust to match actual export shape.

## Rollback / Mitigation

- Rollback trigger: `npm run lint` fails after merge due to unexpected ESLint behavior, or CI lint job is flaky/broken.
- Rollback steps: Revert the commit touching `eslint.config.mjs`, `package.json`, and `build-test.yml`. Restore `.eslintrc.json` from git history if needed.
- Data migration considerations: None.
- Verification after rollback: Confirm `build-test.yml` CI passes without the lint job; confirm `npm run lint` behavior is restored.

## Operational Blocking Policy

- If CI checks fail: Investigate lint errors locally (`npm run lint`). Fix violations before re-pushing. Do not bypass with `--no-verify` or skip flags.
- If security checks fail: N/A for this change (no security-sensitive code paths touched).
- If required reviews are blocked/stale: Tag the PR reviewer directly. If stale >2 business days, escalate to repo maintainer.
- Escalation path and timeout: If the lint job itself is broken (not code violations), open a follow-up issue and temporarily remove `needs: [lint]` from test jobs to unblock CI, restoring it once fixed.

## Open Questions

- No open questions. All decisions confirmed during exploration session.
