# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b fix/443-active-session-controls` then immediately `git push -u origin fix/443-active-session-controls`

## Preflight

- [x] **Verify a PR-review-automation skill is available** — check the available skills list for `pr-review-toolkit:review-pr` (or an equivalent PR-ownership skill such as `pr-reviewer`, depending on the agent configuration in use). If none is listed, halt immediately, inform the user that the tooling is required, provide installation guidance, and do not proceed until the user confirms it is installed. (Satisfied via the `pr-reviewer` skill in the agent configuration used for this change; treat this as a check for *some* PR-review-automation tooling, not a hard dependency on that exact skill name.)

## Execution

- [x] **Issue lifecycle: mark in-progress** — this change is issue-driven (#443, secondary refs #400/#317). Run `gh issue edit 443 --repo dougis-org/session-combat --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, instruct the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds). (Token lacked `read:project` scope; issue label applied, project item update skipped per fallback instructions.)
- [x] **T1 — `useIsDM` hook** (Decision 2): Add `lib/hooks/useIsDM.ts` fetching `GET /api/campaigns/[id]/members/me` (the caller's own membership only), computing `isDM = role === 'dm' && status === 'active'` from that response. Defers the fetch until `useAuth()` finishes loading and short-circuits to `false`/`not loading` if auth resolves with no user. Returns `{ isDM: boolean; loading: boolean }`.
  - Look for existing tooling first: reuse `useAuth` (`lib/hooks/useAuth.ts`) and the existing `/members/me` endpoint (`app/api/campaigns/[id]/members/me/route.ts`) — do not invent a new members-fetch utility, and prefer this single-member endpoint over the full `/members` roster fetch already used by `app/campaigns/[id]/page.tsx` and `CampaignChat` to avoid a redundant full-roster fetch.
  - Write failing unit tests first (TDD): DM+active member -> `isDM: true`; player member -> `false`; DM but `status !== 'active'` -> `false`; current user not a member (404 from `/members/me`) -> `false`; loading state before fetch resolves; auth still loading -> `false`/`loading: true`, no fetch; auth resolved with no user -> `false`/`loading: false`, no fetch.
- [x] **T2 — `SessionControl` component** (Decisions 1, 3, 4): Add `lib/components/SessionControl.tsx`. Props: `campaignId: string`, `activeSessionId: string | null`, `onSessionChange: (id: string | null) => void`. Internally uses `useIsDM(campaignId)`; renders `null` while loading or when `!isDM`. Renders "Start Session" when `activeSessionId === null`, "End Session" + a secondary "Force end (recovery)" affordance when non-null. Local state limited to `busy: boolean` and `error: string | null` — no independent session-id state (per Decision 3).
  - Write failing unit tests first (TDD) covering: renders nothing for non-DM/loading; Start Session click -> `POST /api/campaigns/[id]/sessions/active`, on 201 calls `onSessionChange(newId)`; Start Session 409 -> re-fetches `GET /api/campaigns/[id]`, calls `onSessionChange` with the fetched value, no error text; Start Session other failure (e.g. 500) -> inline error shown, `onSessionChange` not called; End Session click -> `DELETE .../sessions/active` (no `force` param), on 200 calls `onSessionChange(null)`; End Session 404 -> calls `onSessionChange(null)`, no error text; End Session other failure -> inline error shown; Force end click -> `DELETE .../sessions/active?force=true`, on success calls `onSessionChange(null)`.
- [x] **T3 — Wire `SessionControl` into `CampaignLayout` header** (Decision 1): Edit `app/campaigns/[id]/layout.tsx` to render `<SessionControl campaignId={id} activeSessionId={activeSessionId} onSessionChange={setActiveSessionId} />` inside the existing `header` block (next to the campaign name `<h1>`), reusing the `header` variable already shared by both the compact and `isLarge` return branches so it appears on every tab in both layouts.
  - Write/extend a `CampaignLayout` test (or reuse `SessionControl`'s own tests plus a thin integration test) asserting the control renders in the header for both layout branches and that `activeSessionId` propagated from `onSessionChange` also reaches `CampaignChat`/`RollEntryStrip` consistently (Decision 3 / NFR "Control state matches RollEntryStrip state").
- [x] **T4 — Reactive SSE scenario coverage**: Add/extend a test exercising the existing `session` SSE path (simulate `CampaignChat` invoking `onSessionChange` as it already does today) and assert `SessionControl`'s displayed state flips accordingly with no additional fetch triggered by `SessionControl` itself (spec scenario "Control updates reactively on session SSE event"). No production code change expected here — this is a regression/characterization test proving existing plumbing plus the new consumer behave correctly together.
- [x] **T5 — Confirm acceptance criteria coverage**: Walk `openspec/changes/add-active-session-controls/specs/session-controls/spec.md` scenario-by-scenario and confirm each has a corresponding automated test from T1–T4 (see `tests.md` for the authoritative mapping once created).
- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch (explicitly checked in T1/T2 above: reuse `useAuth`, existing `/members` endpoint, existing error-display convention from `RollEntryStrip`)
- [x] Confirm acceptance criteria are covered

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests
- [x] Run E2E tests (if applicable) (the repo's Playwright E2E/regression suite under `tests/e2e/` via `npm run test:regression` was run as part of CI/remote-push validation; no new E2E coverage was added specifically for this feature, since T1/T2 unit tests and the T3/T4 integration-style tests already cover its scenarios)
- [x] Run type checks
- [x] Run build
- [x] Run security/code quality checks required by project standards (lint clean)
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. If yes, apply the docs-only path; otherwise apply the full path. (This change adds `.tsx`/`.ts` files, so the full path applies.)

**Full path** (any non-`.md` file changed):

- **Unit tests** — `npm run test:unit` (this project's documented unit test command); all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Regression / E2E tests** — `npm run test:regression`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

Use the project's documented commands for each of the above (see project README or CLAUDE.md / AGENTS.md).

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `fix/443-active-session-controls` to `main`. PR body MUST include `Closes #443` (and reference #400/#317 as related context, not `Closes`, since they are not the bugs this change closes).
- [ ] **Issue lifecycle: mark in-review**: run `gh issue edit 443 --repo dougis-org/session-combat --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent executing `/opsx:apply` for this change (session initiated by dougis)
- Reviewer(s): `pr-review-toolkit:review-pr` sub-agent (automated gate) + dougis (human, standard project review)
- Required approvals: standard branch protection for `main` (no admin bypass; see project policy — never push directly to protected branches, never use `--admin` merge overrides)

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none anticipated beyond openspec artifacts — no `docs/multi-user-campaigns/*` files describe UI controls for this route today; add a short note there if one is added during implementation)
- [ ] Sync approved spec deltas into `openspec/specs/session-controls/spec.md` (new capability directory). After copying `spec.md`, update relative links that pointed into the change directory so they resolve from the archive location — replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-add-active-session-controls/design.md`, and similarly for `../../tasks.md`.
- [ ] Archive the change: move `openspec/changes/add-active-session-controls/` to `openspec/changes/archive/YYYY-MM-DD-add-active-session-controls/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-add-active-session-controls/` exists and `openspec/changes/add-active-session-controls/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-add-active-session-controls` then `git push -u origin doc/archive-YYYY-MM-DD-add-active-session-controls`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-add-active-session-controls` to `main` with title `docs: archive add-active-session-controls (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D fix/443-active-session-controls doc/archive-YYYY-MM-DD-add-active-session-controls`

Required cleanup after archive: `git fetch --prune` and `git branch -D fix/443-active-session-controls doc/archive-YYYY-MM-DD-add-active-session-controls`
