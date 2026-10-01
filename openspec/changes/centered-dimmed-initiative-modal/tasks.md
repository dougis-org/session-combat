# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git fetch origin` and base the work on `origin/main` (done when the worktree was created)
- [x] **Step 2 — Create and publish working branch:** worktree `.worktrees/centered-dimmed-initiative-modal`, branch `centered-dimmed-initiative-modal`, pushed with `git push -u origin centered-dimmed-initiative-modal`

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [ ] Confirm the dedicated worktree `.worktrees/centered-dimmed-initiative-modal` exists and `cd` into it; confirm the branch is on the remote (`git push -u origin centered-dimmed-initiative-modal` if not). Never check out another branch in the primary checkout.
- [ ] **Issue lifecycle: mark in-progress** (#807): run `gh issue edit 807 --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, tell the user to run `gh auth refresh -s project` and skip the project-item update (the label update still proceeds).
- [ ] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic (e.g. body-scroll-lock pattern in `lib/components/Modal.tsx`).
- [ ] Follow strict TDD per `tests.md`: write the failing test, make it pass, refactor.

### 1. Focus-trap hook (design Decision 5)

- [ ] 1.1 Add `lib/hooks/useFocusTrap.ts`: on activation remember `document.activeElement`, focus the first tabbable descendant (fallback: container with `tabIndex={-1}`); wrap Tab/Shift+Tab at the ends; on deactivation restore focus if the remembered element is still in the document; expose a way to re-focus the first control when a key (the combatant id) changes without restoring focus in between. Do not handle Escape.

### 2. Hook simplification (design Decision 4)

- [ ] 2.1 In `lib/hooks/useInitiativeModal.ts`: remove `initiativeEditPosition`, `initiativeModalRef`, `getCardAnchorPosition`, `remeasureInitiativeModal`, `MODAL_VIEWPORT_MARGIN`, `clampModalToViewport`, and the `ResizeObserver`/scroll/resize effect; change `openInitiativeModal` to take `id: string | null` only; auto-open and manual open no longer require a card element. Keep the dismissal set, auto-open effect, removed-combatant recovery effect, `handleSetInitiative`, and `closeInitiativeModal`.
- [ ] 2.2 Update the `UseInitiativeModalResult` / args types and the file's header comment to match.

### 3. Modal markup (design Decisions 1, 2, 3, 6, 7)

- [ ] 3.1 In `lib/components/ActiveCombatView.tsx`: replace the absolutely positioned modal `div` with the backdrop (`fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-black/40`, `data-testid="initiative-modal-backdrop"`) containing the dialog (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `w-max max-w-full`, existing surface classes, `data-testid="initiative-modal"`, no inline position/width/transform). Keep the backdrop mounted while `initiativeEditId` is set and key only `InitiativeEntry` by combatant id. Wire `useFocusTrap` to the dialog and add the body scroll lock with restore. Update `onSetInitiative` to `openInitiativeModal(id)`. Remove the unused destructured bindings.
- [ ] 3.2 In `lib/components/InitiativeEntry.tsx`: remove the `onModeChange` prop and its notifying effect; remove `max-h-[70vh] overflow-y-auto` from the controls column (keep `p-1`); add id props for the "Set Initiative" heading and the name heading; let the name wrap (`break-words`).
- [ ] 3.3 Check the render site's ancestors for `transform`/`filter` that would break `fixed`; portal to `document.body` only if one exists. Check stacking against the detail panel and remove-confirm popup.

### 4. Tests (see `tests.md`)

- [ ] 4.1 Remove tests for anchoring, clamping, scroll-aware clamp, and re-measure in `tests/unit/components/ActiveCombatView.test.tsx` and `tests/unit/hooks/useInitiativeModal.test.tsx`; remove the `onModeChange` tests in `tests/unit/combat/initiativeEntry.test.tsx`.
- [ ] 4.2 Add the new unit tests (hook, backdrop, classes, accessibility, focus) and the Playwright long-name/keyboard test in `tests/e2e/combat-core.spec.ts` or a new `tests/e2e/combat-initiative-modal.spec.ts`.

### 5. Documentation

- [ ] 5.1 Update `.wolf/anatomy.md` descriptions for changed/new files (`useFocusTrap.ts`, `useInitiativeModal.ts`, `ActiveCombatView.tsx`, `InitiativeEntry.tsx`) and append to `.wolf/memory.md`.
- [ ] 5.2 Confirm the delta spec in `openspec/changes/centered-dimmed-initiative-modal/specs/modal-initiative-entry/spec.md` still matches the implemented behavior; update artifacts first if scope changed.

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [ ] Run unit tests: `npm run test:unit`
- [ ] Run integration tests: `npm run test:integration`
- [ ] Run E2E tests on a free port (not 3000): `npm run test:e2e`
- [ ] Run type checks: `npm run typecheck`
- [ ] Run lint: `npm run lint`
- [ ] Run build: `npm run build`
- [ ] Run security/code quality checks required by project standards (Codacy / Verity gate); fix findings, do not waive without an explicit human-accepted risk
- [ ] Manually verify at a desktop width (about 1400px) and a narrow width with a very long character name: no scrollbar, centered, faint dim, Tab cycles inside, focus returns on close
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. If yes, apply the docs-only path; otherwise apply the full path.

**Full path** (any non-`.md` file changed):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e` (free port, not 3000); all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

**Docs-only path** (every changed file is `.md`):

- **Build** — `npm run build`; build must succeed with no errors
- Skip integration and regression/E2E tests — they are not required when no code changed

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `centered-dimmed-initiative-modal` to `main`. The PR body MUST include `Closes #807`.
- [ ] **Issue lifecycle: mark in-review**: run `gh issue edit 807 --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same discovery as the in-progress step; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --squash` (main is squash-only; NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks (`ci-gate`, Codacy), commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: doug@dougis.com (with Claude Code)
- Reviewer(s): `pr-review-toolkit:review-pr` gate, then GitHub review
- Required approvals: 0 (ruleset); `ci-gate` and Codacy must pass

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] From the primary checkout: `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change
- [ ] Sync approved spec deltas into `openspec/specs/modal-initiative-entry/spec.md` (`openspec archive` aborts on malformed live specs; this one validates, but use `--skip-specs` and hand-merge if it complains). Update relative links that pointed into the change directory so they resolve from the archive location: `../../design.md` → `../../changes/archive/YYYY-MM-DD-centered-dimmed-initiative-modal/design.md`, and similarly for `../../tasks.md`.
- [ ] Archive the change: move `openspec/changes/centered-dimmed-initiative-modal/` to `openspec/changes/archive/YYYY-MM-DD-centered-dimmed-initiative-modal/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-centered-dimmed-initiative-modal/` exists and `openspec/changes/centered-dimmed-initiative-modal/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-centered-dimmed-initiative-modal` then `git push -u origin doc/archive-YYYY-MM-DD-centered-dimmed-initiative-modal`
- [ ] Open a PR from the doc branch to `main` with title `docs: archive centered-dimmed-initiative-modal (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash` (NEVER use `--admin`)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Remove the change's worktree with `git worktree remove --force .worktrees/centered-dimmed-initiative-modal` (`--force` is needed because of the `openspec-shared` submodule) and prune: `git fetch --prune` and `git branch -D centered-dimmed-initiative-modal doc/archive-YYYY-MM-DD-centered-dimmed-initiative-modal`
