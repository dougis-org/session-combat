## ADDED Requirements

This document details *changes* to requirements and is additive to the `../../changes/archive/2026-06-13-issue-405-doc-only-ci-skip/design.md` document, not a replacement.

### Requirement: ADDED Docs-only change detection

The system SHALL detect when all changed files in a push or pull-request match `**/*.md` and expose a `docs_only` output for downstream job conditions.

#### Scenario: All changed files are markdown

- **Given** a pull request or push to `main` where every changed file has a `.md` extension
- **When** the `check-changes` job runs
- **Then** the job outputs `docs_only=true`

#### Scenario: At least one non-markdown file changed

- **Given** a pull request or push to `main` where at least one changed file does not have a `.md` extension
- **When** the `check-changes` job runs
- **Then** the job outputs `docs_only=false`

#### Scenario: Mixed PR (markdown + code files)

- **Given** a pull request containing both `.md` files and `.ts`/`.tsx`/`.js` source files
- **When** the `check-changes` job runs
- **Then** the job outputs `docs_only=false` and the full test suite runs

---

### Requirement: ADDED Lint and build always run

The system SHALL run the `lint` and `build` jobs on every trigger, regardless of `docs_only` value.

#### Scenario: Docs-only PR runs lint and build

- **Given** a pull request where `docs_only=true`
- **When** the workflow executes
- **Then** the `lint` job completes successfully and the `build` job completes successfully

#### Scenario: Build failure caught on docs-only PR

- **Given** a pull request where `docs_only=true` and `next build` fails (e.g., broken import in a non-test file)
- **When** the `build` job runs
- **Then** the `build` job fails and `ci-gate` reports failure, blocking merge

---

### Requirement: ADDED Test jobs skip on docs-only changes

The system SHALL skip `unit-tests`, `integration-tests`, and `regression-tests` when `docs_only=true`.

#### Scenario: All test jobs skipped on docs-only PR

- **Given** a pull request where `docs_only=true`
- **When** the workflow executes
- **Then** `unit-tests`, `integration-tests`, and `regression-tests` all report status `skipped` in the GitHub Actions UI and no runner minutes are consumed by those jobs

#### Scenario: All test jobs run on code-change PR

- **Given** a pull request where `docs_only=false`
- **When** the workflow executes
- **Then** `unit-tests`, `integration-tests`, and `regression-tests` all execute normally

---

### Requirement: ADDED Coverage upload and finalize skip on docs-only changes

The system SHALL skip the `upload-and-finalize-coverage` job when `docs_only=true`.

#### Scenario: Coverage upload skipped on docs-only PR

- **Given** a pull request where `docs_only=true`
- **When** the workflow executes
- **Then** the `upload-and-finalize-coverage` job reports status `skipped` and no coverage data is sent to Codacy

#### Scenario: Coverage uploaded and finalized on code-change PR

- **Given** a pull request where `docs_only=false` and all test jobs complete (success or failure)
- **When** the `upload-and-finalize-coverage` job runs
- **Then** all three partial coverage reports are uploaded to Codacy and `final` is called exactly once

## MODIFIED Requirements

### Requirement: MODIFIED Build job is standalone

The system SHALL run `npm run build` as a dedicated `build` job (currently embedded in `integration-tests` and `regression-tests`).

#### Scenario: Build runs once per workflow trigger

- **Given** any push or pull request triggering the workflow
- **When** the workflow executes
- **Then** `npm run build` is executed exactly once in the standalone `build` job, not duplicated inside test jobs

## REMOVED Requirements

### Requirement: REMOVED Per-job inline coverage upload

The inline coverage upload steps previously present in `unit-tests`, `integration-tests`, and `regression-tests` are removed in favour of the consolidated `upload-and-finalize-coverage` job.

Reason for removal: Consolidation into a single job eliminates code duplication and ensures `final` is called only after all test jobs complete.

## Traceability

- Proposal element "check-changes job" → Requirement: Docs-only change detection
- Proposal element "lint and build always run" → Requirement: Lint and build always run
- Proposal element "test jobs skip on docs-only" → Requirement: Test jobs skip on docs-only changes
- Proposal element "coverage upload consolidation" → Requirement: Coverage upload and finalize skip + MODIFIED Build job is standalone
- Design decision 1 (dorny/paths-filter) → Requirement: Docs-only change detection
- Design decision 2 (standalone build) → Requirement: MODIFIED Build job is standalone
- Design decision 3 (coverage consolidation) → Requirement: Coverage upload and finalize skip
- Requirement: Docs-only change detection → Task: Add check-changes job
- Requirement: Lint and build always run → Task: Extract standalone build job
- Requirement: Test jobs skip on docs-only → Task: Add docs_only conditionals to test jobs
- Requirement: Coverage upload and finalize skip → Task: Add upload-and-finalize-coverage job

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Docs-only PR CI wall-clock time

- **Given** a pull request where `docs_only=true`
- **When** the workflow completes (lint + build + ci-gate)
- **Then** the total wall-clock time from trigger to `ci-gate` success is under 5 minutes

### Requirement: Reliability

#### Scenario: False-positive classification never skips tests on code change

- **Given** any pull request containing at least one non-markdown file
- **When** the `check-changes` job runs using `dorny/paths-filter`
- **Then** `docs_only=false` and all test jobs execute — no code change is ever treated as docs-only

### Requirement: Security

See functional scenario: "Mixed PR (markdown + code files)" — access control over test skipping is enforced by the path-filter logic itself; no additional security scenario applies.
