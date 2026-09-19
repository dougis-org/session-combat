## GitHub Issues

- #639

## Why

- Problem statement: The project pins Jest 29 (`jest`, `jest-environment-jsdom`, `@types/jest`) and `@testing-library/jest-dom` 6.x. Issue #639 (part of the broader dependency-modernization effort tracked in #594) calls for moving the unit-test tooling to the Jest 30 line, which carries jsdom, snapshot-format, and CLI-flag changes.
- Why now: this is the last outstanding Jest-line dependency debt item under #594; deferring it accumulates further drift between the pinned major and upstream security/bugfix releases.
- Business/user impact: none directly — this is test-tooling only, no application runtime code changes. Impact is developer-facing (CI reliability, test run behavior) and indirect (keeping CI dependencies patched).

## Problem Space

- Current behavior: `jest.config.js` and `jest.integration.config.js` both use `preset: "ts-jest"` with an explicit `transform` block for `.tsx?`/`.jsx?` files — `ts-jest` is the only transform actually wired into either Jest run. `package.json` also lists `@swc/jest@^0.2.29` as a devDependency, but nothing in `package-lock.json` lists it as a dependency or peerDependency of any other package, and no config file references it — it resolves as an unused leaf (`npm ls @swc/jest` shows it directly under the root with no consumers). `test:unit` invokes `jest --testPathPattern='tests/unit' --coverage`. Neither config sets `coverageThreshold`; coverage is collected as lcov and uploaded to Codacy, which enforces its own coverage-diff gate in CI (`check-codacy-coverage` in `.github/workflows/build-test.yml`) — Jest itself enforces nothing. A repo-wide search for `*.snap` (excluding `node_modules`, `.worktrees`, `.next`) finds zero snapshot files.
- Desired behavior: `jest`, `jest-environment-jsdom`, `@types/jest` move to the 30.x line and `@testing-library/jest-dom` moves to 7.x, with `npm run test:unit` and `npm run test:integration` green, `npm run lint && npm run typecheck` clean, and no functional/application-code changes.
- Constraints: this is a test-tooling-only change — no `app/`, `lib/`, or runtime code should change as a result. The gate is `npm run test:unit` + `npm run test:integration` green, coverage collection still producing lcov output Codacy can ingest, and `npm run lint && npm run typecheck` passing.
- Assumptions: `ts-jest@^29.4.12` (or a version bump if required) is compatible with Jest 30's peer range; jsdom's version bump inside `jest-environment-jsdom@30` does not break existing component tests reliant on jsdom-specific DOM API behavior; removing `@swc/jest` has no build/test effect since it is unreferenced.
- Edge cases considered: CI passes `--coverage --forceExit` to `test:integration` (`build-test.yml`) — confirmed this is a CLI flag, not a config-driven threshold, so it is unaffected by the config-key renames Jest 30 introduces elsewhere. `test:ci` (`npm run test:integration -- --forceExit`) is a separate script from CI's own invocation and should be checked for consistency but is out of scope to change.

## Scope

### In Scope

- Bump `jest` 29.7.0 → 30.x, `jest-environment-jsdom` 29 → 30, `@types/jest` 29 → 30, `@testing-library/jest-dom` 6.9.1 → 7.x in `package.json`.
- Remove the unused `@swc/jest` devDependency.
- Rename the `--testPathPattern` flag to `--testPathPatterns` in the `test:unit` script (Jest 30 renames this CLI flag).
- Verify `ts-jest@^29.4.12` against Jest 30's peer dependency range; bump `ts-jest` if required for compatibility.
- Run and fix any breakage in `npm run test:unit`, `npm run test:integration`, `npm run lint`, `npm run typecheck` surfaced by the jsdom version bump or other Jest 30 behavior changes.
- Confirm coverage output (lcov) still generates correctly for Codacy upload.

### Out of Scope

- Any application code change in `app/` or `lib/` (this change is test-tooling only).
- Adding Jest `coverageThreshold` config (none exists today; not introducing one here).
- Snapshot-format migration (no `.snap` files exist in the repo; not applicable).
- Migrating the transform strategy away from `ts-jest` (e.g., to `@swc/jest` or Jest's built-in transform) — `@swc/jest` is being removed as dead weight, not adopted.
- Changes to `jest.integration.config.js` transform/config structure beyond what Jest 30 requires for compatibility.
- The rest of the #594 dependency-modernization effort (other "D" items) beyond D4.

## What Changes

- `package.json`: `jest`, `jest-environment-jsdom`, `@types/jest`, `@testing-library/jest-dom` bumped to Jest 30-compatible versions; `@swc/jest` removed; `test:unit` script flag renamed.
- Possibly `ts-jest` bumped if its current pinned range doesn't support Jest 30 as a peer.
- Possibly `jest.config.js` / `jest.integration.config.js` updated if Jest 30 renames/removes any config options currently in use (to be confirmed during implementation — current review found no deprecated keys in use today, but this must be re-verified against the actual Jest 30 changelog at implementation time).
- `package-lock.json` regenerated.

## Risks

- Risk: `jest-environment-jsdom@30`'s underlying jsdom version bump changes DOM API behavior in a way that breaks existing component tests.
  - Impact: test failures in `tests/unit` component specs, blocking the gate.
  - Mitigation: run `npm run test:unit` after the bump and fix failing assertions/mocks case by case; this is expected exploratory work per the issue's own checklist.
- Risk: `ts-jest@^29.4.12`'s peer range doesn't declare support for `jest@30`, causing an install-time peer conflict or runtime transform failure.
  - Impact: `npm ci`/`npm install` warnings or errors, or tests failing to transform TypeScript.
  - Mitigation: check `ts-jest`'s Jest 30 support at implementation time; bump `ts-jest` to a compatible version if needed (this was not in the original issue's dependency list but is a direct consequence of keeping `ts-jest` as the sole transform).
- Risk: removing `@swc/jest` turns out to be relied on by tooling not surfaced by `npm ls` / config grep (e.g., an editor extension or a script invoked outside the repo's own test commands).
  - Impact: low — worst case, something outside `npm run test:unit`/`test:integration`/CI breaks.
  - Mitigation: `npm run test:unit && npm run test:integration && npm run lint && npm run typecheck` all pass with `@swc/jest` removed, which covers every test-execution path in this repo's own scripts and CI.

## Open Questions

- Question: none blocking. All ambiguity from the original issue (#639's claim that `@swc/jest` is "the actual unit-test transform," and its snapshot-churn / coverage-threshold checklist items) was resolved during the preceding explore session by inspecting the actual `jest.config.js`, `jest.integration.config.js`, `package-lock.json`, and repo contents: `@swc/jest` is unused, no snapshots exist, and no Jest-level coverage threshold exists.
  - Needed from: n/a
  - Blocker for apply: no

## Non-Goals

- Switching the test transform from `ts-jest` to a faster alternative (e.g. `@swc/jest`, Vitest). Out of scope; this change only modernizes the existing `ts-jest`-based setup.
- Introducing coverage thresholds enforced by Jest itself.
- Any snapshot-testing adoption.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
