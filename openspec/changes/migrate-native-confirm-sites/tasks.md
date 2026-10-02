# Tasks

Ownership metadata:

- Implementer: (assign at apply time)
- Reviewer(s): dougis
- Required approvals: 0 (ruleset: `ci-gate` + Codacy required checks; squash-only merge)

## Preparation

- [ ] **Step 1 — Sync default branch:** from the primary checkout, `git fetch origin`
- [ ] **Step 2 — Dependency gate:** confirm `confirm-dialog-hook-and-focus-order` is merged to `origin/main` (`git log origin/main --oneline | head`; `ls lib/hooks/useConfirmDialog.tsx` after rebase). If not merged, STOP — do not begin implementation.
- [ ] **Step 3 — Rebase working branch:** in `.worktrees/migrate-native-confirm-sites`, `git rebase origin/main`, then `git push --force-with-lease -u origin migrate-native-confirm-sites` (branch already published during propose)
- [ ] **Step 4 — Submodule schema:** if `openspec` can't find `sdd-with-feedback-loop` in the worktree, `cd .github/openspec-shared && git fetch origin && git checkout -f <sha from primary checkout>`

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list. If not listed, halt, tell the user the plugin is required with installation guidance, and do not proceed until they confirm it is installed.

## Execution

- [ ] **Confirm worktree:** confirm `.worktrees/migrate-native-confirm-sites` exists and `cd` into it (never switch branches in the primary checkout)
- [ ] **Confirm branch is pushed:** `git push -u origin migrate-native-confirm-sites` if not already on remote
- [ ] **Issue lifecycle: mark in-progress:** `gh issue edit 821 --add-label "in-progress"` (skip if already set by part 1); discover the GitHub Project (`gh project list --owner dougis-org --format json`), resolve "In Progress" via `gh project field-list <project-number> --owner dougis-org --format json`, move via `gh project item-edit`. Warn and skip if no item or token lacks `project` scope (`gh auth refresh -s project`).
- [ ] **TDD gate:** for each site group, write the tests in `tests.md` and observe them failing BEFORE migrating that group
- [ ] **1. Characters** (tests T1–T4): migrate `app/characters/page.tsx`, `app/characters/[id]/page.tsx` to `useConfirmDialog` with `variant: 'danger'`, labels per design Decision 2; render `{dialog}` once
- [ ] **2. Monsters** (tests T5–T6): migrate `app/monsters/useMonsterTemplates.ts` + `app/monsters/page.tsx` (hook returns `deleteDialog`; may be skipped per proposal if awkward) to `useConfirmDialog` with `variant: 'danger'`, labels per design Decision 2; render `{dialog}` once
- [ ] **3. Campaigns** (tests T7–T12): migrate `app/campaigns/page.tsx`, `app/campaigns/[id]/page.tsx` (remove member), `app/campaigns/[id]/encounters/page.tsx` (unlink; keep `unlinkConfirmMessage`), `app/campaigns/[id]/sessions/page.tsx` to `useConfirmDialog` with `variant: 'danger'`, labels per design Decision 2; render `{dialog}` once
- [ ] **4. Parties and encounters** (tests T13–T16): migrate `app/parties/page.tsx`, `app/encounters/page.tsx` to `useConfirmDialog` with `variant: 'danger'`, labels per design Decision 2; render `{dialog}` once
- [ ] **5. Test cleanup** (tests T17–T18): remove every `window.confirm`/`global.confirm` mock listed in the proposal (including stale mock in `tests/unit/hooks/useCombat.test.ts`); update any E2E that handles native dialogs for these flows
- [ ] **6. Final grep:** `rg "\bconfirm\\(" app lib` shows no native call sites; `rg "window.confirm|global.confirm" tests` is empty
- [ ] Look for existing helpers to reuse before writing new logic; confirm acceptance criteria in `specs/` are covered

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [ ] `npm run test:unit` (all green)
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
- [ ] Commit and push to `migrate-native-confirm-sites`
- [ ] Open PR to `main`. **PR body MUST include `Closes #821`** (this is the final part). Mention it follows `confirm-dialog-hook-and-focus-order`.
- [ ] **Issue lifecycle: mark in-review:** `gh issue edit 821 --add-label "in-review" --remove-label "in-progress"`; move the project item to "In Review" via `gh project item-edit` (same discovery; warn and skip if not found)
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
- [ ] Verify merged changes appear on `main` and #821 is closed
- [ ] Mark all remaining tasks complete (`- [x]`)
- [ ] Update repository documentation impacted by the change
- [ ] Sync approved spec deltas into `openspec/specs/confirm-dialog/spec.md` (hand-merge; use `openspec archive --skip-specs` because live specs are malformed), updating relative links to `../../changes/archive/YYYY-MM-DD-migrate-native-confirm-sites/design.md` and `tasks.md`
- [ ] Archive: move `openspec/changes/migrate-native-confirm-sites/` to `openspec/changes/archive/YYYY-MM-DD-migrate-native-confirm-sites/` in a **single commit** (copy + deletion together)
- [ ] Confirm the archive dir exists and the original is gone
- [ ] Create doc branch: `git checkout -b doc/archive-YYYY-MM-DD-migrate-native-confirm-sites` and `git push -u origin doc/archive-YYYY-MM-DD-migrate-native-confirm-sites`
- [ ] Open PR `docs: archive migrate-native-confirm-sites (YYYY-MM-DD)` to `main` — do NOT push directly to `main`
- [ ] Immediately enable auto-merge: `gh pr merge <DOC-PR-URL> --auto --squash`
- [ ] Monitor the doc PR until merged (address comments/CI)
- [ ] Remove the worktree: `git worktree remove --force .worktrees/migrate-native-confirm-sites` (submodule requires `--force`), then `git worktree prune`
- [ ] Prune branches: `git fetch --prune` and `git branch -D migrate-native-confirm-sites doc/archive-YYYY-MM-DD-migrate-native-confirm-sites`
