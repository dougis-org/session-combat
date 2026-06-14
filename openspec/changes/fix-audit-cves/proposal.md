## GitHub Issues

- #241

## Why

- Problem statement: `npm audit` reports HIGH vulnerabilities from test dependencies (`testcontainers@10.x` and historically `ts-jest` templates).
- Why now: Fixes are now available in upstream packages (`testcontainers` v12 and `ts-jest` v29.4.11).
- Business/user impact: Resolves security audit failures, ensuring a clean CI security baseline and avoiding alert fatigue.

## Problem Space

- Current behavior: `npm audit --audit-level=high` fails due to vulnerable sub-dependencies like `undici`.
- Desired behavior: `npm audit --audit-level=high` exits with code 0.
- Constraints: Cannot be patched in-place (e.g. via `npm audit fix`) due to semver ranges; requires a major version bump of `testcontainers`.
- Assumptions: The API surface of `@testcontainers/mongodb` used in tests is unaffected by the v10 -> v12 upgrade.
- Edge cases considered: npm might leave a deduplication artifact of `undici` after install, which might require an `overrides` entry in `package.json`.

## Scope

### In Scope

- Upgrading `@testcontainers/mongodb` and `@testcontainers/postgresql` to `^12.0.1` in `devDependencies`.
- Upgrading `ts-jest` to `^29.4.11` in `devDependencies`.
- Re-running `npm install` and verifying audit results.

### Out of Scope

- Upgrading any other unrelated packages.
- Modifying production (`dependencies`) packages.

## What Changes

- `package.json` devDependencies versions for `@testcontainers/mongodb` and `ts-jest`.
- `package-lock.json` generation reflecting the new tree.

## Risks

- Risk: Major version bump of `testcontainers` introduces test-runner incompatibilities.
  - Impact: Moderate (blocks local testing / CI pipelines).
  - Mitigation: The utilized API footprint (`MongoDBContainer().withExposedPorts(27017).start()`) is tiny and unchanged in v12. Run local tests immediately to confirm.

## Open Questions

- Question: None identified. The issue is well defined and a dry-run was already successful.
  - Needed from: N/A
  - Blocker for apply: no

## Non-Goals

- Refactoring the entire test container strategy.
- Fixing CVEs completely unrelated to the `testcontainers` and `ts-jest` trees.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
