# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b campaign-nav-fix-and-encounter-tests` then immediately `git push -u origin campaign-nav-fix-and-encounter-tests`

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Step 1 — Confirm/create dedicated worktree:** confirm `.worktrees/campaign-nav-fix-and-encounter-tests` exists and `cd` into it. If it does not exist, create it now from the primary checkout: fetch `main` and run `git worktree add .worktrees/campaign-nav-fix-and-encounter-tests -b campaign-nav-fix-and-encounter-tests origin/main`. All implementation work below happens inside this worktree, never in the primary checkout.
- [x] **Step 2 — Confirm branch is pushed:** verify `campaign-nav-fix-and-encounter-tests` exists on `origin`; if not, `git push -u origin campaign-nav-fix-and-encounter-tests` from inside the worktree before any implementation begins.
- [x] **Issue lifecycle: mark in-progress (both issues)** — run `gh issue edit 540 --add-label "in-progress" --repo dougis-org/session-combat` and `gh issue edit 541 --add-label "in-progress" --repo dougis-org/session-combat`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move both items via `gh project item-edit`. If no project item is found for one or both issues, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label updates still proceed).
- [x] **Task A — Verify the pre-existing state before changing anything:** confirm `app/campaigns/[id]/layout.tsx` already contains the `Encounters` and `Combat` nav tab entries (it should — shipped in the archived `2026-08-24-campaign-encounters-management-screen` change) and make no edits to that file. Confirm `app/api/campaigns/[id]/encounters/route.ts` and `app/api/campaigns/[id]/encounters/[encounterId]/route.ts` exist and are unmodified by this change. If either check fails (nav tabs missing, or API routes missing/different than expected), STOP and report — this changes the scope and requires updating `proposal.md`/`design.md` before proceeding (Change Control).
- [x] **Task B — Fix the campaign list card (`app/campaigns/page.tsx`, ~line 275):** replace the single `<Link href="/encounters" className="bg-orange-600 hover:bg-orange-700 px-3 py-1 rounded text-sm">Start Encounter</Link>` with two links: `Encounters` (`href={`/campaigns/${campaign.id}/encounters`}`, `className="bg-teal-600 hover:bg-teal-700 px-3 py-1 rounded text-sm"`) and `Start Combat` (`href={`/campaigns/${campaign.id}/combat`}`, `className="bg-orange-600 hover:bg-orange-700 px-3 py-1 rounded text-sm"`, keeping the prior orange styling since it remains the primary action). Match the existing sibling `Link` markup pattern exactly (same wrapper, same class structure) for consistency with Members/Prompt Builder/Library/Session Log. Covers spec requirement "ADDED Campaign list card offers correctly labeled, correctly routed Encounters and Start Combat actions".
- [x] **Task C — Unit test for the campaign list card fix:** add or update a unit test for `app/campaigns/page.tsx` (or a co-located test file following existing repo convention, e.g. under `tests/unit/`) asserting: the rendered campaign card contains a link labeled "Encounters" with the correct `href`, a link labeled "Start Combat" with the correct `href`, and no link labeled "Start Encounter" or pointing to `/encounters`. Covers the same spec requirement as Task B.
- [x] **Task D — Confirm existing API test coverage satisfies #541's unit/integration requirement (verification only, no new test code):** open and read `tests/unit/api/campaigns/[id]/encounters/route.test.ts` and `tests/unit/api/campaigns/[id]/encounters/[encounterId]/route.test.ts`; confirm they cover: DM links an owned encounter, linking twice is idempotent, linking an unowned encounter is rejected, player cannot link, DM unlinks, unlinking a non-linked encounter is a no-op success, player cannot unlink, list returns linked encounters (DM and player member), non-member is rejected, empty `encounterIds` returns empty list. If any of these scenarios is missing from the existing tests, STOP and report the gap — this is a Change Control scope change (add the missing scenario as a new task) rather than something to silently patch. If all scenarios are present, no new test code is written for this task; note the confirmation in the PR description.
- [x] **Task E — New E2E spec file `tests/e2e/campaign-combat-linking.spec.ts`:** create three scenarios per `specs/campaign-nav-encounter-fix/spec.md`:
  - "Start Combat routes to campaign combat setup, not the global encounter browser" — from `/campaigns`, click "Start Combat" on a campaign card, assert the URL is `/campaigns/{id}/combat` and the campaign-scoped `CombatSetupView` renders.
  - "Linking and unlinking an encounter updates the combat-setup picker" — link an existing owned encounter via `/campaigns/{id}/encounters`, confirm it appears in the "From Library" panel at `/campaigns/{id}/combat`; unlink it, confirm it disappears from that panel but is still present on `/encounters`. Assert on final settled UI state (list membership), not fixed waits, per design Decision 4 / NFAC reliability requirement.
  - "Ad hoc combat Quick Entry is unaffected by campaign scoping" — navigate directly to `/combat`, add combatants via Quick Entry, start combat, assert the active combat screen renders, independent of any campaign's linked-encounter state.
  Covers spec requirements "ADDED E2E coverage confirms linking and unlinking an encounter updates the campaign-scoped combat-setup picker" and "ADDED E2E coverage confirms ad hoc combat with zero linked encounters is unaffected by campaign scoping", plus the Start Combat routing scenario.
- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch — reuse existing E2E fixture/setup helpers already used by `tests/e2e/campaigns.spec.ts` and `tests/e2e/combat.spec.ts` (auth setup, campaign/encounter creation helpers) rather than duplicating them in the new spec file.
- [x] Confirm all scenarios in `specs/campaign-nav-encounter-fix/spec.md` are covered by Tasks B–E (walk the scenario list against the tasks above).

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests: `npm run test:unit` and `npm run test:integration` — confirm the existing campaign-encounters API tests (Task D) and the new campaign-list-page test (Task C) all pass
- [x] Run E2E tests: `npm run test:e2e` — confirm the three new scenarios in `tests/e2e/campaign-combat-linking.spec.ts` pass; run the new spec file with repeated execution locally (e.g. `--repeat-each=3`) to catch flakiness before it reaches CI
- [x] Run type checks: `npm run typecheck`
- [x] Run build: `npm run build`
- [x] Run lint: `npm run lint`
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only main` and check whether every changed file ends in `.md`. This change touches `.tsx`/`.ts` files (`app/campaigns/page.tsx`, new/updated unit test, new E2E spec), so the **full path** applies.

**Full path:**

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e` (or `npm run test:regression` if that is the project's gating command); all tests must pass, including the three new scenarios
- **Build** — `npm run build`; build must succeed with no errors

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `campaign-nav-fix-and-encounter-tests` to `main`. **PR body MUST include both `Closes #540` and `Closes #541`** so both issues close on merge. The PR description should note explicitly that #541's API unit/integration test requirement was satisfied by pre-existing tests (cite the two file paths) rather than new tests added by this PR, and that the in-progress-campaign-banner E2E scenario originally listed under #541 is intentionally excluded (blocked on open issue #539).
- [ ] **Issue lifecycle: mark in-review (both issues)** — run `gh issue edit 540 --add-label "in-review" --remove-label "in-progress" --repo dougis-org/session-combat` and `gh issue edit 541 --add-label "in-review" --remove-label "in-progress" --repo dougis-org/session-combat`. Then move both project items to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — never wait for a human to report the merge; never force-merge:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent executing this tasks.md (via `/opsx:apply`)
- Reviewer(s): `pr-review-toolkit:review-pr` sub-agent (automated); human reviewer per repo branch-protection rules
- Required approvals: per repo branch-protection settings on `main`

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none expected beyond this openspec change itself; confirm no README/CLAUDE.md references to the old "Start Encounter" link need updating)
- [ ] Sync approved spec deltas into `openspec/specs/campaign-nav-encounter-fix/spec.md`. After copying, update relative links that pointed into the change directory — replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-campaign-nav-fix-and-encounter-tests/design.md`, and similarly for `../../tasks.md`.
- [ ] Archive the change: move `openspec/changes/campaign-nav-fix-and-encounter-tests/` to `openspec/changes/archive/YYYY-MM-DD-campaign-nav-fix-and-encounter-tests/` and stage both the new location and the deletion of the old location in a single commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-campaign-nav-fix-and-encounter-tests/` exists and `openspec/changes/campaign-nav-fix-and-encounter-tests/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-campaign-nav-fix-and-encounter-tests` then `git push -u origin doc/archive-YYYY-MM-DD-campaign-nav-fix-and-encounter-tests`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-campaign-nav-fix-and-encounter-tests` to `main` with title `docs: archive campaign-nav-fix-and-encounter-tests (YYYY-MM-DD)` — do NOT push directly to `main`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D campaign-nav-fix-and-encounter-tests doc/archive-YYYY-MM-DD-campaign-nav-fix-and-encounter-tests`
- [ ] Remove the change's dedicated worktree: `git worktree remove .worktrees/campaign-nav-fix-and-encounter-tests`

Required cleanup after archive: `git fetch --prune` and `git branch -D campaign-nav-fix-and-encounter-tests doc/archive-YYYY-MM-DD-campaign-nav-fix-and-encounter-tests`
