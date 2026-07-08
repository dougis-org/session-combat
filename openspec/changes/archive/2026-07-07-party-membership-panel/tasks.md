# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feature/party-membership-panel` then immediately `git push -u origin feature/party-membership-panel`

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Issue lifecycle: mark in-progress**: run `gh issue edit 472 --repo dougis-org/session-combat --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds). **Note:** `in-progress` label does not exist in this repo and `gh` token lacks `project` scope — both logged as warnings, non-blocking.
- [x] **Add `GET /api/campaigns/[id]/parties/route.ts`**: `withAuthAndParams<{ id: string }>` handler; require `storage.getMember(id, auth.userId)` to exist with `status === 'active'` (any role) or return 403/404; on success return `storage.loadPartiesByCampaign(id)` as JSON; on storage error return 500 with a generic body. (Design Decision 1; specs/party-management/spec.md)
- [x] **Write tests for the GET route first** (integration test, following existing patterns in `tests/integration/api/campaignPartyMembers.test.ts`): active member of any role gets 200 with parties array; non-member gets 403/404 with empty body; inactive member gets 403/404; campaign with zero parties gets 200 with `[]`; storage failure gets 500.
- [x] **Add `lib/components/PartyMembershipPanel.tsx`**: props `{ campaignId: string; party: Party; characters: Character[] }` (characters = the current player's own characters only). Derive `activeIds` from `party.members` filtered to the player's own character ids with no `leftAt`. Render a checkbox list; on toggle, optimistically update local state, disable the toggled character's checkbox while in flight, `PUT /api/campaigns/{campaignId}/members/{myUserId}/parties/{party.id}` with the full updated `characterIds` array, revert on failure. Mirror the existing optimistic-update pattern already used in `lib/components/SharedCharactersPanel.tsx`. (Design Decisions 2 & 3; specs/party-membership-panel/spec.md)
- [x] **Write component tests first** for `PartyMembershipPanel` (following `tests/unit/components/SharedCharactersPanel.test.tsx` conventions): renders a checkbox per own character; checking calls PUT with expected `characterIds`; unchecking calls PUT excluding the character; failed PUT reverts the checkbox; two independent `PartyMembershipPanel` instances (two parties) do not affect each other's state; empty-characters state renders a message with no checkboxes.
- [x] **Wire the panel into the campaign page** (`app/campaigns/[id]/page.tsx`): fetch `GET /api/campaigns/{id}/parties` and the player's own characters (existing `/api/characters` filtered to `userId === auth.userId`, or reuse an existing characters fetch already on the page if present); render one `PartyMembershipPanel` per party, keyed by `party.id`. If the campaign has zero parties, render nothing or an empty-state message (no crash).
- [x] **Write/extend a test for the campaign page render** confirming one panel section appears per party and that the section is absent when there are zero parties.
- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch (confirmed reuse: `withAuthAndParams`, `storage.getMember`, `storage.loadPartiesByCampaign`, the existing PUT endpoint from #471, and the optimistic-toggle pattern from `SharedCharactersPanel`).
- [x] Confirm all acceptance criteria in `specs/party-management/spec.md` and `specs/party-membership-panel/spec.md` are covered by the tests written above.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit. **Result:** zero complexity/duplication/quality issues found.

## Validation

- [x] Run unit/integration tests
- [x] Run E2E tests (if applicable) — ran `campaigns.spec.ts` and `parties.spec.ts` as targeted regression, 32/32 passed
- [x] Run type checks
- [x] Run build
- [x] Run security/code quality checks required by project standards — `npm run lint` clean (0 errors)
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. This change is expected to be code-affecting (new route + component), so apply the full path unless the diff review shows otherwise.

**Full path** (any non-`.md` file changed):

- **Unit tests** — run the project's unit test suite; all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass
- **Build** — run the project's build script; build must succeed with no errors

**Docs-only path** (every changed file is `.md`):

- **Build** — run the project's build script; build must succeed with no errors
- Skip integration and regression/E2E tests — they are not required when no code changed

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

Use the project's documented commands for each of the above (see project README or CLAUDE.md / AGENTS.md).

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `feature/party-membership-panel` to `main`. The PR body MUST include `Closes #472`. (PR #481)
- [x] **Issue lifecycle: mark in-review**: run `gh issue edit 472 --repo dougis-org/session-combat --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [x] Wait 60 seconds for CI to start
- [x] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing. (2 rounds of review comments addressed per commit history)
- [x] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [x] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**: (PR #481 merged via #4016615)
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: dougis
- Reviewer(s): pr-review-toolkit:review-pr (automated), dougis (final approval)
- Required approvals: 1 (per repo branch protection)

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on `main`
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Update repository documentation impacted by the change (none expected beyond OpenSpec artifacts; confirmed no README/CLAUDE.md references need updating)
- [x] Sync approved spec deltas into `openspec/specs/`: copy `specs/party-management/spec.md` requirement additions into `openspec/specs/party-management/spec.md`, and create `openspec/specs/party-membership-panel/spec.md` from `specs/party-membership-panel/spec.md`. Update relative links that pointed into the change directory so they resolve from the archive location — replace `../../design.md` with `../../changes/archive/2026-07-07-party-membership-panel/design.md`, and similarly for `../../tasks.md`.
- [x] Archive the change: move `openspec/changes/party-membership-panel/` to `openspec/changes/archive/2026-07-07-party-membership-panel/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [x] Confirm `openspec/changes/archive/2026-07-07-party-membership-panel/` exists and `openspec/changes/party-membership-panel/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-2026-07-07-party-membership-panel` then `git push -u origin doc/archive-2026-07-07-party-membership-panel`
- [ ] Open a PR from `doc/archive-2026-07-07-party-membership-panel` to `main` with title `docs: archive party-membership-panel (2026-07-07)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D feature/party-membership-panel doc/archive-2026-07-07-party-membership-panel`

Required cleanup after archive: `git fetch --prune` and `git branch -D feature/party-membership-panel doc/archive-YYYY-MM-DD-party-membership-panel`
