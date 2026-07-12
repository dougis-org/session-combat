## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-07-11-build-test-failure-comments/design.md) document, not a replacement.

### Requirement: ADDED Pull Request Build Failure Comments

The system SHALL post/update a summary comment listing failed jobs on a Pull Request when the `build-test` workflow fails or is cancelled, and delete it when the workflow passes.

#### Scenario: Post new comment on first failure

- **Given** a pull request with no existing build failure comment.
- **When** a workflow run of `build-test.yml` fails.
- **Then** a new PR comment is created containing the list of failed jobs, run number, and run link, along with the identifier marker.

#### Scenario: Update existing comment on subsequent failure

- **Given** a pull request with an existing build failure comment containing the identifier marker.
- **When** a subsequent workflow run of `build-test.yml` fails.
- **Then** the existing comment is updated to prepend the latest run's failure details above the previous run details, separated by a horizontal rule (`---`).

#### Scenario: Delete comment on recovery/success

- **Given** a pull request with an existing build failure comment containing the identifier marker.
- **When** a subsequent workflow run of `build-test.yml` succeeds.
- **Then** the existing comment is deleted.

## MODIFIED Requirements

### Requirement: MODIFIED central CI gate checks

The `ci-gate` job in the `build-test.yml` workflow SHALL perform the PR comment management and then verify that all upstream jobs passed.

#### Scenario: Central CI gate failure triggers comment management first

- **Given** a pull request workflow run where some tests fail.
- **When** the `ci-gate` job executes.
- **Then** the comment management step runs first, managing the PR comment based on the failures, and then the check step runs to fail the workflow.

## REMOVED Requirements

None.

## Traceability

- Proposal element: "On failure of any build-test job, post a comment or update the existing one" -> Requirement: ADDED Pull Request Build Failure Comments (Scenario: Post new comment on first failure / Scenario: Update existing comment on subsequent failure)
- Proposal element: "On success of all jobs, find and delete the prior failure comment" -> Requirement: ADDED Pull Request Build Failure Comments (Scenario: Delete comment on recovery/success)
- Design decision: Centralized Evaluation (Decision 2) -> Requirement: MODIFIED central CI gate checks
- Design decision: Try-Catch Wrapper (Decision 3) -> Requirement: Reliability (Scenario: Recovery behavior / Fork PR tolerance)
- Requirement -> Task(s): Tasks are defined in `tasks.md`.

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Latency budget

- **Given** a successful or failed workflow run.
- **When** the comment management step executes.
- **Then** all comment listing, creation, updating, or deleting operations complete within 15 seconds.

### Requirement: Security

- See functional scenarios: Try-Catch Wrapper for fork PRs.
- The `GITHUB_TOKEN` credentials must not be logged or leaked in output.

### Requirement: Reliability

#### Scenario: Recovery behavior (Fork PR tolerance)

- **Given** a workflow run triggered by a fork PR with a read-only token.
- **When** the comment management step executes and hits a `Resource not accessible` API error.
- **Then** the error is caught, a warning is logged, and the step completes with a successful status code to prevent blocking the PR build.
