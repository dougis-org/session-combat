## GitHub Issues

- #423

## Why

- Problem statement: Codacy's ESLint9 CI container runs sandboxed without the project's `node_modules`, so `eslint-config-next` is not available at `/src`. The container exits with code 1 before any linting occurs, meaning ESLint analysis is completely absent from Codacy reports.
- Why now: Issue #423 was filed 2026-06-14. Codacy ESLint analysis has been silently broken; fixing it restores visibility into lint issues in CI.
- Business/user impact: Without ESLint analysis in Codacy, lint regressions go undetected in code review. Fixing this restores the full quality gate.

## Problem Space

- Current behavior: `eslint.config.mjs` imports `eslint-config-next/core-web-vitals`. Codacy mounts only `/src` (project files) into its ESLint container. The container has its own `node_modules` but not `eslint-config-next`, so the import fails immediately.
- Desired behavior: `eslint.config.mjs` imports only packages that are direct `devDependencies` of the project. Codacy's container can resolve them through the project's own dependency graph.
- Constraints: No rule changes — same plugins, same rules, same severity levels, same ignores. The refactor must be a pure structural change.
- Assumptions: Codacy resolves packages from the project's `node_modules` when they are listed as direct (not transitive) dependencies. The seven underlying plugins are already present in `node_modules` transitively and can be promoted to direct deps without version conflicts.
- Edge cases considered: The `next/typescript` config block uses `typescript-eslint` parser; this must be preserved. The babel fallback parser options in `languageOptions` are part of the base config and must be kept. Existing ignores in `eslint.config.mjs` (`.codacy/**`, `coverage/**`, etc.) must be merged correctly with the ignores baked into the unpacked config.

## Scope

### In Scope

- Rewrite `eslint.config.mjs` to replace the `eslint-config-next/core-web-vitals` import with direct imports of the seven underlying plugins
- Add the seven plugins as explicit `devDependencies` in `package.json` (pinned to versions already in `node_modules`)
- Remove `eslint-config-next` from `devDependencies` (it remains a transitive peer dep of `next`)

### Out of Scope

- Changing any ESLint rules or their severity
- Upgrading any ESLint plugin versions
- Adding new ESLint plugins or rules
- Fixing any pre-existing lint warnings or errors
- Changes to CI pipelines, Codacy configuration files, or GitHub Actions

## What Changes

- `eslint.config.mjs`: Remove `eslint-config-next/core-web-vitals` import; add direct imports of `@next/eslint-plugin-next`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `typescript-eslint`, `eslint-plugin-import`, `eslint-plugin-jsx-a11y`, `globals`; expand inline flat config matching current behavior exactly
- `package.json`: Add seven plugins to `devDependencies`; remove `eslint-config-next` from `devDependencies`

## Risks

- Risk: Subtle rule delta between the inlined config and the original `eslint-config-next` output
  - Impact: Lint errors appear or disappear unexpectedly in CI
  - Mitigation: Run `eslint .` locally before and after and diff the output; confirm zero rule-level difference

- Risk: Version mismatch when pinning newly direct deps
  - Impact: `npm install` resolves different versions than currently in `node_modules`
  - Mitigation: Pin to exact versions already installed (inspected from `node_modules/*/package.json`)

- Risk: Codacy still cannot resolve packages even when direct deps
  - Impact: Issue #423 remains open
  - Mitigation: This is the documented Codacy fix pattern; if it fails, the fallback is a `.codacy/eslint.config.mjs` shim with no Next.js-specific rules

## Open Questions

No unresolved ambiguity exists. The seven plugin versions are known from the current lockfile, the rule set is fully enumerated from the compiled `dist/` files, and the Codacy failure mode is confirmed.

## Non-Goals

- Upgrading to a newer version of `eslint-config-next` or any of its plugins
- Adding TypeScript project-aware linting (`parserOptions.project`)
- Modifying Codacy configuration or suppressing Codacy findings

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
