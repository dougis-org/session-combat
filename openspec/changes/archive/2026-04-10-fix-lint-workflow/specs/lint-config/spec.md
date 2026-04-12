## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED FR1 — Lint script runs cleanly with ESLint 9 flat config

The system SHALL execute `npm run lint` from the repo root without error when no lint violations exist in the codebase.

#### Scenario: Clean run on a violation-free codebase

- **Given** `npm ci` has been run and `eslint.config.mjs` is the sole ESLint config file
- **When** a developer runs `npm run lint`
- **Then** ESLint exits 0 with no configuration errors or deprecation warnings about unsupported flags

#### Scenario: ESLint flat config is loaded (not legacy config)

- **Given** both `.eslintrc.json` has been deleted and `eslint.config.mjs` is present
- **When** `npm run lint` is executed
- **Then** ESLint uses the flat config and does not emit a warning about legacy config files being ignored

---

### Requirement: ADDED FR2 — Lint covers source and test files, excludes generated output

The system SHALL lint all `.js`, `.jsx`, `.ts`, and `.tsx` files in the project source and test directories, and SHALL NOT lint files in `node_modules/`, `.next/`, `coverage/`, `coverage-e2e/`, or `playwright-report/`.

#### Scenario: Test files are included in lint scope

- **Given** a lint violation is introduced into a file under `tests/`
- **When** `npm run lint` is executed
- **Then** ESLint reports the violation in that test file

#### Scenario: Build output is excluded from lint scope

- **Given** the `.next/` directory exists from a prior build
- **When** `npm run lint` is executed
- **Then** ESLint does not report errors for files under `.next/` and does not attempt to parse generated output

---

### Requirement: ADDED NFR1 — Lint completes in a reasonable time

The system SHALL complete a full lint run in under 60 seconds on a standard developer machine.

#### Scenario: Lint performance on clean checkout

- **Given** `npm ci` has been run and all source files are present
- **When** `npm run lint` is executed
- **Then** the process exits within 60 seconds

## MODIFIED Requirements

### Requirement: MODIFIED — Lint script command

The `lint` npm script SHALL invoke `eslint .` without the `--ext` flag.

#### Scenario: Lint script does not pass deprecated flags

- **Given** the `package.json` lint script reads `eslint .`
- **When** `npm run lint` is executed
- **Then** ESLint does not emit an error or warning about an unrecognized `--ext` option

## REMOVED Requirements

### Requirement: REMOVED — Legacy `.eslintrc.json` config

The `.eslintrc.json` file SHALL NOT exist in the repository.

Reason for removal: ESLint 9 flat config (`eslint.config.mjs`) supersedes the legacy format. Having both files creates confusion. ESLint 9 silently ignores `.eslintrc.*` when a flat config is present, making the legacy file dead weight.

## Traceability

- Proposal element "Fix `eslint.config.mjs`" -> FR1, FR2
- Proposal element "Remove `--ext` from lint script" -> MODIFIED lint script requirement
- Proposal element "Delete `.eslintrc.json`" -> REMOVED legacy config requirement
- Design Decision 1 (spread + ignores) -> FR1, FR2
- Design Decision 2 (no `--ext`) -> MODIFIED lint script requirement
- Design Decision 3 (delete `.eslintrc.json`) -> REMOVED legacy config requirement
- FR1 -> Task: Fix eslint.config.mjs
- FR2 -> Task: Fix eslint.config.mjs (ignores block)
- MODIFIED -> Task: Update package.json lint script
- REMOVED -> Task: Delete .eslintrc.json

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Lint completes within time budget

- **Given** a clean `npm ci` install with all source and test files present
- **When** `npm run lint` is run
- **Then** the process exits within 60 seconds

### Requirement: Reliability

#### Scenario: Lint is deterministic across runs

- **Given** no source files have changed
- **When** `npm run lint` is run twice consecutively
- **Then** both runs produce identical output and exit with the same code
