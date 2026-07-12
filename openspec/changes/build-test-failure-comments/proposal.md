## GitHub Issues

- #495

## Why

- **Problem statement**: Currently, when the build and test GitHub Actions workflow fails, it does not manage PR comments, meaning there is no clear indicator of build failures in the PR timeline other than checks, and if we were to post a comment, it would accumulate comments on subsequent failures. Upon successful recovery (a passing build), any prior failure indicator comments remain on the PR, cluttering the discussion history.
- **Why now**: Restructuring build failure notification behaviour keeps pull request histories clean, readable, and actionable, preventing developer cognitive overload.
- **Business/user impact**: Improved developer feedback loops, cleaner repository code review environments, and automated cleanup of transient CI failures.

## Problem Space

- **Current behavior**: No PR comments are posted or managed by the local `build-test.yml` workflow when it fails or succeeds.
- **Desired behavior**: 
  - On failure of any `build-test` job: Post a failure summary comment on the PR containing a list of failed jobs, the run number, and a link to the action run. If a prior failure comment exists from the same workflow, update it by prepending the latest run's failure details to the top of the comment.
  - On success of all jobs: Find any prior failure comment posted by this workflow and delete it.
- **Constraints**: 
  - Must use standard GitHub Actions `github-script` or similar tools utilizing `GITHUB_TOKEN`.
  - Must handle fork PRs where write permissions for comments are unavailable, ensuring the build does not fail because of comment creation limits.
- **Assumptions**: 
  - Only run comment management on `pull_request` events.
  - A hidden marker comment like `<!-- session-combat-build-test-failure -->` is sufficient to identify the comment uniquely.
- **Edge cases considered**:
  - **Fork PRs**: Default token has read-only permission. The workflow step must catch permission errors and continue gracefully without failing the job.
  - **Docs-only changes**: Docs-only PRs skip test jobs. The umbrella `ci-gate` job must recognize skipped jobs as non-failures and not post a failure comment.

## Scope

### In Scope

- Adding custom comment management logic (create/update on failure, delete on success) in `.github/workflows/build-test.yml` under the `ci-gate` job.
- Proper permission setup (`pull-requests: write`) for the `ci-gate` job.
- Ensuring error handling is robust enough to bypass failure when API operations are rejected (e.g. fork PRs).

### Out of Scope

- Comments for other workflows (like `deploy.yml`, `sync-openspec-shared.yml`).
- Slack/Discord integrations or other external communication channels.

## What Changes

- `.github/workflows/build-test.yml`: Update the `ci-gate` job to include explicit `pull-requests: write` permissions and a new script step before the status check step to manage the failure comments.

## Risks

- **Risk**: API rate limits or permission restrictions on forks cause workflow failures.
  - **Impact**: Fork PR builds fail unexpectedly.
  - **Mitigation**: Wrap the API logic in a `try-catch` block inside `actions/github-script` to log warnings instead of throwing errors.
- **Risk**: Multiple concurrent runs editing the same comment cause race conditions.
  - **Impact**: History might become out of sync or overwrite details.
  - **Mitigation**: PR builds are usually run-sequentialized or canceled in progress. The history will naturally update with the latest run info.

## Open Questions

- No unresolved ambiguity exists. The requirements are fully defined.

## Non-Goals

- Managing third-party check comments (like Codacy review comments).
- Preserving a permanent log of all failures inside the PR discussion if they eventually succeed.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
