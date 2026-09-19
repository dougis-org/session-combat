## Context

- Relevant architecture: two Jest configs — `jest.config.js` (unit, `testEnvironment: "jsdom"`, `preset: "ts-jest"`) and `jest.integration.config.js` (integration, `testEnvironment: "node"`, `preset: "ts-jest"`). Both transform `.ts`/`.tsx`/`.jsx` via an explicit `transform` block pointing at `ts-jest`. `package.json` scripts: `test:unit` (`jest --testPathPattern='tests/unit' --coverage`), `test:integration` (`jest --config=jest.integration.config.js`), `test:ci` (`test:integration -- --forceExit`).
- Dependencies touched: `jest`, `jest-environment-jsdom`, `@types/jest`, `@testing-library/jest-dom`, `@swc/jest` (removed), `ts-jest` (conditionally bumped).
- Interfaces/contracts touched: none at the application level. Surface touched is entirely `package.json` devDependencies + scripts, `package-lock.json`, and possibly the two Jest config files if Jest 30 requires a config-key rename.

## Goals / Non-Goals

### Goals

- Land Jest 30 line (`jest`, `jest-environment-jsdom`, `@types/jest`) and `@testing-library/jest-dom` 7.x with zero application code changes.
- Remove the dead `@swc/jest` dependency.
- Keep `ts-jest` as the sole transform, bumping it only if its declared peer range excludes Jest 30.
- Preserve current CI gate shape: `npm run test:unit`, `npm run test:integration`, `npm run lint`, `npm run typecheck` all green; lcov output unchanged in format/location so Codacy upload continues to work.

### Non-Goals

- Replacing `ts-jest` as the transform strategy.
- Adding Jest-level coverage thresholds.
- Adopting snapshot testing.
- Touching any other #594 dependency-modernization item (D-items other than D4).

## Decisions

### Decision 1: Remove `@swc/jest` rather than upgrade it

- Chosen: delete `@swc/jest` from `package.json` devDependencies.
- Alternatives considered: (a) upgrade it to a Jest-30-compatible version per the issue's original checklist; (b) leave it in place, untouched.
- Rationale: `npm ls @swc/jest` shows it as a direct devDependency with no consumers in `package-lock.json` (not a dependency or peerDependency of any other installed package), and neither `jest.config.js` nor `jest.integration.config.js` references it in any `transform` entry. It is confirmed dead weight. Upgrading dead weight (option a) does no useful work; leaving it (option b) keeps a misleading unused dependency in the tree that the next person has to re-investigate.
- Trade-offs: none identified — if some out-of-band tool (editor plugin, ad hoc script) depends on it, that would only surface outside this repo's own test/lint/typecheck commands, which is explicitly out of scope for this test-tooling change to chase down.

### Decision 2: Keep `ts-jest` as the transform; bump only if peer range requires it

- Chosen: attempt the Jest 30 bump first with `ts-jest@^29.4.12` unchanged; only bump `ts-jest` if `npm install`/`npm ci` reports a peer-dependency conflict against `jest@30`, or if tests fail to transform correctly under the new Jest version.
- Alternatives considered: pre-emptively bump `ts-jest` to its latest major alongside Jest; switch transform engines entirely (e.g., to `@swc/jest`, which is being removed here, or Jest's built-in `babel-jest`).
- Rationale: minimize the diff and the number of moving parts changing at once — this keeps the change auditable against the specific #639 scope (Jest 30 ecosystem) rather than compounding it with an unrelated transform-engine migration or a `ts-jest` major bump that may itself carry breaking changes.
- Trade-offs: if `ts-jest`'s currently-pinned range does turn out to need a bump, that becomes a second version change discovered mid-implementation rather than planned upfront — acceptable since it's flagged as a known risk in the proposal and only touches a devDependency, not application code.

### Decision 3: Config files change only if Jest 30 forces it

- Chosen: do not pre-emptively edit `jest.config.js` / `jest.integration.config.js`; only touch them if running the test suites against the bumped packages surfaces a removed/renamed config key Jest 30 no longer accepts.
- Alternatives considered: proactively audit and rewrite both configs against the full Jest 30 migration guide before running anything.
- Rationale: current review of both config files found no deprecated keys in active use (no `testPathPattern`/`moduleNameMapper` deprecated shape issues at the config level — the only confirmed CLI-flag rename is in the `test:unit` script, not the config files). Editing configs without a concrete failure to fix would be speculative and against the project's "don't add validation/handling for scenarios that can't happen" convention.
- Trade-offs: implementation may need an extra iteration if the test run does surface a config incompatibility; acceptable since verification happens before the change is considered done regardless.

## Proposal to Design Mapping

- Proposal element: Bump `jest`, `jest-environment-jsdom`, `@types/jest`, `@testing-library/jest-dom` to Jest 30-compatible versions.
  - Design decision: direct `package.json` version bumps (no decision needed beyond the version numbers themselves); covered implicitly by Decisions 2 and 3 governing what else must change alongside the bump.
  - Validation approach: `npm run test:unit`, `npm run test:integration` pass; `npm run lint && npm run typecheck` pass.
- Proposal element: Remove unused `@swc/jest`.
  - Design decision: Decision 1.
  - Validation approach: full test/lint/typecheck suite green with the dependency removed from `package.json` and `package-lock.json`.
- Proposal element: Rename `--testPathPattern` → `--testPathPatterns` in `test:unit`.
  - Design decision: direct script edit; Jest 30 requires the plural flag name.
  - Validation approach: `npm run test:unit` runs the intended `tests/unit` subset (spot-check the file count/list matches pre-upgrade behavior) and exits 0.
- Proposal element: Verify/bump `ts-jest` peer compatibility.
  - Design decision: Decision 2.
  - Validation approach: `npm install`/`npm ci` completes without peer-dependency errors; TypeScript test files transform and run correctly under both configs.
- Proposal element: Fix any jsdom-version-bump breakage in component tests.
  - Design decision: not a separate decision — handled as reactive fixes during verification, scoped to test files only (never application code), per the proposal's constraint.
  - Validation approach: `npm run test:unit` green with no `app/`/`lib/` diffs in the final change.

## Functional Requirements Mapping

- Requirement: `npm run test:unit` and `npm run test:integration` pass against the Jest 30 line.
  - Design element: Decisions 1-3 collectively (dependency set + transform + config).
  - Acceptance criteria reference: tasks.md verification step; proposal "Gate" criteria.
  - Testability notes: directly executable — run both commands, confirm exit code 0 and no new failing specs relative to the pre-change baseline.
- Requirement: `test:unit` script uses the Jest-30-valid `--testPathPatterns` flag.
  - Design element: direct script edit in `package.json`.
  - Acceptance criteria reference: tasks.md.
  - Testability notes: `npm run test:unit` must not error with an "unknown option" or fall back to running the full suite instead of the `tests/unit` subset.
- Requirement: `@swc/jest` no longer present in `package.json`/`package-lock.json`.
  - Design element: Decision 1.
  - Acceptance criteria reference: tasks.md.
  - Testability notes: `grep -n '"@swc/jest"' package.json package-lock.json` returns no matches; `npm ls @swc/jest` reports "not found" (a `npm ls` failure here is expected and correct, not a regression).

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: coverage collection (lcov output) continues to work unchanged for Codacy upload after the upgrade.
  - Design element: no config changes to `collectCoverageFrom`/coverage output paths planned (Decision 3 — configs untouched unless forced).
  - Acceptance criteria reference: tasks.md.
  - Testability notes: `coverage/lcov.info` is produced by `npm run test:unit` and by `npm run test:integration -- --coverage`, matching the paths CI already uploads from (`.github/workflows/build-test.yml`).
- Requirement category: operability
  - Requirement: no application runtime behavior changes as a side effect of this change.
  - Design element: scope is limited to `package.json`/`package-lock.json` and, conditionally, the two Jest config files — never `app/` or `lib/`.
  - Acceptance criteria reference: proposal "Scope: Out of Scope"; tasks.md.
  - Testability notes: `git diff --stat` against the base branch at completion should show no files under `app/` or `lib/`.

## Risks / Trade-offs

- Risk/trade-off: jsdom bump inside `jest-environment-jsdom@30` changes DOM API behavior used by existing component tests.
  - Impact: test failures requiring fixes to test files (mocks, polyfills, assertions).
  - Mitigation: fix at the test-file level only; if a fix would require touching application code, treat that as a scope-change trigger per Change Control and pause for re-approval rather than silently expanding scope.
- Risk/trade-off: `ts-jest` peer range excludes `jest@30`.
  - Impact: install-time failure or transform breakage.
  - Mitigation: Decision 2 — bump `ts-jest` reactively, scoped to the minimum version that restores compatibility.

## Rollback / Mitigation

- Rollback trigger: `npm run test:unit` or `npm run test:integration` cannot be made green within the change's scope (i.e., fixes would require application code changes, which is out of scope), or `npm run lint`/`npm run typecheck` cannot pass.
- Rollback steps: revert the `package.json`/`package-lock.json` (and any config file) changes on the change branch; no data migration exists so this is a pure dependency revert. `git checkout origin/main -- package.json package-lock.json jest.config.js jest.integration.config.js` from within the worktree, then reinstall.
- Data migration considerations: none — this is a devDependency-only change with no persisted data or schema involved.
- Verification after rollback: `npm ci && npm run test:unit && npm run test:integration` green against the reverted (pre-change) dependency set, confirming the repo returns to its known-good baseline.

## Operational Blocking Policy

- If CI checks fail: investigate the specific failing check (unit, integration, lint, typecheck) locally first; if the failure traces to the Jest 30 bump and a fix is possible within test-file-only scope, fix and re-push; if it would require application code changes, stop and flag for scope re-approval rather than expanding into app code under this change.
- If security checks fail: not expected — this change touches only devDependencies used for testing, not runtime/production dependencies. If a security scanner (e.g. Codacy) flags something, treat it as unrelated to this change's scope unless it's a direct transitive-dependency issue introduced by the bumped packages, in which case investigate and downgrade/pin as needed.
- If required reviews are blocked/stale: standard project process — ping reviewer, no special handling needed for this change given its narrow, mechanical nature.
- Escalation path and timeout: if verification (test/lint/typecheck) cannot be made green within the scope defined in the proposal, stop implementation and escalate to the requester with the specific blocking failure rather than force-merging or expanding scope unilaterally.

## Open Questions

- None blocking. Same resolution status as proposal.md's Open Questions section.
