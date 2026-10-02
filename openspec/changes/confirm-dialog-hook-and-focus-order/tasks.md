# Tasks

Ownership metadata:

- Implementer: (assign at apply time)
- Reviewer(s): dougis
- Required approvals: 0 (ruleset: `ci-gate` + Codacy required checks; squash-only merge)

## Preparation

- [ ] **Step 1 — Sync default branch:** from the primary checkout, `git fetch origin` (worktree `.worktrees/confirm-dialog-hook-and-focus-order` branches from `origin/main`)
- [ ] **Step 2 — Working branch:** `confirm-dialog-hook-and-focus-order` already created and pushed during propose; verify with `git ls-remote --heads origin confirm-dialog-hook-and-focus-order`
- [ ] **Step 3 — Submodule schema:** if `openspec` can't find `sdd-with-feedback-loop` in the worktree, `cd .github/openspec-shared && git fetch origin && git checkout -f <sha from primary checkout>`

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list. If not listed, halt, tell the user the plugin is required with installation guidance, and do not proceed until they confirm it is installed.

## Execution

- [ ] **Confirm worktree:** confirm `.worktrees/confirm-dialog-hook-and-focus-order` exists and `cd` into it (never switch branches in the primary checkout)
- [ ] **Confirm branch is pushed:** `git push -u origin confirm-dialog-hook-and-focus-order` if not already on remote
- [ ] **Issue lifecycle: mark in-progress:** run `gh issue edit 821 --add-label "in-progress"`; discover the GitHub Project (`gh project list --owner dougis-org --format json`), resolve the "In Progress" option (`gh project field-list <project-number> --owner dougis-org --format json`), move the item via `gh project item-edit`. Warn and skip if no project item or the token lacks `project` scope (`gh auth refresh -s project`). _Only mark in-progress; do NOT add `Closes #821` to this PR — the follow-up change closes the issue (use `Refs #821`)._
- [ ] **TDD gate:** all failing tests in `tests.md` for a section MUST be written and observed failing before that section's implementation starts
- [ ] **1. Modal `closeButtonTabbable`** (tests T1–T2): add the prop in `lib/components/Modal.tsx` (`tabIndex={-1}` when false; default true)
- [ ] **2. ConfirmDialog order, focus, variant** (tests T3–T8): in `lib/components/ConfirmDialog.tsx` render Confirm before Cancel, `autoFocus` Confirm, pass `closeButtonTabbable={false}`, add `variant` (`'default' | 'danger'`)
- [ ] **3. `useConfirmDialog` hook** (tests T9–T13): create `lib/hooks/useConfirmDialog.tsx` returning `{ confirm, dialog }`; `useId` for `titleId`; confirm closes then calls `onConfirm`
- [ ] **4. Refactor ActiveCombatView** (tests T14–T16): replace `showEndCombatConfirm` state + inline dialog in `lib/components/ActiveCombatView.tsx` with the hook; keep the derived auto-end `<ConfirmDialog>` (fixed `titleId`)
- [ ] **5. Update existing tests/E2E:** `tests/unit/components/ConfirmDialog.test.tsx`, `tests/unit/components/ActiveCombatView.test.tsx`, `tests/e2e/combat-core.spec.ts` (add a tab-order check); keep `data-testid`s unchanged
- [ ] Look for existing helpers to reuse before writing new logic; confirm acceptance criteria in `specs/` are covered

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [ ] `npm run test:unit` (all green, coverage as configured)
- [ ] `npm run test:ci` (integration)
- [ ] `npm run test:regression` / `npm run test:e2e` — use a free port, not 3000 (other threads occupy it)
- [ ] `npm run lint` and `npx tsc --noEmit`
- [ ] `npm run build`
- [ ] Run security/code quality checks required by project standards (Verity gate, Codacy)
- [ ] All completed tasks marked `- [x]`
- [ ] All steps in [Remote push validation]

## Remote push validation

Determine whether the change is **docs-only** (`git diff --name-only origin/main` — every file ends in `.md`).

**Full path** (any non-`.md` file changed): unit tests, integration tests, regression/E2E tests, and build must all pass.

**Docs-only path:** build must pass; skip integration and E2E.

If ANY required step fails, iterate and fix before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were addressed before the final commit
- [ ] Commit and push to `confirm-dialog-hook-and-focus-order`
- [ ] Open PR to `main`. This is part 1 of 2 for #821 — body uses `Refs #821` (NOT `Closes`) so the issue stays open for `migrate-native-confirm-sites`. State in the body that PR 2 depends on this PR.
- [ ] **Issue lifecycle:** leave #821 as `in-progress` (PR 2 moves it to `in-review`/closes it)
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero remain. If findings persist after three or more iterations with no progress, report the stall and wait for human guidance
- [ ] Address every PR comment before merging
- [ ] **Enable auto-merge only after the review gate passes:** `gh pr merge <PR-URL> --auto --squash` (NEVER `--admin`; main is squash-only)
- [ ] **Iterate until merged** until `gh pr view <PR-URL> --json state` returns `MERGED` (exit and notify on `CLOSED`):
  1. Build and tests — run [Remote push validation]; fix failures first
  2. PR comments — `gh pr view <PR-URL> --json reviewThreads`; address each unresolved thread, validate, push, wait 180s
  3. CI failures — `gh pr checks <PR-URL> --json isRequired,state`; fix failing required checks, validate, push, wait 180s; restart from step 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] From the primary checkout: `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on `main`
- [ ] Notify that `migrate-native-confirm-sites` is unblocked (rebase its branch on `main`)
- [ ] Mark all remaining tasks complete (`- [x]`)
- [ ] Update documentation impacted by the change (hook usage note in the `confirm-dialog` spec Purpose)
- [ ] Sync approved spec deltas into `openspec/specs/confirm-dialog/spec.md` and `openspec/specs/modal/spec.md` (hand-merge; `openspec archive --skip-specs` because live specs are malformed), updating relative links to `../../changes/archive/YYYY-MM-DD-confirm-dialog-hook-and-focus-order/design.md` and `tasks.md`
- [ ] Archive: move `openspec/changes/confirm-dialog-hook-and-focus-order/` to `openspec/changes/archive/YYYY-MM-DD-confirm-dialog-hook-and-focus-order/` in a **single commit** (copy + deletion together)
- [ ] Confirm the archive dir exists and the original is gone
- [ ] Create doc branch: `git checkout -b doc/archive-YYYY-MM-DD-confirm-dialog-hook-and-focus-order` and `git push -u origin doc/archive-YYYY-MM-DD-confirm-dialog-hook-and-focus-order`
- [ ] Open PR `docs: archive confirm-dialog-hook-and-focus-order (YYYY-MM-DD)` to `main` — do NOT push directly to `main`
- [ ] Immediately enable auto-merge: `gh pr merge <DOC-PR-URL> --auto --squash`
- [ ] Monitor the doc PR until merged (address comments/CI)
- [ ] Remove the worktree: `git worktree remove --force .worktrees/confirm-dialog-hook-and-focus-order` (submodule requires `--force`), then `git worktree prune`
- [ ] Prune branches: `git fetch --prune` and `git branch -D confirm-dialog-hook-and-focus-order doc/archive-YYYY-MM-DD-confirm-dialog-hook-and-focus-order`
