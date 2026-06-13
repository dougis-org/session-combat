## Context

- Relevant architecture: Test infrastructure (Node.js, Jest, Testcontainers).
- Dependencies: `package.json` devDependencies (`@testcontainers/mongodb`, `ts-jest`).
- Interfaces/contracts touched: `MongoDBContainer` API in test setup files.

## Goals / Non-Goals

### Goals

- Clean `npm audit --audit-level=high` output.
- Upgrade outdated test dependencies safely without refactoring tests.

### Non-Goals

- Upgrade production dependencies.
- Upgrade dependencies unrelated to the test CVEs.

## Decisions

### Decision 1: Upgrade to testcontainers v12

- Chosen: Upgrade `@testcontainers/mongodb` from `10.x` to `^12.0.1`.
- Alternatives considered: `npm audit fix` (impossible due to semver constraint in v10), `npm update` (leaves `undici` unpatched), `npm overrides` (brittle).
- Rationale: v12 officially updates `undici`, `tmp`, and `dockerode` which contain the underlying vulnerabilities causing the `npm audit` failures.
- Trade-offs: Upgrading a major version introduces minor risk of regressions, but the limited API usage (`MongoDBContainer().withExposedPorts(27017).start()`) mitigates the impact.

### Decision 2: Upgrade to ts-jest v29.4.11

- Chosen: Upgrade `ts-jest` to `^29.4.11`.
- Alternatives considered: Leave as-is since the handlebars issue was resolved silently.
- Rationale: Since the package maintainers bumped the underlying `handlebars` dependency, keeping `ts-jest` fully updated within the 29.4.x line ensures we have their officially patched dependency tree.
- Trade-offs: Minimal risk since it's a minor/patch level bump.

## Proposal to Design Mapping

- Proposal element: Upgrading `@testcontainers/mongodb` to `^12.0.1` in `devDependencies`.
  - Design decision: Upgrade to testcontainers v12
  - Validation approach: Run local test suite using testcontainers to verify functional behavior.

- Proposal element: Re-running `npm install` and verifying audit results.
  - Design decision: Upgrade to testcontainers v12 and ts-jest v29.4.11
  - Validation approach: Run `npm audit --audit-level=high` post-install.

## Functional Requirements Mapping

- Requirement: Packages must be upgraded without breaking existing test setup.
  - Design element: Upgrade to testcontainers v12 and ts-jest v29.4.11
  - Acceptance criteria reference: Specs tests passing AC.
  - Testability notes: Existing integration and E2E tests using MongoDBContainer must pass without modification.

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: Zero HIGH or CRITICAL vulnerabilities in the dependency tree.
  - Design element: Dependency upgrades
  - Acceptance criteria reference: Specs audit AC.
  - Testability notes: `npm audit --audit-level=high` must exit with code 0.

## Risks / Trade-offs

- Risk/trade-off: Testcontainer API regressions or runtime behavior changes in v12.
  - Impact: Moderate (integration tests failing locally or in CI).
  - Mitigation: Run `npm run test:ci` immediately after install. Review `tests/integration/global.setup.ts` and `tests/e2e/global.setup.ts` if needed.

## Rollback / Mitigation

- Rollback trigger: Unresolvable test failures related to `MongoDBContainer` that require out-of-scope refactoring.
- Rollback steps: Revert `package.json` and `package-lock.json` changes using git.
- Data migration considerations: N/A.
- Verification after rollback: `npm ci && npm run test:ci` passes.

## Operational Blocking Policy

- If CI checks fail: Diagnose issue. If unfixable within scope, initiate rollback and document findings.
- If security checks fail: Re-evaluate audit tree to ensure no remaining vulnerabilities exist; potentially add an `overrides` for npm deduplication artifacts if they are false positives.
- If required reviews are blocked/stale: Ping reviewers after 24h.
- Escalation path and timeout: Revert PR if it blocks other critical merges for >2 hours.

## Open Questions

- None.
