## MODIFIED Requirements

### Requirement: MODIFIED Test suite location for CampaignChat live-data wiring

The unit tests verifying the `CampaignChat` live-data wiring (SSE stream, message feed rendering, history, unread badge, members fetching, composer, and mentions) SHALL be split into focused test files under the `tests/unit/components/CampaignChat/` folder.

#### Scenario: Live-data unit tests run and pass in dedicated suites

- **Given** the `CampaignChat.test.tsx` file is decomposed
- **When** `npm run test:unit` is executed
- **Then** all tests pass successfully across the following files:
  - [`tests/unit/components/CampaignChat/CampaignChat.sse.test.tsx`](../../../../tests/unit/components/CampaignChat/CampaignChat.sse.test.tsx) (6 tests)
  - [`tests/unit/components/CampaignChat/CampaignChat.history.test.tsx`](../../../../tests/unit/components/CampaignChat/CampaignChat.history.test.tsx) (3 tests)
  - [`tests/unit/components/CampaignChat/CampaignChat.unread.test.tsx`](../../../../tests/unit/components/CampaignChat/CampaignChat.unread.test.tsx) (4 tests)
  - [`tests/unit/components/CampaignChat/CampaignChat.members.test.tsx`](../../../../tests/unit/components/CampaignChat/CampaignChat.members.test.tsx) (2 tests)
  - [`tests/unit/components/CampaignChat/CampaignChat.composer.test.tsx`](../../../../tests/unit/components/CampaignChat/CampaignChat.composer.test.tsx) (11 tests)
  - [`tests/unit/components/CampaignChat/CampaignChat.visibility.test.tsx`](../../../../tests/unit/components/CampaignChat/CampaignChat.visibility.test.tsx) (4 tests)
  - [`tests/unit/components/CampaignChat/CampaignChat.scene.test.tsx`](../../../../tests/unit/components/CampaignChat/CampaignChat.scene.test.tsx) (6 tests)

## Traceability

- Proposal element: Decomposing tests into focused files -> Requirement: MODIFIED Test suite location
- Design decision: Centralized helpers.ts File -> Requirement: MODIFIED Test suite location
- Design decision: Deferring Imports in Hoisted Mocks using require() -> Requirement: MODIFIED Test suite location
- Design decision: Create Dedicated CampaignChat.composer.test.tsx -> Requirement: MODIFIED Test suite location
- Requirement -> Task(s): Decompose live-data wiring tests to focused suites
