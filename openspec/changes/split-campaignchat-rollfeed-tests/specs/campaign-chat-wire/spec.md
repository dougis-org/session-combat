## MODIFIED Requirements

### Requirement: MODIFIED Test suite location for CampaignChat live-data wiring

The unit tests verifying the `CampaignChat` live-data wiring (SSE stream, message feed rendering, roll-feed ingestion and rendering, history, unread badge, members fetching, composer, and mentions) SHALL be split into focused test files under the `tests/unit/components/CampaignChat/` folder, each kept within the repository's ~300-line comprehensibility guidance and scoped to a single concern.

#### Scenario: Live-data unit tests run and pass in dedicated suites

- **Given** the `CampaignChat.test.tsx` file is decomposed
- **When** `npm run test:unit` is executed
- **Then** all tests pass successfully across the following files:
  - `tests/unit/components/CampaignChat/CampaignChat.sse.test.tsx`
  - `tests/unit/components/CampaignChat/CampaignChat.history.test.tsx`
  - `tests/unit/components/CampaignChat/CampaignChat.unread.test.tsx`
  - `tests/unit/components/CampaignChat/CampaignChat.members.test.tsx`
  - `tests/unit/components/CampaignChat/CampaignChat.composer.test.tsx`
  - `tests/unit/components/CampaignChat/CampaignChat.visibility.test.tsx`
  - `tests/unit/components/CampaignChat/CampaignChat.scene.test.tsx`

#### Scenario: Roll-feed unit tests are split into concern-scoped suites

- **Given** the oversized `tests/unit/components/CampaignChat/CampaignChat.roll.test.tsx` (436 lines)
- **When** it is decomposed and `npm run test:unit` is executed
- **Then** its tests pass across concern-scoped files, and `CampaignChat.roll.test.tsx` no longer exists:
  - `tests/unit/components/CampaignChat/CampaignChat.rollFeed.stream.test.tsx` — SSE roll/message ingestion and dedup (4 tests)
  - `tests/unit/components/CampaignChat/CampaignChat.rollFeed.rendering.test.tsx` — `RollFeedItem` output including the `d%` standard-formula path (6 tests)
  - `tests/unit/components/CampaignChat/CampaignChat.rollFeed.history.test.tsx` — roll-history fetch, merge, sort, cross-source dedup (4 tests)
  - `tests/unit/components/CampaignChat/CampaignChat.rollFeed.scroll.test.tsx` — feed auto-scroll geometry on ingested rolls (2 tests)
- **And** the 2 former `activeSessionId` smoke tests are dropped as redundant with `CampaignChat.ssr.test.tsx`
- **And** shared roll setup (`makeRoll` fixture, `/rolls` fetch route) lives in `tests/unit/components/CampaignChat/helpers.tsx`, not duplicated per file
