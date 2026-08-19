# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** done during proposal (`git fetch origin main`, worktree branched from `origin/main`)
- [x] **Step 2 — Create and publish working branch:** done during proposal — `.worktrees/multi-dice-pool-popout` on branch `multi-dice-pool-popout`, pushed to `origin/multi-dice-pool-popout`

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — confirmed present in the available skills list (`pr-review-toolkit:review-pr`). No halt needed.

## Execution

- [x] **Step 1 — Issue lifecycle: mark in-progress**: `gh issue edit 509 --repo dougis-org/session-combat --add-label "in-progress"`. Discover the linked GitHub Project (`gh project list --owner dougis-org --format json`), resolve the status field option matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, instruct the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).

- [x] **Step 2 — `lib/utils/dice.ts`: add `rollDicePool`**
  - Add `rollDicePool(groups: { sides: number; count: number }[]): { sides: number; value: number }[]`, validating every group's `sides` against the existing `SUPPORTED_SIDES` and every group's `count` the same way `rollDie` validates `count`, before rolling any dice (fail closed — no partial rolls on validation failure).
  - Reuse the existing `rollOneDie`/`getCrypto` helpers; do not duplicate rejection-sampling logic.
  - `rollDie` itself is untouched — verify with a diff review that no existing export's signature or behavior changed.
  - Acceptance criteria: `dice-rolling` delta spec — "ADDED Backend supports multi-group dice-pool rolls", "Dice-pool rolls reuse the same secure randomness and validation as single-die rolls".

- [x] **Step 3 — `tests/unit/lib/dice.test.ts`: extend for `rollDicePool`** (write tests before/alongside the implementation per BDD/TDD)
  - Single-group pool returns correctly-tagged results.
  - Mixed-group pool returns results tagged by their own group's sides, in group order.
  - Empty group list returns `[]`.
  - Unsupported die size in any group rejects the whole call, no partial rolls.
  - Invalid count in any group rejects the whole call.
  - Run: `npm run test:unit -- tests/unit/lib/dice.test.ts`

- [x] **Step 4 — New `DicePoolPortal` overlay-root component**
  - Lazily create/reuse a `<div id="dice-pool-overlay-root">` under `document.body`, guarded by an `isBrowser()`-style check (mirror `LocalStore`'s existing SSR-safety convention) so no `document` access happens during server render.
  - Renders children via `createPortal`, `fixed`-positioned from the trigger's `getBoundingClientRect()`, recomputed on open/resize/scroll, `z-index` explicitly above the chat dock's `z-40`.
  - Acceptance criteria: `roll-share-ui` delta spec — "ADDED Floating dice pop-out renders outside the chat dock's DOM subtree"; NFAC "No `document` access during server render for the dice pop-out".

- [x] **Step 5 — New dice pop-out trigger + staging pool component in `lib/components/CampaignChat.tsx`**
  - Remove `RollEntryStrip` and its render call.
  - Add a persistent d20 trigger button anchored at the bottom of the chat dock; enabled iff `activeSessionId !== null` (same gating `RollEntryStrip` used); disabling it while open also closes the pop-out.
  - Add the pop-out itself (rendered through `DicePoolPortal` when open): grouped per-size counters (d4–d20) with add/remove controls, a modifier input, and the visibility selector (Group/DM-only) relocated from the old strip.
  - Wire outside-click and Escape-to-close handling.
  - Keep pop-out open/close state local to this new component tree — do not add it to `dockReducer`.
  - Acceptance criteria: `roll-share-ui` delta spec — "ADDED Dice pop-out trigger anchored to the chat dock", "ADDED Dice staging pool", "MODIFIED Roll-entry strip is replaced by the dice pop-out trigger and pool", "REMOVED Immediate-click-to-roll behavior".

- [x] **Step 6 — Commit ("Roll") handler**
  - Build `formula` from non-zero staged groups (`Nd<sides>` joined by `+`) plus modifier (`+M`/`-M`, omitted at 0), matching the existing sign convention from the old strip.
  - Call `rollDicePool` with the staged groups; flatten results to `rolls: number[]` in staged-group order; compute `total` as the sum plus modifier.
  - POST to `/api/campaigns/[id]/rolls` with the same body shape as today (`formula`, `rolls`, `total`, `visibility`) — no changes to the endpoint or `CampaignRoll` type.
  - Disable the "Roll" control and all pool controls while the POST is in flight; disable "Roll" when the pool is empty.
  - On `201`: pass the returned roll to the feed exactly as today (`onRollPosted`), then clear the staged pool and reset the modifier.
  - On `409`: show the existing "No active session" inline error, do not clear the staged pool, do not add anything to the feed.
  - Acceptance criteria: `roll-share-ui` delta spec — "ADDED Commit rolls the entire staged pool as one combined roll" (all scenarios).

- [x] **Step 7 — Component tests for the new pop-out/pool/trigger** (write/extend alongside implementation)
  - Trigger renders/enabled/disabled per `activeSessionId`; open/close on click, outside-click, and Escape.
  - Pop-out DOM node is a descendant of the overlay root, not the chat dock drawer (`role="complementary"` element) — validates Decision 4's portal structure.
  - Pool add/remove/modifier interactions with zero network calls until commit.
  - Commit POST body shape (formula/rolls/total/visibility) for a mixed-group pool, a single-die pool, and a zero-modifier pool.
  - Roll button disabled states: empty pool, in-flight commit.
  - Successful commit clears pool; 409 preserves pool and shows inline error.
  - No always-visible die buttons remain outside the (closed-by-default) pop-out.
  - Run: `npm run test:unit -- tests/unit/components/CampaignChat`

- [x] **Step 8 — Manual/visual verification** (per proposal Risk 1 and design Decision 4 trade-off)
  - Run the app locally (`npm run dev`), open a campaign with an active session, verify the pop-out positions correctly above-right of the trigger, is not clipped by the chat dock, and stacks above other fixed UI, on both a desktop-width and a narrow (mobile-width) viewport.
  - Confirm the two proposal Open Questions' chosen defaults (grouped counters; above-right anchor with fade/scale) render reasonably; note any visual issue for follow-up but do not block on aesthetic polish beyond "not broken/clipped."

- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch — confirmed: reused `rollOneDie`/`getCrypto` (Step 2), `isBrowser()`-style SSR guard convention from `LocalStore` (Step 4), existing formula-sign convention and 409/visibility handling from the old `RollEntryStrip` (Steps 5-6).
- [x] Confirm acceptance criteria are covered — cross-check every scenario in `openspec/changes/multi-dice-pool-popout/specs/dice-rolling/spec.md` and `openspec/changes/multi-dice-pool-popout/specs/roll-share-ui/spec.md` has a corresponding test from Steps 3 and 7.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. Automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests: `npm run test:unit`
- [x] Run E2E tests (if applicable to dice/chat flows): `npm run test:e2e` (or project's documented E2E command)
- [x] Run type checks: `npm run typecheck` (or project's documented command)
- [x] Run build: `npm run build`
- [x] Run security/code quality checks required by project standards (Codacy, per project skills)
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against `main`) and check whether every changed file ends in `.md`. This change touches `lib/utils/dice.ts`, `lib/components/CampaignChat.tsx`, and test files — the **full path** applies.

**Full path:**

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — project's integration test command; all tests must pass
- **Regression / E2E tests** — project's E2E/regression command; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

If **ANY** required step fails, iterate and fix before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `multi-dice-pool-popout` to `main`. PR body MUST include `Closes #509`.
- [x] **Issue lifecycle: mark in-review**: `gh issue edit 509 --repo dougis-org/session-combat --add-label "in-review" --remove-label "in-progress"`. Move the project item to the status column matching "In Review" via `gh project item-edit` (same discovery pattern as the in-progress step; warn and skip if not found).
- [x] Wait 60 seconds for CI to start
- [x] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [x] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [x] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if `CLOSED`, exit and notify the user — never wait for a human to report the merge; never force-merge:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent (this change)
- Reviewer(s): `pr-review-toolkit:review-pr` (automated gate) + human maintainer (dougis) on request
- Required approvals: zero outstanding `review-pr` findings before auto-merge is enabled; human approval not required to enable auto-merge per this project's schema rules, but PR remains open for human comment until merged

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only` (from the primary checkout, not the worktree)
- [x] Verify the merged changes appear on `main`
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Update repository documentation impacted by the change (none anticipated beyond the specs themselves — no README/CLAUDE.md changes expected)
- [x] Sync approved spec deltas into `openspec/specs/`:
  - Copy `openspec/changes/multi-dice-pool-popout/specs/dice-rolling/spec.md` content into `openspec/specs/dice-rolling/spec.md` (merge as ADDED requirements alongside existing content)
  - Copy `openspec/changes/multi-dice-pool-popout/specs/roll-share-ui/spec.md` content into `openspec/specs/roll-share-ui/spec.md` (merge ADDED/MODIFIED/REMOVED into the existing capability spec, replacing the superseded immediate-click requirement)
  - Update relative links that pointed into the change directory so they resolve from the archive location — replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-multi-dice-pool-popout/design.md`, and similarly for `../../tasks.md`
- [x] Archive the change: move `openspec/changes/multi-dice-pool-popout/` to `openspec/changes/archive/YYYY-MM-DD-multi-dice-pool-popout/` **and stage both the new location and the deletion of the old location in a single commit**
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-multi-dice-pool-popout/` exists and `openspec/changes/multi-dice-pool-popout/` is gone
- [x] **Create a doc branch**: `git checkout -b doc/archive-YYYY-MM-DD-multi-dice-pool-popout` then `git push -u origin doc/archive-YYYY-MM-DD-multi-dice-pool-popout`
- [x] Open a PR from `doc/archive-YYYY-MM-DD-multi-dice-pool-popout` to `main` with title `docs: archive multi-dice-pool-popout (YYYY-MM-DD)` — do NOT push directly to `main`
- [x] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin`)
- [x] Monitor the doc PR until it merges (same loop as the implementation PR)
- [x] Prune merged local branches: `git fetch --prune` and `git branch -D multi-dice-pool-popout doc/archive-YYYY-MM-DD-multi-dice-pool-popout`
- [x] Remove the change's dedicated worktree: `git worktree remove .worktrees/multi-dice-pool-popout`

Required cleanup after archive: `git fetch --prune` and `git branch -D multi-dice-pool-popout doc/archive-YYYY-MM-DD-multi-dice-pool-popout`
