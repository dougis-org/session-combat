# Tasks

Ownership metadata:

- Implementer: dougis
- Reviewer(s): pr-review-toolkit:review-pr, Codacy, Verity
- Required approvals: 0 (ci-gate + Codacy required checks; squash merge)

## Preparation

- [ ] **Step 1 — Confirm worktree:** `.worktrees/fix-campaign-route-validation-auth` exists; `cd` into it
- [ ] **Step 2 — Confirm branch published:** `git push -u origin fix-campaign-route-validation-auth` if not already on remote

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the skills list; if absent, halt and tell the user the plugin is required

## Execution

- [ ] **Issue lifecycle: mark in-progress:** `gh issue edit 829 --add-label "in-progress"`; move the project item to "In Progress" via `gh project item-edit` (warn and skip if not found; if token lacks `project` scope, tell user to run `gh auth refresh -s project`)
- [ ] 1.1 Add failing tests per `tests.md`; run `npx jest tests/unit/api/campaigns` and confirm they fail for the right reason
- [ ] 2.1 Wrap `GET` in `app/api/campaigns/global/route.ts` with `withAuth`; verify the 401 test and existing global tests pass
- [ ] 2.2 In `app/api/campaigns/global/[id]/route.ts`, call `validateEntityId` after `requireAdmin`, before storage; verify 400 test passes and storage is not called
- [ ] 3.1 Update `tests/unit/api/campaigns/global.route.test.ts` for authenticated GET; verify suite green
- [ ] 4.1 In `app/api/campaigns/[id]/characters/route.ts`, validate campaign id in POST and GET; verify 400 tests pass
- [ ] 4.2 In `app/api/campaigns/[id]/characters/[cid]/route.ts`, validate `id` and `cid`; verify 400 tests pass
- [ ] 5.1 In `app/api/campaigns/global/[id]/copy/route.ts`, replace `validateString` with `validateEntityId`; verify over-length test passes
- [ ] 6.1 Confirm `app/campaigns/page.tsx` still loads the catalog for a logged-in user (existing tests/e2e); no code change expected
- [ ] Look for reuse of existing helpers before adding code (`validateEntityId` only; no new helpers)
- [ ] Confirm acceptance criteria in `specs/**` are covered

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a sub-agent to run the `openspec-review-code` skill; automatically apply all clearly-correct findings without asking, re-run tests, then commit

## Validation

- [ ] Run unit tests (`npm test`)
- [ ] Run integration tests
- [ ] Run E2E tests on a free port (not 3000)
- [ ] Run type check (`npx tsc --noEmit`)
- [ ] Run build (`npm run build`)
- [ ] Run Verity/Codacy checks; do not waive without explicit human acceptance
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Determine whether the change is docs-only (`git diff --name-only` — every file ends in `.md`).

**Full path:** unit tests, integration tests, E2E/regression tests, build — all must pass.

**Docs-only path:** build only.

If any required step fails, fix it before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent ran and findings were addressed before the final commit
- [ ] Commit and push to the working branch
- [ ] Open PR to `main`; body MUST include `Closes #829`
- [ ] **Issue lifecycle: mark in-review:** `gh issue edit 829 --add-label "in-review" --remove-label "in-progress"`; move project item to "In Review"
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address findings until zero remain (report stall after 3 no-progress iterations)
- [ ] Enable auto-merge only after review gate passes: `gh pr merge <PR-URL> --auto --squash` (repo ruleset is squash-only; NEVER `--admin`)
- [ ] **Iterate until merged** — loop until `gh pr view <PR-URL> --json state` is `MERGED` (exit and notify if `CLOSED`):
  1. Build and tests — run [Remote push validation]; fix before anything else
  2. PR comments — address every unresolved thread, resolve each via GraphQL `resolveReviewThread`, push, wait 180s
  3. CI failures — fix failing required checks (`ci-gate`, Codacy), push, wait 180s; restart at 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] From the primary checkout: `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on `main`
- [ ] Mark all remaining tasks complete (`- [x]`)
- [ ] Update documentation impacted by the change
- [ ] Sync spec deltas into `openspec/specs/` (hand-merge; `campaign-template-admin` MODIFIED replaces the public-list requirement; use `--skip-specs` on archive if live specs fail validation); fix relative links to the archive location
- [ ] Archive `openspec/changes/fix-campaign-route-validation-auth/` to `openspec/changes/archive/YYYY-MM-DD-fix-campaign-route-validation-auth/` in a single commit
- [ ] Confirm archive exists and original is gone
- [ ] Create `doc/archive-YYYY-MM-DD-fix-campaign-route-validation-auth`, push, open PR titled `docs: archive fix-campaign-route-validation-auth (YYYY-MM-DD)` — never push directly to `main`
- [ ] Enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash`
- [ ] Monitor the doc PR until merged
- [ ] Remove the worktree (`git worktree remove --force .worktrees/fix-campaign-route-validation-auth`, needed because of the submodule) and prune: `git fetch --prune`, `git branch -D fix-campaign-route-validation-auth doc/archive-YYYY-MM-DD-fix-campaign-route-validation-auth`
