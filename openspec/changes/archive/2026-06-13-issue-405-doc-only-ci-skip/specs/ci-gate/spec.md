## ADDED Requirements

This document details *changes* to requirements and is additive to the `../../design.md` document, not a replacement.

### Requirement: ADDED ci-gate umbrella job

The system SHALL expose a single `ci-gate` job that succeeds when all upstream jobs either passed or were skipped, and fails if any upstream job concluded with `failure` or `cancelled`.

#### Scenario: All upstream jobs pass — gate succeeds

- **Given** a non-docs pull request where all upstream jobs (`lint`, `build`, `unit-tests`, `integration-tests`, `regression-tests`, `upload-and-finalize-coverage`, `check-codacy-coverage`) complete with `success`
- **When** the `ci-gate` job evaluates upstream results
- **Then** `ci-gate` completes with `success`

#### Scenario: Docs-only PR — skipped jobs do not block gate

- **Given** a docs-only pull request where test jobs, coverage upload, and Codacy polling jobs are all `skipped` and `lint` + `build` pass
- **When** the `ci-gate` job evaluates upstream results
- **Then** `ci-gate` completes with `success`

#### Scenario: Any upstream job fails — gate fails

- **Given** any pull request where at least one upstream job concludes with `failure`
- **When** the `ci-gate` job evaluates upstream results using `contains(needs.*.result, 'failure')`
- **Then** `ci-gate` fails, blocking merge

#### Scenario: ci-gate is the only required branch-protection check for this workflow

- **Given** branch protection rules for `main` after this change is deployed
- **When** a pull request targets `main`
- **Then** only `ci-gate` (from the `Build & Test` workflow) appears as a required check; individual job names (`lint`, `unit-tests`, etc.) are not required checks; Codacy Quality remains a separate required check

## MODIFIED Requirements

### Requirement: MODIFIED Branch protection required checks

Branch protection for `main` SHALL require `ci-gate` instead of individual workflow job names and instead of Codacy Diff Coverage and Codacy Coverage Variation as separate checks.

#### Scenario: ci-gate required check blocks merge on failure

- **Given** a pull request where `ci-gate` has failed
- **When** a contributor attempts to merge
- **Then** GitHub blocks the merge and displays `ci-gate` as a failing required check

#### Scenario: Codacy Quality remains independently required

- **Given** a pull request where `ci-gate` passes but Codacy Quality reports a failure
- **When** a contributor attempts to merge
- **Then** GitHub blocks the merge due to the Codacy Quality required check

## REMOVED Requirements

### Requirement: REMOVED Individual job names as required branch-protection checks

`lint`, `unit-tests`, `integration-tests`, `regression-tests`, and `finalize-coverage` are removed as individually required branch-protection checks.

Reason for removal: The `ci-gate` job aggregates all of these; requiring individual jobs prevents the skip-on-docs-only pattern from working cleanly.

## Traceability

- Proposal element "single required branch-protection check" → Requirement: ci-gate umbrella job
- Proposal element "branch protection restructure" → Requirement: MODIFIED Branch protection required checks
- Design decision 5 (ci-gate umbrella) → Requirement: ci-gate umbrella job
- Requirement: ci-gate umbrella job → Task: Add ci-gate job to build-test.yml
- Requirement: MODIFIED Branch protection required checks → Task: Update branch protection rules

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: ci-gate logic is trivially simple and cannot itself error

- **Given** any workflow run
- **When** the `ci-gate` job executes
- **Then** the job body consists solely of a single conditional shell check (`contains(needs.*.result, 'failure')`) with no external dependencies, ensuring it cannot fail for infrastructure reasons

### Requirement: Performance

#### Scenario: ci-gate adds no meaningful latency

- **Given** all upstream jobs have completed
- **When** the `ci-gate` job runs
- **Then** the job completes within 30 seconds (shell conditional only, no installs or network calls)

### Requirement: Security

The `ci-gate` job requires no additional permissions beyond the workflow default. See functional scenarios above for access-control behaviour.
