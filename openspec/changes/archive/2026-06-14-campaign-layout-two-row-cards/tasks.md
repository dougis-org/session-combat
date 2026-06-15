# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/campaign-layout-two-row-cards` then immediately `git push -u origin feat/campaign-layout-two-row-cards`

## Execution

### 1. Review existing tests before touching code

- [x] Read `tests/unit/components/CampaignsPage.test.tsx` and catalogue all button/chip/heading queries that may break after DOM restructure
- [x] Note which selectors depend on the current single-row layout

### 2. Refactor campaign list card layout (`app/campaigns/page.tsx` lines ~428–474)

- [x] Replace the single `flex justify-between items-start` container with a two-row structure:
  - Header row: `flex items-center gap-2 flex-wrap` — contains `<h2>` with `min-w-0 truncate` + status chip with `flex-shrink-0`
  - Action row: `flex flex-wrap gap-2 mt-3` — contains Members, Session Log, Edit, Delete
- [x] Verify `ManagementChapterInfo` and `moduleName` paragraph still render between header and action rows

### 3. Refactor active campaigns card layout (`app/campaigns/page.tsx` lines ~234–277)

- [x] Apply the same two-row pattern to the active campaigns dashboard card:
  - Header row: campaign name + status chip (same pattern as list card)
  - Action row: Members, Prompt Builder, Library, Start Encounter links
- [x] Ensure `CampaignChapterInfo`, `moduleName`, `lastSession`, DM Notes, and party roster sections remain below the header row in the correct order

### 4. Update unit tests

- [x] Update `tests/unit/components/CampaignsPage.test.tsx` to use role/text-based queries rather than positional DOM assumptions
- [x] Ensure all FR1–FR4 scenarios from `openspec/changes/campaign-layout-two-row-cards/specs/campaign-card-layout/spec.md` have corresponding test coverage

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] `npm run test:unit` — all tests pass
- [x] `npm run build` — no type errors or build failures
- [x] `npm run lint` — no lint errors introduced
- [x] Manually verify (via `npm run dev` or screenshots) that campaign cards render with two rows at desktop and mobile widths
- [x] Confirm `git diff package.json` shows no dependency changes
- [x] All completed tasks marked complete

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` and check whether every changed file ends in `.md`. This change modifies `.tsx` and `.ts` files — use the full path.

**Full path:**

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- Skip integration and E2E tests unless the CI configuration requires them for this change type

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to `feat/campaign-layout-two-row-cards` and push to remote
- [x] Open PR from `feat/campaign-layout-two-row-cards` to `main`. PR body MUST include: `Closes #420`
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --squash` (use `--squash` per repo ruleset; NEVER use `--admin`)
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

Ownership metadata:

- Implementer: (agent)
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on `main`
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Sync approved spec deltas: copy `openspec/changes/campaign-layout-two-row-cards/specs/campaign-card-layout/spec.md` to `openspec/specs/campaign-card-layout/spec.md`; update relative links from `../../design.md` to `../../changes/archive/2026-06-14-campaign-layout-two-row-cards/design.md` (and similarly for `tasks.md`)
- [x] Archive the change: move `openspec/changes/campaign-layout-two-row-cards/` to `openspec/changes/archive/2026-06-14-campaign-layout-two-row-cards/` **as a single atomic commit** that includes both the copy and the deletion
- [x] Confirm archive location exists and original directory is gone
- [x] **Create a doc branch:** `git checkout -b doc/archive-2026-06-14-campaign-layout-two-row-cards` then `git push -u origin doc/archive-2026-06-14-campaign-layout-two-row-cards`
- [x] Open a PR from the doc branch to `main` with title `docs: archive campaign-layout-two-row-cards (2026-06-14)`
- [x] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash`
- [x] Monitor the doc PR until it merges; address any comments or CI failures, push to the same doc branch, repeat
- [x] Prune merged local branches: `git fetch --prune` and `git branch -D feat/campaign-layout-two-row-cards doc/archive-2026-06-14-campaign-layout-two-row-cards`
