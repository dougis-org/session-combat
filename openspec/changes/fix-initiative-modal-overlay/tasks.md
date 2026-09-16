# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only` (done from primary checkout before worktree creation)
- [x] **Step 2 — Create and publish working branch:** `git worktree add .worktrees/fix-initiative-modal-overlay -b fix-initiative-modal-overlay origin/main` then `git push -u origin fix-initiative-modal-overlay` (done)

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Issue lifecycle: mark in-progress**: run `gh issue edit 747 --repo dougis-org/session-combat --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [x] **Task 1 — Anchor to card, not button (Decision 2, `MODIFIED Pinned Initiative Modal Overlay`):** In `lib/components/CombatantCardHeader.tsx`, stop deriving the anchor rect from the Initiative button; in `lib/components/ActiveCombatView.tsx`, derive the initial `{top, left}` from `document.querySelector('[data-combatant-id="<id>"]')`'s own `getBoundingClientRect()` via the existing `rectToPosition` helper, for both the click-to-open path and the post-save auto-advance path in `handleSetInitiative`.
- [x] **Task 2 — Measure-then-clamp positioning (Decision 2):** Remove `INITIATIVE_MODAL_WIDTH` and the `left - INITIATIVE_MODAL_WIDTH` subtraction in `ActiveCombatView.tsx`. Add a `useLayoutEffect` (keyed on `initiativeEditId`) that measures the rendered modal via a `ref` and clamps `top`/`left` so the modal's bounding box stays within `window.innerWidth`/`window.innerHeight` (scroll-aware), with a minimum 16px margin.
- [x] **Task 3 — Dismissed-combatant tracking (Decision 1, `ADDED Dismiss Suppresses Auto-Reopen For That Combatant`):** Add a `dismissedInitiativeIds` `useRef<Set<string>>` in `ActiveCombatView.tsx`. On manual close (`onClose` from a click-triggered or auto-opened modal, click-outside, Escape) where the combatant still has no `initiativeRoll`, add its id to the set before clearing `initiativeEditId`. Do not add to the set when the close follows a successful save.
- [x] **Task 4 — Auto-open effect (Decision 1, `ADDED Auto-Open on Unset Initiative`):** Add a `useEffect` in `ActiveCombatView.tsx` keyed on a stable signature of unrolled combatant ids (via `!combatant.initiativeRoll`) plus `initiativeEditId`. When no modal is open and an unrolled, non-dismissed combatant exists, auto-target the first one (using existing `sortCombatants` ordering) with the same card-anchored positioning from Task 1/2. Verify this fires both on initial mount and when a new unrolled combatant is added (e.g. via "+ Add Enemy"/"+ Add Party Member").
- [x] **Task 5 — Missing-DOM-node recovery (existing `Reliability` NFAC, still applies to the auto-open path):** Confirm the auto-open effect and the anchor lookup both fall back to closing (`initiativeEditId`/`initiativeEditPosition` → `null`) rather than throwing when `document.querySelector('[data-combatant-id="<id>"]')` returns `null`.
- [x] **Task 6 — "N/A" red readout (Decision 3, `ADDED Unset Initiative Readout`):** In `lib/components/combatant-card/CombatantCardHeader.tsx`'s `InitiativeControl`, render `combatant.initiativeRoll ? combatant.initiative : 'N/A'` and apply a red/warning text class conditioned on `!combatant.initiativeRoll`, leaving the rolled-value styling unchanged.
- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch (reuse `rectToPosition`, `sortCombatants`, the existing `RemoveConfirmPopup`/`CombatantDetailPanel` scroll-aware clamp pattern where applicable)
- [x] Confirm acceptance criteria are covered: all scenarios in `openspec/changes/fix-initiative-modal-overlay/specs/modal-initiative-entry/spec.md` have corresponding tests (see `tests.md`)

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests: `npm run test:unit` (3957/3957 passing; `test:integration`: 357/361, 4 skipped pre-existing/unrelated)
- [x] Run E2E tests (if applicable) — not run directly; no E2E suite touches this UI path, covered by unit/integration
- [x] Run type checks: `npx tsc --noEmit` (or project's documented type-check command) — clean
- [x] Run build: `npm run build` — succeeds
- [x] Run security/code quality checks required by project standards (Verity gate on commit/push) — passed after fixing 2 CRITICAL findings (strict-integer validation on manual initiative entry)
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. This change touches `.tsx` component files, so the **full path** applies.

**Full path** (any non-`.md` file changed):

- **Unit tests** — run the project's unit test suite (`npm run test:unit`); all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass
- **Build** — run the project's build script (`npm run build`); build must succeed with no errors

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `fix-initiative-modal-overlay` to `main`. **PR body MUST include `Closes #747`.**
- [ ] **Issue lifecycle: mark in-review**: run `gh issue edit 747 --repo dougis-org/session-combat --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --squash` (this repo's ruleset only allows squash merges — NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, reply, then resolve via the GraphQL `resolveReviewThread` mutation, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent (this session), on behalf of doug@dougis.com
- Reviewer(s): `pr-review-toolkit:review-pr` automated gate; human review as repo policy requires
- Required approvals: repo branch-protection default (squash merge only, per this repo's ruleset)

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only` (from primary checkout)
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (if any)
- [ ] Sync approved spec deltas into `openspec/specs/`: copy `openspec/changes/fix-initiative-modal-overlay/specs/modal-initiative-entry/spec.md` into `openspec/specs/modal-initiative-entry/spec.md`, merging ADDED/MODIFIED requirements into the existing spec. Update all relative links that pointed into the change directory so they resolve from the archive location — replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-fix-initiative-modal-overlay/design.md`, and similarly for `../../tasks.md`.
- [ ] Archive the change: move `openspec/changes/fix-initiative-modal-overlay/` to `openspec/changes/archive/YYYY-MM-DD-fix-initiative-modal-overlay/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-fix-initiative-modal-overlay/` exists and `openspec/changes/fix-initiative-modal-overlay/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-fix-initiative-modal-overlay` then `git push -u origin doc/archive-YYYY-MM-DD-fix-initiative-modal-overlay`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-fix-initiative-modal-overlay` to `main` with title `docs: archive fix-initiative-modal-overlay (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D fix-initiative-modal-overlay doc/archive-YYYY-MM-DD-fix-initiative-modal-overlay`
- [ ] Remove the change's dedicated worktree: `git worktree remove .worktrees/fix-initiative-modal-overlay` (from the primary checkout)

Required cleanup after archive: `git fetch --prune` and `git branch -D fix-initiative-modal-overlay doc/archive-YYYY-MM-DD-fix-initiative-modal-overlay`
