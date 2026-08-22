# Tasks

## Preparation

- [ ] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [ ] **Step 2 — Create and publish working branch:** `git checkout -b decouple-dice-panel-from-chat` then immediately `git push -u origin decouple-dice-panel-from-chat`

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [ ] **Issue lifecycle: mark in-progress** — this change is issue-driven (GitHub issue #521). Run `gh issue edit 521 --add-label "in-progress"`. Then discover the GitHub Project linked to `dougis-org/session-combat` (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).

### 1. `dice-session-bridge` — presence + roll-request module

- [ ] Add `lib/dice/diceSessionBridge.ts`: module-scoped singleton state; `announcePresence({campaignId, sessionId})`, `clearPresence()`, `onPresenceChange(cb)` (returns unsubscribe, replays current value to a new subscriber immediately per spec); `requestRoll({campaignId, sessionId, roll})`, `onRollRequested(cb)` (returns unsubscribe); test-only `resetDiceSessionBridge()` export.
- [ ] Write unit tests covering every scenario in `openspec/changes/decouple-dice-panel-from-chat/specs/dice-session-bridge/spec.md` (presence announce/clear/replay/unsubscribe, roll-request notify/no-op-with-no-subscribers).
- [ ] Confirm acceptance criteria in that spec file are covered by the new tests.

### 2. `CampaignChat` — bridge wiring (additive only)

- [ ] Add an effect in `CampaignChat` (near the existing `activeSessionId`/`streamStatus` state) that calls `announcePresence({campaignId, sessionId: activeSessionId})` whenever `activeSessionId` is non-null, and `clearPresence()` on unmount or when `activeSessionId` becomes null.
- [ ] Add a subscription via `onRollRequested` that, on receiving a payload, compares `payload.campaignId`/`payload.sessionId` against the component's current `campaignId` prop / `activeSessionId` state, and — only on an exact match — routes `payload.roll` through the existing POST-to-`/api/campaigns/:id/rolls` → success/409/error → append/dedupe → scroll tail (extract the shared tail from `handleRoll` into a small internal function if needed so both the in-chat trigger and the bridge subscription call the same code path; do not duplicate the POST/append/scroll logic).
- [ ] Do **not** modify `useDicePool`, `DicePoolPanel`, `DiceTriggerButton`, or any existing prop/behavior of `CampaignChat`'s own in-chat dice pool.
- [ ] Write/extend unit tests per `openspec/changes/decouple-dice-panel-from-chat/specs/dice-session-bridge/spec.md` ("CampaignChat only acts on a roll request matching its own current campaign and session", "CampaignChat announces and clears presence in lockstep...") and `openspec/changes/decouple-dice-panel-from-chat/specs/roll-share-ui/spec.md` (externally-requested roll reaches the feed identically; 409 handling; in-chat trigger unaffected).
- [ ] Run the existing `tests/unit/components/CampaignChat/CampaignChat.dicePool*.test.tsx`, `CampaignChat.roll.test.tsx`, and `CampaignChat.resize.test.tsx` suites unmodified and confirm they still pass (regression gate for "existing chat-roll behavior must not change").

### 3. `GlobalDiceFab` — standalone fab + modal

- [ ] Add `lib/components/GlobalDiceFab.tsx`: fixed lower-left button (reuse `DiceD20Icon` from `lib/components/icons/dice.tsx`), gated by `useAuth()` (renders nothing when `user` is `null`); center-screen modal on click, built from a pool-builder UI equivalent to the existing `DicePoolPanel` controls (extract/share the per-die-size stepper row if straightforward, otherwise duplicate minimally — see design.md's accepted trade-off) using `rollDicePool()` from `lib/utils/dice.ts` for computation.
- [ ] Implement Escape/outside-click close (mirror the existing `handlePointerDown`/`handleKeyDown` pattern from `useDicePool` in `CampaignChat.tsx`); no timeout-based close.
- [ ] Subscribe to `onPresenceChange`; show a "send to session chat" control only while presence is non-null; on click, call `requestRoll` using the *current* presence value read at click-time.
- [ ] Ensure no `document`/portal access occurs during SSR (mirror the guard already proven in `CampaignChat.dicePool.ssr.test.tsx`).
- [ ] Write unit tests covering every scenario in `openspec/changes/decouple-dice-panel-from-chat/specs/global-dice-fab/spec.md`.

### 4. Mount `GlobalDiceFab` in the root layout

- [ ] Add `<GlobalDiceFab />` to `app/layout.tsx` alongside `<NavBar />`.
- [ ] Manual check: load a few representative routes (a non-campaign page, a campaign page with no active session, a campaign page with an active session) and confirm the fab renders correctly, doesn't visually collide with the footer/nav, and the "send to session chat" option appears/disappears as expected.

### 5. General

- [ ] Implement sub-tasks in small, testable increments, in the order above (bridge → CampaignChat wiring → fab → root-layout mount), running the relevant test file after each step.
- [ ] Before writing new logic, check for existing reusable pieces (`rollDicePool`, `DIE_ICONS`/`DiceD20Icon`, the outside-click/Escape pattern in `useDicePool`, `useAuth`) — do not reimplement any of these.
- [ ] Confirm every acceptance criterion in `openspec/changes/decouple-dice-panel-from-chat/proposal.md` and every scenario across the three new/updated spec files is covered by a passing test or an explicit manual-check note above.

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

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against `main`) and check whether every changed file ends in `.md`. This change is expected to touch `.ts`/`.tsx` files, so the **full path** applies.

**Full path:**

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e:regression` (or `npm run test:e2e` if the regression subset is not applicable to this change); all tests must pass
- **Build** — `npm run build`; build must succeed with no errors
- **Type check** — `npm run typecheck`; must pass with no errors
- **Lint** — `npm run lint`; must pass with no errors

If **ANY** required step fails, iterate and fix before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `decouple-dice-panel-from-chat` to `main`. The PR body **must** include `Closes #521`.
- [ ] **Issue lifecycle: mark in-review**: run `gh issue edit 521 --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — never wait for a human to report the merge; never force-merge:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: (assign at apply time)
- Reviewer(s): (assign at apply time)
- Required approvals: 1 (project default)

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan (any finding touching `app/api/campaigns/[id]/rolls/route.ts` is a hard blocker requiring investigation per design.md's Operational Blocking Policy, since this change should not touch that route at all)
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (if any docs reference dice-rolling being session/campaign-only)
- [ ] Sync approved spec deltas into `openspec/specs/`: create `openspec/specs/global-dice-fab/spec.md` and `openspec/specs/dice-session-bridge/spec.md` (new capabilities), and merge the `roll-share-ui` delta's new "ADDED" requirement into `openspec/specs/roll-share-ui/spec.md`'s existing ADDED section. Update all relative links that pointed into the change directory (`../../design.md`, `../../tasks.md`) to `../../changes/archive/YYYY-MM-DD-decouple-dice-panel-from-chat/design.md` and `.../tasks.md`.
- [ ] Archive the change: move `openspec/changes/decouple-dice-panel-from-chat/` to `openspec/changes/archive/YYYY-MM-DD-decouple-dice-panel-from-chat/` **and stage both the new location and the deletion of the old location in a single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-decouple-dice-panel-from-chat/` exists and `openspec/changes/decouple-dice-panel-from-chat/` is gone
- [ ] **Create a doc branch**: `git checkout -b doc/archive-YYYY-MM-DD-decouple-dice-panel-from-chat` then `git push -u origin doc/archive-YYYY-MM-DD-decouple-dice-panel-from-chat`
- [ ] Open a PR from that branch to `main` with title `docs: archive decouple-dice-panel-from-chat (YYYY-MM-DD)` — do NOT push directly to `main`
- [ ] **Immediately** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin`)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D decouple-dice-panel-from-chat doc/archive-YYYY-MM-DD-decouple-dice-panel-from-chat`

Required cleanup after archive: `git fetch --prune` and `git branch -D decouple-dice-panel-from-chat doc/archive-YYYY-MM-DD-decouple-dice-panel-from-chat`
