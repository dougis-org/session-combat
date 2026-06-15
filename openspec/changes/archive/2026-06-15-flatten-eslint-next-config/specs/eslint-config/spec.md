## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED ESLint config loads without missing-package error

The system SHALL load `eslint.config.mjs` successfully in environments where only direct `devDependencies` are available (e.g., Codacy's sandboxed ESLint container).

#### Scenario: Config loads in sandboxed environment

- **Given** an environment with only the project's direct `devDependencies` available in `node_modules`
- **When** ESLint initialises and loads `eslint.config.mjs`
- **Then** ESLint exits with code 0 (or a lint-finding code, not a config-load error)

#### Scenario: No missing-package error in local environment

- **Given** a developer's local checkout with all deps installed
- **When** `npx eslint .` is run
- **Then** the output contains no `Cannot find package` or `MODULE_NOT_FOUND` errors

---

## MODIFIED Requirements

### Requirement: MODIFIED ESLint config produces identical resolved rules

The system SHALL resolve the same set of rules, severity levels, plugins, globals, parser, and file patterns as before the change.

#### Scenario: Resolved config matches pre-change baseline for a TS file

- **Given** `eslint.config.mjs` has been rewritten with direct imports
- **When** `npx eslint --print-config src/app/page.tsx` is run before and after the change
- **Then** the printed config diff shows no changes to `rules`, `plugins`, `languageOptions`, or `settings`

#### Scenario: Previously ignored paths remain ignored

- **Given** `eslint.config.mjs` has been rewritten with merged ignores
- **When** `npx eslint coverage/` or `npx eslint .next/` or `npx eslint docs/` is run
- **Then** ESLint reports no files matched / exits with no findings for those paths

#### Scenario: `no-restricted-imports` rule preserved for test files

- **Given** `eslint.config.mjs` has been rewritten
- **When** a file in `tests/` imports from `@jest/globals`
- **Then** ESLint reports an error for that import (rule is still active)

---

## REMOVED Requirements

### Requirement: REMOVED Implicit dependency on `eslint-config-next` for ESLint config resolution

Reason for removal: The change replaces the `eslint-config-next` import with direct plugin imports. `eslint-config-next` no longer needs to be a direct `devDependency` for ESLint to work; it remains a transitive peer dep of `next` but is not imported by `eslint.config.mjs`.

---

## Traceability

- Proposal element "Replace eslint-config-next import" → Requirement: MODIFIED (identical resolved rules)
- Proposal element "Promote seven plugins to direct devDependencies" → Requirement: ADDED (config loads without missing-package error)
- Proposal element "Remove eslint-config-next from devDependencies" → Requirement: REMOVED
- Design Decision 1 (inline flat config) → ADDED scenario: Config loads in sandboxed environment
- Design Decision 2 (pin exact versions) → MODIFIED scenario: Resolved config matches pre-change baseline
- Design Decision 3 (merge ignores) → MODIFIED scenario: Previously ignored paths remain ignored
- ADDED requirement → Task: Rewrite `eslint.config.mjs`
- MODIFIED requirement → Task: Add direct devDependencies to `package.json`
- REMOVED requirement → Task: Remove `eslint-config-next` from `package.json`

---

## Non-Functional Acceptance Criteria

### Requirement: Operability

#### Scenario: `npm install` succeeds after dependency changes

- **Given** `package.json` has been updated to add seven direct deps and remove `eslint-config-next`
- **When** `npm install` is run in a clean checkout
- **Then** `npm install` exits with code 0 and no peer-dependency warnings related to the changed packages

### Requirement: Reliability

#### Scenario: ESLint run produces no new findings

- **Given** the rewritten `eslint.config.mjs` and updated `package.json`
- **When** `npx eslint .` is run on the full project
- **Then** the number and identity of lint findings is identical to a baseline run before the change (no new errors or warnings introduced by the config rewrite itself)

### Requirement: Security

See functional scenarios above — no access-control or token-leakage concerns apply to an ESLint config change.
