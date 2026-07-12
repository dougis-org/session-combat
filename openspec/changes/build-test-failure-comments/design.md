## Context

- **Relevant architecture**: GitHub Actions workflows. Specifically, `.github/workflows/build-test.yml` which defines the testing pipeline and the `ci-gate` umbrella job.
- **Dependencies**: `actions/github-script@v8` (uses Octokit to communicate with GitHub REST API).
- **Interfaces/contracts touched**: GitHub Issue Comments API (`issues.listComments`, `issues.createComment`, `issues.updateComment`, `issues.deleteComment`).

## Goals / Non-Goals

### Goals

- Automatically comment on PRs when the build-test workflow fails.
- Prepend new run details to existing comments on subsequent failures.
- Automatically delete the failure comment when the build passes.
- Ensure the workflow completes successfully even if the comment actions fail (e.g. on fork PRs where API access is read-only).

### Non-Goals

- Posting comments on push events to `main` branch (since there is no PR to comment on).
- Modifying checks or commit statuses directly.
- Commenting on third-party reviewer tools (like Codacy).

## Decisions

### Decision 1: Comment Identification and Marker

- **Chosen**: Use a hidden HTML comment marker `<!-- session-combat-build-test-failure -->` at the beginning of the comment body to identify previous failure comments from this workflow.
- **Alternatives considered**: Checking the author of the comment (not specific enough, as the same bot may post other types of comments on the PR).
- **Rationale**: A hidden HTML marker is robust, standard, and highly specific to this workflow, avoiding any clash with other comments.
- **Trade-offs**: None.

### Decision 2: Status Evaluation of Upstream Jobs

- **Chosen**: Evaluate job status results using GitHub Actions `needs` context in JS. The step lists results for all upstream jobs (`check-changes`, `lint`, `build`, etc.) and filters for `'failure'` or `'cancelled'`.
- **Alternatives considered**: Having separate individual steps in each job to comment (leads to race conditions, multiple comments, and duplicate logic).
- **Rationale**: Evaluating everything in `ci-gate` centralized job keeps all logic DRY, avoids race conditions, and ensures only one comment represents the overall run state.
- **Trade-offs**: Requires `ci-gate` to run `if: always()`, which it already does.

### Decision 3: Error Tolerance on Fork Pull Requests

- **Chosen**: Wrap the entire JavaScript comment logic block in a `try-catch` statement. In the `catch` block, print a warning to logs instead of throwing or exit 1.
- **Alternatives considered**: Explicit permission check steps or skipping the job on fork conditions.
- **Rationale**: A try-catch block is simple, robust, and handles any type of API failure (including rate limits, permissions, network blips) gracefully, ensuring the core build pipeline never blocks on cosmetic comment actions.
- **Trade-offs**: Permission warnings will be visible in workflow logs but will not trigger build failures.

## Proposal to Design Mapping

- **Proposal element**: On failure of any `build-test` job, post a comment or update the existing one by prepending details.
  - **Design decision**: CENTRALIZED EVALUATION (Decision 2). Check upstream job results, generate comment text, and call `issues.createComment` or `issues.updateComment`.
  - **Validation approach**: Mock inputs/statuses in a test script or run the workflow on a test branch.
- **Proposal element**: On success of all jobs, find and delete the prior failure comment.
  - **Design decision**: CLEANUP ON SUCCESS (Decision 1 & 2). If no jobs failed, check for a comment containing the marker and delete it using `issues.deleteComment`.
  - **Validation approach**: Verify that after a successful build runs, any previous failure comment on the test PR is removed.
- **Proposal element**: Gracefully handle fork PRs with read-only permissions.
  - **Design decision**: TRY-CATCH WRAPPER (Decision 3). The step has `continue-on-error: false` but the JS code internally catches errors and prints warnings.
  - **Validation approach**: Verify code review workflow runs do not fail when triggered from a fork PR.

## Functional Requirements Mapping

- **Requirement**: Find prior comment.
  - **Design element**: `github.rest.issues.listComments` matching `c.body.includes(marker)`.
  - **Acceptance criteria reference**: `specs/build-test-failure-comments.md`
  - **Testability notes**: Verify that the correct comment is matched even when other comments exist on the PR.
- **Requirement**: Prepend new failure details.
  - **Design element**: Splitting body on `marker` and inserting new details right below the marker, keeping existing history below.
  - **Acceptance criteria reference**: `specs/build-test-failure-comments.md`
  - **Testability notes**: Verify subsequent failures stack details chronologically with the newest at the top.
- **Requirement**: Delete comment on success.
  - **Design element**: `github.rest.issues.deleteComment` for the matched comment ID.
  - **Acceptance criteria reference**: `specs/build-test-failure-comments.md`
  - **Testability notes**: Verify a successful run deletes the comment.

## Non-Functional Requirements Mapping

- **Requirement category**: Security / Reliability
  - **Requirement**: Do not crash the build on API failures (e.g. fork PR permission limits).
  - **Design element**: Try-catch wrapper inside `actions/github-script`.
  - **Acceptance criteria reference**: `specs/build-test-failure-comments.md`
  - **Testability notes**: Verify that even if the API throws "Resource not accessible", the workflow continues and passes.

## Risks / Trade-offs

- **Risk/trade-off**: The default GITHUB_TOKEN permissions could be insufficient in some configurations.
  - **Impact**: Comments won't be posted on branch PRs.
  - **Mitigation**: Add explicit `permissions: pull-requests: write` to the `ci-gate` job in `build-test.yml`.

## Rollback / Mitigation

- **Rollback trigger**: Comments are breaking the workflow run or causing massive API spam.
- **Rollback steps**: Revert the commit to remove the comment step or set the step `if` condition to `false`.
- **Data migration considerations**: None (cosmetic comments only).
- **Verification after rollback**: Verify that the workflow runs successfully without posting or trying to manage comments.

## Operational Blocking Policy

- **If CI checks fail**: The PR must not be merged. This is enforced by `ci-gate` umbrella check which is a required branch protection.
- **If security checks fail**: The PR will be blocked. Security alerts must be resolved before merge.
- **If required reviews are blocked/stale**: The PR remains blocked until reviews are submitted/re-requested.
- **Escalation path and timeout**: Standard developer override if GitHub Actions outage occurs.

## Open Questions

- None.
