# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/campaign-session-access` then immediately `git push -u origin feat/campaign-session-access`

## Execution

### Task 1 — Update Active Campaigns Dashboard session section (`app/campaigns/page.tsx`)

- [x] Locate the conditional block that renders `{lastSession && (...)}` inside the Active Campaigns Dashboard campaign card
- [x] Replace the conditional with an unconditional session section:
  - When `lastSession` exists: render the existing session card (session number, title, date, milestone badge, "View all sessions →" link)
  - When `lastSession` is null: render "No sessions logged yet." text and a "Log First Session →" `<Link href={`/campaigns/${campaign.id}/sessions`}>`
- [x] Write/update unit tests in `tests/unit/components/` covering:
  - Session section renders with session data (happy path)
  - Session section renders empty state CTA when no sessions
  - Milestone badge renders when `milestone: true`

### Task 2 — Add "Session Log" button to Active Campaigns action row (`app/campaigns/page.tsx`)

- [x] In the same file, locate the `<div className="flex flex-wrap gap-2 mt-3 mb-4">` action row inside the Active Campaigns Dashboard
- [x] Add a `<Link href={`/campaigns/${campaign.id}/sessions`}>Session Log</Link>` button, styled consistently with existing action row buttons (use green: `bg-green-600 hover:bg-green-700`)
- [x] Write/update unit tests asserting the "Session Log" link is present in the action row with the correct href

### Task 3 — Add campaign name header and tab bar to campaign layout (`app/campaigns/[id]/layout.tsx`)

- [x] Extend the existing `fetch(`/api/campaigns/${id}`)` response handling to also read and store `data?.name` in a state variable `campaignName`
- [x] Add a `usePathname()` call (import from `next/navigation`)
- [x] Render a header section above `{children}`:
  - Campaign name as an `<h1>` or `<p>` header (empty/omitted if fetch fails or name is absent)
  - Tab bar with four `<Link>` tabs: **Members** → `/campaigns/${id}`, **Sessions** → `/campaigns/${id}/sessions`, **Prompts** → `/campaigns/${id}/prompts`, **Library** → `/campaigns/${id}/library`
  - Active tab detection:
    - Members: `pathname === `/campaigns/${id}``
    - Sessions: `pathname.startsWith(`/campaigns/${id}/sessions`)`
    - Prompts: `pathname.startsWith(`/campaigns/${id}/prompts`)`
    - Library: `pathname.startsWith(`/campaigns/${id}/library`)`
  - Active tab styled with distinct highlight (e.g., `border-b-2 border-blue-400 text-white` vs `text-gray-400`)
- [x] `CampaignChat` component must still render (it's already in the layout — ensure it's not displaced)
- [x] Write unit tests for the layout covering:
  - All four tabs render
  - Correct active tab highlighted for each of the four pathnames
  - Campaign name rendered when fetch succeeds
  - Tab bar still renders when fetch fails (graceful degradation)
  - `CampaignChat` still renders

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] `npm run test` — all unit tests pass
- [x] `npm run test:integration` (if applicable) — all integration tests pass
- [x] `npm run build` — TypeScript build succeeds with no errors
- [x] `npm run lint` (if configured) — no lint errors
- [x] All tasks above marked complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` and check whether every changed file ends in `.md`. If yes, apply the docs-only path; otherwise apply the full path.

**Full path** (any non-`.md` file changed):

- **Unit tests** — `npm run test`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors

**Docs-only path** (every changed file is `.md`):

- **Build** — `npm run build`; must succeed with no errors
- Skip unit and integration tests

If **ANY** required step fails, iterate and fix before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to `feat/campaign-session-access` and push to remote
- [ ] Open PR from `feat/campaign-session-access` to `main`. PR body **MUST** include `Closes #442`
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin`)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [ ] **Iterate until merged** — repeat the following priority loop until `gh pr view <PR-URL> --json state` returns `MERGED`; if `CLOSED` exit and notify user:
  1. **Build and tests** — run all steps in [Remote push validation]; fix failures, commit, push before anything else
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address each unresolved thread, commit, run validation, push, wait 180s; repeat until all resolved
  3. **CI check failures** — after all comments resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix failing required checks, commit, run validation, push, wait 180s; restart from step 1

Ownership metadata:

- Implementer: (agent)
- Reviewer(s): @dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Sync approved spec deltas into `openspec/specs/`:
  - Copy `openspec/changes/campaign-session-access/specs/campaign-dashboard-sessions/spec.md` → `openspec/specs/campaign-dashboard-sessions/spec.md`
  - Copy `openspec/changes/campaign-session-access/specs/campaign-subnav/spec.md` → `openspec/specs/campaign-subnav/spec.md`
  - Update relative links in both copied files: replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-campaign-session-access/design.md` and `../../tasks.md` with `../../changes/archive/YYYY-MM-DD-campaign-session-access/tasks.md`
- [ ] Archive the change: move `openspec/changes/campaign-session-access/` to `openspec/changes/archive/YYYY-MM-DD-campaign-session-access/` in a **single commit** (stage both copy and deletion together)
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-campaign-session-access/` exists and `openspec/changes/campaign-session-access/` is gone
- [ ] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-campaign-session-access` then `git push -u origin doc/archive-YYYY-MM-DD-campaign-session-access`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-campaign-session-access` to `main` with title `docs: archive campaign-session-access (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin`)
- [ ] Monitor the doc PR until merged; address comments and CI failures iteratively
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D feat/campaign-session-access doc/archive-YYYY-MM-DD-campaign-session-access`
