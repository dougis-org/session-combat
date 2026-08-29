## 1. Shared dice hooks (`lib/dice/`)

- [x] 1.1 Create `lib/dice/useDicePoolState.ts`: extract pool/modifier state, add/remove
      (clamped to `MAX_PER_DIE`/`MAX_MODIFIER`), `poolTotal`, open/close + outside-click +
      Escape handling (parameterized on `triggerRef`/`panelRef`), and a `buildRoll()`
      function using `rollDicePool`/`buildPoolFormula`/`getActiveDiceGroups`, from
      `CampaignChat.tsx`'s current `useDicePool` minus the submission call
- [x] 1.2 Unit test `useDicePoolState` in isolation (add/remove clamping, modifier
      clamping, open/close on outside-click/Escape, `buildRoll()` output shape)
- [x] 1.3 Create `lib/dice/useRollSubmission.ts`: extract `submitRoll(campaignId, formula,
      rolls, total, visibility)` from `CampaignChat.tsx`'s current `submitRoll`,
      preserving 201→'success', 409→'conflict', else/throw→'error' mapping
- [x] 1.4 Unit test `useRollSubmission` in isolation (success/conflict/error/thrown-error
      cases, mocking `fetch`)

## 2. Shared dice presentational components (`lib/components/dice/`)

- [x] 2.1 Create `lib/components/dice/DicePoolPanel.tsx`, moved from `CampaignChat.tsx`,
      driven by a `dp`-shaped prop matching `useDicePoolState`'s return value plus a
      passed-in `onRoll`/submission handler
- [x] 2.2 Create `lib/components/dice/DiceTriggerButton.tsx`, moved from
      `CampaignChat.tsx`, taking `dp`, `isDisabled`, and `triggerRef` as props (disable
      logic computed by the caller, per design decision 5, not baked into the shared hook)

## 3. Wire CampaignChat to the shared dice hooks/components (pre-split, highest risk first)

- [x] 3.1 In `CampaignChat.tsx` (still the single file at this point), replace the inline
      `useDicePool`/`DicePoolPanel`/`DiceTriggerButton` with the new shared
      `useDicePoolState` + `useRollSubmission` + `lib/components/dice/*` components,
      preserving `isTriggerDisabled = activeSessionId !== null ? streamStatus !== 'open' :
      true` computed locally and passed in as a prop
- [x] 3.2 Run the full existing dice-pool test suite
      (`CampaignChat.dicePool.ui.test.tsx`, `CampaignChat.dicePool.commit.test.tsx`,
      `CampaignChat.dicePool.scroll.test.tsx`, `CampaignChat.dicePool.ssr.test.tsx`) and
      confirm all pass unchanged before proceeding to any further step

## 4. Remove the optimistic roll-append path and the roll-request bridge channel

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
- [x] 4.7 Update `CampaignChat.sse.test.tsx` / relevant test file(s) if any assertion
      depended on the now-removed optimistic append timing (own-roll scroll behavior should
      still pass since it's covered by `onStreamEvent`'s existing `rollerId` check)

## 5. Update GlobalDiceFab to submit directly

- [x] 5.1 Replace `GlobalDiceFab.tsx`'s inline pool state (`pool`, `modifierText`,
      `handleAdd`, `handleRemove`, `poolTotal`) with `useDicePoolState`
- [x] 5.2 Replace `GlobalDiceFab.tsx`'s `requestRoll` call in `handleSendToChat` with a
      direct `await submitRoll(presence.campaignId, result.formula, result.rolls,
      result.total, result.visibility)` call from `useRollSubmission`, mapping
      `'success'` → `sendState: 'sent'`, `'conflict' | 'error'` → `sendState: 'failed'`
- [x] 5.3 Preserve `GlobalDiceFab`'s existing two-step interaction (roll locally via
      `buildRoll()`, display result, separate explicit "send" click) — do not collapse
      into a single auto-submit action (per proposal Non-Goals)
- [x] 5.4 Update `tests/unit/components/GlobalDiceFab.test.tsx`: replace
      `onRollRequested`-based assertions with direct `fetch` mocking for the submission
      call; add a case asserting send succeeds with presence set but no `CampaignChat`
      rendered in the test tree at all (the concrete bug-fix scenario)

## 6. Split CampaignChat.tsx into submodules

- [x] 6.1 Create `lib/components/CampaignChat/useDockState.ts`: `dockReducer`,
      `resolveHeight`, `DragHandle`'s drag-resize handlers (`handleDragStart`), pin/expand
      /collapse handlers, persisted-size init/validation (`PIN_KEY`, `CHAT_SIZE_KEY`,
      `NAVBAR_HEIGHT`, `isValidPersistedSize`, `safeGet`/`safeSet`/`safeRemove`)
- [x] 6.2 Create `lib/components/CampaignChat/useChatFeed.ts`: `feed`/`seenIds` state, SSE
      wiring (`onStreamEvent` for message/roll/session, including the unchanged
      `scrollToBottom(roll.rollerId === user?.userId)` on-ingest scroll check), history
      fetch + infinite-scroll pagination, `scrollToBottom`
- [x] 6.3 Create `lib/components/CampaignChat/ChatFeed.tsx`: `ChatFeed`,
      `ChatMessageItem`, `RollFeedItem`, `getVisibilityMarker`, `resolveUsername`
- [x] 6.4 Create `lib/components/CampaignChat/Composer.tsx`: `ChatComposer`,
      `MentionDropdown`
- [x] 6.5 Create `lib/components/CampaignChat/DragHandle.tsx` (trivial move, unchanged)
- [x] 6.6 Create `lib/components/CampaignChat/index.tsx`: coordinator wiring
      `useDockState` + `useChatFeed` + the shared dice hooks/components (already wired in
      step 3), rendering the collapsed pill and expanded drawer, re-exporting
      `CampaignChat` so `@/lib/components/CampaignChat` continues to resolve
- [x] 6.7 Delete the original `lib/components/CampaignChat.tsx`
- [x] 6.8 Update any relative imports inside the moved test helpers/files if needed (test
      import paths already reference `@/lib/components/CampaignChat`, which should require
      no change per design decision 4 — verify this holds)

## 7. Verification

- [x] 7.1 Run `npm run test:unit` — full suite, including all 13
      `tests/unit/components/CampaignChat/*.test.tsx` files, `GlobalDiceFab.test.tsx`, and
      `diceSessionBridge.test.ts`, and confirm everything passes
- [x] 7.2 Run the project's typecheck/build to confirm no remaining import of the removed
      `diceSessionBridge` exports and no other type errors from the split
- [ ] 7.3 Manual smoke check: chat drawer collapse/expand/pin/drag-resize; roll dice from
      the chat-docked panel; roll dice from `GlobalDiceFab` with chat open; roll dice from
      `GlobalDiceFab` with chat collapsed; roll dice from `GlobalDiceFab` with chat not
      mounted at all (e.g. a non-campaign page, if presence is somehow still set — or
      simply confirm the send affordance is correctly absent without presence) and with
      chat mounted-but-closed on a campaign page
- [x] 7.4 Confirm no file under `lib/components/CampaignChat/` or `lib/dice/` trips the
      Verity quality gate's size threshold
