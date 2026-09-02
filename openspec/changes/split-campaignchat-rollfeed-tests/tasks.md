## 1. Extend shared helpers

- [x] 1.1 Add `makeRoll(overrides?: Partial<CampaignRoll>): CampaignRoll` to
  `tests/unit/components/CampaignChat/helpers.tsx`, moved verbatim from
  `CampaignChat.roll.test.tsx` (fixture at lines 29–43).
- [x] 1.2 Add a `/rolls` GET branch to `setupFetchMock` returning
  `overrides?.rolls ?? { rolls: [] }`; leave all existing routes and the
  `mockRollPost` POST-replacement path unchanged.
- [x] 1.3 Run the full `tests/unit/components/CampaignChat/` and
  `tests/unit/components/dice/` suites to confirm the helper change is inert
  for existing files.

## 2. Create CampaignChat.rollFeed.stream.test.tsx

- [x] 2.1 New file with the three `jest.mock` blocks (LocalStore,
  useCampaignStream capturing into `sharedTestState.capturedOnEvent`, useAuth)
  and `beforeEach`/`afterEach` matching `CampaignChat.sse.test.tsx`.
- [x] 2.2 Move T2's 4 stream-mechanics tests unchanged: append roll item,
  duplicate roll id ignored, stream message regression, feed renders both kinds.
- [x] 2.3 Switch `openDock(...)` calls to `openDockWithSession(...)`.

## 3. Create CampaignChat.rollFeed.rendering.test.tsx

- [x] 3.1 New file, same mock/setup preamble.
- [x] 3.2 Move T3's 4 `RollFeedItem` rendering tests unchanged.
- [x] 3.3 Move the 2 percentile tests ("renders a percentile roll through the
  standard formula path", "renders the percentile 100 result ...") unchanged.

## 4. Create CampaignChat.rollFeed.history.test.tsx

- [x] 4.1 New file, same mock/setup preamble.
- [x] 4.2 Move T5's 4 tests unchanged: fetch history with correct sessionId,
  no rolls fetch when session null, merged feed sorted by createdAt, roll id in
  both history and prior stream event appears once.

## 5. Create CampaignChat.rollFeed.scroll.test.tsx

- [x] 5.1 New file, same mock/setup preamble.
- [x] 5.2 Move the local `getFeedContainer` / `markScrolledUp` helpers and the
  2 auto-scroll tests unchanged.

## 6. Remove the old file and drop T1

- [x] 6.1 Delete `tests/unit/components/CampaignChat/CampaignChat.roll.test.tsx`.
- [x] 6.2 Confirm T1's 2 `activeSessionId` smoke tests are not carried over
  (covered by `CampaignChat.ssr.test.tsx`).

## 7. Verify

- [x] 7.1 `npm test -- tests/unit/components/CampaignChat` green; test count is
  16 (was 18, −2 T1).
- [x] 7.2 Each new file is under the ~300-line guidance.
- [x] 7.3 `git diff` on the moved tests shows relocation only — no assertion or
  body changes.
- [x] 7.4 Update `.wolf/anatomy.md` for the file set change; append the
  `.wolf/memory.md` entry.

## 8. Pull Request Review

- [ ] 8.1 Perform a PR review, address comments/feedback, ensure required checks pass.
