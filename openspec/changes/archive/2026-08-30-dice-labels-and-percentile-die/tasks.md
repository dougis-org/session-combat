# Tasks

Issue-driven: **#573**. Default branch: `main`. Feature branch: `feat/573-dice-labels-and-percentile-die`.

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/573-dice-labels-and-percentile-die` then immediately `git push -u origin feat/573-dice-labels-and-percentile-die`

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list. If not listed, halt, tell the user the plugin is required, provide installation guidance, and do not proceed until they confirm it is installed.
- [x] Re-run `openspec validate dice-labels-and-percentile-die --strict` — must pass before implementation.

## Execution

- [x] **Issue lifecycle: mark in-progress** — run `gh issue edit 573 --add-label "in-progress"`. Discover the linked GitHub Project (`gh project list --owner <owner> --format json`), resolve the status option matching "In Progress" (`gh project field-list <project-number> --owner <owner> --format json`), and move the item via `gh project item-edit`. If no project item is found, log a warning and continue. If the token lacks `project` scope, tell the user to run `gh auth refresh -s project` and skip the project-item update (label update still proceeds).

### 1. Centralized percentile helper (`dice-rolling`)

- [x] 1.1 Write failing tests in `tests/unit/lib/dice.test.ts` for `rollPercentile()`: returns `{ tensFace, onesFace, value }` with faces in 1..10 and `value` in 1..100; decodes `[10,10]→100`, `[10,9]→9`, `[9,7]→97`, `[10,1]→1`, `[1,10]→10`; over many iterations every face 1..10 appears for each die and every value 1..100 is reachable.
- [x] 1.2 Implement `rollPercentile()` in `lib/utils/dice.ts` via two `rollOneDie(10, …)` draws on the existing secure generator, applying the D3 decode rule; export `PERCENTILE_FORMULA = 'd%'`.
- [x] 1.3 Confirm 1.1 passes; refactor.

### 2. Shared die-control components (`dice-iconography`, `roll-share-ui`)

- [x] 2.1 Write failing tests for `lib/components/dice/DieGlyph.tsx`: `sides ∈ {4,6,8,10,12,20}` → matching `DIE_ICONS[sides]` + visible text `d{sides}`; percentile variant → exactly two `DiceD10Icon`s + visible text `d%`; label is rendered text, not only `title`/`aria-label`.
- [x] 2.2 Implement `DieGlyph`.
- [x] 2.3 Write failing tests for `lib/components/dice/DiePoolButton.tsx`: renders remove/add controls named `Remove d{sides}` / `Add d{sides}`; shows `DieGlyph` + `×{count}` badge; add disabled at `MAX_PER_DIE` and when `disabled`; fires `onAdd`/`onRemove`; renders no `title` attribute.
- [x] 2.4 Implement `DiePoolButton`.
- [x] 2.5 Write failing tests for `lib/components/dice/PercentileButton.tsx`: one control named `/percentile|d%/i`, shows `DieGlyph` `d%` variant, no count badge, no remove control, fires `onRoll` once per click, respects `disabled`.
- [x] 2.6 Implement `PercentileButton`.
- [x] 2.7 Confirm 2.1/2.3/2.5 pass; refactor.

### 3. Wire percentile into shared state (`dice-pool-shared-state`)

- [x] 3.1 Write a failing test in `tests/unit/lib/dice/useDicePoolState.test.ts`: `buildPercentileRoll()` returns `{ formula: 'd%', rolls: [v], total: v }` with a single `v` in 1..100 equal to `total`, independent of staged pool and modifier.
- [x] 3.2 Implement `buildPercentileRoll()` in `lib/dice/useDicePoolState.ts` on top of `rollPercentile()`; export from the hook return.
- [x] 3.3 Confirm 3.1 passes; refactor.

### 4. Chat-dock panel (`roll-share-ui`)

- [x] 4.1 Write failing tests for `DicePoolPanel`: each of the six die controls renders a visible `d{sides}` label; no die control carries `title`; the percentile control renders inline as the last item of the die row; clicking it invokes the new `onRollPercentile` prop.
- [x] 4.2 Write a failing test for `useCampaignDice`: `handlePercentileRoll()` calls `submitRoll` once with `formula: 'd%'`, one-element `rolls` (1..100), matching `total`, current `visibility`; toggles `isRolling`; maps `conflict`/failure to `rollError` like `handleDiceRoll`; does not reset the staged pool.
- [x] 4.3 Update `DicePoolPanel.tsx` to render `DIE_SIDES.map(DiePoolButton)` + one inline `PercentileButton`; remove the per-die `title`; add `onRollPercentile` prop.
- [x] 4.4 Add `handlePercentileRoll()` to `useCampaignDice.ts`; thread it through `CampaignChat` to the panel.
- [x] 4.5 Confirm 4.1/4.2 pass; refactor.

### 5. Global dice fab (`global-dice-fab`)

- [x] 5.1 Write failing tests for `GlobalDiceFab`: each die control shows a visible `d{sides}` label; the per-die hover-popover tooltip is gone (no `hoveredTooltip`-driven die tooltip element); an inline percentile control is present; clicking it sets a result with `formula 'd%'` and a 1..100 total; "Send to session chat" submits that result unchanged when presence exists.
- [x] 5.2 Update `GlobalDiceFab.tsx`: render shared `DiePoolButton` + `PercentileButton`; delete the die-button `hoveredTooltip` branches and the hover-popover `<div>` (keep the trigger tooltip); add a percentile handler feeding `setResult`.
- [x] 5.3 Confirm 5.1 passes; refactor.

### 6. Feed rendering (`roll-share-ui`)

- [x] 6.1 Write a failing test that `RollFeedItem` renders `{ formula: 'd%', rolls: [100], total: 100 }` as `d% → [100] = 100` with the standard roll-item treatment, and `{ rolls: [9], total: 9 }` as `d% → [9] = 9`.
- [x] 6.2 Adjust `ChatFeed.tsx` only if 6.1 reveals a gap (expected: none).
- [x] 6.3 Confirm 6.1 passes.

### 7. Regression + integration

- [x] 7.1 Update existing `GlobalDiceFab` / `CampaignChat` dice-pool unit suites for the new label markup and removed tooltips.
- [x] 7.2 Extend `tests/integration/campaigns/rolls.integration.test.ts` with a percentile submission (`formula: 'd%'`, `rolls: [v]`) round-tripping through `/api/campaigns/[id]/rolls` and appearing in the feed via SSE.
- [x] 7.3 Update `.wolf/anatomy.md` with the three new `lib/components/dice/` files; add a one-line pointer in `lib/components/icons/dice.tsx` that `rollPercentile()`'s two-face return is the roll-animation groundwork.
- [x] 7.4 Confirm acceptance criteria in every `specs/**` delta are covered by a test in `tests.md`.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. Automatically apply all clearly-correct findings directly to the code — no stopping, no presenting the list, no confirmation. Apply fixes, re-run tests, then commit.

## Validation

- [x] `npm run test:unit`
- [x] `npm run test:integration` (via the project harness — starts Mongo, cleans the test DB, starts Next.js)
- [x] `npm run test:regression` (E2E) if any user-facing flow is affected
- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm run build`
- [x] All completed tasks marked `- [x]`
- [x] All steps in [Remote push validation]

## Remote push validation

Determine whether the change is **docs-only**: `git diff --name-only HEAD` — if every changed file ends in `.md`, use the docs-only path; otherwise the full path.

**Full path** (any non-`.md` file changed — expected here):

- **Unit tests** — `npm run test:unit`; all pass
- **Integration tests** — `npm run test:integration`; all pass
- **Regression / E2E** — `npm run test:regression`; all pass
- **Build** — `npm run build`; succeeds with no errors

**Docs-only path:** run `npm run build` only; skip integration and E2E.

If ANY required step fails, iterate and fix before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent ran and all findings were addressed before the final commit
- [x] Commit all changes to the working branch and push
- [x] Open PR from `feat/573-dice-labels-and-percentile-die` to `main`. **PR body MUST include `Closes #573`** (unconditional).
- [x] **Issue lifecycle: mark in-review** — `gh issue edit 573 --add-label "in-review" --remove-label "in-progress"`; move the project item to the "In Review" column (same discovery as the in-progress step; warn and skip if not found).
- [x] Wait 60 seconds for CI to start
- [x] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero remain. If findings persist after 3+ iterations with no progress, report the stall with remaining findings and wait for human guidance.
- [x] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER `--admin`)
- [x] **Iterate until merged** — repeat until `gh pr view <PR-URL> --json state` returns `MERGED` (if `CLOSED`, exit and notify the user); never wait for a human to report the merge, never force-merge:
  1. **Build and tests** — run all [Remote push validation] steps; fix failures, commit, push before anything else this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for each unresolved thread, address, commit, run [Remote push validation], push, wait 180s; continue until all resolved (see project memory `feedback_resolve_pr_comments`)
  3. **CI check failures** — only after all comments resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix failing required checks, commit, run [Remote push validation], push, wait 180s; restart from step 1

Ownership metadata:

- Implementer:
- Reviewer(s):
- Required approvals:

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on `main`
- [x] Mark all remaining tasks complete (`- [x]`)
- [x] Update repository documentation impacted by the change (`.wolf/anatomy.md`, `.wolf/cerebrum.md` if a convention was learned)
- [x] Sync approved spec deltas into `openspec/specs/`: copy each `specs/<cap>/spec.md` into `openspec/specs/<cap>/spec.md`, merging ADDED/MODIFIED/REMOVED into the live spec; fix relative links to resolve from the archive location (`../../design.md` → `../../changes/archive/2026-08-29-dice-labels-and-percentile-die/design.md`, likewise for `../../tasks.md`)
- [x] Archive: move `openspec/changes/dice-labels-and-percentile-die/` to `openspec/changes/archive/2026-08-29-dice-labels-and-percentile-die/`, staging the new location and the deletion of the old in a **single commit**
- [x] Confirm the archive path exists and `openspec/changes/dice-labels-and-percentile-die/` is gone
- [x] **Create a doc branch:** `git checkout -b doc/archive-2026-08-29-dice-labels-and-percentile-die` then `git push -u origin doc/archive-2026-08-29-dice-labels-and-percentile-die`
- [x] Open a PR from that branch to `main`, title `docs: archive dice-labels-and-percentile-die (2026-08-29)` — **do NOT push directly to `main`** (see project memory `feedback_no_branch_protection_bypass`)
- [x] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER `--admin`)
- [x] Monitor the doc PR until merged (same loop as the implementation PR)
- [x] Prune merged local branches: `git fetch --prune` and `git branch -D feat/573-dice-labels-and-percentile-die doc/archive-2026-08-29-dice-labels-and-percentile-die`
