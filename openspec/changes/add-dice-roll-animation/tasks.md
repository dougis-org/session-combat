# Tasks

Change: `add-dice-roll-animation` · Issue-driven: dougis-org/session-combat#586 ·
Default branch: `main` · Working branch: `add-dice-roll-animation` (worktree
`.worktrees/add-dice-roll-animation`)

All work happens inside `.worktrees/add-dice-roll-animation`, never the primary checkout.

## Preparation

- [ ] **Step 1 — Default branch is current:** the worktree branch `add-dice-roll-animation`
  was cut from `origin/main`. From the worktree, `git fetch origin main` and confirm the
  branch is not behind (`git log --oneline origin/main..HEAD` shows only this change's
  commits; rebase onto `origin/main` if needed).
- [ ] **Step 2 — Working branch is published:** confirm `add-dice-roll-animation` exists on
  remote (`git rev-parse --abbrev-ref --symbolic-full-name @{u}` resolves). It was pushed at
  proposal time; if not, `git push -u origin add-dice-roll-animation` now — the branch must
  exist on remote before any implementation work.
- [ ] Confirm the `.github/openspec-shared` submodule is initialized in the worktree
  (`git submodule status`); `openspec validate add-dice-roll-animation --strict` must pass.

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills
  list for `pr-review-toolkit:review-pr`. If not listed, halt immediately, tell the user the
  plugin is required, give installation guidance, and do not proceed until they confirm it
  is installed.
- [ ] **Design-time spike (blocking the dependency commit):** in a throwaway script or
  sandbox, confirm the chosen 3D dice library (`@3d-dice/dice-box`, per design Decision 2)
  can render **predetermined** outcomes for d4, d6, d8, d10, d12, d20, and percentile (two
  d10s decoding to 1..100 including "00"→100). Record the exact notation form in
  `design.md` Decision 2. If percentile predetermination is unsupported, switch percentile
  to the 2D SVG fallback and note it in `design.md` and the spec before writing integration
  code.

## Execution

- [ ] **Issue lifecycle: mark in-progress** — run
  `gh issue edit 586 --add-label "in-progress"`. Then discover the linked GitHub Project
  (`gh project list --owner dougis-org --format json`), resolve the status field option
  matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`),
  and move the item via `gh project item-edit`. If no project item is found, log a warning
  and continue. If the `gh` token lacks `project` scope, tell the user to run
  `gh auth refresh -s project` and skip the project-item update (the label edit still
  applies).
- [ ] Before writing new logic, check for reusable pieces: `rollDicePool` / `rollPercentile`
  (`lib/utils/dice.ts`) already return the per-die detail; `useDockState`
  (`lib/components/CampaignChat/useDockState.ts`) is the `LocalStore` + `safeGet`/`safeSet`
  persistence pattern; `DieGlyph` (`lib/components/dice/DieGlyph.tsx`) is the shared
  icon/label component (decision n123); decision n047's body-level portal pattern.

### E1 — Data seam on `BuiltRoll` (spec: `dice-pool-shared-state`)

- [ ] **Test first:** in `tests/unit/lib/dice/useDicePoolState.test.ts`, add failing tests:
  `buildRoll()` returns `breakdown: {sides,value}[]` (one per die, correct sizes) and
  `modifier`, with `formula`/`rolls`/`total` unchanged; `buildPercentileRoll()` returns
  `percentileFaces: [tens, ones]` that decode to `total`, pool/modifier untouched.
- [ ] Widen `BuiltRoll` in `lib/dice/useDicePoolState.ts` to add
  `breakdown: { sides: number; value: number }[]`, `modifier: number`,
  `percentileFaces?: [number, number]`. Update `buildRoll` to keep `rollDicePool(groups)`
  results for `breakdown` (derive `rolls` from them as today) and set `modifier`. Update
  `buildPercentileRoll` to set `percentileFaces` from `rollPercentile()`.
- [ ] Update any `BuiltRoll` object literals in existing tests/fixtures to satisfy the type.
- [ ] Confirm `submitRoll` in `GlobalDiceFab` still passes only
  `formula, rolls, total, visibility` (add/keep a test asserting the POST body shape).

### E2 — Preferences hook (spec: `global-dice-fab` — animation preference; send-to-chat checkbox)

- [ ] **Test first:** `tests/unit/lib/dice/useDiceFabPreferences.test.ts` — table of
  (stored value, `matchMedia` reduced-motion) → resolved `disableAnimation`; explicit
  choice overrides media query; `sendToChat` default `false`; both persist across remount;
  storage-unavailable path does not throw.
- [ ] Add `lib/dice/useDiceFabPreferences.ts`: `LocalStore` + `safeGet`/`safeSet` wrappers,
  keys `dice-fab-send-to-chat` and `dice-fab-disable-animation` (`// nosemgrep`).
  `disableAnimation` stored tri-state (`true|false|null`); resolved value falls back to
  `window.matchMedia('(prefers-reduced-motion: reduce)').matches` when `null`. Client-only
  guards for SSR.

### E3 — Animation library seam + notation mapping (spec: `global-dice-fab` — rolling plays an animation; NFAC performance/reliability)

- [ ] **Test first:** `tests/unit/lib/dice/toDiceBoxNotation.test.ts` — pure function
  `toDiceBoxNotation(built: BuiltRoll)` → predetermined notation for each die type, mixed
  pools, modifier handling, percentile (two d10s), and the `DICE_ANIM_CAP = 30` cap
  (120-die pool → ≤30 dice; `total` unchanged).
- [ ] Add `lib/dice/toDiceBoxNotation.ts` (pure, no library import).
- [ ] Add `lib/dice/useDiceAnimation.ts`: lazy `import()` of the 3D library, WebGL +
  asset-load feature detection behind a timeout, `run(built)` that plays the predetermined
  tumble and resolves on settle, teardown, and a `status` of
  `'idle' | 'unsupported'`. On detection failure it resolves immediately (instant path) and
  logs once via the existing client logging seam. Single-instance invariant.
- [ ] Add `@3d-dice/dice-box` to `package.json` (only after the Preflight spike passes).
  Self-host its runtime assets under `public/dice-box/`; wire the asset path.
- [ ] Confirm via `next build` output / bundle analysis that the library package is not in
  the entry/first-load chunk (NFAC performance scenario).

### E4 — Roll overlay + total modal (spec: `global-dice-fab` — dismissing the overlay leaves the panel open)

- [ ] **Test first:** `tests/unit/components/DiceRollOverlay.test.tsx` — portal mounts to
  `document.body`; Escape removes only the overlay; outside-click removes only the overlay;
  a second roll replaces (never stacks) the overlay; total modal shows `built.total`;
  disabled-animation path shows the modal with no canvas node.
- [ ] Add `lib/components/dice/DiceRollOverlay.tsx`: body-level portal (lazily created root,
  SSR-safe per n047), hosts the animation canvas container and the total modal, capture-
  phase Escape/outside-click handler that `stopPropagation`s so `useDicePoolState`'s panel
  handler does not also fire. Reuse `DieGlyph` for any static die labelling.

### E5 — Wire into `GlobalDiceFab` (spec: `global-dice-fab` — MODIFIED send-to-chat)

- [ ] **Test first:** in `tests/unit/components/GlobalDiceFab.test.tsx`, replace the
  post-roll "Send to session chat" button tests with:
  - checked + active session → `submitRoll` called once with exact args; animation seam not
    invoked until the promise resolves; `sendState` → `'sent'` on 201 then animation runs.
  - unchecked, or no presence → no `submitRoll` / `fetch`; animation runs immediately.
  - `submitRoll` → `'error'`/`'conflict'` → `sendState` `'failed'`, retry affordance shown,
    animation still runs, no throw.
  - "Disable Animation" checked → overlay opens with total modal, no tumble.
  - checkbox states persist across remount while presence exists.
- [ ] In `lib/components/GlobalDiceFab.tsx`: consume `useDiceFabPreferences` and
  `useDiceAnimation`; render the "send to session chat" and "Disable Animation" checkboxes
  in the panel; remove the post-roll send button markup (keep `sendState` + retry text).
  Make `handleRoll` / `handlePercentileRoll` async: `build → (if sendToChat && presence:
  await submitRoll, set sendState) → animate (or instant) → setResult`. Disable Roll +
  percentile controls while `sendState === 'pending'` (existing behavior — verify).
- [ ] Update `.wolf/anatomy.md` (new files) and append to `.wolf/memory.md`.

### E6 — Spec/behaviour reconciliation

- [ ] Re-read `openspec/changes/add-dice-roll-animation/specs/**` and confirm every scenario
  has a corresponding passing test (see `tests.md`). Mark "Confirm acceptance criteria are
  covered".

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code`
  skill. Automatically apply all clearly-correct findings to the code — without stopping,
  without presenting the list to the user, without asking for confirmation. Apply fixes,
  re-run tests to confirm green, then commit.

## Validation

- [ ] Run unit/integration tests via the project harness (see README / CLAUDE.md — do not
  invoke Jest directly per decision n102)
- [ ] Run E2E tests (dice-roll smoke: real animation settles on decided faces; run against
  a free port, not 3000)
- [ ] Run type checks
- [ ] Run build (`next build`) and confirm the 3D library is not in the entry chunk
- [ ] Run security / code-quality checks required by project standards (Verity gate — fix
  findings, do not `verity waive` on agent judgment)
- [ ] All completed tasks marked complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Determine whether the change is **docs-only**: `git diff --name-only HEAD` (or vs. the base
branch) — if every changed file ends in `.md`, use the docs-only path; else the full path.
This change touches `.ts`/`.tsx`/`package.json`, so the **full path** applies.

**Full path** (any non-`.md` file changed):

- **Unit tests** — project unit suite; all pass
- **Integration tests** — project integration suite (via the harness that owns the MongoDB
  container + Next.js lifecycle); all pass
- **Regression / E2E tests** — project E2E/regression suite; all pass
- **Build** — `next build`; succeeds with no errors

If **any** required step fails, iterate and fix before pushing. Use the project's documented
commands (README / CLAUDE.md).

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent ran and all findings were auto-addressed
  before the final commit
- [ ] Commit all changes to `add-dice-roll-animation` and push to remote
- [ ] Open PR from `add-dice-roll-animation` → `main`. **PR body MUST include
  `Closes #586`** (unconditional). Search for a PR template
  (`.github/PULL_REQUEST_TEMPLATE*`) and follow it.
- [ ] **Issue lifecycle: mark in-review** — `gh issue edit 586 --add-label "in-review"
  --remove-label "in-progress"`, then move the project item to the "In Review" column (same
  discovery as the in-progress step; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit,
  push, re-run) until zero findings remain. If findings persist after three or more
  iterations with no progress, report the stall with remaining findings and wait for human
  guidance.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):**
  `gh pr merge <PR-URL> --auto --merge` (NEVER `--admin`; never force-merge; never bypass
  branch protection)
- [ ] **Iterate until merged** — repeat continuously until
  `gh pr view <PR-URL> --json state` returns `MERGED` (if `CLOSED`, exit and notify the
  user). Never wait for a human to report the merge:
  1. **Build and tests** — run all [Remote push validation] steps; fix failures, commit,
     push first
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; resolve every
     unresolved thread (address, commit, validate, push, wait 180s); every PR comment must
     be addressed before merge (memory: resolve-pr-comments)
  3. **CI check failures** — only after comments are resolved, poll
     `gh pr checks <PR-URL>`; fix failing required checks (commit, validate, push, wait
     180s); restart from step 1

Ownership metadata:

- Implementer: TBD (assigned at apply time)
- Reviewer(s): `openspec-review-code` sub-agent (pre-commit) + `pr-review-toolkit:review-pr`
  sub-agent (post-PR) + human PR review
- Required approvals: per `main` branch protection

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm thread resolved

## Post-Merge

- [ ] From the primary checkout: `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (README dice section, if any;
  `.wolf/anatomy.md`; `.wolf/cerebrum.md` learnings)
- [ ] Sync approved spec deltas into `openspec/specs/`: copy
  `specs/global-dice-fab/spec.md` and `specs/dice-pool-shared-state/spec.md` into
  `openspec/specs/<cap>/spec.md`, merging ADDED/MODIFIED into the live requirements. Fix
  relative links: `../../design.md` → `../../changes/archive/<date>-add-dice-roll-animation/design.md`,
  same for `../../tasks.md`.
- [ ] Archive the change: move `openspec/changes/add-dice-roll-animation/` to
  `openspec/changes/archive/<YYYY-MM-DD>-add-dice-roll-animation/` and stage the new
  location **and** the deletion of the old location in a **single** commit
- [ ] Confirm the archive dir exists and `openspec/changes/add-dice-roll-animation/` is gone
- [ ] Create a doc branch: `git checkout -b doc/archive-<YYYY-MM-DD>-add-dice-roll-animation`
  then `git push -u origin doc/archive-<YYYY-MM-DD>-add-dice-roll-animation`
- [ ] Open a PR from that doc branch → `main`, title
  `docs: archive add-dice-roll-animation (<YYYY-MM-DD>)` — do NOT push directly to `main`
- [ ] **Immediately** enable auto-merge on the doc PR:
  `gh pr merge <DOC-PR-URL> --auto --merge` (never `--admin`)
- [ ] Monitor the doc PR until merged (same loop as the implementation PR)
- [ ] Remove the change's worktree: from the primary checkout,
  `git worktree remove .worktrees/add-dice-roll-animation` (use `--force` if the
  openspec-shared submodule blocks removal — memory: worktree-submodule-removal)
- [ ] Prune merged local branches: `git fetch --prune` and
  `git branch -D add-dice-roll-animation doc/archive-<YYYY-MM-DD>-add-dice-roll-animation`

Completion checklist:

- [ ] Docs updated (README, `.wolf/anatomy.md`, `.wolf/cerebrum.md`)
- [ ] Approved spec deltas synced into `openspec/specs/` before/with archive
- [ ] Change archived as a single atomic commit
- [ ] Change worktree removed and merged local branches pruned
