## ADDED Requirements

This document details *changes* to requirements and is additive to the `../../changes/archive/2026-06-13-issue-405-doc-only-ci-skip/design.md` document, not a replacement.

### Requirement: ADDED Codacy coverage gate via workflow polling

The system SHALL poll the GitHub Checks API for "Codacy Diff Coverage" and "Codacy Coverage Variation" check results on pull requests, and fail the workflow if either check does not conclude with `success` within the timeout window.

#### Scenario: Both Codacy checks pass within timeout

- **Given** a pull request where `docs_only=false` and `upload-and-finalize-coverage` has completed
- **When** the `check-codacy-coverage` job polls `checks.listForRef`
- **Then** the job succeeds once both "Codacy Diff Coverage" and "Codacy Coverage Variation" checks report `conclusion: success`

#### Scenario: A Codacy coverage check fails

- **Given** a pull request where `docs_only=false` and Codacy reports `conclusion: failure` for "Codacy Diff Coverage"
- **When** the `check-codacy-coverage` job detects the failed conclusion
- **Then** the job fails immediately, blocking `ci-gate` and preventing merge

#### Scenario: Codacy checks do not complete within timeout

- **Given** a pull request where `docs_only=false` and Codacy has not posted check results within 10 minutes of `check-codacy-coverage` starting
- **When** the polling loop exhausts the timeout
- **Then** the `check-codacy-coverage` job fails with a timeout error message, blocking `ci-gate`

#### Scenario: Codacy checks skipped on docs-only PR

- **Given** a pull request where `docs_only=true`
- **When** the workflow executes
- **Then** the `check-codacy-coverage` job reports status `skipped` and no Codacy API calls are made

#### Scenario: Codacy checks skipped on push to main

- **Given** a direct push to `main` (not a pull request event)
- **When** the workflow executes
- **Then** the `check-codacy-coverage` job reports status `skipped` regardless of `docs_only` value

---

### Requirement: ADDED Codacy partial coverage upload consolidated

The system SHALL upload all three partial coverage reports (unit, integration, regression) and call `final` in a single `upload-and-finalize-coverage` job after all test jobs complete.

#### Scenario: All three partial reports uploaded before final

- **Given** a pull request where `docs_only=false` and all three test jobs have completed (any result)
- **When** the `upload-and-finalize-coverage` job runs
- **Then** `lcov.info` from unit tests, `lcov.info` from integration tests, and `lcov.info` from regression tests are each uploaded as partial reports, and `final` is called exactly once after all three

#### Scenario: Coverage upload skipped when CODACY_API_TOKEN absent

- **Given** a fork PR or environment where `CODACY_API_TOKEN` is not set
- **When** the `upload-and-finalize-coverage` job runs
- **Then** the job exits successfully with a logged message indicating the token is absent, and does not attempt to upload

## REMOVED Requirements

### Requirement: REMOVED Standalone Codacy branch-protection checks for coverage

"Codacy Diff Coverage" and "Codacy Coverage Variation" are removed as standalone required branch-protection checks.

Reason for removal: Both checks are now consumed and gated inside the workflow via the `check-codacy-coverage` polling job. The Codacy Quality check is unaffected and remains a standalone required check.

## Traceability

- Proposal element "Codacy coverage checks internalised" → Requirement: Codacy coverage gate via workflow polling
- Proposal element "coverage upload consolidation" → Requirement: Codacy partial coverage upload consolidated
- Design decision 4 (check-codacy-coverage polling) → Requirement: Codacy coverage gate via workflow polling
- Design decision 3 (coverage consolidation) → Requirement: Codacy partial coverage upload consolidated
- Requirement: Codacy coverage gate via workflow polling → Task: Add check-codacy-coverage job
- Requirement: Codacy partial coverage upload consolidated → Task: Add upload-and-finalize-coverage job; Task: Remove per-job coverage upload steps

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Polling does not add latency beyond Codacy processing time

- **Given** a non-docs PR where Codacy posts both check results within 3 minutes of `final` being called
- **When** the `check-codacy-coverage` job polls at 30-second intervals
- **Then** the job completes within 30 seconds of Codacy posting results (i.e., polling overhead is at most one interval)

### Requirement: Reliability

#### Scenario: Hard fail on timeout — no silent pass

- **Given** a non-docs PR where Codacy has not posted check results after 10 minutes
- **When** the polling loop exhausts its budget
- **Then** the `check-codacy-coverage` job exits with a non-zero code and a human-readable timeout message; `ci-gate` fails; the PR is blocked

See functional scenario: "Codacy checks do not complete within timeout" above.

### Requirement: Security

The polling job reads only GitHub Checks API (read-only `checks: read` permission). It does not write check results or modify PR state. No additional security scenario beyond functional coverage applies.
