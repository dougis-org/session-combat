# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b fix-campaign-subnav-theming` then immediately `git push -u origin fix-campaign-subnav-theming`

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If not found, halt immediately, inform the user that the `pr-review-toolkit` plugin is required, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Issue lifecycle: mark in-progress**: run `gh issue edit 484 --add-label "in-progress"`. Then discover the GitHub Project linked to `dougis-org/session-combat` via `gh project list --owner dougis-org --format json`, resolve the status field option semantically matching "In Progress" via `gh project field-list <project-number> --owner dougis-org --format json`, and move the item via `gh project item-edit`. If no project item is found for issue #484, log a warning and continue. If the `gh` token lacks the `project` scope, instruct the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).

- [x] **Task 1 — `app/campaigns/[id]/layout.tsx`: centralize background, restyle tabs**
  - Wrap the layout's rendered output in a single dark surface: `<div className="bg-gray-900 min-h-screen text-white">{header}{nav}{children}{chat}</div>` in the default branch, so header, nav, content, and the `CampaignChat` panel share one themed ancestor.
  - In the `isChatLarge` branch, add `bg-gray-900 text-white` to the outer `<div className="flex h-screen overflow-hidden">` container (not just `<main>`), so `<main>` and the chat panel share the same themed ancestor there too.
  - Update the tab-rendering `.map()`: replace `${isActive ? 'border-b-2 border-blue-400 text-white' : 'text-gray-400'} px-2 py-1` with `${isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'} px-3 py-1.5 rounded-md text-sm font-medium transition-colors`.
  - Do not change `usePathname()`-based active-route matching logic.

- [x] **Task 2 — `app/campaigns/[id]/page.tsx`: remove duplicate background wrapper**
  - Remove the outer `min-h-screen bg-gray-900 text-white` wrapper div (line ~218); keep any inner container/padding divs intact.

- [x] **Task 3 — `app/campaigns/[id]/sessions/page.tsx`: remove duplicate background wrapper**
  - Remove the outer `min-h-screen bg-gray-900 text-white` wrapper div (line ~386); keep any inner container/padding divs intact.

- [x] **Task 4 — `app/campaigns/[id]/prompts/page.tsx`: remove duplicate background wrapper**
  - Remove `min-h-screen bg-gray-900 text-white` from both the loading-state wrapper (line ~231) and the main content wrapper (line ~240); keep the inner `container mx-auto px-4 py-8` divs intact.

- [x] **Task 5 — `app/campaigns/[id]/library/page.tsx`: remove duplicate background wrapper**
  - Remove the outer `min-h-screen bg-gray-900 text-white` wrapper div (line ~217); do **not** touch the unrelated inner `bg-gray-900` classes on the `<pre>` (line ~35) or `<textarea>` (line ~50) elements — those are nested content styling, not the page-level background.

- [x] **Task 6 — `app/campaigns/[id]/combat/page.tsx`: remove duplicate background wrapper**
  - In the loading-state div (line ~12), remove `min-h-screen bg-gray-900` while keeping `flex items-center justify-center text-white` so the loading text stays centered and legible against the now-centralized layout background.

- [x] **Task 7 — Manual/visual verification across both `isChatLarge` states**
  - Run the dev server and visit `/campaigns/[id]`, `/sessions`, `/prompts`, `/library`, and `/combat` for a test campaign.
  - Confirm no visible seam between header/nav and page content on any route.
  - Confirm the active tab renders as a solid `bg-blue-600` chip and is legible; confirm inactive tabs show plain gray text with no leftover underline.
  - Expand chat to large mode (if reachable via existing UI trigger) and repeat the seam/tab checks in that layout branch.
  - Confirm a short-content page (e.g., an empty Library) still fills the viewport with the dark background (no white gap at the bottom).

- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch (none expected here — this is a pure Tailwind class change reusing existing patterns already present in Prompt Builder's sub-tabs)
- [x] Confirm acceptance criteria in `specs/campaign-subnav/spec.md` are covered by the above tasks

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests: `npm run test:unit`
- [x] Run E2E tests (if applicable to campaign-subnav coverage): `npm run test:e2e`
- [x] Run type checks: `npm run typecheck`
- [x] Run build: `npm run build`
- [x] Run lint: `npm run lint`
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against `main`) and check whether every changed file ends in `.md`. This change touches `.tsx` files, so the **full path** applies.

**Full path:**

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e` (or `npm run test:regression` if E2E coverage exists for `/campaigns/[id]/*` nav); all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `fix-campaign-subnav-theming` to `main`. The PR body MUST include `Closes #484`.
- [ ] **Issue lifecycle: mark in-review**: run `gh issue edit 484 --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge). Per project convention, use squash merge since the repo ruleset only allows squash.
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved. After replying to a comment, also resolve the thread via the `resolveReviewThread` GraphQL mutation, per project convention.
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: dougis (via agent-assisted implementation)
- Reviewer(s): PR reviewers assigned via `pr-review-toolkit:review-pr` and any human reviewers added to the PR
- Required approvals: standard branch protection rules for `main`

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved (reply + resolve thread)

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none expected beyond the OpenSpec artifacts themselves)
- [ ] Sync approved spec deltas into `openspec/specs/campaign-subnav/spec.md`. After copying `specs/campaign-subnav/spec.md` to `openspec/specs/campaign-subnav/spec.md`, update all relative links that pointed into the change directory so they resolve from the archive location — replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-fix-campaign-subnav-theming/design.md`, and similarly for any `../../tasks.md` references.
- [ ] Archive the change: move `openspec/changes/fix-campaign-subnav-theming/` to `openspec/changes/archive/YYYY-MM-DD-fix-campaign-subnav-theming/` **and stage both the new location and the deletion of the old location in a single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-fix-campaign-subnav-theming/` exists and `openspec/changes/fix-campaign-subnav-theming/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-fix-campaign-subnav-theming` then `git push -u origin doc/archive-YYYY-MM-DD-fix-campaign-subnav-theming` (this branch contains only `.md` changes — no code fixes belong here, per project convention)
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-fix-campaign-subnav-theming` to `main` with title `docs: archive fix-campaign-subnav-theming (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D fix-campaign-subnav-theming doc/archive-YYYY-MM-DD-fix-campaign-subnav-theming`

Required cleanup after archive: `git fetch --prune` and `git branch -D fix-campaign-subnav-theming doc/archive-YYYY-MM-DD-fix-campaign-subnav-theming`
