## GitHub Issues

- dougis-org/session-combat#405

## Why

- Problem statement: Every PR that only changes documentation (`.md` files) runs the full CI suite — lint, unit tests, integration tests, regression tests (with MongoDB + Playwright), and Codacy coverage upload. This wastes 10–15+ minutes of runner time and delays merge for changes that cannot affect runtime behaviour.
- Why now: Doc-only PRs are a recurring pattern (OpenSpec archive PRs, README updates, issue docs). The cost is paid on every such PR with zero risk reduction.
- Business/user impact: Faster merge cycles for documentation changes; reduced CI runner costs; less friction for contributors making doc-only updates.

## Problem Space

- Current behavior: `build-test.yml` runs unconditionally on every push to `main` and every PR targeting `main`. All five jobs (lint, unit-tests, integration-tests, regression-tests, finalize-coverage) run regardless of which files changed. Three separate Codacy checks (Diff Coverage, Coverage Variation, Quality) are configured as required branch-protection checks.
- Desired behavior: When **all** changed files match `**/*.md`, CI runs only lint and build. Tests and Codacy coverage reporting are skipped. A single `ci-gate` job is the only required branch-protection check. The Codacy Quality check remains a separate required check. For non-docs changes, behaviour is identical to today.
- Constraints:
  - Branch protection currently lists individual job names as required checks; those must be replaced with `ci-gate`.
  - Codacy "Diff Coverage" and "Coverage Variation" checks must be consumed and surfaced inside the workflow (not as standalone branch-protection rules) so they auto-pass on docs-only runs.
  - Codacy Quality check is owned by Codacy and stays as a standalone required check — out of scope for this change.
  - Coverage upload uses a three-partial-report + `final` pattern; that must be preserved for non-docs runs.
- Assumptions:
  - A PR with even one non-markdown file change runs the full suite.
  - On push to main (not a PR), Codacy coverage polling is skipped; coverage is uploaded and finalized but not gated.
  - Codacy processes coverage and posts check results within a reasonable window (≤10 minutes) after `final` is called.
  - Skipping coverage upload for docs-only commits is safe: Codacy retains the last known repo coverage and does not interpret absence of a report as a drop.
- Edge cases considered:
  - Mixed PR (`.md` + code files) → full suite runs.
  - Push directly to `main` with only `.md` changes → lint + build only, no test jobs, no coverage polling.
  - Push directly to `main` with code changes → full suite runs, coverage uploaded and finalized, no Codacy polling (no PR context).
  - Codacy polling timeout → workflow fails (coverage is a hard gate, not advisory).
  - All three test jobs skipped → `finalize-coverage` also skipped; `ci-gate` treats skipped upstream jobs as passing.

## Scope

### In Scope

- Add `check-changes` job that outputs `docs_only: true/false` based on changed file paths.
- Extract build into a standalone job that always runs (currently embedded in `integration-tests` and `regression-tests`).
- Add per-job `if: needs.check-changes.outputs.docs_only != 'true'` conditions to `unit-tests`, `integration-tests`, `regression-tests`, and `finalize-coverage`.
- Consolidate coverage upload (currently inline per test job) into a single `upload-and-finalize-coverage` job that runs after all three test jobs complete.
- Add `check-codacy-coverage` job that polls GitHub Checks API for "Codacy Diff Coverage" and "Codacy Coverage Variation" results on PRs; fails on timeout or check failure.
- Add `ci-gate` umbrella job that succeeds when all upstream jobs either pass or are skipped.
- Update branch protection: replace current required checks with `ci-gate` only (Codacy Quality remains).

### Out of Scope

- Codacy Quality check configuration (remains a separate required branch-protection check).
- Changes to any test suite, test configuration, or coverage reporter settings.
- Changes to `deploy.yml`, `wait-for-ai-reviews.yml`, or `resolve-outdated-comments.yml`.
- Optimising CI for non-markdown partial changes (e.g., skipping regression tests when only config files change).

## What Changes

- `.github/workflows/build-test.yml`: Restructured with `check-changes`, standalone `build`, `upload-and-finalize-coverage`, `check-codacy-coverage`, and `ci-gate` jobs; existing test jobs gain skip conditions; per-job coverage upload steps removed.
- Branch protection rules: `ci-gate` replaces individual job names as the required check for the `Build & Test` workflow.

## Risks

- Risk: `check-changes` incorrectly classifies a mixed PR as docs-only, skipping tests on a code change.
  - Impact: High — broken code could merge without test coverage.
  - Mitigation: Use an established path-filter action (e.g., `dorny/paths-filter`) or a shell glob that errs on the side of running tests; validate with test PRs before merging.

- Risk: Codacy polling times out on slow analysis runs, blocking merge of legitimate PRs.
  - Impact: Medium — workflow fails, PR is blocked until re-run or timeout is increased.
  - Mitigation: Set a generous timeout (10 minutes); log elapsed time; ensure re-run resolves the issue.

- Risk: Skipping coverage `final` for docs-only runs causes Codacy to behave unexpectedly (e.g., treating the commit as having 0% coverage).
  - Impact: Medium — could affect repo-level coverage metrics or subsequent PR checks.
  - Mitigation: Verify Codacy behaviour by running a docs-only test PR before updating branch protection.

- Risk: Branch protection update leaves a window where neither old nor new checks are required.
  - Impact: Low — brief window during cutover where a PR could merge without checks.
  - Mitigation: Update branch protection in a single atomic change immediately after the workflow lands on `main`.

## Open Questions

No unresolved ambiguity remains. All decisions were confirmed during the explore session:
- Codacy check names: "Codacy Diff Coverage" and "Codacy Coverage Variation" ✓
- Branch protection restructure to single `ci-gate` approved ✓
- Codacy Quality check stays separate ✓
- Docs-only push to main: lint + build only, no polling ✓
- Polling timeout behaviour: hard fail ✓

## Non-Goals

- Making CI faster for non-docs PRs.
- Parallelising test jobs further.
- Removing or replacing the Codacy integration.
- Caching `node_modules` or build artifacts across runs.

## Change Control

If scope changes after proposal approval, update `openspec/changes/issue-405-doc-only-ci-skip/proposal.md`, `design.md`, `specs/**/*.md`, and `tasks.md` before implementation starts.
