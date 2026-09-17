# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git fetch origin main` (done during propose)
- [x] **Step 2 — Create and publish working branch:** `.worktrees/auto-scroll-next-combatant` created off `origin/main` on branch `auto-scroll-next-combatant`, pushed via `git push -u origin auto-scroll-next-combatant` (done during propose)

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [ ] **Issue lifecycle: mark in-progress** — run `gh issue edit 754 --repo dougis-org/session-combat --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [ ] Confirm working directory is `.worktrees/auto-scroll-next-combatant` before any edit
- [ ] **Schema (design Decision 3):** in `lib/preferences/schema.ts`, add `combat: { autoScrollToNextCombatant: boolean }` to `PreferenceValues`, `DEFAULT_PREFERENCES` (default `true`), `KEY_VALIDATORS["combat.autoScrollToNextCombatant"]` (`typeof v === "boolean"`), and `cloneDefaults()` — mirror the existing `chat.pinned` entry exactly
- [ ] **Schema tests:** extend `lib/preferences/schema.ts`'s existing unit test file with cases for the new key: valid boolean accepted, invalid type rejected/dropped, default resolution when absent, sparse-delta omission when equal to default (covers specs `user-preferences` scenarios "Auto-scroll preference survives logout and re-login on another device", "Default auto-scroll value is not persisted", "Malformed stored value degrades to default")
- [ ] **Client provider:** confirm `lib/preferences/usePreferences.tsx` requires no logic changes (it is generic over `KNOWN_PATHS`) — add a passthrough unit-test assertion that `combat.autoScrollToNextCombatant` round-trips through `setPreference`/local mirror like existing keys
- [ ] **API route / repo:** confirm `app/api/me/preferences/route.ts` and `lib/storage/userPreferencesRepo.ts` require no logic changes (generic patch/partition functions) — extend their existing test suites with one request/response case covering the new key
- [ ] **Combat view scroll wrapper (design Decisions 1 & 2):** in `lib/components/ActiveCombatView.tsx`, add a small isolated helper (e.g. `scrollToActiveCombatant`) plus a guard ref (e.g. `pendingAutoScrollRef`) and a `useEffect` on `[activeCombatantId]` that only acts when the ref is armed; wrap the `onNextTurn` passed to `CombatantCard`/`LairActionsSlot` so it arms the ref (only when `combat.autoScrollToNextCombatant` preference resolves `true`) immediately before calling `nextTurn()`. On fire, `document.querySelector('[data-combatant-id="<activeCombatantId>"]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })`. Do NOT modify `lib/hooks/useCombat.ts`
- [ ] **Combat view unit tests:** extend `tests/unit/components/ActiveCombatView.test.tsx` (or the relevant CombatantCard test file) with: (1) click "Current Turn (done)" with preference enabled → `scrollIntoView` called once on the new active combatant's element (mock `Element.prototype.scrollIntoView`, jsdom doesn't implement it); (2) preference disabled → not called; (3) downed combatant interposed between current and next-eligible → target is the eligible one, not the immediate DOM sibling (covers specs `combat-turn-auto-scroll` "Turn advances past a downed combatant"); (4) round wrap → target is the first eligible combatant of the new round (covers "Turn wraps to the start of the round"); (5) `restartRound` click → `scrollIntoView` NOT called; (6) combatant removal shifting indices → `scrollIntoView` NOT called
- [ ] **Profile page toggle (design Decision 4):** in `app/profile/page.tsx`, add a toggle control for `combat.autoScrollToNextCombatant` in the same section/pattern as the existing dice/chat toggles, wired through `usePreferences()`
- [ ] **Profile page tests:** extend `tests/unit/app/profile/page.test.tsx` with a scenario toggling the new preference and asserting it calls through to `usePreferences` the same way the existing dice/chat toggle tests do (covers specs `profile-settings` "Edit combat auto-scroll preference")
- [ ] **E2E:** extend `tests/e2e/combat.spec.ts` with a scenario that clicks "Current Turn (done)" in a combat with enough combatants to require scrolling, and asserts the new active combatant's card is within the viewport afterward
- [ ] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch (done during design — reuses `data-combatant-id`, the `handleSetInitiative` forward-looking-state pattern, and the generic preference pipeline; no new mechanisms introduced)
- [ ] Confirm acceptance criteria are covered: cross-check every scenario in `openspec/changes/auto-scroll-next-combatant/specs/**/*.md` against the test added for it

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [ ] Run unit/integration tests
- [ ] Run E2E tests (if applicable)
- [ ] Run type checks
- [ ] Run build
- [ ] Run security/code quality checks required by project standards
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. This change touches non-`.md` files (TypeScript/TSX), so the **full path** applies.

**Full path**:

- **Unit tests** — run the project's unit test suite; all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass
- **Build** — run the project's build script; build must succeed with no errors

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

Use the project's documented commands for each of the above (see project README or CLAUDE.md / AGENTS.md).

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `auto-scroll-next-combatant` to `main`. PR body MUST include `Closes #754`
- [ ] **Issue lifecycle: mark in-review** — run `gh issue edit 754 --repo dougis-org/session-combat --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent executing `/opsx:apply` for this change
- Reviewer(s): `pr-review-toolkit:review-pr` gate (automated), plus any human reviewer requested on the PR
- Required approvals: per repository branch ruleset for `main` (squash-only, `ci-gate` + Codacy required checks — see [[project_main_branch_squash_only_ruleset]])

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only` (from the primary checkout, not this worktree)
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none expected beyond specs)
- [ ] Sync approved spec deltas into `openspec/specs/`: create `openspec/specs/combat-turn-auto-scroll/spec.md` (new capability) from the delta, and merge the `MODIFIED Requirements` in this change's `specs/user-preferences/spec.md` and `specs/profile-settings/spec.md` into `openspec/specs/user-preferences/spec.md` and `openspec/specs/profile-settings/spec.md` respectively. Update relative links that pointed into the change directory — replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-auto-scroll-next-combatant/design.md`, and similarly for `../../tasks.md`
- [ ] Archive the change: move `openspec/changes/auto-scroll-next-combatant/` to `openspec/changes/archive/YYYY-MM-DD-auto-scroll-next-combatant/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-auto-scroll-next-combatant/` exists and `openspec/changes/auto-scroll-next-combatant/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-auto-scroll-next-combatant` then `git push -u origin doc/archive-YYYY-MM-DD-auto-scroll-next-combatant`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-auto-scroll-next-combatant` to `main` with title `docs: archive auto-scroll-next-combatant (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D auto-scroll-next-combatant doc/archive-YYYY-MM-DD-auto-scroll-next-combatant`
- [ ] Remove the change's dedicated worktree: `git worktree remove .worktrees/auto-scroll-next-combatant` (from the primary checkout)

Required cleanup after archive: `git fetch --prune` and `git branch -D auto-scroll-next-combatant doc/archive-YYYY-MM-DD-auto-scroll-next-combatant`
