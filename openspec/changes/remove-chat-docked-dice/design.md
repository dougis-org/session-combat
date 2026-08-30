## Context

- **Relevant architecture:**
  - `lib/components/CampaignChat/index.tsx` — coordinator for the chat dock. Renders a
    flex-row wrapper whose children are `<DicePoolPanel>` (left) and the drawer
    (`role="complementary"`). The drawer stacks: header row, `<ChatFeed>` (`flex-1`),
    optional Push Scene / `<SceneComposer>`, `<ChatComposer>`, and a bottom bar with the
    "No active session" hint + `<DiceTriggerButton>`.
  - `lib/components/CampaignChat/useCampaignDice.ts` — binds `useDicePoolState` +
    `useRollSubmission` to the dock, plus a `isTriggerDisabled` rule
    (`activeSessionId !== null ? streamStatus !== 'open' : true`) and an effect that
    closes the panel when `activeSessionId` goes null.
  - `lib/components/dice/DicePoolPanel.tsx`, `lib/components/dice/DiceTriggerButton.tsx` —
    presentational; only consumer today is `CampaignChat/index.tsx`.
  - `lib/components/GlobalDiceFab.tsx` — mounted once in `app/layout.tsx`; its own
    `useDicePoolState` + `useRollSubmission`, its own pool/percentile controls
    (`DiePoolButton`, `PercentileButton`, `DieGlyph`), and a presence-gated "Send to
    session chat" affordance driven by `diceSessionBridge`.
  - `lib/dice/diceSessionBridge.ts` — `announcePresence` / `clearPresence` /
    `onPresenceChange`. `CampaignChat` announces `{campaignId, sessionId}` while it owns an
    active session; `GlobalDiceFab` subscribes.
- **Dependencies (must remain after this change):** `lib/dice/useDicePoolState.ts`
  (`buildRoll`, `buildPercentileRoll`, `setIsOpen`, …), `lib/dice/useRollSubmission.ts`,
  `lib/utils/dice.ts` (`rollPercentile`, `PERCENTILE_FORMULA`, `DIE_SIDES`),
  `lib/components/dice/DieGlyph.tsx`, `DiePoolButton.tsx`, `PercentileButton.tsx`,
  `lib/components/icons/dice` — all still used by `GlobalDiceFab`.
- **Interfaces/contracts touched:**
  - `CampaignChat` props: **unchanged** (`campaignId`, `activeSessionId`,
    `onSessionChange`, `onSizeChange`). `activeSessionId` keeps gating roll-history fetch
    and the presence bridge; it no longer gates a dice trigger (there is none).
  - Public import `@/lib/components/CampaignChat`: unchanged.
  - `/api/campaigns/[id]/rolls`, SSE `'roll'` event, `diceSessionBridge` API: untouched.

## Goals / Non-Goals

### Goals

- No dice trigger, dice panel, or dice-pool state in the chat dock.
- `ChatFeed` expands into the reclaimed vertical space with no extra work (it is already
  `flex-1 overflow-y-auto`).
- Bottom footer renders only when `activeSessionId === null`, showing just the
  "No active session" message.
- All dice-rolling still available (unchanged) from `GlobalDiceFab`.
- Roll history, interleaved feed, `RollFeedItem`, percentile feed rendering, and
  rollerId-based auto-scroll are behaviorally identical before and after.
- Zero dead code left behind; Verity size/quality gate green.

### Non-Goals

- Any modification to `GlobalDiceFab` or the shared dice hooks/components/utilities.
- Any change to the rolls API, SSE stream, `diceSessionBridge`, roll history fetching, or
  feed auto-scroll.
- Dice roll animation.
- Relocating or restyling `GlobalDiceFab`.

## Decisions

### Decision 1: Delete the chat-docked dice UI outright rather than feature-flag or hide it

- **Chosen:** Remove `<DicePoolPanel>`, `<DiceTriggerButton>`, and `useCampaignDice`
  entirely, and delete the three source files plus the four dead `CampaignChat.dicePool.*`
  test files.
- **Alternatives considered:** (a) keep the components but stop rendering them from
  `CampaignChat`; (b) a `showDockedDice` prop defaulting off.
- **Rationale:** `GlobalDiceFab` is a complete replacement and is already the FAB the
  requester wants. Nothing else imports these files. Keeping unrendered components would
  leave two staging-pool implementations to maintain through future dice work, which is
  the exact cost issue #585 is trying to shed. `decouple-dice-roll-capability` already
  established that no dice-pool or roll-submission code should live under
  `lib/components/CampaignChat/` — deleting `useCampaignDice.ts` completes that direction.
- **Trade-offs:** If a future requirement wants an in-drawer roll affordance, it comes
  back from git history / the archived `roll-share-ui` requirements rather than a live
  flag. Accepted — YAGNI, and the spec history preserves the design.

### Decision 2: Render the bottom footer only when there is no active session

- **Chosen:** Replace the always-rendered
  `<div class="border-t border-gray-700 p-2 flex-shrink-0 flex items-center justify-between">`
  (which held the "No active session" `<p>` and `<DiceTriggerButton>`) with a footer
  rendered **only** when `activeSessionId === null`:
  `{activeSessionId === null && (<div class="border-t border-gray-700 px-3 py-2 flex-shrink-0"><p class="text-xs text-gray-500">No active session</p></div>)}`.
- **Alternatives considered:** (a) always render the footer wrapper, empty when a session
  is active — leaves an empty bordered strip; (b) drop the footer entirely and surface
  "No active session" elsewhere (header, composer placeholder) — larger change, moves a
  known signal; (c) keep the `justify-between` two-column layout — pointless with one item.
- **Rationale:** The requester's answer to the explore question: "if no active session,
  replace the send button with the message." With an active session there is nothing to
  show, so the strip should not exist. `px-3 py-2` matches the sibling Push Scene strip's
  padding for visual consistency.
- **Trade-offs:** The drawer's resting height changes slightly when a session
  activates/deactivates while open. Acceptable — `ChatFeed` is `flex-1` and absorbs it;
  covered by a test.

### Decision 3: Keep the single-child flex-row wrapper in `index.tsx`

- **Chosen:** Leave `<div className={rowWrapperClass}>` in place even though its only
  remaining child is the drawer.
- **Alternatives considered:** Flatten — return the drawer (and its `rowWrapperClass`
  positioning merged onto it) directly.
- **Rationale:** Smallest, lowest-risk diff. `rowWrapperClass` carries the `fixed
  bottom-0 right-0 z-40` / `h-full` positioning that the `dock.isLarge` layout in
  `app/campaigns/[id]/layout.tsx` depends on; merging it onto the drawer risks a
  positioning regression for marginal gain.
- **Trade-offs:** One layer of arguably-redundant markup remains. Flagged as the sole
  open question; can be flattened in a follow-up if desired.

### Decision 4: Spec delta treats `roll-share-ui` as reduced, not deleted

- **Chosen:** In `openspec/changes/remove-chat-docked-dice/specs/roll-share-ui/spec.md`,
  mark REMOVED the requirements that describe the chat-docked trigger, staging pool,
  in-chat percentile control, flex-sibling panel, and roll-entry-strip replacement;
  MODIFY the "CampaignChat accepts activeSessionId prop" requirement to drop the dice
  clause; ADD a requirement for the session-gated footer. Keep untouched: interleaved
  feed, roll history on expand, feed auto-scroll, roll-feed-item rendering, percentile
  *feed* rendering.
- **Alternatives considered:** Delete the whole `roll-share-ui` capability and fold the
  surviving feed requirements into `campaign-chat-wire`.
- **Rationale:** The surviving requirements are cohesive ("how chat renders rolls") and
  already cross-referenced from `global-dice-fab` and `dice-pool-shared-state`. Moving
  them would ripple into unrelated specs. `dice-pool-shared-state` / `dice-iconography` /
  `global-dice-fab` need no delta — they never asserted the chat panel exists, only that
  the shared pieces are shared.
- **Trade-offs:** `roll-share-ui`'s Purpose line still mentions "in-chat dice-rolling UI";
  the delta updates that sentence to scope it to feed rendering + history.

### Decision 5: `campaign-chat-dock` "Source location" requirement drops `useCampaignDice.ts`

- **Chosen:** MODIFY the `decouple-dice-roll-capability` "ADDED Source location for
  CampaignChat submodules" requirement so its enumerated file list no longer includes
  `useCampaignDice.ts`, and its "no dice-pool selection or roll-submission logic" clause
  now holds trivially (no dice hook at all).
- **Alternatives considered:** Leave it, treating the file list as illustrative.
- **Rationale:** The requirement enumerates the files explicitly and has a scenario that
  inspects "every file under `lib/components/CampaignChat/`"; deleting one file makes the
  literal list stale.
- **Trade-offs:** None material.

## Proposal to Design Mapping

- Proposal element: Remove `<DicePoolPanel>`, `<DiceTriggerButton>`, `useCampaignDice`,
  refs/state/handlers from `index.tsx`.
  - Design decision: Decision 1
  - Validation approach: `CampaignChat` renders with no `/roll|dice/i` control in the
    drawer; `grep` shows no remaining imports; full `tests/unit/components/CampaignChat/`
    suite green; typecheck + build green.
- Proposal element: Bottom bar rendered only when `activeSessionId === null` with just the
  "No active session" message.
  - Design decision: Decision 2
  - Validation approach: New tests — footer present with text when `activeSessionId={null}`,
    absent when `activeSessionId="s1"`.
- Proposal element: Delete dead source + dead tests.
  - Design decision: Decision 1
  - Validation approach: Files absent; `npm run test:unit` and `npm run typecheck` pass;
    no orphaned import errors.
- Proposal element: Keep `announcePresence` / `clearPresence` and `activeSessionId` prop.
  - Design decision: Decisions 1, 4
  - Validation approach: `dice-session-bridge` scenarios still pass; `GlobalDiceFab`
    "Send to session chat" appears when `CampaignChat` has an active session (existing
    `GlobalDiceFab.test.tsx`).
- Proposal element: Spec deltas for `roll-share-ui` and `campaign-chat-dock`.
  - Design decision: Decisions 4, 5
  - Validation approach: `openspec validate remove-chat-docked-dice --strict` passes;
    delta review.
- Proposal element: Keep the single-child flex-row wrapper.
  - Design decision: Decision 3
  - Validation approach: `dock.isLarge` layout in `app/campaigns/[id]/layout.tsx` renders
    unchanged (existing `CampaignChat.resize.test.tsx` / `.drawer.test.tsx`).

## Functional Requirements Mapping

- Requirement: Chat dock renders no dice trigger or dice panel.
  - Design element: Decision 1 — deletions in `index.tsx`.
  - Acceptance criteria reference: `roll-share-ui` REMOVED "Dice pop-out trigger anchored
    to the chat dock", REMOVED "Dice staging pool", REMOVED "Dice panel renders as an
    in-flow flex sibling", REMOVED "Standalone percentile (d%) roll control" (chat-dock),
    REMOVED "Commit rolls the entire staged pool", REMOVED "Roll-entry strip is replaced
    by the dice pop-out trigger and pool".
  - Testability notes: RTL `queryByRole('button', { name: /roll|dice/i })` within the
    `complementary` drawer returns null; no element with `title="Dice Rolls for main
    screen pop out"`.
- Requirement: `CampaignChat` still accepts `activeSessionId` and gates roll history +
  presence on it (no dice gating).
  - Design element: Decisions 1, 4 — prop retained, `useCampaignDice` removed.
  - Acceptance criteria reference: `roll-share-ui` MODIFIED "CampaignChat accepts
    activeSessionId prop".
  - Testability notes: `activeSessionId={null}` → no GET `/rolls`, feed loads; non-null →
    GET `/rolls?sessionId=…` fired (existing `CampaignChat.roll.test.tsx` unchanged).
- Requirement: Session-gated footer message.
  - Design element: Decision 2.
  - Acceptance criteria reference: `roll-share-ui` ADDED "Chat dock shows a no-active-
    session footer only when no session is active".
  - Testability notes: text `No active session` present iff `activeSessionId == null`.
- Requirement: Roll feed rendering, roll history, percentile feed rendering, auto-scroll
  unchanged.
  - Design element: No code change to `ChatFeed.tsx` / `useChatFeed.ts`.
  - Acceptance criteria reference: `roll-share-ui` (unchanged) "Interleaved feed…",
    "Roll history loaded on dock expand", "Feed auto-scrolls on a new dice roll, consumed
    solely via the SSE stream", "Roll feed item rendering", "Roll feed renders a
    percentile roll through the existing formula path".
  - Testability notes: `CampaignChat.roll.test.tsx` and `CampaignChat.dicePool.scroll`'s
    *feed* assertions — the auto-scroll behavior is retained via `roll.test.tsx`
    (`scroll` test file is deleted because it drives scroll via the removed panel; any
    stream-driven auto-scroll assertion it holds that is not already in `roll.test.tsx`
    must be migrated there — see tasks).
- Requirement: `campaign-chat-dock` submodule file list no longer includes
  `useCampaignDice.ts`.
  - Design element: Decision 5.
  - Acceptance criteria reference: `campaign-chat-dock` MODIFIED "Source location for
    CampaignChat submodules".
  - Testability notes: `ls lib/components/CampaignChat/` shows no `useCampaignDice.ts`;
    `grep -rl "rolls" lib/components/CampaignChat/` returns only feed-render/history files.

## Non-Functional Requirements Mapping

- Requirement category: reliability (SSR safety)
  - Requirement: The chat dock performs no `document`/portal access during server render
    after the dice panel is removed.
  - Design element: Removal of `DicePoolPanel`/`DiceTriggerButton` (the only portal-ish
    surface in the dock); dock shell already SSR-safe via `LocalStore.isBrowser()` +
    `useEffect` gating.
  - Acceptance criteria reference: `campaign-chat-dock` NFR "No localStorage access
    during server render" (unchanged); `global-dice-fab` NFR "No `document` access during
    server render" now covers all remaining dice-panel SSR risk.
  - Testability notes: The removed `CampaignChat.dicePool.ssr.test.tsx` is superseded by
    `GlobalDiceFab.ssr.test.tsx`; a lightweight `renderToString(<CampaignChat …/>)` smoke
    assertion is added to the dock's SSR coverage if not already present.
- Requirement category: performance
  - Requirement: No feed re-sort / layout thrash introduced.
  - Design element: `ChatFeed` and `useChatFeed` untouched; only siblings removed.
  - Acceptance criteria reference: `roll-share-ui` NFR "Feed append does not re-sort on
    SSE roll event" (unchanged).
  - Testability notes: existing `roll.test.tsx` dedup/append tests remain green.
- Requirement category: operability
  - Requirement: Verity size/quality gate passes for `lib/components/CampaignChat/`.
  - Design element: `index.tsx` shrinks (fewer imports, refs, one hook call, simpler
    footer); a file is deleted.
  - Acceptance criteria reference: `campaign-chat-dock` "No file in the split exceeds the
    project's readability/size guidance".
  - Testability notes: `verity` pre-commit gate green; line count of `index.tsx` drops.

## Risks / Trade-offs

- Risk/trade-off: An auto-scroll assertion unique to `CampaignChat.dicePool.scroll.test.tsx`
  is lost when that file is deleted.
  - Impact: A stream-roll auto-scroll regression could go uncaught.
  - Mitigation: Before deleting, diff its `it(...)` blocks against `roll.test.tsx`;
    migrate any SSE-stream-driven auto-scroll case (rollerId self/other, near-bottom gate)
    into `roll.test.tsx`, driving the roll via a mocked SSE event rather than the panel.
- Risk/trade-off: Hidden dependency on the dice trigger for focus order / tab index in
  the drawer.
  - Impact: Minor a11y/tab-order shift.
  - Mitigation: Keyboard-a11y scenarios in `campaign-chat-dock` still pass; manual tab
    check during apply via the `run` skill.
- Risk/trade-off: Single-child wrapper (Decision 3) is inelegant.
  - Impact: Cosmetic code smell.
  - Mitigation: Documented open question; cheap follow-up if the requester wants it flat.

## Rollback / Mitigation

- Rollback trigger: Post-merge regression in the chat dock (feed not rendering, drawer
  layout broken, presence bridge stopped announcing) traced to this change, or dice
  rolling unavailable because `GlobalDiceFab` turns out not to cover a needed flow.
- Rollback steps: `git revert` the squash-merge commit on `main`; restore the archived
  `roll-share-ui` requirements from the change archive if the revert lands after archive.
- Data migration considerations: None — no schema, no persisted state, no API change.
- Verification after rollback: `npm run test:unit` + `npm run test:integration` green;
  chat dock shows the dice trigger again; `GlobalDiceFab` unaffected either way.

## Operational Blocking Policy

- If CI checks fail: diagnose from the failing job log, fix on the working branch, push,
  re-run. Typecheck/lint failures from a missed import reference are the most likely and
  are fixed by completing the deletion sweep. Do not merge with red CI.
- If security checks fail: unexpected for a pure UI removal; if Codacy/Verity flags a
  finding, fix it — do not waive. A waive is only for a human-accepted risk with a cited
  source.
- If required reviews are blocked/stale: follow `pr-review-toolkit:review-pr` until zero
  findings, then enable auto-merge (`gh pr merge --auto --merge`). Never `--admin` /
  force-merge. If review stalls with no progress after 3 iterations, report remaining
  findings to the user and wait.
- Escalation path and timeout: If CI or review is stuck > ~1 working day with no path
  forward, summarize the blocker and remaining findings for the requester and pause.

## Open Questions

- Keep or flatten the single-child flex-row wrapper in `index.tsx` (Decision 3)? Default:
  keep. Not a blocker for apply.
