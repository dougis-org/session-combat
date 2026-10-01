# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git fetch origin main` (primary checkout untouched; worktree created from `origin/main`)
- [x] **Step 2 — Create and publish working branch:** worktree `.worktrees/issue-811-confirm-dialog`, branch `issue-811-confirm-dialog`, pushed with upstream tracking

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If missing, halt, tell the user the plugin is required, and wait for confirmation of installation.
- [ ] Confirm `ActiveCombatView` is the only caller of `endCombat` (`tokensave_callers` / grep) before removing the native prompt

## Execution

- [ ] **Issue lifecycle: mark in-progress** (issue #811): `gh issue edit 811 --add-label "in-progress"`. Discover the GitHub Project (`gh project list --owner dougis-org --format json`), resolve the "In Progress" status option (`gh project field-list <project-number> --owner dougis-org --format json`), move the item via `gh project item-edit`. Warn and skip if no project item is found; if the token lacks `project` scope, tell the user to run `gh auth refresh -s project` and skip the project-item update.
- [ ] Work only inside `.worktrees/issue-811-confirm-dialog`
- [ ] **T1 — Modal `titleId` (TDD):** add optional `titleId` prop (default `'modal-title'`) to `lib/components/Modal.tsx`, used for the `<h2 id>` and `aria-labelledby`. Existing callers unchanged.
- [ ] **T2 — ConfirmDialog (TDD):** create `lib/components/ConfirmDialog.tsx` on top of `Modal` (`size="small"`) with required props `isOpen`, `title`, `titleId`, `confirmLabel`, `cancelLabel`, `onConfirm`, `onCancel`, plus `children`/`message`. Green confirm (`bg-green-600 hover:bg-green-700`), red cancel (`bg-red-600 hover:bg-red-700`), `data-testid` `confirm-dialog-confirm` / `confirm-dialog-cancel`. `Modal.onClose` → `onCancel` (covers "×", Escape, overlay).
- [ ] **T3 — useCombat (TDD):** remove `confirm()` from `endCombat` in `lib/hooks/useCombat.ts`; keep guard, PUT, reset, and error handling unchanged. Update `tests/unit/hooks/useCombat.test.ts` (drop `global.confirm` mock at ~line 235; assert `confirm` not called).
- [ ] **T4 — ActiveCombatView (TDD):** add `showEndCombatConfirm` state in `lib/components/ActiveCombatView.tsx`; End Combat button opens the dialog (`titleId="end-combat-confirm-title"`, title "End Combat?", labels "End Combat" / "Return to Combat"); confirm closes the dialog synchronously then calls `endCombat()`; cancel just closes.
- [ ] **T5 — E2E:** update `tests/e2e/combat-core.spec.ts` (~line 89) to click the in-app "End Combat" confirm button instead of accepting a native dialog; scope the locator to the dialog since the page also has an "End Combat" button.
- [ ] Reuse existing test helpers/fixtures (`tests/unit/fixtures/useCombat.ts`) rather than adding new ones
- [ ] Confirm all acceptance scenarios in `specs/confirm-dialog/spec.md` are covered by `tests.md`

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [ ] `npm run test:unit` (use a free port, not 3000, for any server-backed run)
- [ ] `npm run test:ci` (integration)
- [ ] `npm run test:regression` (E2E; run on a clear port, not 3000)
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Run security/code quality checks required by project standards (Verity gate, Codacy)
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. If yes, apply the docs-only path; otherwise apply the full path.

**Full path** (any non-`.md` file changed):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:ci`; all tests must pass
- **Regression / E2E tests** — `npm run test:regression`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

**Docs-only path** (every changed file is `.md`):

- **Build** — `npm run build`; build must succeed with no errors
- Skip integration and regression/E2E tests — they are not required when no code changed

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `issue-811-confirm-dialog` to `main`. The PR body MUST include `Closes #811`.
- [ ] **Issue lifecycle: mark in-review:** `gh issue edit 811 --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the "In Review" column via `gh project item-edit` (same discovery as above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings and wait for human guidance.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --squash` (`main` is squash-only per repo ruleset; NEVER use `--admin`)
- [ ] **Iterate until merged** — repeat until `gh pr view <PR-URL> --json state` returns `MERGED`; if `CLOSED`, exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix failures, commit, push before anything else
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address every unresolved thread, commit, run [Remote push validation], push, wait 180 seconds; continue until all resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix failing required checks (`ci-gate`, Codacy), commit, run [Remote push validation], push, wait 180 seconds; restart from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: doug@dougis.com (with Claude Code)
- Reviewer(s): `pr-review-toolkit:review-pr` sub-agent; repo owner for PR comments
- Required approvals: 0 (ruleset); `ci-gate` + Codacy required checks

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only` (from the primary checkout)
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change
- [ ] Sync approved spec deltas into `openspec/specs/confirm-dialog/spec.md`; update relative links (`../../design.md` → `../../changes/archive/YYYY-MM-DD-shared-confirm-dialog-end-combat/design.md`, likewise `tasks.md`)
- [ ] Archive the change: move `openspec/changes/shared-confirm-dialog-end-combat/` to `openspec/changes/archive/YYYY-MM-DD-shared-confirm-dialog-end-combat/`, staging the new location and the deletion in a single commit
- [ ] Confirm the archive directory exists and the original is gone
- [ ] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-shared-confirm-dialog-end-combat` then `git push -u origin doc/archive-YYYY-MM-DD-shared-confirm-dialog-end-combat`
- [ ] Open a PR to `main` titled `docs: archive shared-confirm-dialog-end-combat (YYYY-MM-DD)` — do NOT push directly to `main`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash` (NEVER `--admin`)
- [ ] Monitor the doc PR until it merges (address comments and CI failures on the same branch)
- [ ] Prune: `git fetch --prune`, `git branch -D issue-811-confirm-dialog doc/archive-YYYY-MM-DD-shared-confirm-dialog-end-combat`, and `git worktree remove --force .worktrees/issue-811-confirm-dialog` (`--force` needed because of the `openspec-shared` submodule)
- [ ] File a follow-up issue to migrate the remaining native `confirm()` call sites to `ConfirmDialog` (if the requester agrees; see proposal Open Questions)
