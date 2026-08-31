# Tasks

Change: `fix-dice-animation-predetermined-faces` — issue-driven (#624).
All work happens inside the dedicated worktree
`.worktrees/fix-dice-animation-predetermined-faces` on branch
`fix-dice-animation-predetermined-faces`, never in the primary checkout.

> **Rewritten 2026-08-30.** The Decision 1 spike on `@3d-dice/dice-box@1.1.4`
> proved that engine has no forced-face mechanism. This change now **replaces the
> engine** with `@drdreo/dice-box-threejs@1.1.0`, which natively honors the `@`
> predetermined notation the code already emits. See `proposal.md` History.

## Preparation

- [x] **Step 1 — Confirm the dedicated worktree exists and enter it.**
- [x] **Step 2 — Confirm the working branch is published** (`git status -sb`
  tracks `origin/fix-dice-animation-predetermined-faces`).
- [x] **Step 3 — Sync with base:** `git fetch origin main` and rebase onto
  `origin/main`.
- [x] **Step 4 — Install dependencies in the worktree** (`npm ci`); check out the
  `.github/openspec-shared` submodule.
- [x] **Step 5 — Add the new engine deps** (`@drdreo/dice-box-threejs@1.1.0`
  pinned, `three`, `cannon-es`) so the spike can drive the real package.

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available
  skills list. If not listed, halt, inform the user, provide installation
  guidance, do not proceed until confirmed.
- [x] **Confirm `openspec-review-code` is available** for the pre-commit review
  step; if not, halt and inform the user.
- [x] **Confirm the rewritten proposal/design/specs/tasks/tests are validated:**
  `openspec validate fix-dice-animation-predetermined-faces --strict` passes.

## Execution

### E0 — Issue lifecycle: mark in-progress

- [x] Run `gh issue edit 624 --add-label "in-progress"`.
- [x] Discover the linked GitHub Project
  (`gh project list --owner dougis-org --format json`), resolve the "In Progress"
  status option, and move the item via `gh project item-edit`. If no project item
  is found, log a warning and continue. If the `gh` token lacks the `project`
  scope, tell the user to run `gh auth refresh -s project` and skip the
  project-item update (the label update still proceeds).

### E1 — Spike: confirm `@drdreo/dice-box-threejs` forced faces + teardown (design Decision 1)

- [x] Write a throwaway spike (a `*.spike.test.ts` Playwright test or a scratch
  script under a real browser context, deleted before the final commit) that
  drives `@drdreo/dice-box-threejs@1.1.0` against a `public/`-served asset path
  and confirms:
  1. `roll("Nd<sides>@v1,v2,…")` lands each physical die on its `@` value for
     `d4`, `d6`, `d8`, `d10`, `d12`, `d20`, with `reason: "forced"` in the
     returned `DiceResults`.
  2. `roll("2d10@t,o")` lands both percentile d10s, including a `0`/`10` face.
  3. Multi-group `"2d20@14,2+1d6@5"` returns one `DiceSet` per group with the
     forced values.
  4. `clearDice()` + dropping the instance reference stops the render loop and
     frees the WebGL context (roll → clear → new instance → roll again works
     within one page).
  5. The working `assetPath` value that resolves `textures/…` under `public/`.
- [x] Record the finding as a short note appended to `design.md` "Open Questions"
  (resolved) and confirm which path applies:
  - Forced faces reliable → proceed with E2–E7.
  - Not reliable → **STOP**, update `proposal.md` / `design.md` / `specs` per
    Change Control to the detect-and-skip fallback, get user acknowledgement,
    then proceed (E3 reconciliation still applies; `toDiceBoxNotation` emits
    plain random notation; every roll is reconciled and mismatches skip).
- [x] Confirm the exact `DiceResults` / `DiceSet` / `DiceResult` shape from the
  package's `types/index.d.ts` and the runtime (percentile `0`/`10` encoding,
  grouping, ordering).

### E2 — Swap the engine dependency and assets (design Decisions 2, 5)

- [x] Remove `@3d-dice/dice-box` from `package.json` / lockfile.
- [x] Add a committed asset-copy step (npm script or a small `scripts/` copier,
  matching how the project already handles static assets) that copies
  `node_modules/@drdreo/dice-box-threejs/dist/textures/` to
  `public/dice-box-threejs/textures/`. Do not copy `sounds/` (`sounds: false`).
  Wire it into `postinstall` / `prebuild` as appropriate; add the copied path to
  `.gitignore` if the project ignores generated public assets, otherwise commit
  them.
- [x] Delete `types/dice-box.d.ts`; if `tsconfig.json` `types` / `typeRoots` or
  `files` referenced it, update them.

### E3 — Rewrite `useDiceAnimation` against the new engine (design Decision 2)

- [x] Rewrite `lib/dice/useDiceAnimation.ts`:
  - lazy `import('@drdreo/dice-box-threejs')` under `IMPORT_TIMEOUT_MS`.
  - `new DiceBox(container, { assetPath, baseScale:
    diceAnimationScale(animatedDiceCount(built)), theme_material, sounds: false,
    shadows, iterationLimit })`.
  - `await withTimeout(box.initialize(), INIT_TIMEOUT_MS)`.
  - `const results = await withTimeout(box.roll(toDiceBoxNotation(built)),
    ROLL_TIMEOUT_MS)` — **capture** `results` (currently discarded at line 173).
  - `box.clearDice()` everywhere `box.clear()` was called.
  - Keep the exported `DiceAnimation` contract, `DiceAnimationStatus`, the
    timeout constants, `runIdRef` single-instance invariant, `webglOkRef` probe,
    `loggedRef` once-guard, and the persistent-vs-transient failure split
    unchanged.
- [x] Import `DiceResults` / `DiceResult` types from
  `@drdreo/dice-box-threejs` (no more ambient `types/dice-box.d.ts`).
- [x] `ASSET_PATH` constant updated to the spike-confirmed `public/` path.

### E4 — Capture and reconcile engine results (design Decision 3)

- [x] Add a pure `lib/dice/reconcileDiceFaces.ts`:
  `reconcileDiceFaces(expected, settled)` compares expected vs settled faces
  **per die-size group as an unordered multiset** over the first
  `animatedDiceCount()` dice of each group, with percentile `0`/`10`
  normalization. Returns match / mismatch. Reuse any existing helper in
  `lib/utils/dice.ts` (percentile decode, multiset compare) before writing new
  ones.
- [x] In `useDiceAnimation`, after `roll()` resolves, flatten
  `results.sets[].rolls[]` and call `reconcileDiceFaces`. On mismatch: classify
  as a **transient per-roll failure** — `clearDice()` without bumping the run
  token, emit exactly one diagnostic via the existing client logging seam with a
  message distinct from the malformed-roll `console.error` and the
  persistent-unsupported `console.warn`, keep `status` at `idle`, resolve
  `run()` `true` so `GlobalDiceFab` reveals promptly.
- [x] Once-per-mount log guard for mismatch (mirror the existing `loggedRef`
  pattern; a separate ref).
- [x] `toDiceBoxNotation.ts`: keep the `@` string form; adjust only if the spike
  found a multi-group / percentile notation quirk. Keep it pure, keep die-size
  grouping in first-seen order, keep the `DICE_ANIM_CAP = 15` truncation,
  `animatedDiceCount()` unchanged.

### E5 — Retune the scale curve (design Decision 4)

- [x] Retune `DICE_BASE_SCALE` / `DICE_MIN_SCALE` in
  `lib/dice/diceAnimationScale.ts` for `@drdreo/dice-box-threejs`'s `baseScale`
  units (default 100). Keep the curve shape and invariants (monotonic
  non-increasing, `count<=6` returns base, floored at min, non-positive → 1).
  Update `tests/unit/lib/dice/diceAnimationScale.test.ts` numeric expectations.

### E6 — Legibility: `+N more` on the existing readout (design Decision 6)

- [x] In `lib/components/dice/DiceRollOverlay.tsx` `StaticRollResult`: above
  `DICE_ANIM_CAP`, render the first `DICE_ANIM_CAP` dice plus a `+N more`
  indicator (`N = breakdown.length - DICE_ANIM_CAP`); total stays `built.total`.
  Below the cap, unchanged. Confirm the readout still renders on every reveal
  path (it is inside the `modalRevealed` block).
- [x] Re-check the canvas band `max-w` / `max-h` for the new engine's camera /
  `baseScale`; adjust the Tailwind classes if 15 dice clip or obscure the modal,
  keeping the fixed margin above the modal (n047 layout preserved).

### E7 — E2E: assert settled faces, not just the total

- [x] Extend `tests/e2e/dice-roll-animation.spec.ts` so the pool-roll test reads
  the engine's resolved per-die results (via a test-only hook exposed from
  `useDiceAnimation` / `onRollComplete`, or by asserting the modal's per-die
  readout) and asserts they equal the inline `[a, b]` values — not only the
  aggregate total.
- [x] Add a percentile assertion that the two d10 faces shown decode to the modal
  total.
- [x] Keep the existing dismissal / panel-stays-open assertions green.
- [x] CI-no-WebGL path: the result modal and per-die readout still appear via the
  instant path.

### E8 — Wire-up and spec sync

- [x] Confirm `GlobalDiceFab` and every `toDiceBoxNotation` / `useDiceAnimation`
  consumer compiles against the new shapes (`npm run typecheck`).
- [x] Confirm every acceptance scenario in
  `openspec/changes/fix-dice-animation-predetermined-faces/specs/**/*.md` is
  covered by a test or a visual-check task.
- [ ] Visual-check task: run the app, roll `2d12`, `2d20`, `d%`, `15d6`; capture
  screenshots at 1280px and 375px; record the chosen `baseScale` / container
  constants in `design.md` (Decision 4 / 6). Confirm dice and the readout are
  readable and the modal is not obscured.

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the
  `openspec-review-code` skill on the staged diff. The primary agent must
  automatically apply all clearly-correct findings directly to the code — without
  stopping, without presenting the findings list to the user, without asking for
  confirmation. Apply fixes, re-run the affected tests, then commit.

## Validation

- [x] `npm run test:unit` — all pass (rewritten `useDiceAnimation`, new
  `reconcileDiceFaces`, retuned `diceAnimationScale`, `DiceRollOverlay`,
  `toDiceBoxNotation` tests).
- [ ] `npm run test:integration` — all pass.
- [ ] `npm run test:e2e -- tests/e2e/dice-roll-animation.spec.ts` then the full
  `npm run test:regression` — all pass.
- [x] `npm run typecheck` — no errors.
- [x] `npm run lint` — no errors.
- [x] `npm run build` — succeeds; `@drdreo/dice-box-threejs` / `three` /
  `cannon-es` are in an async chunk, not the initial bundle.
- [ ] Verity pre-commit / pre-push gate — no findings (fix, do not waive).
- [ ] Codacy checks — no new issues.
- [x] Throwaway spike files removed; `@3d-dice/dice-box` fully gone from
  `package.json`, lockfile, `types/`, and code; no stray `node_modules` /
  `.worktrees` content staged.
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

- [x] Ensure the `openspec-review-code` sub-agent ran and all findings were
  addressed before the final commit.
- [x] Commit all changes to `fix-dice-animation-predetermined-faces` and push.
- [x] Open a PR from `fix-dice-animation-predetermined-faces` to `main`. The PR
  body MUST include `Closes #624`. Search `.github/PULL_REQUEST_TEMPLATE*` and
  follow the template if present. Call out the new dependencies
  (`@drdreo/dice-box-threejs`, `three`, `cannon-es`) and the removal of
  `@3d-dice/dice-box` explicitly.
- [x] **Issue lifecycle: mark in-review** — run
  `gh issue edit 624 --add-label "in-review" --remove-label "in-progress"`, then
  move the project item to "In Review" (same discovery pattern as E0; warn and
  skip if not found).
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
  past Decision 3.

## Post-Merge

- [ ] From the primary checkout: `git checkout main` and `git pull --ff-only`.
- [ ] Verify the merged changes appear on `main`.
- [ ] Mark all remaining tasks `[x]`.
- [ ] Sync the approved spec deltas into the global specs: apply the
  ADDED/MODIFIED requirements from
  `openspec/changes/fix-dice-animation-predetermined-faces/specs/global-dice-fab/spec.md`
  into `openspec/specs/global-dice-fab/spec.md`, and from
  `.../specs/dice-roll/spec.md` into `openspec/specs/dice-roll/spec.md`. Fix
  relative links to resolve from the archive location.
- [ ] Archive the change: move
  `openspec/changes/fix-dice-animation-predetermined-faces/` to
  `openspec/changes/archive/YYYY-MM-DD-fix-dice-animation-predetermined-faces/`
  and stage the copy and the deletion of the old location in a **single** commit.
- [ ] Confirm the archive dir exists and the original change dir is gone.
- [ ] Create a doc branch
  `doc/archive-YYYY-MM-DD-fix-dice-animation-predetermined-faces`, push it, open a
  PR to `main` titled
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
