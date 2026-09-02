## Context

Issue #580 asks to split `CampaignChat.roll.test.tsx` along its `T1/T2/T3/T5`
markers. Since the issue was filed the file has grown from 340 → 436 lines and
gained a ported "Feed auto-scroll on a stream 'roll' event" section (2 tests +
local geometry helpers) from the deleted `CampaignChat.dicePool.scroll.test.tsx`.
The `CampaignChat.dicePool.*` files the issue names as the naming precedent no
longer exist; the surviving convention is `CampaignChat.<concern>.test.tsx` with
shared setup in `helpers.tsx` and per-file `jest.mock()` blocks (mock factories
are hoisted per file and cannot be centralized).

## Goals / Non-Goals

**Goals:**
- Every resulting file under the ~300-line guidance, one concern each.
- Test bodies and assertions byte-identical to today (git should show pure moves).
- Local setup reconciled with `helpers.tsx` rather than duplicated per split file.

**Non-Goals:**
- Any change to `CampaignChat.tsx` or other application code.
- Rewriting assertions, adding coverage, or "improving" tests while moving them.
- Relocating the percentile tests out of the CampaignChat suite (they exercise
  `RollFeedItem`, not the numeric-chip modal — moving them to `tests/.../dice/`
  would require rebuilding the CampaignChat + `useCampaignStream` harness there).

## Decisions

- **Four files, by concern:** `stream` (ingestion/dedup), `rendering`
  (`RollFeedItem` output, incl. `d%` formula path), `history` (fetch/merge/sort),
  `scroll` (auto-scroll geometry). Scroll stays separate rather than folding into
  `history` because it drags along `getFeedContainer` / `markScrolledUp`.
- **Percentile tests → `rendering`.** Confirmed with the issue owner: they assert
  `d% → [97] =` feed-row text through the standard formula path, a rendering
  concern, not stream mechanics.
- **Drop T1.** `CampaignChat.ssr.test.tsx` already asserts the dock renders with
  `activeSessionId: null`; the non-null case is covered implicitly by every other
  test in the new files calling `openDockWithSession`.
- **helpers.tsx changes are additive:**
  - new `makeRoll(overrides)` fixture (the local one, moved verbatim).
  - `setupFetchMock` gains a `/rolls` GET branch returning `overrides.rolls ??
    { rolls: [] }`. Existing routes and the POST-replacement path (`mockRollPost`)
    are untouched, so `dice/`-adjacent suites are unaffected.
  - call sites switch `openDock(sessionId)` → `openDockWithSession(sessionId)`
    (already exported, returns `{ user, rerender }`), and the local
    `capturedOnEvent` → `sharedTestState.capturedOnEvent`, matching
    `CampaignChat.sse.test.tsx`.

## Risks / Trade-offs

- **Risk:** `setupFetchMock` divergence — the local mock guarded GET vs POST on
  `/messages` and `/rolls`; the shared one keys off URL substring + a `/messages`
  POST branch. **Mitigation:** add the `/rolls` GET branch explicitly and run the
  full `CampaignChat/` + `dice/` suites before/after to confirm no route
  regression.
- **Risk:** T5.3 / T5.4 depend on both `/messages` and `/rolls` GET returning
  seeded fixtures in one `setupFetchMock({ messages, rolls })` call. **Mitigation:**
  the added branch reads `overrides.rolls`, matching how `overrides.messages`
  already works.
- **Trade-off:** 16 tests across 4 files + shared helpers is more files to open,
  but matches the rest of the `CampaignChat/` suite and the repo's size gate.
