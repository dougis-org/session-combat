# Tasks

## Preparation

- [ ] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [ ] **Step 2 — Create and publish working branch:** `git checkout -b campaign-encounters-management-screen` then immediately `git push -u origin campaign-encounters-management-screen`

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [ ] **Step 1 — Confirm/create dedicated worktree:** confirm `.worktrees/campaign-encounters-management-screen` exists (created during propose, if that convention was followed) and `cd` into it. If it does not exist, create it now from the primary checkout: fetch `main` and run `git worktree add .worktrees/campaign-encounters-management-screen -b campaign-encounters-management-screen origin/main`. All implementation work below happens inside this worktree, never in the primary checkout.
- [ ] **Step 2 — Confirm branch is pushed:** verify `campaign-encounters-management-screen` exists on `origin`; if not, `git push -u origin campaign-encounters-management-screen` from inside the worktree before any implementation begins.
- [ ] **Issue lifecycle: mark in-progress** — run `gh issue edit 537 --add-label "in-progress" --repo dougis-org/session-combat`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [ ] **Task A — Add nav tabs to `app/campaigns/[id]/layout.tsx`:** add `{ label: 'Encounters', href: \`/campaigns/${id}/encounters\` }` and `{ label: 'Combat', href: \`/campaigns/${id}/combat\` }` to the existing nav array (after `Library`). Covers spec requirement "MODIFIED Campaign layout nav includes Encounters and Combat tabs".
- [ ] **Task B — Scaffold `app/campaigns/[id]/encounters/page.tsx`:** `ProtectedRoute`-wrapped page reading `campaignId` via `useParams()`, matching the shape of `app/campaigns/[id]/library/page.tsx` (default-exported page + inner content component taking `campaignId`).
- [ ] **Task C — Linked-encounters list + fetch-on-mount:** call `GET /api/campaigns/[id]/encounters` on mount, render list (or empty state per spec scenario "Campaign with zero linked encounters"). Covers spec requirement "ADDED Campaign encounters page lists only the current campaign's linked encounters".
- [ ] **Task D — "Link Existing Encounter" picker:** fetch `GET /api/encounters` on open, exclude already-linked ids (client-side `Set`), add case-insensitive name-search filter, render selectable rows, handle "all already linked" empty state, wire link action to `POST /api/campaigns/[id]/encounters` with `{ encounterId }`, disable the link control while in flight, refetch linked list on success, show inline error (not silent) on non-2xx. Covers spec requirements "ADDED \"Link Existing Encounter\" picker..." and "ADDED In-flight mutation buttons are disabled...".
- [ ] **Task E — "Create New Encounter" via `EncounterEditor`:** render `EncounterEditor` unmodified; host-page `onSave` handler POSTs to `/api/encounters` with `{ name, description, monsters, campaignId }`; on plain `201` success, close panel and refetch linked list; on `201` with `linkWarning` in the body, show a distinct non-blocking warning, still close the panel, still refetch. Covers spec requirement "ADDED \"Create New Encounter\" reuses EncounterEditor and links the result to the campaign".
- [ ] **Task F — "Unlink" per row:** confirm dialog (via `window.confirm`) stating the encounter will not be deleted and remains on the global Encounters list; on confirm, call `DELETE /api/campaigns/[id]/encounters/[encounterId]`, refetch linked list on success; on cancel, no request is made. Covers spec requirement "ADDED \"Unlink\" removes the campaign association without deleting the encounter".
- [ ] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch — reuse `ErrorBanner` (`lib/components/ui`) for hard errors, matching `app/campaigns/[id]/library/page.tsx`'s pattern, rather than inventing a new error-display component.
- [ ] Confirm all spec scenarios in `specs/campaign-encounter-management-ui/spec.md` are covered by the implementation above (walk the scenario list against Tasks A–F).

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [ ] Run unit/integration tests: `npm run test:unit`
- [ ] E2E: none added by this change (see `tests.md`); skip `npm run test:e2e`
- [ ] Run type checks: `npm run typecheck`
- [ ] Run build: `npm run build`
- [ ] Run lint: `npm run lint`
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only main` and check whether every changed file ends in `.md`. This change touches `.tsx` files, so the **full path** applies.

**Full path:**

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass (this change adds no new API routes, so no new integration tests are expected, but the suite must still pass unmodified)
- **Regression / E2E tests** — no E2E tests are added by this change (see `tests.md` rationale); run the existing suite (`npm run test:regression`) only if CI already gates on it for all PRs, to confirm no regression
- **Build** — `npm run build`; build must succeed with no errors

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `campaign-encounters-management-screen` to `main`. **PR body MUST include `Closes #537`.**
- [ ] **Issue lifecycle: mark in-review** — run `gh issue edit 537 --add-label "in-review" --remove-label "in-progress" --repo dougis-org/session-combat`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — never wait for a human to report the merge; never force-merge:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent executing `/opsx:apply` for this change
- Reviewer(s): `pr-review-toolkit:review-pr` sub-agent (automated) + human PR reviewer per repo branch protection
- Required approvals: per repo branch protection rules on `main` (see `CONTRIBUTING.md`); no admin bypass

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved
- If issue #540 is independently in progress and produces a conflicting diff to `app/campaigns/[id]/layout.tsx`: coordinate with whoever owns #540 before merging either PR (see proposal.md Risks); do not silently overwrite the other change's nav-array edits.

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (note in `docs/superpowers/specs/2026-08-23-campaign-encounter-linking-plan.md` that #537's scope, plus #540's nav-tab sub-scope, is complete, so a future #540 pass only needs the campaign-list button split)
- [ ] Sync approved spec deltas into `openspec/specs/`: copy `specs/campaign-encounter-management-ui/spec.md` to `openspec/specs/campaign-encounter-management-ui/spec.md`, updating the relative link to `design.md` to point to `../../changes/archive/YYYY-MM-DD-campaign-encounters-management-screen/design.md`
- [ ] Archive the change: move `openspec/changes/campaign-encounters-management-screen/` to `openspec/changes/archive/YYYY-MM-DD-campaign-encounters-management-screen/` **and stage both the new location and the deletion of the old location in a single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-campaign-encounters-management-screen/` exists and `openspec/changes/campaign-encounters-management-screen/` is gone
- [ ] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-campaign-encounters-management-screen` then `git push -u origin doc/archive-YYYY-MM-DD-campaign-encounters-management-screen`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-campaign-encounters-management-screen` to `main` with title `docs: archive campaign-encounters-management-screen (YYYY-MM-DD)` — do NOT push directly to `main`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D campaign-encounters-management-screen doc/archive-YYYY-MM-DD-campaign-encounters-management-screen`
- [ ] Remove the change's dedicated worktree: `git worktree remove .worktrees/campaign-encounters-management-screen`

Required cleanup after archive: `git fetch --prune` and `git branch -D campaign-encounters-management-screen doc/archive-YYYY-MM-DD-campaign-encounters-management-screen`
