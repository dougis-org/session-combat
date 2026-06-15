## Context

- Relevant architecture: `eslint.config.mjs` is the single ESLint flat-config entry point for the project. Codacy's ESLint9 analysis tool mounts project source files at `/src` and runs its own sandboxed Node environment; it does not have access to the project's `node_modules` tree unless packages are listed as direct dependencies that Codacy can resolve.
- Dependencies: `eslint-config-next@16.2.6` is currently the only direct ESLint dependency in `devDependencies`. It wraps seven underlying plugins transitively. All seven plugins are already present in `node_modules`.
- Interfaces/contracts touched: `eslint.config.mjs` (ESLint config entry point), `package.json` (devDependencies).

## Goals / Non-Goals

### Goals

- Eliminate the `eslint-config-next` import from `eslint.config.mjs` so Codacy's container can run ESLint without missing-package errors
- Preserve the exact same rule set, severity levels, plugins, globals, parser, and ignores as the current config produces
- Make all ESLint plugin dependencies explicit in `package.json`

### Non-Goals

- Changing any ESLint rule or severity
- Upgrading plugin versions beyond what is already installed
- Modifying Codacy configuration files or `.codacy/` directory
- Adding TypeScript project-aware linting

## Decisions

### Decision 1: Inline the flat config rather than using a Codacy-specific shim

- Chosen: Rewrite `eslint.config.mjs` with direct plugin imports expanding the full config inline
- Alternatives considered: (a) Add a separate `.codacy/eslint.config.mjs` with no Next.js deps — keeps main config intact but creates drift; (b) Configure Codacy to skip ESLint — removes analysis entirely
- Rationale: A single source of truth for ESLint config is correct. The inlined config runs identically locally, in CI, and in Codacy.
- Trade-offs: The `eslint.config.mjs` grows from 33 lines to ~80 lines; this is acceptable one-time verbosity for a permanent fix.

### Decision 2: Pin newly direct deps to currently installed versions

- Chosen: Pin each of the seven plugins to the exact version already in `node_modules` (see version table below)
- Alternatives considered: Use caret ranges (`^`) and let npm resolve — risks pulling in different versions than what `eslint-config-next` uses today
- Rationale: Zero behaviour change is the explicit constraint. Pinning guarantees the same rule implementations.
- Trade-offs: Upgrading these plugins in the future requires a deliberate version bump; this is the desired outcome.

**Version table (pin targets):**

| Package | Version |
|---|---|
| `@next/eslint-plugin-next` | `16.2.6` |
| `eslint-plugin-react` | `7.37.5` |
| `eslint-plugin-react-hooks` | `7.0.1` |
| `typescript-eslint` | `8.57.0` |
| `eslint-plugin-import` | `2.32.0` |
| `eslint-plugin-jsx-a11y` | `6.10.2` |
| `globals` | `16.4.0` |

Note: `globals` has two installed copies — v14.0.0 at the top level and v16.4.0 nested under `eslint-config-next/node_modules/`. The inlined config must use v16.4.0 (matching what `eslint-config-next` actually used), so `globals` is pinned to `16.4.0` as a new direct dep.

### Decision 3: Merge ignores from the unpacked config and existing `eslint.config.mjs`

- Chosen: Combine the ignores from `eslint-config-next`'s built-in ignores (`.next/**`, `out/**`, `build/**`, `next-env.d.ts`) with the project-specific ignores already in `eslint.config.mjs` (`coverage/**`, `coverage-e2e/**`, `playwright-report/**`, `.codacy/**`, `docs/**`) into one ignores block
- Alternatives considered: Keep them as two separate config objects — functionally equivalent but slightly more verbose
- Rationale: A single ignores block is easier to audit
- Trade-offs: None

## Proposal to Design Mapping

- Proposal element: Replace `eslint-config-next/core-web-vitals` import
  - Design decision: Decision 1 (inline flat config)
  - Validation approach: Run `npx eslint --print-config src/app/page.tsx` before and after; diff must show no rule changes

- Proposal element: Promote seven plugins to direct devDependencies
  - Design decision: Decision 2 (pin to exact installed versions)
  - Validation approach: `npm ls @next/eslint-plugin-next eslint-plugin-react` shows single resolved version matching pinned value

- Proposal element: `globals` version split
  - Design decision: Decision 2 (pin to v16.4.0)
  - Validation approach: `node -e "require('globals')"` resolves v16 after install

- Proposal element: Ignores consolidation
  - Design decision: Decision 3 (merge into one block)
  - Validation approach: `npx eslint coverage/` returns "no files matched" (still ignored)

## Functional Requirements Mapping

- Requirement: ESLint config must load without errors in Codacy's sandboxed container
  - Design element: Direct plugin imports (Decision 1)
  - Acceptance criteria reference: specs/eslint-config.md — "config loads without missing-package error"
  - Testability notes: Verify locally with `npx eslint .`; Codacy result verified after merge

- Requirement: Rule set must be identical before and after
  - Design element: Exact inline expansion of `eslint-config-next` dist output (Decision 1)
  - Acceptance criteria reference: specs/eslint-config.md — "resolved rules match pre-change baseline"
  - Testability notes: `npx eslint --print-config` diff on a representative file

- Requirement: All ignores preserved
  - Design element: Decision 3 (merged ignores block)
  - Acceptance criteria reference: specs/eslint-config.md — "previously ignored paths remain ignored"
  - Testability notes: Run eslint against `coverage/`, `.next/`, `docs/` — all must produce no findings

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: `npm install` must complete without version conflicts after dep changes
  - Design element: Decision 2 (pin exact versions)
  - Acceptance criteria reference: specs/eslint-config.md — "`npm install` exits 0"
  - Testability notes: Run `npm install` in a clean checkout after `package.json` changes

- Requirement category: reliability
  - Requirement: Local ESLint run must produce same findings as before
  - Design element: Decision 1 + Decision 2
  - Acceptance criteria reference: specs/eslint-config.md — "no new lint errors introduced"
  - Testability notes: `npx eslint .` output diff before/after

## Risks / Trade-offs

- Risk/trade-off: Inlined config diverges from future `eslint-config-next` updates
  - Impact: Project misses upstream rule improvements automatically
  - Mitigation: This is an accepted trade-off; the project can periodically review `eslint-config-next` changelogs and update manually

- Risk/trade-off: `globals` v16 introduces API differences vs v14
  - Impact: `globals.browser` / `globals.node` could have different key sets, changing available globals
  - Mitigation: Both v14 and v16 expose `browser` and `node` with the same shape; confirmed via inspection

## Rollback / Mitigation

- Rollback trigger: Codacy ESLint still fails after merge, OR `npx eslint .` produces new errors
- Rollback steps: Revert `eslint.config.mjs` and `package.json` to pre-change state; run `npm install`
- Data migration considerations: None
- Verification after rollback: `npx eslint .` exits with same code as before the change

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix lint errors or rule delta before proceeding.
- If security checks fail: Do not merge. Investigate whether a newly direct dep introduced an advisory.
- If required reviews are blocked/stale: Ping reviewer after 24 hours; escalate to maintainer after 48 hours.
- Escalation path and timeout: If Codacy still fails after merge despite correct deps, fall back to a `.codacy/eslint.config.mjs` shim (out of scope for this change but known fallback).

## Open Questions

No open questions. All design decisions are fully resolved based on inspection of the installed packages.
