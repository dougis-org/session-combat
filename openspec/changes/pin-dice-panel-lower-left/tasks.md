## Preparation

- [x] Read the context of `lib/components/GlobalDiceFab.tsx`.

## Preflight

- [x] Verify `pr-review-toolkit:review-pr` is available (or map to equivalent agent skill).

## Execution

- [x] If issue-driven, run `gh issue edit #526 --add-label "in-progress"`.
- [x] Move the GitHub Project item to the "In Progress" status column.
- [x] Update `GlobalDiceFab.tsx` panel positioning (`fixed inset-0 z-50 bg-black/50`, `absolute bottom-4 left-4`).
- [x] Implement custom `Tooltip` pattern in `GlobalDiceFab.tsx`, replacing `title` attributes.

## Pre-Commit Code Review

- [x] Run the `openspec-review-code` sub-agent to review changes before committing.
- [x] Address all findings from the sub-agent.

## Validation

- [x] Ensure tests pass.
- [x] Ensure lint and type checks pass.

## PR and Merge

- [ ] Commit changes with an appropriate message.
- [ ] Push the branch to origin.
- [ ] Open a PR for this branch. Include `Closes #526` in the PR body.
- [ ] Run `gh issue edit #526 --add-label "in-review" --remove-label "in-progress"`.
- [ ] Move the GitHub Project item to the "In Review" status column.
- [ ] Wait 60 seconds, then spawn a sub-agent to run `pr-review-toolkit:review-pr`.
- [ ] Address all findings until zero findings remain.
- [ ] Enable auto-merge via `gh pr merge <PR-URL> --auto --merge`.

## Post-Merge

- [ ] Wait for auto-merge to complete.
