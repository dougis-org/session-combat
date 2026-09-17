# Tasks

## Preparation

- [ ] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [ ] **Step 2 — Create and publish working branch:** `git checkout -b campaign-nav-fix-and-encounter-tests` then immediately `git push -u origin campaign-nav-fix-and-encounter-tests`

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [ ] **Step 1 — Confirm/create dedicated worktree:** confirm `.worktrees/campaign-nav-fix-and-encounter-tests` exists (created during propose, if that convention was followed) and `cd` into it. If it does not exist, create it now from the primary checkout: fetch `main` and run `git worktree add .worktrees/campaign-nav-fix-and-encounter-tests -b campaign-nav-fix-and-encounter-tests origin/main`. All implementation work below happens inside this worktree, never in the primary checkout.
- [ ] **Step 2 — Confirm branch is pushed:** verify `campaign-nav-fix-and-encounter-tests` exists on `origin`; if not, `git push -u origin campaign-nav-fix-and-encounter-tests` from inside the worktree before any implementation begins.
- [ ] **Issue lifecycle: mark in-progress (#540 and #541):** run `gh issue edit 540 --add-label "in-progress" --repo dougis-org/session-combat` and `gh issue edit 541 --add-label "in-progress" --repo dougis-org/session-combat`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move both issues' project items via `gh project item-edit`. If no project item is found for either, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label updates still proceed).
- [ ] **Task A — Fix campaign list card (`app/campaigns/page.tsx` ~line 275):** replace the single `<Link href="/encounters">Start Encounter</Link>` with two links: `<Link href={`/campaigns/${campaign.id}/encounters`}>Encounters</Link>` (new `bg-teal-600 hover:bg-teal-700` class, per design.md Decision 2) and `<Link href={`/campaigns/${campaign.id}/combat`}>Start Combat</Link>` (keep `bg-orange-600 hover:bg-orange-700`). Match the existing button classes/spacing pattern used by the sibling Members/Prompt Builder/Library/Session Log links in the same row. Covers spec requirement "ADDED Campaign list card offers correctly labeled, correctly routed Encounters and Start Combat actions".
- [ ] **Task B — Unit test for the campaign list card fix:** add or update a unit test for `app/campaigns/page.tsx` (or the existing campaigns-list test file, if one exists — check `tests/unit/` first) asserting: a link labeled "Encounters" renders with `href="/campaigns/{id}/encounters"`, a link labeled "Start Combat" renders with `href="/campaigns/{id}/combat"`, and no link labeled "Start Encounter" or pointing at `/encounters` remains. Covers spec scenario "Campaign card shows Encounters and Start Combat links".
- [ ] **Task C — Verify existing API test coverage satisfies #541 (no new tests written; verification only):** re-run `npm run test:unit` and `npm run test:integration` and confirm `tests/unit/api/campaigns/[id]/encounters/route.test.ts` and `tests/unit/api/campaigns/[id]/encounters/[encounterId]/route.test.ts` exist, pass, and their scenario list still covers: DM links an owned encounter, idempotent re-link, ownership rejection, player-cannot-link, DM unlinks, unlink-when-not-linked no-op, player-cannot-unlink, list/empty-list, non-member rejection (per design.md Decision 3 / Context). **If any of these tests are missing, failing, or a scenario has been removed since design was written, STOP — this is a Change Control scope change (design.md Decision 3 assumption invalidated): do not silently add ad hoc tests to patch the gap; update `proposal.md`/`design.md` to reflect the real state before continuing, and flag it to the user.**
- [ ] **Task D — New E2E spec file `tests/e2e/campaign-combat-linking.spec.ts`:** create the file following existing `tests/e2e/*.spec.ts` conventions (auth/setup helpers, `test.describe` blocks) and add three scenarios:
  - [ ] **D1 — Start Combat routes to campaign combat setup:** from `/campaigns`, click "Start Combat" on a campaign card; assert the URL is `/campaigns/{id}/combat` and the campaign-scoped combat setup view renders (a stable selector within `CombatSetupView`, not the add-encounter screen). Covers spec scenario "Start Combat routes to campaign combat setup, not the global encounter browser".
  - [ ] **D2 — Linking/unlinking an encounter updates the combat-setup picker:** from `/campaigns/{id}/encounters`, link an existing owned encounter; navigate to `/campaigns/{id}/combat` and assert it appears in the "From Library" panel; return and unlink it; re-check the picker no longer lists it; confirm it is still present on the global `/encounters` page. Assert on final settled UI state, not fixed waits (design.md Decision 4 / NFAC reliability requirement). Covers spec scenarios "Linking an encounter makes it appear in the campaign's combat-setup picker" and "Unlinking an encounter removes it from the picker but not from the global list".
  - [ ] **D3 — Ad hoc `/combat` Quick Entry works with zero campaign-linked encounters:** navigate directly to `/combat` (no campaignId), add combatants via Quick Entry, start combat, assert the active combat screen renders. Covers spec scenario "Ad hoc combat Quick Entry works with zero campaign-linked encounters".
- [ ] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch — reuse existing E2E auth/setup helpers and Playwright fixtures already used in `tests/e2e/combat.spec.ts` and `tests/e2e/campaigns.spec.ts` rather than inventing new ones.
- [ ] Confirm all spec scenarios in `specs/campaign-nav-encounter-fix/spec.md` are covered by Tasks A–D (walk the scenario list against the tasks above, including the Reliability NFAC scenario).

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [ ] Run unit/integration tests: `npm run test:unit` and `npm run test:integration`
- [ ] Run E2E tests: `npm run test:e2e` (or the project's Playwright invocation), including the new `campaign-combat-linking.spec.ts` file — run it with `--repeat-each=3` locally at least once to catch obvious flakiness before merge (design.md Risks)
- [ ] Run type checks: `npm run typecheck`
- [ ] Run build: `npm run build`
- [ ] Run lint: `npm run lint`
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only main` and check whether every changed file ends in `.md`. This change touches `.tsx` and `.spec.ts` files, so the **full path** applies.

**Full path:**

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e` (or `npm run test:regression` if that is the project's full E2E/regression command); all tests must pass, including the new `campaign-combat-linking.spec.ts` scenarios
- **Build** — `npm run build`; build must succeed with no errors

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `campaign-nav-fix-and-encounter-tests` to `main`. **PR body MUST include both `Closes #540` and `Closes #541`** so both issues close together when the PR merges.
- [ ] **Issue lifecycle: mark in-review (#540 and #541):** run `gh issue edit 540 --add-label "in-review" --remove-label "in-progress" --repo dougis-org/session-combat` and `gh issue edit 541 --add-label "in-review" --remove-label "in-progress" --repo dougis-org/session-combat`. Then move both project items to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --squash` (this repo's `main` is a squash-only ruleset — use `--squash`, not `--merge`; NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent executing this change (assigned to the current user, per proposal convention)
- Reviewer(s): `pr-review-toolkit:review-pr` sub-agent + required human/CI review per repo branch ruleset
- Required approvals: 0 human approvals required by `main`'s squash-only ruleset, but `ci-gate` and Codacy required checks must pass (per project memory: main is a squash-only ruleset)

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none expected beyond the openspec artifacts themselves)
- [ ] Sync approved spec deltas into `openspec/specs/campaign-nav-encounter-fix/spec.md`. After copying, update relative links that pointed into the change directory — replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-campaign-nav-fix-and-encounter-tests/design.md`, and similarly for `../../tasks.md`.
- [ ] Archive the change: move `openspec/changes/campaign-nav-fix-and-encounter-tests/` to `openspec/changes/archive/YYYY-MM-DD-campaign-nav-fix-and-encounter-tests/` and stage both the new location and the deletion of the old location in a single commit — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-campaign-nav-fix-and-encounter-tests/` exists and `openspec/changes/campaign-nav-fix-and-encounter-tests/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-campaign-nav-fix-and-encounter-tests` then `git push -u origin doc/archive-YYYY-MM-DD-campaign-nav-fix-and-encounter-tests`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-campaign-nav-fix-and-encounter-tests` to `main` with title `docs: archive campaign-nav-fix-and-encounter-tests (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Remove the change's dedicated worktree: `git worktree remove .worktrees/campaign-nav-fix-and-encounter-tests`
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D campaign-nav-fix-and-encounter-tests doc/archive-YYYY-MM-DD-campaign-nav-fix-and-encounter-tests`
