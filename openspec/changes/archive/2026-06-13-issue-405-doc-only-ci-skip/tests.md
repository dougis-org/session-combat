---
name: tests
description: Tests for the issue-405-doc-only-ci-skip change
---

# Tests

## Overview

This change is entirely CI workflow configuration (`.github/workflows/build-test.yml`). There are no application unit or integration tests to write — the test suite IS the CI run itself. Validation is done by pushing branches with specific file change patterns and observing GitHub Actions behaviour.

All test cases below correspond to tasks in `tasks.md` and acceptance scenarios in the spec files under `specs/`.

## Testing Steps

For each test case, the TDD cycle maps as:
1. **Failing state:** Verify the current workflow does NOT exhibit the desired behaviour (e.g., tests run on docs-only PRs today).
2. **Pass state:** After implementing the task, verify the workflow exhibits the desired behaviour.
3. **Refactor:** Ensure no regressions in the non-docs path.

## Test Cases

### Task 1 — `check-changes` job

- [x] **TC-1.1** Push a branch with only `.md` file changes; confirm `check-changes` job output `docs_only=true` in Actions UI
  - Spec: `specs/doc-only-ci-skip/spec.md` → "All changed files are markdown"
- [x] **TC-1.2** Push a branch with at least one non-`.md` file changed; confirm `check-changes` outputs `docs_only=false`
  - Spec: `specs/doc-only-ci-skip/spec.md` → "At least one non-markdown file changed"
- [x] **TC-1.3** Push a branch with mixed `.md` + `.ts` changes; confirm `docs_only=false`
  - Spec: `specs/doc-only-ci-skip/spec.md` → "Mixed PR (markdown + code files)"

### Task 2 — Standalone `build` job

- [x] **TC-2.1** On any trigger, confirm `build` job appears in the workflow graph and executes `npm run build` exactly once
  - Spec: `specs/doc-only-ci-skip/spec.md` → "Build runs once per workflow trigger"
- [x] **TC-2.2** Confirm `integration-tests` and `regression-tests` no longer contain a build step in their logs
  - Spec: design.md Decision 2

### Task 3 — Docs-only skip conditions on test jobs

- [x] **TC-3.1** On a docs-only PR, confirm `unit-tests`, `integration-tests`, and `regression-tests` all show status `Skipped` in Actions UI
  - Spec: `specs/doc-only-ci-skip/spec.md` → "All test jobs skipped on docs-only PR"
- [x] **TC-3.2** On a code-change PR, confirm all three test jobs execute normally (not skipped)
  - Spec: `specs/doc-only-ci-skip/spec.md` → "All test jobs run on code-change PR"

### Task 4 — `upload-and-finalize-coverage` job

- [x] **TC-4.1** On a code-change PR, confirm `upload-and-finalize-coverage` job runs and logs show three partial uploads followed by `final`
  - Spec: `specs/codacy-coverage-gate/spec.md` → "All three partial reports uploaded before final"
- [x] **TC-4.2** On a docs-only PR, confirm `upload-and-finalize-coverage` shows status `Skipped`
  - Spec: `specs/doc-only-ci-skip/spec.md` → "Coverage upload skipped on docs-only PR"
- [x] **TC-4.3** On a fork PR (no `CODACY_API_TOKEN`), confirm job exits successfully with a "token absent" log message
  - Spec: `specs/codacy-coverage-gate/spec.md` → "Coverage upload skipped when CODACY_API_TOKEN absent"
- [x] **TC-4.4** Confirm the old `finalize-coverage` job no longer exists in the workflow

### Task 5 — `check-codacy-coverage` job

- [x] **TC-5.1** On a code-change PR with passing coverage, confirm `check-codacy-coverage` job succeeds after detecting both Codacy checks as `success`
  - Spec: `specs/codacy-coverage-gate/spec.md` → "Both Codacy checks pass within timeout"
- [x] **TC-5.2** On a docs-only PR, confirm `check-codacy-coverage` shows status `Skipped`
  - Spec: `specs/codacy-coverage-gate/spec.md` → "Codacy checks skipped on docs-only PR"
- [x] **TC-5.3** On a direct push to `main` (not a PR), confirm `check-codacy-coverage` shows status `Skipped`
  - Spec: `specs/codacy-coverage-gate/spec.md` → "Codacy checks skipped on push to main"
- [x] **TC-5.4** (Code review only — hard to trigger in practice) Inspect polling logic to confirm a non-`success` Codacy conclusion causes immediate job failure, and timeout causes hard fail (not pass)
  - Spec: `specs/codacy-coverage-gate/spec.md` → "A Codacy coverage check fails" and "Codacy checks do not complete within timeout"

### Task 6 — `ci-gate` job

- [x] **TC-6.1** On a docs-only PR where lint and build pass and test jobs are skipped, confirm `ci-gate` succeeds
  - Spec: `specs/ci-gate/spec.md` → "Docs-only PR — skipped jobs do not block gate"
- [x] **TC-6.2** On a code-change PR where all jobs pass, confirm `ci-gate` succeeds
  - Spec: `specs/ci-gate/spec.md` → "All upstream jobs pass — gate succeeds"
- [x] **TC-6.3** Push a branch with a deliberately failing test; confirm `ci-gate` fails
  - Spec: `specs/ci-gate/spec.md` → "Any upstream job fails — gate fails"
- [x] **TC-6.4** Confirm `ci-gate` completes in under 30 seconds once upstream jobs are done
  - Spec: `specs/ci-gate/spec.md` NFAC → "ci-gate adds no meaningful latency"

### Task 7 — Branch protection update

- [x] **TC-7.1** After updating branch protection, confirm `ci-gate` appears as a required check on a new PR
  - Spec: `specs/ci-gate/spec.md` → "ci-gate is the only required branch-protection check for this workflow"
- [x] **TC-7.2** Confirm `lint`, `unit-tests`, `integration-tests`, `regression-tests` do NOT appear as individually required checks
  - Spec: `specs/ci-gate/spec.md` → REMOVED "Individual job names as required branch-protection checks"
- [x] **TC-7.3** Confirm `Codacy Quality` still appears as a required check and is independent of `ci-gate`
  - Spec: `specs/ci-gate/spec.md` → "Codacy Quality remains independently required"
- [x] **TC-7.4** Confirm `Codacy Diff Coverage` and `Codacy Coverage Variation` are NOT standalone required checks
  - Spec: `specs/codacy-coverage-gate/spec.md` → REMOVED "Standalone Codacy branch-protection checks for coverage"

## Regression Coverage

- [x] **REG-1** A normal code-change PR runs full suite end-to-end and merges successfully — identical behaviour to pre-change
- [x] **REG-2** A docs-only PR (e.g., an OpenSpec archive PR containing only `.md` files) completes CI in under 5 minutes
  - Spec: `specs/doc-only-ci-skip/spec.md` NFAC → "Docs-only PR CI wall-clock time"
