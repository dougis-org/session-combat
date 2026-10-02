# Tasks

Branch / worktree: `issue-689-migrate-storage-callers-minor-domains` at `.worktrees/issue-689-migrate-storage-callers-minor-domains`. Default branch: `main`. Linked issue: #689 (parent #499).

## Preparation

- [x] **Step 1 — Sync default branch:** from the primary checkout, `git fetch origin main` (worktree is based on `origin/main`)
- [x] **Step 2 — Confirm working branch is published:** inside `.worktrees/issue-689-migrate-storage-callers-minor-domains`, verify `git rev-parse --abbrev-ref @{u}` resolves; if not, `git push -u origin issue-689-migrate-storage-callers-minor-domains`

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list. If not listed, halt, inform the user the plugin is required, give installation guidance, and do not proceed until confirmed.

## Execution

- [x] **Issue lifecycle: mark in-progress:** `gh issue edit 689 --add-label "in-progress"`, then discover the GitHub Project (`gh project list --owner dougis-org --format json`), resolve the "In Progress" option (`gh project field-list <n> --owner dougis-org --format json`) and move the item via `gh project item-edit`. If no item is found, warn and continue; if the token lacks the `project` scope, tell the user to run `gh auth refresh -s project` and skip the project update.
- [x] Look for existing helpers/patterns first (precedent: `openspec/changes/archive/*issue-687-migrate-storage-callers*` and commit dd389bac)

### 1. Baseline

- [x] 1.1 Run `npm run test:unit` and record that it is green before editing

### 2. Migrate route handlers (one commit-sized increment each)

- [x] 2.1 Shares: in `app/api/campaigns/[id]/characters/[cid]/route.ts`, `app/api/campaigns/[id]/characters/route.ts`, `app/api/campaigns/[id]/members/[userId]/route.ts` replace `import { storage }` with `import * as shareRepo from '@/lib/storage/shareRepo'` and `storage.<fn>` with `shareRepo.<fn>`
- [x] 2.2 Templates: in `app/api/campaigns/global/route.ts`, `app/api/campaigns/global/[id]/route.ts`, `app/api/campaigns/global/[id]/copy/route.ts` use `import * as campaignTemplateRepo from '@/lib/storage/campaignTemplateRepo'`
- [x] 2.3 Preferences: in `app/api/me/preferences/route.ts` use `import * as userPreferencesRepo from '@/lib/storage/userPreferencesRepo'`

### 3. Retarget unit tests

- [x] 3.1 `tests/unit/api/campaigns/[id]/characters/[cid]/route.test.ts`, `tests/unit/api/campaigns/[id]/characters/route.test.ts`, `tests/unit/api/campaigns/[id]/members/[userId]/route.unit.test.ts`: mock `@/lib/storage/shareRepo`; drop the `@/lib/storage` mock and `jest.mocked(storage)` aliases
- [x] 3.2 `tests/unit/api/campaigns/global.route.test.ts`, `global.id.route.test.ts`, `global.id.copy.route.test.ts`: mock `@/lib/storage/campaignTemplateRepo`; drop the facade mock
- [x] 3.3 Run each edited test file individually, then `npm run test:unit`

### 4. Verify completeness

- [x] 4.1 `grep -rnE "storage\.(addShare|removeShare|listSharesForCampaign|listAllSharesForCampaign|loadGlobalCampaignTemplate|saveCampaignTemplate|deleteCampaignTemplate|getUserPreferences|updateUserPreferences)" app lib` returns hits only inside `lib/storage.ts`
- [x] 4.2 Confirm `lib/storage.ts`, `tests/unit/lib/storage/facadeShape.test.ts` and `tests/integration/api/mePreferences.test.ts` are unmodified (`git diff --stat`)
- [x] 4.3 Confirm acceptance criteria are covered (callers import narrow repos; tests pass)

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. Automatically apply all clearly-correct findings — without stopping, presenting the list, or asking for confirmation. Re-run tests, then commit.

## Validation

- [x] Run unit tests: `npm run test:unit`
- [x] Run integration tests: `npm run test:integration` (confirm script name in `package.json`)
- [ ] Run E2E tests (if applicable per `package.json`)
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] Run security/code quality checks required by project standards (Codacy / lint)
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Determine whether the change is **docs-only**: `git diff --name-only origin/main...HEAD` and check whether every file ends in `.md`.

**Full path** (any non-`.md` file changed): unit tests, integration tests, regression/E2E tests, and build must all pass.

**Docs-only path** (every file is `.md`): build must succeed; skip integration and E2E.

If **ANY** required step fails, iterate and fix before pushing. Use the commands documented in `package.json` / `CLAUDE.md` (note: there is no `npm test`; use `npm run test:unit`).

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and its findings addressed before the final commit
- [ ] Commit all changes to the working branch and push
- [ ] Open PR to `main`; the body MUST include `Closes #689`
- [ ] **Issue lifecycle: mark in-review:** `gh issue edit 689 --add-label "in-review" --remove-label "in-progress"`, then move the project item to "In Review" (warn and skip if not found)
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero remain. If findings persist after three iterations with no progress, report the stall and wait for human guidance.
- [ ] **Enable auto-merge only after the review gate passes:** `gh pr merge <PR-URL> --auto --squash` (the repo ruleset only allows squash; NEVER use `--admin`)
- [ ] **Iterate until merged** until `gh pr view <PR-URL> --json state` returns `MERGED` (if `CLOSED`, exit and notify the user); never force-merge:
  1. **Build and tests** — run [Remote push validation]; fix, commit, push first
  2. **PR comments** — for every unresolved thread, address, commit, validate, push, reply and resolve the thread (GraphQL `resolveReviewThread`), wait 180 seconds
  3. **CI check failures** — after comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix failing required checks, commit, validate, push, wait 180 seconds; restart from step 1

After every push, restart at step 1.

Ownership metadata:

- Implementer: doug (with Claude Code)
- Reviewer(s): `pr-review-toolkit:review-pr` sub-agent; repo reviewers
- Required approvals: Per `main` branch protection / ruleset

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] From the primary checkout: `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none expected)
- [ ] Sync approved spec deltas into `openspec/specs/storage-callers-narrow-imports-minor-domains/spec.md`; rewrite relative links to `../../changes/archive/YYYY-MM-DD-issue-689-migrate-storage-callers-minor-domains/design.md` and `.../tasks.md`; use valid main-spec form (not delta headings) so `openspec archive` is not blocked
- [ ] Archive: move `openspec/changes/issue-689-migrate-storage-callers-minor-domains/` to `openspec/changes/archive/YYYY-MM-DD-issue-689-migrate-storage-callers-minor-domains/` in a **single** commit (copy + deletion together)
- [ ] Confirm the archive directory exists and the original is gone
- [ ] Create doc branch: `git checkout -b doc/archive-YYYY-MM-DD-issue-689-migrate-storage-callers-minor-domains` and `git push -u origin` it
- [ ] Open a docs-only PR titled `docs: archive issue-689-migrate-storage-callers-minor-domains (YYYY-MM-DD)` — do NOT push directly to `main`
- [ ] Immediately enable auto-merge: `gh pr merge <DOC-PR-URL> --auto --squash`
- [ ] Monitor the doc PR until merged (address comments and CI)
- [ ] Remove the worktree and prune: `git worktree remove .worktrees/issue-689-migrate-storage-callers-minor-domains`, `git fetch --prune`, `git branch -D issue-689-migrate-storage-callers-minor-domains doc/archive-YYYY-MM-DD-issue-689-migrate-storage-callers-minor-domains`
