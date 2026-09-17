# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** done during propose (`git fetch origin main`, worktree branched from `origin/main` at `94ace1a6`)
- [x] **Step 2 — Create and publish working branch:** done during propose — `.worktrees/decompose-active-combat-view` on branch `decompose-active-combat-view`, pushed to `origin/decompose-active-combat-view`

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If not listed, halt, inform the user the plugin is required, provide installation guidance, and do not proceed until confirmed installed.

## Execution

- [x] Confirm the dedicated worktree exists at `.worktrees/decompose-active-combat-view` and work is happening inside it (confirmed — this session is already running from that directory)
- [x] Confirm the working branch `decompose-active-combat-view` is pushed to `origin` (confirmed above)
- [ ] **Issue lifecycle: mark in-progress** — run `gh issue edit 761 --add-label "in-progress"`. Discover the linked GitHub Project (`gh project list --owner dougis-org --format json`), resolve the "In Progress" status option (`gh project field-list <project-number> --owner dougis-org --format json`), move the item via `gh project item-edit`. If no project item is found, log a warning and continue. If `gh` lacks `project` scope, tell the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).

### Sub-task 1: Extract `useInitiativeModal` hook (Decision 1)

- [ ] Look for existing hooks in `lib/hooks/` with a similar "extract stateful UI logic" shape (e.g. patterns used in the `combatant-card-decomposition` change) to match conventions before writing new code.
- [ ] Create `lib/hooks/useInitiativeModal.ts` exporting a hook that accepts `{ combatState: UseCombatReturn['combatState'], setInitiativeRoll: UseCombatReturn['setInitiativeRoll'], updateCombatantInitiativeSettings: UseCombatReturn['updateCombatantInitiativeSettings'] }` and returns `{ initiativeEditId, initiativeEditPosition, initiativeModalRef, openInitiativeModal, handleSetInitiative, closeInitiativeModal, getCardAnchorPosition }`.
- [ ] Move verbatim (including all inline rationale comments) from `lib/components/ActiveCombatView.tsx`: `initiativeEditId`/`initiativeEditPosition` state, `initiativeModalRef`, `dismissedInitiativeIds` ref, `getCardAnchorPosition`, `openInitiativeModal`, `handleSetInitiative`, `closeInitiativeModal`, the auto-open `useEffect` (with its `unrolledCombatantIds` dependency string and eslint-disable comment), the removal-race recovery `useEffect`, and the viewport-clamp `useLayoutEffect` (including `MODAL_VIEWPORT_MARGIN`).
- [ ] Update `ActiveCombatView.tsx` to call `useInitiativeModal(...)` and use its return values everywhere the extracted state/handlers were used (the JSX that renders the modal at lines ~408–430 stays in `ActiveCombatView.tsx`, reading `combatState.combatants.find(...)` as it does today, but using the hook's `initiativeEditId`/`initiativeEditPosition`/`initiativeModalRef`).
- [ ] Confirm hook call order in `ActiveCombatView.tsx` is unchanged relative to other hooks (`useInitiativeModal` called unconditionally, in the same relative position as the extracted state used to be declared).
- [ ] Run `npx tsc --noEmit` to confirm no type errors from the extraction.

### Sub-task 2: Measure gate impact, decide on Decision 2 fallback

- [ ] Check `wc -l lib/components/ActiveCombatView.tsx` post-extraction and compare against Verity's file-length gate threshold (check `.verity/` config or prior gate failure messages on #702/#756 for the exact line-count threshold).
- [ ] If still over threshold: extract `handleConSaveRequired` and/or the remove/detail popup state wiring into a small additional hook (e.g. `useCombatantPopups`), following the same "move verbatim, preserve comments" approach as Sub-task 1. If under threshold, skip this fallback and note in the PR description that Decision 2's fallback wasn't needed.

### Sub-task 3: Split `tests/e2e/combat.spec.ts` (Decision 3)

- [ ] In `tests/e2e/helpers/actions.ts`, add the promoted `registerTestUser(page, testInfo)` helper (moved verbatim from `combat.spec.ts`) and a distinctly-named password generator for it (e.g. `randomStrongPassword()`, generated per-call — do **not** reuse or overwrite the existing `STRONG_PASSWORD` export, which other spec files depend on with its current static value).
- [ ] Create `tests/e2e/combat-import.spec.ts`: D&D Beyond import + character/party/encounter creation tests (current lines ~36–252), with its own `test.describe`, the shared `beforeEach` (`clearCookies`), and imports from `helpers/actions.ts` / `helpers/isolation.ts` / `@/tests/helpers/dndBeyondImport`.
- [ ] Create `tests/e2e/combat-core.spec.ts`: combat-screen UI elements + temp-HP tests (current lines ~261–396).
- [ ] Create `tests/e2e/combat-legendary.spec.ts`: legendary-action tests + the full end-to-end registration-to-combat flow (current lines ~397–677).
- [ ] Create `tests/e2e/combat-lair.spec.ts`: lair-action tests (current lines ~678–834).
- [ ] Verify every test from the original file appears in exactly one new file, with an unchanged name and body (mechanical move, no assertion edits).
- [ ] Delete `tests/e2e/combat.spec.ts` once all tests are confirmed migrated.
- [ ] Check each new spec file's line count against the same Verity gate threshold used in Sub-task 2; split further if any file still trips it.

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. Automatically apply all clearly-correct findings to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then commit.

## Validation

- [ ] Run unit/integration tests: `npm run test:unit`
- [ ] Run E2E tests: `npx playwright test tests/e2e/combat-import.spec.ts tests/e2e/combat-core.spec.ts tests/e2e/combat-legendary.spec.ts tests/e2e/combat-lair.spec.ts`
- [ ] Run type checks: `npx tsc --noEmit`
- [ ] Run build: `npm run build`
- [ ] Run lint: `npm run lint`
- [ ] Diff the new e2e run's pass/fail counts against a baseline run of the original `combat.spec.ts` (captured before deleting it) — same test count, same names, all green
- [ ] Confirm Verity's file-length/comprehensibility gate passes for `lib/components/ActiveCombatView.tsx` and every new `tests/e2e/combat-*.spec.ts` file
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against `main`) and check whether every changed file ends in `.md`. This change touches `.tsx`/`.ts` files, so the **full path** applies.

**Full path:**

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Regression / E2E tests** — `npm run test:regression` (or the targeted `combat-*.spec.ts` set plus a full regression pass before merge); all tests must pass
- **Build** — `npm run build`; must succeed with no errors

If **ANY** required step fails, iterate and fix before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `decompose-active-combat-view` to `main`. PR body **must** include `Closes #761`.
- [ ] **Issue lifecycle: mark in-review** — run `gh issue edit 761 --add-label "in-review" --remove-label "in-progress"`. Move the project item to the "In Review" status column via `gh project item-edit` (same discovery pattern as above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after 3+ iterations with no progress, report the stall with remaining findings and wait for human guidance.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (never `--admin`)
- [ ] **Iterate until merged** — repeat until `gh pr view <PR-URL> --json state` returns `MERGED` (or `CLOSED`, in which case exit and notify the user):
  1. **Build and tests** — run all steps in [Remote push validation]; fix failures, commit, push before anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address every unresolved thread, commit, validate, push, wait 180 seconds
  3. **CI check failures** — after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix failing required checks, commit, validate, push, wait 180 seconds; restart from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent (this session)
- Reviewer(s): `pr-review-toolkit:review-pr` automated gate + repository CODEOWNERS
- Required approvals: standard repo branch-protection rules (squash-merge only, per prior project convention)

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only` (from the primary checkout, not this worktree)
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none expected — pure structural refactor; confirm no `.wolf/anatomy.md` or similar file references the old single-file locations if such docs exist)
- [ ] `skip_specs: true` — no spec deltas to sync into `openspec/specs/`
- [ ] Archive the change: move `openspec/changes/decompose-active-combat-view/` to `openspec/changes/archive/YYYY-MM-DD-decompose-active-combat-view/`, staging both the new location and the deletion of the old location in a single commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-decompose-active-combat-view/` exists and `openspec/changes/decompose-active-combat-view/` is gone
- [ ] Create a doc branch: `git checkout -b doc/archive-YYYY-MM-DD-decompose-active-combat-view` then `git push -u origin doc/archive-YYYY-MM-DD-decompose-active-combat-view`
- [ ] Open a PR from that branch to `main` titled `docs: archive decompose-active-combat-view (YYYY-MM-DD)` — do NOT push directly to `main`
- [ ] Immediately enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (never `--admin`)
- [ ] Monitor the doc PR until merged (same loop as the implementation PR)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D decompose-active-combat-view doc/archive-YYYY-MM-DD-decompose-active-combat-view`
- [ ] Remove the change's dedicated worktree: `git worktree remove .worktrees/decompose-active-combat-view`

Required cleanup after archive: `git fetch --prune` and `git branch -D decompose-active-combat-view doc/archive-YYYY-MM-DD-decompose-active-combat-view`
