# Tasks

Change: `improve-dice-roll-animation` · Issue-driven: **yes** (`#596`) · Worktree: `.worktrees/improve-dice-roll-animation` · Base/default branch: `main` · Owner org: `dougis-org`

All file/folder references are relative to project root. All work happens inside the worktree `.worktrees/improve-dice-roll-animation` — never the primary checkout.

## Preparation

- [ ] **Step 1 — Confirm base is current:** the worktree branch `improve-dice-roll-animation` was created from `origin/main` during propose. From the primary checkout run `git fetch origin`; if `origin/main` has advanced materially, rebase the worktree branch: `git -C .worktrees/improve-dice-roll-animation rebase origin/main`.
- [ ] **Step 2 — Confirm working branch is published:** `git -C .worktrees/improve-dice-roll-animation status -sb` shows it tracks `origin/improve-dice-roll-animation` (pushed during propose). If not, `git -C .worktrees/improve-dice-roll-animation push -u origin improve-dice-roll-animation`.
- [ ] **Step 3 — Ensure the openspec submodule is present in the worktree:** `git -C .worktrees/improve-dice-roll-animation submodule update --init .github/openspec-shared` (needed for `openspec` schema resolution inside the worktree).

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If it is not listed, halt immediately, tell the user the `pr-review-toolkit` plugin is required for this change's PR gate, provide installation guidance (`/plugin` → install `pr-review-toolkit`), and do not proceed until the user confirms it is installed.
- [ ] **Verify `openspec-review-code` is available** for the pre-commit review sub-agent. If missing, halt and inform the user.
- [ ] Confirm local toolchain: `npm ci` completes in the worktree; `npm run typecheck` and `npm run test:unit -- --passWithNoTests` run.

## Execution

Work strictly BDD/TDD: for every task below, the matching cases in `openspec/changes/improve-dice-roll-animation/tests.md` are written and made to **fail first**, then implementation makes them pass, then refactor. Do not start an implementation sub-task before its failing test exists.

- [ ] **Step 1 — Confirm worktree:** verify `.worktrees/improve-dice-roll-animation` exists and `cd` into it. If it does not exist, from the primary checkout run `git fetch origin && git worktree add .worktrees/improve-dice-roll-animation improve-dice-roll-animation`. Never checkout this branch in the primary checkout.
- [ ] **Step 2 — Confirm remote branch:** `git status -sb` shows tracking `origin/improve-dice-roll-animation`; if not, `git push -u origin improve-dice-roll-animation`.
- [ ] **Step 3 — Issue lifecycle: mark in-progress** _(issue-driven)_: run `gh issue edit 596 --add-label "in-progress"`. Then discover the GitHub Project linked to the repo: `gh project list --owner dougis-org --format json`; resolve the status field option semantically matching "In Progress" via `gh project field-list <project-number> --owner dougis-org --format json`; move the item with `gh project item-edit --id <item-id> --field-id <status-field-id> --project-id <project-id> --single-select-option-id <in-progress-option-id>`. If no project item is found, log a warning and continue. If the `gh` token lacks `project` scope, tell the user to run `gh auth refresh -s project` and skip the project-item update (the label edit still proceeds).

- [ ] **E1 — Lower the animated-dice cap to 15** (`lib/dice/toDiceBoxNotation.ts`): change `DICE_ANIM_CAP` from `30` to `15`; update the doc comment. Reuse the existing capping/grouping logic — no new traversal.
  - Covers spec scenario "Large pools animate a capped subset of 15".
- [ ] **E2 — Add the pure down-scaling curve** (`lib/dice/useDiceAnimation.ts` or a sibling `lib/dice/diceAnimationScale.ts`): export `DICE_BASE_SCALE` and `diceAnimationScale(count: number): number` — returns `DICE_BASE_SCALE` for `count <= 6`, a monotonically non-increasing value for `7..15`, clamped to a defined `DICE_MIN_SCALE` floor. Pure, no imports.
  - Covers spec scenario "More than six dice shrink to fit the clear zone".
- [ ] **E3 — Configure dice-box for size + completion signal** (`lib/dice/useDiceAnimation.ts`): pass `scale: diceAnimationScale(animatedCount)` (and `settleTimeout` if needed) into the `DiceBox` config; derive `animatedCount` from the built roll's animated subset (respecting the 15 cap). Ensure `run()`'s promise resolves **only after** `box.roll()` settles, and that the instant/teardown/unsupported paths resolve promptly (never hang). Do not change WebGL probing or the persistent-vs-transient failure split.
  - Covers spec sizing clause + scenarios "Pool roll animates larger centered dice…", "Modal shows immediately when the dice engine is unsupported".
- [ ] **E4 — Bound and center the dice canvas region** (`lib/components/dice/DiceRollOverlay.tsx`): replace the `absolute inset-0` canvas mount with a bounded, horizontally centered element sized in viewport units with a `max` cap, laid out in a centered vertical stack with the result modal beneath it and a gap; the canvas's bottom edge (physics floor) sits a fixed margin above the modal. Keep `pointer-events-none` and `DICE_ROLL_CANVAS_ID`.
  - Covers spec centered-region + landing clauses + scenario "Pool roll animates larger centered dice then reveals the modal".
- [ ] **E5 — Gate the result modal on completion** (`lib/components/dice/DiceRollOverlay.tsx`): add internal `modalRevealed` state, initially `false`. Set it `true` when: `disableAnimation` is `true` (immediately), animation `status` is `'unsupported'` (immediately), the completion signal fires, or a `MODAL_REVEAL_FALLBACK_MS` (~6000ms) timeout elapses. On the fallback path also tear down the box. Render the modal only when `modalRevealed`. Reset `modalRevealed` to `false` when the `built` prop identity changes (new roll). Preserve capture-phase Escape / outside-click "close overlay only" handling and focus-into-dialog on reveal.
  - Covers spec gating + fallback clauses + scenarios "Modal stays hidden until the tumble settles", "Modal shows immediately when animation is disabled", "Modal shows immediately when the dice engine is unsupported", "Modal is revealed by the fallback timeout if completion never signals".
- [ ] **E6 — Wire the completion signal from the FAB** (`lib/components/GlobalDiceFab.tsx`): `runAnimation` awaits `animation.run(...)` and surfaces settle to the overlay (a boolean prop like `animationSettled`, or an `onAnimationSettled` callback the overlay subscribes to). Ensure per-roll reset so a second roll re-gates the modal. Keep the immediate inline `formula → [rolls] = total` line unchanged. Do not alter `built.total` / `built.rolls` or the shared-submit flow.
  - Covers spec outcome-decided clause + scenarios "Pool roll animates larger centered dice then reveals the modal", "Roll outcome is decided before the animation starts".
- [ ] **E7 — Manual visual verification** (documented, not automated): run `npm run dev` in the worktree, roll `1d20`, `6d6`, `15d6`, `120d6`, and a percentile roll at a desktop viewport and a ~390px mobile viewport. Confirm: dice are ~modal-font sized, centered, settle just above the modal without obscuring it, and the modal appears only after the tumble. Record observations (and screenshots via `openwolf designqc` if useful) in the PR description. If the size target is unreachable within the clear zone for 15 dice, STOP — that is a scope change; update proposal/design/specs/tasks per Change Control before continuing.
- [ ] Confirm every acceptance scenario in `openspec/changes/improve-dice-roll-animation/specs/global-dice-fab/spec.md` maps to a passing test in `tests.md`.
- [ ] Look for existing tooling/functions to reuse before adding new logic (capping logic in `toDiceBoxNotation`, `useDiceAnimation` teardown/run-token machinery, overlay focus/dismiss effects).

## Pre-Commit Code Review

- [ ] **Before every commit** (including fix commits made during the PR loop): spawn a dedicated sub-agent via the Agent tool instructed to "Run the openspec-review-code skill" against the working tree diff. The primary agent MUST automatically apply all clearly-correct findings directly — without stopping, without presenting the findings list to the user, without asking for confirmation. Apply fixes, re-run `npm run test:unit`, then commit. Never skip this step.

## Validation

- [ ] `npm run test:unit` — all unit tests pass (new + existing `DiceRollOverlay`, `GlobalDiceFab`, `useDiceAnimation`, `toDiceBoxNotation` suites).
- [ ] `npm run typecheck` — no errors.
- [ ] `npm run lint` — clean (note `eslint-plugin-jsx-a11y` is active; the delayed-dialog focus handling must not regress a11y lint).
- [ ] `npm run build` — succeeds.
- [ ] `npm run test:integration` (via the project harness) — passes; this change touches only client components so no new integration coverage is expected, but the suite must stay green.
- [ ] E2E: not applicable to the 3D canvas (WebGL unreliable in CI). Run `npm run test:regression` only to confirm no regression in existing flows.
- [ ] All completed tasks marked `- [x]`.
- [ ] All steps in [Remote push validation].

## Remote push validation

Determine whether the change is **docs-only**: `git diff --name-only origin/main...HEAD` — if every file ends in `.md`, use the docs-only path; otherwise the full path. (This change edits `.ts`/`.tsx` — full path.)

**Full path:**

- **Unit tests** — `npm run test:unit`; all pass.
- **Integration tests** — `npm run test:integration` via the project harness; all pass.
- **Regression / E2E** — `npm run test:regression`; all pass.
- **Build** — `npm run build`; succeeds with no errors.

**Docs-only path:** build only; skip integration and regression.

If ANY required step fails, iterate and fix before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent ran and all findings were auto-addressed before the final commit.
- [ ] Commit all changes on `improve-dice-roll-animation` and push to `origin`.
- [ ] Open a PR from `improve-dice-roll-animation` → `main`. **The PR body MUST include `Closes #596`** (unconditional). Search for a PR template (`.github/PULL_REQUEST_TEMPLATE/` or `.github/pull_request_template.md`) and follow it. Include the E7 visual-verification notes/screenshots.
- [ ] **Issue lifecycle: mark in-review**: `gh issue edit 596 --add-label "in-review" --remove-label "in-progress"`. Move the project item to the status column semantically matching "In Review" (same project/field/option discovery as the in-progress step; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start.
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (run Pre-Commit Code Review, commit, push, re-run) until zero findings remain. If findings persist after 3+ iterations with no progress, report the stall with remaining findings and wait for human guidance.
- [ ] **Only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER `--admin`).
- [ ] **Iterate until merged** — repeat continuously until `gh pr view <PR-URL> --json state` returns `MERGED` (if `CLOSED`, exit and notify the user); never wait for a human to report the merge; never force-merge:
  1. **Build and tests** — run all [Remote push validation] steps; fix failures, commit (via Pre-Commit Code Review), push before anything else this iteration.
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180s; continue until all threads resolved.
  3. **CI check failures** — only after comments are resolved, poll `gh pr checks <PR-URL>`; fix failing required checks, commit, run [Remote push validation], push, wait 180s; restart from step 1.

Ownership metadata:

- Implementer: dougis (@doug)
- Reviewer(s): `pr-review-toolkit:review-pr` gate + human review as required by branch protection
- Required approvals: per `main` branch protection (do not bypass — see project memory "No branch protection bypass")

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security/Verity finding → remediate (do not waive on agent judgement) → commit → validate → push → re-scan
- Review comment → address → commit → validate locally → push → confirm thread resolved

## Post-Merge

- [ ] From the primary checkout: `git checkout main` and `git pull --ff-only`.
- [ ] Verify the merged changes appear on `main`.
- [ ] Mark all remaining tasks complete (`- [x]`).
- [ ] Update any repository documentation impacted by the change (dice animation notes in README / `.wolf/` if present).
- [ ] Sync the approved spec delta into the global spec: apply the MODIFIED requirement from `openspec/changes/improve-dice-roll-animation/specs/global-dice-fab/spec.md` into `openspec/specs/global-dice-fab/spec.md`. Update relative links so they resolve from the archive location — `../../design.md` → `../../changes/archive/YYYY-MM-DD-improve-dice-roll-animation/design.md`, and likewise for `../../tasks.md`.
- [ ] Archive the change: move `openspec/changes/improve-dice-roll-animation/` to `openspec/changes/archive/YYYY-MM-DD-improve-dice-roll-animation/` and stage the new location and the deletion of the old location in a **single** commit.
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-improve-dice-roll-animation/` exists and `openspec/changes/improve-dice-roll-animation/` is gone.
- [ ] Create a doc branch: `git checkout -b doc/archive-YYYY-MM-DD-improve-dice-roll-animation` then `git push -u origin doc/archive-YYYY-MM-DD-improve-dice-roll-animation`.
- [ ] Open a PR `doc/archive-YYYY-MM-DD-improve-dice-roll-animation` → `main`, title `docs: archive improve-dice-roll-animation (YYYY-MM-DD)`. Do NOT push directly to `main`.
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER `--admin`).
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR).
- [ ] Remove the change worktree: `git worktree remove .worktrees/improve-dice-roll-animation` (use `--force` if it fails due to the openspec submodule — see project memory "Worktree submodule removal").
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D improve-dice-roll-animation doc/archive-YYYY-MM-DD-improve-dice-roll-animation`.
