## Preparation

- [x] Confirm this change proposal is approved.
- [x] Ensure the OpenTelemetry requirements are understood (from `specs/telemetry/spec.md`).

## Preflight

- [x] Verify `pr-review-toolkit:review-pr` is available in the current environment. (If not, halt and inform the user).

## Execution

- [x] Step 1: Confirm the dedicated worktree for this change exists at `.worktrees/add-otel-telemetry` and `cd` into it. If not, from primary checkout: `git worktree add .worktrees/add-otel-telemetry -b add-otel-telemetry origin/main`.
- [x] Step 2: Push the working branch to remote: `git push -u origin add-otel-telemetry`.
- [x] Step 3: Run `gh issue edit #505 --add-label "in-progress"`. Attempt to update GitHub Project status to "In Progress".
- [x] Step 4: Add `@opentelemetry/api` dependency: `npm install @opentelemetry/api`.
- [x] Step 5: Update `lib/telemetry/logger.ts` to implement the retroactive spans, counter metrics, and NODE_ENV gated console fallback as designed.
- [x] Step 6: Update tests for `logger.ts` to verify the OTel metrics and trace calls, and console behavior.

## Pre-Commit Code Review

- [x] Spawn a sub-agent to run the `openspec-review-code` skill.
- [x] Automatically apply all clearly-correct findings without asking.
- [x] Re-run tests after applying fixes.

## Validation

- [x] Run `npm run typecheck` to ensure no typing issues with the new dependency.
- [x] Run `npm run test:unit` to verify `logger.ts` coverage is maintained.
- [x] Run `npm run lint` to ensure no linting regressions.

## PR and Merge

- [x] Commit all changes, push to remote, and open a PR to `main`. Body must include `Closes #505`.
- [x] Run `gh issue edit #505 --add-label "in-review" --remove-label "in-progress"`. Attempt to update GitHub Project status to "In Review".
- [x] Wait 60 seconds for CI to start, then spawn a sub-agent to run `pr-review-toolkit:review-pr`. Address all findings until zero remain.
- [x] Enable auto-merge via `gh pr merge <PR-URL> --auto --merge`.
- [ ] Autonomously monitor for review comments or CI failures. Fix and push until `gh pr view --json state` reports `MERGED`.

## Post-Merge

- [ ] Checkout `main` and pull in the primary checkout.
- [ ] Verify merged changes appear on the default branch.
- [ ] Sync approved spec deltas to `openspec/specs/`.
- [ ] Archive the change directory as a single atomic commit (copy to archive + delete from active).
- [ ] Push the archive commit to the default branch.
- [ ] Remove the worktree: `git worktree remove .worktrees/add-otel-telemetry`.
- [ ] Delete the merged local branch `add-otel-telemetry`.
