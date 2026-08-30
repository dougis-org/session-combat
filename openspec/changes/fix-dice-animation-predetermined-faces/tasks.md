# Tasks

Change: `fix-dice-animation-predetermined-faces` — issue-driven (#624).
All work happens inside the dedicated worktree
`.worktrees/fix-dice-animation-predetermined-faces` on branch
`fix-dice-animation-predetermined-faces`, never in the primary checkout.

## Preparation

- [ ] **Step 1 — Confirm the dedicated worktree exists and enter it:** verify
  `.worktrees/fix-dice-animation-predetermined-faces` exists (created during
  propose) and `cd` into it. If it does not exist, from the primary checkout run
  `git fetch origin main` then
  `git worktree add .worktrees/fix-dice-animation-predetermined-faces -b fix-dice-animation-predetermined-faces origin/main`.
  Never checkout a different branch in the primary checkout.
- [ ] **Step 2 — Confirm the working branch is published:** `git status -sb`
  shows the branch tracks `origin/fix-dice-animation-predetermined-faces`; if
  not, `git push -u origin fix-dice-animation-predetermined-faces` from inside
  the worktree before any implementation work.
- [ ] **Step 3 — Sync with base:** `git fetch origin main` and
  `git merge --ff-only origin/main` (or rebase) so the branch is current.
- [ ] **Step 4 — Install dependencies in the worktree:** `npm ci` (the worktree
  has no `node_modules` yet; the Decision 1 spike needs `@3d-dice/dice-box`
  source available). Ensure the `.github/openspec-shared` submodule is checked
  out (`git submodule update --init --force .github/openspec-shared`).

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available
  skills list. If it is not listed, halt immediately, inform the user the plugin
  is required, provide installation guidance, and do not proceed until the user
  confirms it is installed.
- [ ] **Confirm `openspec-review-code` is available** for the pre-commit review
  step; if not, halt and inform the user.

## Execution

### E0 — Issue lifecycle: mark in-progress

- [ ] Run `gh issue edit 624 --add-label "in-progress"`.
- [ ] Discover the linked GitHub Project
  (`gh project list --owner dougis-org --format json`), resolve the status field
  option semantically matching "In Progress"
  (`gh project field-list <project-number> --owner dougis-org --format json`),
  and move the item via `gh project item-edit`. If no project item is found, log
  a warning and continue. If the `gh` token lacks the `project` scope, tell the
  user to run `gh auth refresh -s project` and skip the project-item update (the
  label update still proceeds).

### E1 — Spike: confirm the dice-box forced-results API (design Decision 1)

- [ ] Read `node_modules/@3d-dice/dice-box` source and its shipped `README.md`;
  determine exactly how `@3d-dice/dice-box@1.1.4` accepts forced per-die
  results. Check, in order: (1) object/array roll notation with a per-die
  `value`; (2) `roll()` + bounded `reroll()` toward target faces; (3) the
  `@3d-dice/dice-parser-interface` / `dice-roller-parser` layer.
- [ ] Write a throwaway spike (a `*.spike.test.ts` or a scratch script, deleted
  before the final commit) that drives dice-box headlessly / in a jsdom+webgl
  stub or a Playwright page and confirms whether the chosen mechanism actually
  lands the requested faces for `d6`, `d12`, `d20`, and `2d10` percentile.
- [ ] Record the finding as a short note appended to `design.md` "Open
  Questions" (resolved) and confirm which design path applies:
  - Mechanism found → proceed with tasks E2–E4 (Decision 2 + 3 + 5).
  - No mechanism → **STOP**, update `proposal.md` Scope / What Changes and
    `design.md` per Change Control, get user acknowledgement, then proceed with
    Decision 4 (E3 + E5 only, `toDiceBoxNotation` emits plain random notation).
- [ ] Confirm the shape of `DiceBoxResult` returned by `box.roll()` from the
  real source (fields, ordering, grouping, percentile `0`/`10` encoding) and
  update `types/dice-box.d.ts` to match.

### E2 — Pass predetermined faces to the engine (design Decision 2)

- [ ] Rewrite `lib/dice/toDiceBoxNotation.ts` to return the spike-confirmed
  forced-results argument shape (likely a typed `DiceBoxRollSpec` object/array
  instead of a string). Keep it pure (no RNG import), keep die-size grouping in
  first-seen order, keep the percentile `2 × d10` mapping (`00` → `10,10`), keep
  the `DICE_ANIM_CAP = 15` truncation. `animatedDiceCount()` unchanged.
- [ ] Update `types/dice-box.d.ts` for the new `roll()` argument type.
- [ ] Update `lib/dice/useDiceAnimation.ts` to pass the new argument to
  `box.roll()`.
- [ ] Rewrite `tests/unit/lib/dice/toDiceBoxNotation.test.ts` for the new shape:
  single die types, mixed pool + modifier (modifier is not a die), percentile
  faces, `00` percentile, 120-die pool capped at 15, 15- and 6-die boundaries.

### E3 — Capture and reconcile engine results (design Decision 3 / 4)

- [ ] In `lib/dice/useDiceAnimation.ts`, stop discarding the `box.roll()` return
  value (currently `lib/dice/useDiceAnimation.ts:173`). Capture the
  `DiceBoxResult[]`.
- [ ] Add a pure helper (e.g. `reconcileDiceFaces(expected, settled)` in a
  sibling module) that compares expected vs settled faces **per die-size group
  as an unordered multiset** over the first `animatedDiceCount()` dice of each
  group, with percentile `0`/`10` normalization. Returns match / mismatch.
- [ ] On mismatch: classify as a **transient per-roll failure** (same class as a
  thrown `roll()` error): tear down the box without bumping the run token, emit
  exactly one diagnostic via the existing client logging seam with a message
  distinct from the malformed-roll `console.error` and the persistent-unsupported
  `console.warn`, keep `status` at `idle`, and resolve `run()` `true` so
  `GlobalDiceFab` reveals the result promptly (not via the fallback timeout).
- [ ] (Only if the spike selected the reroll mechanism) implement a single
  bounded `reroll()` pass toward target faces before the mismatch classification;
  keep the whole `run()` within `ROLL_TIMEOUT_MS`.
- [ ] Once-per-mount log guard for mismatch (mirror the existing `loggedRef`
  pattern).
- [ ] Unit tests in `tests/unit/lib/dice/useDiceAnimation.test.ts`: matching
  results resolve `true` with no log; mismatched results resolve `true`, keep
  `status idle`, emit one warn; reordered results match; percentile `0`/`10`
  match; a second mismatch in the same mount does not log again; no `fetch` from
  the reconciliation path.

### E4 — E2E: assert settled faces, not just the total

- [ ] Extend `tests/e2e/dice-roll-animation.spec.ts` so the pool-roll test reads
  the dice engine's resolved per-die results (via a test-only hook exposed from
  `useDiceAnimation` / `onRollComplete`, or by asserting the modal's new per-die
  readout) and asserts they equal the inline `[a, b]` values — not only the
  aggregate total.
- [ ] Add a percentile assertion that the two d10 faces shown decode to the
  modal total.
- [ ] Keep the existing dismissal / panel-stays-open assertions green.

### E5 — Legibility (design Decision 5)

- [ ] Raise `DICE_BASE_SCALE` in `lib/dice/diceAnimationScale.ts` and retune the
  shrink curve / `DICE_MIN_SCALE` floor so 15 dice still fit the clear zone.
  Update `tests/unit/lib/dice/*` for the new constants (curve still monotonic
  non-increasing, `count<=6` returns the raised base, floored at the minimum).
- [ ] Widen the canvas band `max-w` / `max-h` in
  `lib/components/dice/DiceRollOverlay.tsx` within the centered stack, keeping
  the fixed margin above the modal (n047 layout preserved).
- [ ] Add a per-die result readout to the result modal in `DiceRollOverlay.tsx`,
  rendered from `built.breakdown` / `built.percentileFaces` as plain DOM text
  styled like the inline result line. Show it on every reveal path (animated,
  disabled, unsupported, fallback, mismatch). Above the 15-die cap show the
  animated subset plus a `+N more` indicator; total stays the full-pool total.
- [ ] `tests/unit/components/DiceRollOverlay.test.tsx`: readout renders for pool
  and percentile; present under `disableAnimation`, `animationStatus`
  `'unsupported'`, and settled paths; total text unchanged through the overlay;
  large-pool `+N more` indicator.
- [ ] Visual-check task: run the app, roll `2d12`, `2d20`, `d%`, and `15d6`;
  capture screenshots at 1280px and 375px viewport widths; record the chosen
  `scale` / container constants in `design.md` (Decision 5). Confirm dice and
  the per-die readout are readable and the modal is not obscured.

### E6 — Wire-up and spec sync

- [ ] Confirm `GlobalDiceFab` and any other `toDiceBoxNotation` /
  `useDiceAnimation` consumers compile against the new shapes (`tsc --noEmit`).
- [ ] Look for existing helpers before adding new ones (multiset compare,
  percentile decode already in `lib/utils/dice.ts`).
- [ ] Confirm every acceptance scenario in
  `openspec/changes/fix-dice-animation-predetermined-faces/specs/global-dice-fab/spec.md`
  is covered by a test or a visual-check task.

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the
  `openspec-review-code` skill on the staged diff. The primary agent must
  automatically apply all clearly-correct findings directly to the code —
  without stopping, without presenting the findings list to the user, and
  without asking for confirmation. Apply fixes, re-run the affected tests to
  confirm they pass, then commit.

## Validation

- [ ] `npm run test:unit` — all pass (new `toDiceBoxNotation`, `useDiceAnimation`,
  `DiceRollOverlay`, `diceAnimationScale` tests included).
- [ ] `npm run test:integration` — all pass.
- [ ] `npm run test:e2e -- tests/e2e/dice-roll-animation.spec.ts` then the full
  `npm run test:regression` — all pass.
- [ ] `npm run typecheck` — no errors.
- [ ] `npm run lint` — no errors.
- [ ] `npm run build` — succeeds.
- [ ] Verity pre-commit / pre-push gate — no findings (fix, do not waive).
- [ ] Codacy checks — no new issues.
- [ ] Throwaway spike files removed; no stray `node_modules` or `.worktrees`
  content staged.
- [ ] All completed tasks marked `[x]`.
- [ ] All steps in [Remote push validation] pass.

## Remote push validation

Determine whether the change is **docs-only**: `git diff --name-only origin/main`
— if every changed file ends in `.md`, use the docs-only path; otherwise the full
path.

**Full path** (non-`.md` files changed — expected here):

- **Unit tests** — `npm run test:unit`; all pass
- **Integration tests** — `npm run test:integration`; all pass
- **Regression / E2E** — `npm run test:regression`; all pass
- **Build** — `npm run build`; succeeds

**Docs-only path** (every changed file is `.md`):

- **Build** — `npm run build`; succeeds
- Skip integration and regression/E2E

If any required step fails, iterate and fix before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent ran and all findings were
  addressed before the final commit.
- [ ] Commit all changes to `fix-dice-animation-predetermined-faces` and push.
- [ ] Open a PR from `fix-dice-animation-predetermined-faces` to `main`. The PR
  body MUST include `Closes #624`. Search `.github/PULL_REQUEST_TEMPLATE*` and
  follow the template if present.
- [ ] **Issue lifecycle: mark in-review** — run
  `gh issue edit 624 --add-label "in-review" --remove-label "in-progress"`, then
  move the project item to the "In Review" status column (same discovery pattern
  as E0; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start.
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all
  findings (commit, run [Remote push validation], push, re-run) until zero
  findings remain. If findings persist after three or more iterations with no
  progress, report the stall with the remaining findings and wait for human
  guidance.
- [ ] **Only after the review gate passes (zero findings):**
  `gh pr merge <PR-URL> --auto --merge` (NEVER `--admin`).
- [ ] **Iterate until merged** — loop until `gh pr view <PR-URL> --json state`
  returns `MERGED` (if `CLOSED`, exit and notify the user); never wait for a
  human to report the merge, never force-merge:
  1. **Build and tests** — run [Remote push validation]; fix failures, commit,
     push first.
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address
     every unresolved thread, commit, run [Remote push validation], push, wait
     180s; repeat until all resolved.
  3. **CI failures** — only after comments are resolved, poll
     `gh pr checks <PR-URL>`; fix failing required checks, commit, run [Remote
     push validation], push, wait 180s; restart from step 1.

Ownership metadata:

- Implementer: TBD (assigned agent)
- Reviewer(s): @dougis + `pr-review-toolkit:review-pr` gate
- Required approvals: 1 human + green required checks + zero review-pr findings

Blocking resolution flow:

- CI failure → diagnose from logs → fix → commit → validate locally → push →
  re-run checks.
- Security / Verity / Codacy finding → remediate (never waive on agent
  judgement) → commit → validate → push → re-scan.
- Review comment → address → commit → validate → push → confirm thread resolved.
- Spike inconclusive after its time box → stop, report to user, do not proceed
  past Decision 4.

## Post-Merge

- [ ] From the primary checkout: `git checkout main` and `git pull --ff-only`.
- [ ] Verify the merged changes appear on `main`.
- [ ] Mark all remaining tasks `[x]`.
- [ ] Update any repository docs impacted by the change (none expected beyond the
  spec sync).
- [ ] Sync the approved spec delta into the global spec: apply the
  ADDED/MODIFIED requirements from
  `openspec/changes/fix-dice-animation-predetermined-faces/specs/global-dice-fab/spec.md`
  into `openspec/specs/global-dice-fab/spec.md`. After copying, update relative
  links that pointed into the change dir so they resolve from the archive
  location (`../../design.md` →
  `../../changes/archive/YYYY-MM-DD-fix-dice-animation-predetermined-faces/design.md`,
  same for `tasks.md`).
- [ ] Archive the change: move
  `openspec/changes/fix-dice-animation-predetermined-faces/` to
  `openspec/changes/archive/YYYY-MM-DD-fix-dice-animation-predetermined-faces/`
  and stage the copy and the deletion of the old location in a **single** commit.
- [ ] Confirm the archive dir exists and the original change dir is gone.
- [ ] Create a doc branch:
  `git checkout -b doc/archive-YYYY-MM-DD-fix-dice-animation-predetermined-faces`
  then `git push -u origin doc/archive-YYYY-MM-DD-fix-dice-animation-predetermined-faces`.
- [ ] Open a PR from that doc branch to `main` titled
  `docs: archive fix-dice-animation-predetermined-faces (YYYY-MM-DD)` — do NOT
  push directly to `main`.
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR:
  `gh pr merge <DOC-PR-URL> --auto --merge` (never `--admin`).
- [ ] Monitor the doc PR until merged (same loop as the implementation PR).
- [ ] Verify issue #624 auto-closed via `Closes #624`; if the project item did
  not move to "Done", move it manually.
- [ ] Remove the change's worktree:
  `git worktree remove .worktrees/fix-dice-animation-predetermined-faces`.
- [ ] Prune merged local branches: `git fetch --prune` and
  `git branch -D fix-dice-animation-predetermined-faces doc/archive-YYYY-MM-DD-fix-dice-animation-predetermined-faces`.
