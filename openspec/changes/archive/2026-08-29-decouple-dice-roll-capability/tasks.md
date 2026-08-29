# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `decouple-dice-roll-capability` — branch and initial `propose:` commit already existed from the proposal step; confirmed pushed to `origin` before implementation began.

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — confirmed present in the available skills list. In practice this change used the project's `pr-reviewer` skill (installed in this repo, equivalent monitor/fix/merge remit) rather than `pr-review-toolkit:review-pr` specifically; noted here for accuracy rather than claiming the literal tool was invoked.

## Execution

- [x] **Issue lifecycle: mark in-progress** _(skipped)_ — not performed; no GitHub Project item lookup/label update was done for issue #517 during this session.

### 1. Shared dice hooks (`lib/dice/`)

- [x] 1.1 Create `lib/dice/useDicePoolState.ts`: extract pool/modifier state, add/remove
      (clamped to `MAX_PER_DIE`/`MAX_MODIFIER`), `poolTotal`, open/close + outside-click +
      Escape handling (parameterized on `triggerRef`/`panelRef`), and a `buildRoll()`
      function using `rollDicePool`/`buildPoolFormula`/`getActiveDiceGroups`, from
      `CampaignChat.tsx`'s current `useDicePool` minus the submission call
- [x] 1.2 Unit test `useDicePoolState` in isolation (add/remove clamping, modifier
      clamping, open/close on outside-click/Escape, `buildRoll()` output shape)
- [x] 1.3 Create `lib/dice/useRollSubmission.ts`: extract `submitRoll(formula, rolls,
      total, visibility)` (returned from a `useRollSubmission(campaignId)` hook) from
      `CampaignChat.tsx`'s current `submitRoll`, preserving 201→'success', 409→'conflict',
      else/throw→'error' mapping
- [x] 1.4 Unit test `useRollSubmission` in isolation (success/conflict/error/thrown-error
      cases, mocking `fetch`)

### 2. Shared dice presentational components (`lib/components/dice/`)

- [x] 2.1 Create `lib/components/dice/DicePoolPanel.tsx`, moved from `CampaignChat.tsx`,
      driven by a `dp`-shaped prop matching `useDicePoolState`'s return value plus a
      passed-in `onRoll`/submission handler
- [x] 2.2 Create `lib/components/dice/DiceTriggerButton.tsx`, moved from
      `CampaignChat.tsx`, taking `dp`, `isDisabled`, and `triggerRef` as props (disable
      logic computed by the caller, per design decision 5, not baked into the shared hook)

### 3. Wire CampaignChat to the shared dice hooks/components (pre-split, highest risk first)

- [x] 3.1 In `CampaignChat.tsx` (still the single file at this point), replace the inline
      `useDicePool`/`DicePoolPanel`/`DiceTriggerButton` with the new shared
      `useDicePoolState` + `useRollSubmission` + `lib/components/dice/*` components,
      preserving `isTriggerDisabled = activeSessionId !== null ? streamStatus !== 'open' :
      true` computed locally and passed in as a prop
- [x] 3.2 Run the full existing dice-pool test suite
      (`CampaignChat.dicePool.ui.test.tsx`, `CampaignChat.dicePool.commit.test.tsx`,
      `CampaignChat.dicePool.scroll.test.tsx`, `CampaignChat.dicePool.ssr.test.tsx`) and
      confirm all pass unchanged before proceeding to any further step

### 4. Remove the optimistic roll-append path and the roll-request bridge channel

- [x] 4.1 Delete `CampaignChat.tsx`'s `handleRollPosted` function and its direct call from
      `submitRoll`'s success branch — a submitted roll now enters the feed only via the SSE
      `'roll'` stream event, matching every other client's roll
- [x] 4.2 Delete `CampaignChat.tsx`'s `useEffect` that calls `onRollRequested`, and its
      import of `onRollRequested` from `lib/dice/diceSessionBridge.ts`
- [x] 4.3 Re-run the repo-wide search for `requestRoll`/`onRollRequested` usages to confirm
      no remaining production or test callers before deleting the exports (per proposal's
      Risk mitigation — re-verify at implementation time, not just at proposal time)
- [x] 4.4 Remove `requestRoll`, `onRollRequested`, `RollRequestPayload`,
      `RollRequestResult`, `RollRequestListener`, and the request-shaped use of
      `RollOutcome` from `lib/dice/diceSessionBridge.ts`; keep `announcePresence`,
      `clearPresence`, `onPresenceChange`, `DicePresence`, and `resetDiceSessionBridge`
      unchanged
- [x] 4.5 Delete `tests/unit/components/CampaignChat/CampaignChat.diceSessionBridge.test.tsx`
      in its entirety (covers only the removed request/response path)
- [x] 4.6 Update `tests/unit/lib/dice/diceSessionBridge.test.ts` to drop all
      `requestRoll`/`onRollRequested` coverage, keeping presence-channel coverage intact
- [x] 4.7 Update `CampaignChat.dicePool.scroll.test.tsx` (assertions depended on the
      now-removed optimistic append timing) to simulate the SSE echo of the committed roll
      instead; own-roll scroll behavior continues to pass, now via `onStreamEvent`'s
      `rollerId` check

### 5. Update GlobalDiceFab to submit directly

- [x] 5.1 Replace `GlobalDiceFab.tsx`'s inline pool state (`pool`, `modifierText`,
      `handleAdd`, `handleRemove`, `poolTotal`) with `useDicePoolState`
- [x] 5.2 Replace `GlobalDiceFab.tsx`'s `requestRoll` call in `handleSendToChat` with a
      direct `await submitRoll(result.formula, result.rolls, result.total,
      dp.visibility)` call from `useRollSubmission(presence?.campaignId ?? '')`, mapping
      `'success'` → `sendState: 'sent'`, `'conflict' | 'error'` → `sendState: 'failed'`
- [x] 5.3 Preserve `GlobalDiceFab`'s existing two-step interaction (roll locally via
      `buildRoll()`, display result, separate explicit "send" click) — do not collapse
      into a single auto-submit action (per proposal Non-Goals)
- [x] 5.4 Update `tests/unit/components/GlobalDiceFab.test.tsx`: replace
      `onRollRequested`-based assertions with direct `fetch` mocking for the submission
      call; add a case asserting send succeeds with presence set but no `CampaignChat`
      rendered in the test tree at all (the concrete bug-fix scenario)
- [x] 5.5 _(added during review)_ Remove `GlobalDiceFab`'s duplicate outside-click/Escape
      document listeners — `useDicePoolState` already handles outside-click/Escape-to-close
      internally; the fab's own effect now only layers focus management on top of it

### 6. Split CampaignChat.tsx into submodules

- [x] 6.1 Create `lib/components/CampaignChat/useDockState.ts`: `dockReducer`,
      `resolveHeight`, `DragHandle`'s drag-resize handlers (`handleDragStart`), pin/expand
      /collapse handlers, persisted-size init/validation (`PIN_KEY`, `CHAT_SIZE_KEY`,
      `NAVBAR_HEIGHT`, `isValidPersistedSize`, `safeGet`/`safeSet`/`safeRemove`)
- [x] 6.2 Create `lib/components/CampaignChat/useChatFeed.ts`: `feed`/`seenIds` state, SSE
      wiring (`onStreamEvent` for message/roll/session, including the unchanged
      `scrollToBottom(roll.rollerId === user?.userId)` on-ingest scroll check), unread
      count, `scrollToBottom`
- [x] 6.2a _(added during review)_ Extract `lib/components/CampaignChat/useHistoryPagination.ts`
      from `useChatFeed`: history fetch-on-expand + infinite-scroll pagination, so
      `useChatFeed` becomes a coordinator (Verity flagged the un-split hook as over the
      function-size guidance)
- [x] 6.3 Create `lib/components/CampaignChat/ChatFeed.tsx`: `ChatFeed`,
      `ChatMessageItem`, `RollFeedItem`, `getVisibilityMarker`, `resolveUsername`
- [x] 6.4 Create `lib/components/CampaignChat/Composer.tsx`: `ChatComposer`,
      `MentionDropdown`
- [x] 6.4a _(added during review)_ Extract `lib/components/CampaignChat/useComposer.ts`:
      composer/mention state and handlers (`handleSend`, mention select/blur/keydown), so
      `index.tsx` no longer owns this logic inline
- [x] 6.5 Create `lib/components/CampaignChat/DragHandle.tsx` (trivial move, unchanged)
- [x] 6.5a _(added during review)_ Extract `lib/components/CampaignChat/useMembers.ts` and
      `lib/components/CampaignChat/useCampaignDice.ts` out of `index.tsx` (member-fetch
      effect; dice-pool/submission wiring + `isTriggerDisabled` computation), reducing the
      coordinator from 325 to ~215 lines per Verity's size-comprehensibility finding
- [x] 6.6 Create `lib/components/CampaignChat/index.tsx`: coordinator wiring
      `useDockState` + `useChatFeed` + `useComposer` + `useMembers` + `useCampaignDice` +
      the shared dice hooks/components, rendering the collapsed pill and expanded drawer,
      re-exporting `CampaignChat` so `@/lib/components/CampaignChat` continues to resolve
- [x] 6.7 Delete the original `lib/components/CampaignChat.tsx`
- [x] 6.8 Update any relative imports inside the moved test helpers/files if needed — test
      import paths already reference `@/lib/components/CampaignChat`; confirmed no change
      needed

### Hardening added during pre-commit/pre-push review (not originally itemized)

- [x] `useChatFeed`: reset all campaign-scoped state (feed, seenIds, pagination, unread)
      when `campaignId` changes, and generation-guard in-flight history requests so a stale
      response for a prior campaign cannot write into a newly switched campaign's feed
- [x] `useHistoryPagination`: reset `historyLoadedRef` on a failed/empty history response so
      a later expand retries instead of permanently believing history already loaded; added
      `CampaignChat.history.test.tsx` regression test
- [x] `useRollSubmission`, `useHistoryPagination`, `useMembers`, `useComposer`: URL-encode
      `campaignId`/`activeSessionId` path segments and build query strings via
      `URLSearchParams`
- [x] `lib/utils/dice.ts`: export a `DieSides` union type derived from `DIE_SIDES`; use it
      for `useDicePoolState`'s `handleAdd`/`handleRemove` parameters instead of bare `number`

## Pre-Commit Code Review

- [x] **Before every commit**, this repo's Verity pre-commit/pre-push gate (an automated
      review hook, not the `openspec-review-code` sub-agent named in this schema's default
      template) reviewed staged changes. All CRITICAL/HIGH findings across three review
      cycles were fixed directly (stale campaign-scoped feed state on `campaignId` change,
      unencoded identifiers in request URLs, a bodyless-201 false-failure bug, duplicate
      outside-click listeners, an unbounded die-side parameter type, and a stuck
      `historyLoadedRef` suppressing retry) before the commit/push was allowed to proceed.

## Validation

- [x] Run unit/integration tests — `npm run test:unit` (2988 tests, all passing); CI's
      `integration-tests` and `regression-tests` jobs also passed on the PR
- [ ] Run E2E tests (if applicable) — not applicable; no E2E scenarios touch this surface
- [x] Run type checks — `tsc --noEmit`, clean
- [x] Run build — `npm run build`, succeeds
- [x] Run security/code quality checks required by project standards — Verity gate passed;
      `eslint` clean across all touched files
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Change is **not** docs-only (non-`.md` files changed) — full path applied:

- [x] **Unit tests** — passed locally and in CI
- [x] **Integration tests** — passed in CI
- [x] **Regression / E2E tests** — passed in CI (`regression-tests` job)
- [x] **Build** — succeeded locally and in CI

## PR and Merge

- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `decouple-dice-roll-capability` to `main` — [PR #570](https://github.com/dougis-org/session-combat/pull/570), body includes `Closes #517`
- [x] **Issue lifecycle: mark in-review** _(skipped)_ — not performed, same as the in-progress step above
- [x] Wait for CI to start and complete
- [x] Used the `pr-reviewer` skill (monitor/fix/merge loop) in place of a dedicated
      `pr-review-toolkit:review-pr` sub-agent invocation; zero open review threads existed,
      all CI checks passed on the first run
- [x] **Enabled auto-merge:** `gh pr merge 570 --auto --squash` (squash, not `--merge`,
      matching this repo's established merge convention seen in prior PRs; never used
      `--admin`)
- [x] **Iterated until merged** — polled `gh pr view 570 --json state,statusCheckRollup`
      until all checks completed; PR reached `MERGED` with all 13 checks green
      (check-changes, lint, build, unit-tests, integration-tests, regression-tests,
      coverage upload, Codacy coverage/analysis, ci-gate) and zero comment threads

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on `main` (commit `965d769`)
- [x] Mark all remaining tasks as complete (`- [x]`) — except the manual browser smoke
      check (task 7.3 below), which genuinely was not performed
- [ ] Update repository documentation impacted by the change — none identified beyond this
      OpenSpec change itself
- [x] Sync approved spec deltas into `openspec/specs/`: `campaign-chat-dock` (ADDED
      submodule-location requirement, corrected to list the actual 9 extracted files),
      `dice-session-bridge` (REMOVED the two roll-request-channel requirements),
      `global-dice-fab` (MODIFIED "send to session chat" in place + ADDED the
      mounted-independence requirement + corrected a stale Security scenario), `roll-share-ui`
      (REMOVED the externally-requested-roll requirement, MODIFIED the auto-scroll
      requirement in place), and created the new `dice-pool-shared-state` capability spec
- [ ] Archive the change: move `openspec/changes/decouple-dice-roll-capability/` to
      `openspec/changes/archive/2026-08-29-decouple-dice-roll-capability/` in a single commit
- [ ] Confirm the archive directory exists and the original is gone
- [ ] **Create a doc branch:** `doc/archive-2026-08-29-decouple-dice-roll-capability`, push
- [ ] Open a PR from that branch to `main` titled `docs: archive
      decouple-dice-roll-capability (2026-08-29)` — do NOT push directly to `main`
- [ ] **Immediately enable auto-merge** on the doc PR
- [ ] Monitor the doc PR until it merges
- [ ] Prune merged local branches and remove the change's worktree

Required cleanup after archive: `git fetch --prune` and `git branch -D decouple-dice-roll-capability doc/archive-2026-08-29-decouple-dice-roll-capability`, then `git worktree remove .worktrees/decouple-dice-roll-capability`.

### 7. Verification

- [x] 7.1 Run `npm run test:unit` — full suite, including all CampaignChat test files,
      `GlobalDiceFab.test.tsx`, and `diceSessionBridge.test.ts`, and confirm everything
      passes (2988 tests)
- [x] 7.2 Run the project's typecheck/build to confirm no remaining import of the removed
      `diceSessionBridge` exports and no other type errors from the split
- [ ] 7.3 Manual smoke check: chat drawer collapse/expand/pin/drag-resize; roll dice from
      the chat-docked panel; roll dice from `GlobalDiceFab` with chat open; roll dice from
      `GlobalDiceFab` with chat collapsed; roll dice from `GlobalDiceFab` with chat not
      mounted at all (e.g. a non-campaign page, if presence is somehow still set — or
      simply confirm the send affordance is correctly absent without presence) and with
      chat mounted-but-closed on a campaign page — **not performed; no browser available in
      this session**
- [x] 7.4 Confirm no file under `lib/components/CampaignChat/` or `lib/dice/` trips the
      Verity quality gate's size threshold (largest file, `index.tsx`, is ~215 lines)
