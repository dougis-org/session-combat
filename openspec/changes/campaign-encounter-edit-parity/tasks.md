# Tasks

> Change: `campaign-encounter-edit-parity` — GitHub issue: dougis-org/session-combat#606
> All work happens in the dedicated worktree `.worktrees/campaign-encounter-edit-parity`
> on branch `campaign-encounter-edit-parity` (already created and published).
> Strict BDD/TDD: write the failing test from the spec scenario first, then implement.

## Preparation

- [x] **Step 1 — Confirm worktree + branch:** in `.worktrees/campaign-encounter-edit-parity`,
  verify `git branch --show-current` is `campaign-encounter-edit-parity` and it tracks
  `origin/campaign-encounter-edit-parity`. Rebase onto latest `origin/main`
  (`git fetch origin && git rebase origin/main`).
- [x] **Step 2 — Branch already published:** confirm `git push -u origin campaign-encounter-edit-parity`
  is in place (done during proposal). No new branch needed.
- [x] **Step 3 — Confirm submodule:** ensure `.github/openspec-shared/openspec/schemas/sdd-with-feedback-loop/`
  is present in the worktree (needed for `openspec` commands).

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list.
  If not listed, halt immediately, tell the user the `pr-review-toolkit` plugin is required,
  provide installation guidance, and do not proceed until they confirm it is installed.
- [x] **Re-read the spec deltas** (`openspec/changes/campaign-encounter-edit-parity/specs/campaign-encounter-management-ui/spec.md`)
  and confirm every scenario has a planned test below.
- [x] **Confirm no API changes are needed** — `GET /api/campaigns/[id]/encounters` returns full
  encounter objects incl. `monsters`; `PUT /api/encounters/[id]` supports the edit. If either
  assumption is wrong, stop and update `proposal.md` / `design.md` / this file before coding.
- [x] **Resolve open questions or accept defaults** — co-DM editing: gate on `isDM` only,
  non-owner save errors via the standard path. Editor note about shared-record semantics:
  omit. Proceed with these defaults unless the requester (Doug) says otherwise.

## Execution

- [x] **Issue lifecycle: mark in-progress** — run `gh issue edit 606 --add-label "in-progress"`.
  Discover the repo's GitHub Project (`gh project list --owner dougis-org --format json`),
  resolve the status field option matching "In Progress"
  (`gh project field-list <project-number> --owner dougis-org --format json`), and move the
  item via `gh project item-edit`. If no project item is found, log a warning and continue.
  If the token lacks `project` scope, tell the user to run `gh auth refresh -s project` and
  skip the project-item update (the label update still proceeds).

- [x] **Task A — Shared `EncounterCard` (Design Decision 3).** _Covers spec: "Linked-encounter
  cards show the encounter's monster roster", "MODIFIED ... lists only the current campaign's
  linked encounters" (card presentation)._
  - [x] Write component tests for a new `lib/components/EncounterCard.tsx`: renders name,
    optional description, `Monsters (N)` heading + one row per monster (name + HP/AC);
    renders an actions slot; with no monsters shows `Monsters (0)` and no rows.
  - [x] Implement `EncounterCard` as a pure presentational component (no fetch, no state),
    props roughly `{ encounter, actions?: ReactNode }` (or explicit `onEdit`/`onDelete`/`onUnlink`
    — pick the shape that keeps both call sites simplest).
  - [x] Refactor `app/encounters/EncountersContent` to render through `EncounterCard`
    (global list passes Edit + Delete). Keep existing `data-testid="encounter-card"`.
  - [x] Run existing global-encounters component tests; fix any breakage from the refactor.
  - [ ] **Fallback (only if review flags global-list regression risk as too high):** keep a
    campaign-local card mirroring the global markup instead of extracting. This is a
    pre-approved implementation fallback, not a scope change.

- [x] **Task B — DM-awareness / read-only path (Design Decision 1).** _Covers spec: "Campaign
  encounters page renders read-only for non-DM members", "MODIFIED ... " (non-DM scenario)._
  - [x] Write component tests for `app/campaigns/[id]/encounters/page.tsx` with `useIsDM`
    mocked: `{isDM:true}` → Link/Create bar + per-card Edit + Unlink present;
    `{isDM:false}` → list renders with name/description/roster, none of Link/Create/Edit/Unlink,
    no error banner; `{loading:true}` → list renders with no management controls (no
    show-then-hide).
  - [x] Consume `useIsDM(campaignId)` in `EncountersManagementContent`. Gate the Link/Create
    action bar, the picker, the `Edit` button, and the `Unlink` button on
    `isDM === true`. While `loading`, render the list without controls.

- [x] **Task C — Inline edit (Design Decision 2).** _Covers spec: "DM edits a linked encounter
  inline from the campaign encounters page" (all scenarios)._
  - [x] Write component tests: click `Edit` → `EncounterEditor` mounts with encounter data
    (`isNew={false}`); save → `PUT /api/encounters/e1` with updated `name`/`description`/`monsters`
    → on success editor closes, `GET /api/campaigns/[id]/encounters` called again, card shows
    updated text; on failure → error banner shows server `error`, editor stays open, no refetch;
    opening `Edit` on a second card closes the first editor (one editor at a time).
  - [x] Add `editingEncounter: Encounter | null` state and `handleEditSave(encounter)` that
    `PUT`s to `/api/encounters/${encounter.id}` with `{ name, description, monsters }`, and on
    success clears `editingEncounter` and calls `fetchLinked()`; on failure sets the page error
    via `ErrorBanner` and leaves the editor open. Mirror the existing `handleCreateSave`.
  - [x] Render `EncounterEditor` inline (keyed by `editingEncounter.id`) when set; wire the
    per-card `Edit` button to set `editingEncounter` and ensure `isCreatingEncounter` /
    picker are closed.
  - [x] Pass the `Edit` (and existing `Unlink`) action into `EncounterCard`; do NOT pass any
    delete action. _Covers spec: "Campaign encounters page offers no encounter-deletion action"._
  - [x] Add a component test asserting no `Delete` control and no path to `DELETE /api/encounters/[id]`
    from this page.

- [x] **Task D — Server-side authorization guard test (NFAC Security).** _Covers spec:
  "Non-owner edit attempt is rejected by the server"._
  - [x] Ensure an integration test exists (add if missing) that `PUT /api/encounters/[id]` by a
    non-owner returns `404` and does not mutate the encounter. Run via the project harness
    (`npm run test:integration`), never `jest` directly (per project standard).

- [x] **Task E — Campaign edit integration test (Reliability + functional).** _Covers spec:
  "DM edits a linked encounter and saves", "List stays consistent after a failed edit"._
  - [x] Add an integration test (harness): seed a campaign with a linked encounter owned by the
    DM, `PUT` an edit via the campaign edit path, reload linked encounters, assert the change
    persisted. Use a free port for any server (not 3000).

- [x] Confirm every spec scenario in
  `openspec/changes/campaign-encounter-edit-parity/specs/campaign-encounter-management-ui/spec.md`
  maps to a passing test.
- [x] Look for existing tooling/helpers (`useIsDM`, `EncounterEditor`, `ErrorBanner`,
  `ValidationError`, test fixtures under `tests/fixtures`) and reuse rather than re-implement.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code`
  skill against the staged + unstaged diff. The primary agent automatically applies all
  clearly-correct findings directly — without stopping, without presenting the list, without
  asking for confirmation. Apply fixes, re-run the relevant tests to confirm they pass, then commit.

## Validation

- [x] `npm run test:unit` — all pass (includes new component tests).
- [x] `npm run test:integration` — all pass (harness owns MongoDB + Next lifecycle; never run `jest` directly).
- [x] `npm run test:e2e` — ran `tests/e2e/campaign-combat-linking.spec.ts` (3) + `tests/e2e/encounters.spec.ts` (4), all pass on chromium.
- [x] `npm run typecheck` — clean.
- [x] `npm run lint` — clean.
- [x] `npm run build` — succeeds.
- [x] Run any security/code-quality checks required by project standards (`security-review` skill on the branch diff).
- [x] Manual visual parity check: parity is now guaranteed by construction — both `/encounters` and `/campaigns/[id]/encounters` render every card through the single shared `lib/components/EncounterCard.tsx`. (`openwolf designqc` not run: no `.wolf/` tooling in this worktree.)
- [ ] All completed tasks marked complete.
- [ ] All steps in [Remote push validation].

## Remote push validation

Determine whether the change is **docs-only**: `git diff --name-only origin/main...HEAD` — if every
path ends in `.md`, use the docs-only path; otherwise the full path. (This change touches `.tsx`/`.ts`,
so the full path applies.)

**Full path:**

- **Unit tests** — `npm run test:unit`; all pass.
- **Integration tests** — `npm run test:integration`; all pass.
- **Regression / E2E** — `npm run test:regression`; all pass (or documented N/A if untouched).
- **Build** — `npm run build`; succeeds with no errors.

**Docs-only path:** build only; skip integration and E2E.

If ANY required step fails, iterate and fix before pushing.

## PR and Merge

- [ ] Confirm the `openspec-review-code` sub-agent ran and all findings were addressed before the final commit.
- [ ] Commit all changes to `campaign-encounter-edit-parity` and push.
- [ ] Open PR `campaign-encounter-edit-parity` → `main`. **PR body MUST include `Closes #606`.**
  Search for a PR template (`.github/PULL_REQUEST_TEMPLATE*`) and follow it.
- [ ] **Issue lifecycle: mark in-review** — `gh issue edit 606 --add-label "in-review" --remove-label "in-progress"`,
  then move the project item to the "In Review" column (same discovery as the in-progress step; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start.
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push,
  re-run) until zero remain. If findings persist after 3+ iterations with no progress, report the
  stall with remaining findings and wait for human guidance.
- [ ] **After the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge`
  (NEVER `--admin`, never bypass branch protection).
- [ ] **Iterate until merged** — repeat until `gh pr view <PR-URL> --json state` returns `MERGED`
  (if `CLOSED`, stop and notify the user):
  1. **Build and tests** — run all [Remote push validation] steps; fix failures, commit, push first.
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; resolve every unresolved
     thread, commit fixes, re-run [Remote push validation], push, wait 180s; repeat until all resolved.
  3. **CI check failures** — only after comments are resolved, poll `gh pr checks <PR-URL>`; fix
     failing required checks, commit, re-validate, push, wait 180s; restart from step 1.

Ownership metadata:

- Implementer: _(assign at apply time)_
- Reviewer(s): Doug (dougis-org)
- Required approvals: per repo branch-protection settings (do not bypass)

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved
- If CI is blocked by unrelated infra > 1 working day → note on the PR and in the change's feedback, ask Doug how to proceed. Never bypass branch protection.

## Post-Merge

- [ ] `git checkout main` (primary checkout) and `git pull --ff-only`.
- [ ] Verify the merged changes appear on `main`.
- [ ] Mark all remaining tasks complete (`- [x]`).
- [ ] **Issue lifecycle: close** — confirm #606 auto-closed via `Closes #606`; if not, close it
  and move the project item to "Done".
- [ ] Update any repo documentation impacted by the change (`.wolf/anatomy.md`, `.wolf/memory.md`,
  `.wolf/cerebrum.md` per project conventions; README if the encounters UX is documented).
- [ ] Sync the approved spec delta into the global spec: merge
  `openspec/changes/campaign-encounter-edit-parity/specs/campaign-encounter-management-ui/spec.md`
  into `openspec/specs/campaign-encounter-management-ui/spec.md`, updating relative links
  (`../../design.md` → `../../changes/archive/YYYY-MM-DD-campaign-encounter-edit-parity/design.md`,
  same for `../../tasks.md`).
- [ ] Archive the change: move `openspec/changes/campaign-encounter-edit-parity/` to
  `openspec/changes/archive/YYYY-MM-DD-campaign-encounter-edit-parity/`, staging the new location
  and the deletion of the old in a single commit.
- [ ] Confirm the archive dir exists and `openspec/changes/campaign-encounter-edit-parity/` is gone.
- [ ] Create a doc branch `doc/archive-YYYY-MM-DD-campaign-encounter-edit-parity`, push it,
  open PR → `main` titled `docs: archive campaign-encounter-edit-parity (YYYY-MM-DD)`
  (do NOT push directly to `main`).
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`.
- [ ] Monitor the doc PR until merged (same loop as the implementation PR).
- [ ] Prune merged local branches and remove the worktree:
  `git fetch --prune`, `git worktree remove --force .worktrees/campaign-encounter-edit-parity`
  (per project note, `--force` is required when the worktree carries the openspec-shared submodule),
  `git branch -D campaign-encounter-edit-parity doc/archive-YYYY-MM-DD-campaign-encounter-edit-parity`.
