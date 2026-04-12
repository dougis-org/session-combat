## GitHub Issues

- dougis-org/session-combat#130

## Why

- Problem statement: The repo's lint tooling is broken. `npm run lint` cannot run successfully locally or in CI. ESLint 9 (flat config) is installed but the project has an outdated legacy config (`.eslintrc.json`) and a lint script that still passes the deprecated `--ext` flag. There is no CI lint gate, meaning lint regressions can be merged silently.
- Why now: A lint failure was discovered while validating the `saveParty()` fix for #125. Every PR since then has been merged without lint coverage.
- Business/user impact: Contributors cannot validate changes before pushing. Lint regressions merge undetected. CI gives a false confidence signal.

## Problem Space

- Current behavior: `npm run lint` invokes `eslint . --ext .js,.jsx,.ts,.tsx`, but `eslint` is not on PATH (not in node_modules/.bin without install, and `--ext` is unsupported in ESLint 9 flat config mode). Both `.eslintrc.json` (legacy) and `eslint.config.mjs` (flat) coexist, causing confusion. No CI job runs lint.
- Desired behavior: `npm run lint` runs cleanly against all project source and test files, excluding generated/build output. A dedicated lint CI job runs before build and test jobs, failing fast on lint errors.
- Constraints: ESLint 9 flat config is already in use (`eslint.config.mjs` exists). `eslint-config-next` v16 is the rule source. Must not lint `node_modules/`, `.next/`, `coverage*/`, or `playwright-report/`.
- Assumptions: `eslint-config-next/core-web-vitals` v16 exports a flat-config-compatible array. TypeScript support is bundled via `eslint-config-next` (no separate `@typescript-eslint` setup needed).
- Edge cases considered: Coexisting `.eslintrc.json` and `eslint.config.mjs` — ESLint 9 ignores `.eslintrc.*` when a flat config is present, but the file is dead weight and should be removed. The `--ext` flag is silently ignored in flat config mode; dropping it is safe because ESLint 9 defaults to JS/TS/JSX/TSX file handling.

## Scope

### In Scope

- Fix `eslint.config.mjs` to spread `nextCoreWebVitals` into an array and add explicit `ignores` for build/generated output directories
- Remove `--ext` flag from the `lint` script in `package.json`
- Delete `.eslintrc.json` (legacy config, dead with flat config)
- Add a `lint` CI job to `build-test.yml` that runs before `unit-tests`, `integration-tests`, and `regression-tests`
- Wire `needs: [lint]` onto all three existing test jobs so lint failures block them

### Out of Scope

- Adding new lint rules beyond what `eslint-config-next/core-web-vitals` provides
- Fixing any existing lint violations in the codebase (tracked separately)
- Changing test infrastructure or coverage reporting
- Updating ESLint or `eslint-config-next` versions

## What Changes

- `eslint.config.mjs` — spread flat config array, add ignores
- `package.json` — remove `--ext` flag from lint script
- `.eslintrc.json` — deleted
- `.github/workflows/build-test.yml` — new `lint` job; `needs: [lint]` on test jobs

## Risks

- Risk: `eslint-config-next/core-web-vitals` v16 may not export a flat-config-compatible array, causing `...spread` to fail.
  - Impact: Lint would error on startup rather than lint anything.
  - Mitigation: Verify after `npm install` by running `eslint .` locally. If the spread fails, fall back to the direct export pattern already in place.
- Risk: Existing codebase has lint violations that will now fail the new CI gate.
  - Impact: All PRs blocked until violations are fixed.
  - Mitigation: Run lint locally after fix and address any violations before merging this change, or scope a follow-up task.

## Open Questions

No unresolved ambiguity. All design decisions were confirmed during exploration:
- Lint covers all source and test files, excludes generated/module output. ✓
- TypeScript plugin support via `eslint-config-next` is acceptable. ✓
- Lint is a standalone upstream CI job gating all test jobs (fail fast). ✓

## Non-Goals

- Introducing stricter lint rules (e.g., `@typescript-eslint/strict`, import ordering)
- Auto-fixing lint violations as part of this change
- Adding a pre-commit lint hook (husky already present but out of scope here)

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
