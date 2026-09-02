## Why

`tests/unit/components/CampaignChat/CampaignChat.roll.test.tsx` is 436 lines
(GitHub issue #580 filed it at 340), well over this repo's ~300-line
comprehensibility guidance — the same threshold that drove the source-side
`CampaignChat.tsx` split in PR #570 and the test-suite split in PR #579.

The file already self-documents its seams with `// ── T1/T2/T3/T5 ──` section
markers, plus a later un-numbered "Feed auto-scroll" section that was ported in
from the removed `CampaignChat.dicePool.scroll.test.tsx`. It mixes four
unrelated concerns (stream ingestion, feed-row rendering, history fetch/merge,
auto-scroll geometry) and carries a local mock/fixture setup that has drifted
from this directory's shared `helpers.tsx`.

## What Changes

Pure test reorganization — no application code changes, no test assertions
changed. Every test keeps its current behavior; only its file location and the
setup it imports change.

- Split `CampaignChat.roll.test.tsx` into four concern-scoped files following
  the directory's `CampaignChat.<concern>.test.tsx` convention:
  - `CampaignChat.rollFeed.stream.test.tsx` — T2: SSE roll/message ingestion,
    dedup, mixed feed (4 tests)
  - `CampaignChat.rollFeed.rendering.test.tsx` — T3: `RollFeedItem` visual
    output (formula/breakdown/total/roller/`[DM]`/bg-class/vendored icon) **plus**
    the 2 percentile (`d%`) feed-rendering tests currently living under T2, which
    assert the standard-formula render path, not stream mechanics (6 tests)
  - `CampaignChat.rollFeed.history.test.tsx` — T5: roll-history fetch param,
    null-session skip, merged-feed sort, cross-source dedup (4 tests)
  - `CampaignChat.rollFeed.scroll.test.tsx` — the ported auto-scroll section,
    with its local `getFeedContainer` / `markScrolledUp` helpers (2 tests)
- Drop T1's 2 `activeSessionId` smoke tests as redundant: `CampaignChat.ssr.test.tsx`
  already covers `renders … activeSessionId: null` and every sibling suite
  smoke-renders the dock.
- Reconcile the local setup into `helpers.tsx`:
  - add a `makeRoll` fixture
  - extend `setupFetchMock` with a `/rolls` GET route (`overrides.rolls`)
  - migrate call sites from the local `openDock(sessionId)` (conflicting
    signature) to the existing `openDockWithSession`
  - use the shared `sharedTestState.capturedOnEvent` capture pattern instead of
    the file-local `capturedOnEvent`
- Delete `CampaignChat.roll.test.tsx`.
- Update `.wolf/anatomy.md` for the file set change.

## Capabilities

No spec changes. This change touches only test files and test helpers; no
capability behavior is added, modified, or removed.

## Impact

- Deletes `tests/unit/components/CampaignChat/CampaignChat.roll.test.tsx`.
- Adds 4 `tests/unit/components/CampaignChat/CampaignChat.rollFeed.*.test.tsx` files.
- Modifies `tests/unit/components/CampaignChat/helpers.tsx` (additive: new
  fixture + one fetch route; no change to existing exports' behavior).
- Test count: 18 current → 16 after (bodies unchanged). The only removal is
  T1's 2 smoke tests; the other 16 are relocated: stream 4 + rendering 6
  (T3's 4 + 2 percentile) + history 4 + scroll 2.
- Updates `.wolf/anatomy.md`.
