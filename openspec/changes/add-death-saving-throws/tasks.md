# Tasks

Change: `add-death-saving-throws` — GitHub issue #92 (issue-driven).
Default branch: `main`. Working branch: `add-death-saving-throws`.
Worktree: `.worktrees/add-death-saving-throws`.

Ownership metadata:

- Implementer: TBD (agent via `/opsx:apply`)
- Reviewer(s): repo owner (Doug); automated `pr-review-toolkit:review-pr` + `openspec-review-code`
- Required approvals: per `main` ruleset — 0 human approvals required, `ci-gate` + Codacy required checks must pass; auto-merge via `--squash`

## Preparation

- [ ] **Step 1 — Sync default branch:** from the primary checkout, `git fetch origin main` (do not `git checkout main` if another worktree/branch is in progress there)
- [ ] **Step 2 — Working branch already exists and is published:** `add-death-saving-throws` was created and pushed during propose; confirm with `git -C .worktrees/add-death-saving-throws status` and `git ls-remote --heads origin add-death-saving-throws`

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If not listed, halt immediately, tell the user the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.
- [ ] **Verify `openspec-review-code` is available** — required for the Pre-Commit Code Review gate.
- [ ] Confirm the worktree has the openspec-shared submodule checked out (`.worktrees/add-death-saving-throws/.github/openspec-shared` non-empty); if not, `git submodule update --init --recursive` inside the worktree.

## Execution

- [ ] **Step 1 — Confirm worktree:** confirm `.worktrees/add-death-saving-throws` exists (created during propose) and `cd` into it. Do all implementation work here. Never checkout a different branch in the primary checkout.
- [ ] **Step 2 — Confirm remote branch:** confirm `add-death-saving-throws` is pushed to `origin`; if not, `git push -u origin add-death-saving-throws` from inside the worktree before any implementation.
- [ ] **Issue lifecycle: mark in-progress** — run `gh issue edit 92 --add-label "in-progress"`. Then discover the linked GitHub Project (`gh project list --owner dougis-org --format json`), resolve the status field option matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks `project` scope, tell the user to run `gh auth refresh -s project` and skip the project-item update (the label update still proceeds).

### Types & pure logic (TDD — write failing tests first)

- [ ] **T1** Add optional fields to `CombatantState` in `lib/types.ts`: `deathSaves?: { successes: number; failures: number }` and `lifeState?: 'dying' | 'stable' | 'dead'`. Run `npm run typecheck`.
- [ ] **T2** Write `tests/unit/combat/deathSaves.test.ts` covering: `usesDeathSaves` (player vs monster/lair), `enterDying`, `applyDeathSaveRoll` for d20 buckets (1, 2–9, 10–19, 20), resolution at 3 successes / 3 failures with counts cleared, nat-20 revive at 1 HP, `toggleDeathSaveSlot` on/off + re-resolution, `applyDamageWhileDowned` (normal +1, critical → dead, `damage >= maxHp` → dead, stable → dying), `clearDeathState`, and the legacy "no fields → treated as active" case. Confirm the suite fails (module absent).
- [ ] **T3** Implement `lib/combat/deathSaves.ts` with the pure functions from design Decision 2. Reuse `rollDie` from `lib/utils/dice.ts`; do not add a `rollDie` call inside the pure reducers (the caller passes the d20 value). Run `npm run test:unit -- deathSaves` until green.
- [ ] **T4** Add a `lifeStateDisplay(combatant)` helper (badge text + greyed flag + show-tracker flag) — colocate in `lib/combat/deathSaves.ts` or `lib/utils/combat.ts` consistent with existing patterns. Unit-test each `lifeState` (including `undefined` and monster-at-0-HP fallback to `☠️`).

### HP wiring in `CombatantCard`

- [ ] **T5** Write component tests (`tests/unit/components/CombatantCard.deathSaves.test.tsx`): player dropped to 0 HP → `onUpdate` called with `lifeState: 'dying'` + empty `deathSaves`; monster to 0 HP → no such update; healing a dying player to ≥1 → `onUpdate` clears `lifeState`/`deathSaves`; damage to a dying player → failure added; damage ≥ maxHp → `dead`. Confirm failing.
- [ ] **T6** Update `adjustHp` in `lib/components/CombatantCard.tsx` (`~:252`) to delegate to the `deathSaves` helpers on the damage and healing branches for player combatants only, merging the returned `Partial<CombatantState>` into the existing `onUpdate` call (alongside the current concentration-clear logic). Keep `adjustHp` the single writer — no `useEffect` on `hp`.
- [ ] **T7** Investigate whether the damage-entry UI exposes a critical-hit flag. If yes, pass `critical` into `applyDamageWhileDowned`. If no, pass `critical: false` and rely on the `damage >= maxHp` instant-death rule; note the gap in the PR description as a follow-up. Run `npm run test:unit -- CombatantCard.deathSaves`.

### Death-save tracker UI

- [ ] **T8** Write tests for a new `DeathSaveTracker` sub-component: renders 3 success + 3 failure slots reflecting `deathSaves`, clicking a slot calls the toggle handler with the right kind/index, "Roll death save" button calls a roll handler and shows the returned d20 value. Confirm failing.
- [ ] **T9** Implement `DeathSaveTracker` (new file under `lib/components/`), wired into `CombatantCard` to render when `usesDeathSaves(combatant) && combatant.hp <= 0`. The roll handler calls `rollDie(20)[0]`, stores it in transient component state for inline display (mirroring the `d20:X` initiative readout), and passes it to `applyDeathSaveRoll` → `onUpdate`. Do NOT import any dice 3D engine module. Run the component tests until green.
- [ ] **T10** Replace the `hp <= 0 && '☠️'` sites in `CombatantCard.tsx` (`~:441` header, `~:674` target list) with `lifeStateDisplay`-driven rendering; keep `☠️` fallback for non-death-save combatants. Update/extend snapshot or assertion tests.

### Initiative-list styling

- [ ] **T11** Write component tests for `ActiveCombatView` (or the card within it): active / dying / stable / dead combatants render with the expected badge + greyed styling; stable and dead still occupy a turn slot (advancing turns stops on them). Confirm failing.
- [ ] **T12** Apply `lifeStateDisplay`-driven styling in `lib/components/ActiveCombatView.tsx` and the card so `stable`/`dead` are greyed and `dying` shows the tracker. Do not add skip logic to `nextTurn` in `lib/hooks/useCombat.ts`. Run tests until green.

### Follow-up issue

- [ ] **T13** Create a GitHub issue: title "feat: House-rule / optional-rule configuration", body referencing #92, explaining that the nat-20-counts-as-2-successes rule (and future optional rules like flanking, massive-damage detail) should become configurable and that #92 hard-coded the nat-20 rule as always-on. Record the new issue number here.

### Coverage confirmation

- [ ] Confirm every acceptance scenario in `openspec/changes/add-death-saving-throws/specs/death-saving-throws/spec.md` maps to at least one passing test (see `tests.md`).
- [ ] Look for existing tooling/helpers before adding new logic (reused: `rollDie`, `applyHealing`, `applyTypedDamage`, `updateCombatant`).

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent automatically applies all clearly-correct findings directly to the code — without stopping, without presenting the list to the user, without asking for confirmation. Apply fixes, re-run `npm run test:unit` and `npm run typecheck` to confirm green, then commit.

## Validation

- [ ] `npm run test:unit` — all unit/integration tests pass (includes new `deathSaves`, `CombatantCard.deathSaves`, `DeathSaveTracker`, `ActiveCombatView` specs)
- [ ] `npm run test:e2e` — regression/E2E suite passes (combat flows unaffected)
- [ ] `npm run typecheck` — no errors
- [ ] `npm run lint` — no new violations
- [ ] `npm run build` — succeeds with no errors
- [ ] Security / code-quality checks required by project standards pass (Codacy; verity pre-commit/pre-push gate — fix findings, do not waive on agent judgment)
- [ ] `openspec validate add-death-saving-throws --strict` passes
- [ ] All completed tasks marked complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Determine whether the change is **docs-only**: `git diff --name-only origin/main...HEAD` — if every changed file ends in `.md`, use the docs-only path; otherwise the full path. This change touches `.ts`/`.tsx`, so the full path applies.

**Full path:**

- **Unit tests** — `npm run test:unit`; all pass
- **Integration tests** — `npm run test:integration`; all pass
- **Regression / E2E tests** — `npm run test:regression`; all pass
- **Build** — `npm run build`; succeeds with no errors

If ANY required step fails, iterate and fix before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent ran and all findings were addressed before the final commit
- [ ] Commit all changes to `add-death-saving-throws` and push to remote
- [ ] Open PR from `add-death-saving-throws` to `main`. **PR body MUST include `Closes #92`.** Include a summary, the "critical-hit flag" investigation result (T7), and the follow-up issue number from T13.
- [ ] **Issue lifecycle: mark in-review** — `gh issue edit 92 --add-label "in-review" --remove-label "in-progress"`, then move the project item to the "In Review" status column (same discovery pattern as in-progress; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero remain. If findings persist after 3+ iterations with no progress, report the stall with remaining findings and wait for human guidance.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --squash` (per `main` squash-only ruleset; NEVER `--admin`)
- [ ] **Iterate until merged** — repeat until `gh pr view <PR-URL> --json state` returns `MERGED` (if `CLOSED`, exit and notify the user); never wait for a human to report the merge, never force-merge:
  1. **Build and tests** — run all [Remote push validation] steps; fix failures, commit, push first
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address every unresolved thread, commit, validate, push, wait 180s; repeat until all resolved
  3. **CI check failures** — after comments are clear, poll `gh pr checks <PR-URL>`; fix failing required checks (`ci-gate`, Codacy), commit, validate, push, wait 180s; restart from step 1

Blocking resolution flow:

- CI failure → diagnose → fix → commit → [Remote push validation] → push → re-run checks
- Security finding → remediate (only `verity waive` for a human-cited accepted risk) → commit → validate → push → re-scan
- Review comment → address → commit → validate → push → confirm thread resolved

## Post-Merge

- [ ] From the primary checkout, `git fetch origin main` and confirm the merge commit is on `main`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (combat/HP docs, `.wolf/anatomy.md` for new files, `.wolf/cerebrum.md` learnings, `.wolf/buglog.json` if any bug was fixed during apply)
- [ ] Sync approved spec deltas into `openspec/specs/`: copy `openspec/changes/add-death-saving-throws/specs/death-saving-throws/spec.md` to `openspec/specs/death-saving-throws/spec.md`, updating relative links — `../../design.md` → `../../changes/archive/YYYY-MM-DD-add-death-saving-throws/design.md` (and similarly for `../../tasks.md`)
- [ ] Archive the change: move `openspec/changes/add-death-saving-throws/` to `openspec/changes/archive/YYYY-MM-DD-add-death-saving-throws/` and stage both the new location and the deletion in a **single** commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-add-death-saving-throws/` exists and `openspec/changes/add-death-saving-throws/` is gone
- [ ] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-add-death-saving-throws` then `git push -u origin doc/archive-YYYY-MM-DD-add-death-saving-throws`
- [ ] Open a PR from that doc branch to `main` titled `docs: archive add-death-saving-throws (YYYY-MM-DD)` — do NOT push directly to `main`
- [ ] **Immediately** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash` (NEVER `--admin`)
- [ ] Monitor the doc PR until merged (same loop as the implementation PR)
- [ ] Prune merged local branches and worktree: `git worktree remove .worktrees/add-death-saving-throws --force` (submodule present), `git fetch --prune`, `git branch -D add-death-saving-throws doc/archive-YYYY-MM-DD-add-death-saving-throws`
- [ ] Close the loop on issue #92 (auto-closed by `Closes #92`); move its project item to "Done"; confirm the T13 follow-up issue is filed
