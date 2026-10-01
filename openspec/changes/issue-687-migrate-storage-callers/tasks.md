## Phase 1: Storage Caller Refactoring

- [x] Task 1.1: Update Roll Route Handlers
  - File: `app/api/campaigns/[id]/rolls/route.ts`
  - Action: Replace `import { storage } from '@/lib/storage'` with `import * as rollRepo from '@/lib/storage/rollRepo'`.
  - Action: Replace `storage.saveCampaignRoll` with `rollRepo.saveCampaignRoll`.
  - Action: Replace `storage.listCampaignRolls` with `rollRepo.listCampaignRolls`.
- [x] Task 1.2: Update Session Route Handlers
  - Files:
    - `app/api/campaigns/[id]/sessions/route.ts`
    - `app/api/campaigns/[id]/sessions/[sessionId]/route.ts`
    - `app/api/campaigns/[id]/sessions/active/route.ts`
  - Action: Replace `import { storage } from '@/lib/storage'` with `import * as sessionLogRepo from '@/lib/storage/sessionLogRepo'`.
  - Action: Replace all `storage.<method>` calls (loadSessionLogs, getNextSessionNumber, saveSessionLog, updateSessionLog, deleteSessionLog) with `sessionLogRepo.<method>`.

## Phase 2: Test Mocks

- [x] Task 2.1: Update Roll Tests
  - File: `tests/unit/api/campaigns/[id]/rolls.route.test.ts`
  - Action: Replace `jest.mock("@/lib/storage")` with `jest.mock("@/lib/storage/rollRepo")`.
  - Action: Update the mocked methods to reflect the new path.
- [x] Task 2.2: Update Session Tests
  - Files:
    - `tests/unit/api/campaigns/sessions.route.test.ts`
    - `tests/unit/api/campaigns/sessions.id.route.test.ts`
    - `tests/unit/api/campaigns/[id]/sessions/active.route.test.ts`
    - `tests/unit/storage/sessionLog.test.ts`
  - Action: Replace `jest.mock("@/lib/storage")` with `jest.mock("@/lib/storage/sessionLogRepo")`.
  - Action: Update the mocked methods to reflect the new path. Ensure any other repos (like `campaignRepo`) mocked via `storage` are split into their own isolated `jest.mock()` blocks if necessary (though exploration confirmed they are already split).

## Phase 3: Review and Delivery

- [x] Task 3.1: Local AI Code Review
  - Run the `openspec-review-code` skill or `pr-reviewer-toolkit` on the local changes before committing.
  - Fix any issues identified.
- [ ] Task 3.2: PR Review
  - Create Pull Request
  - Wait for CI checks (Lint, Typecheck, Tests)
  - Address any reviewer feedback
- [ ] Task 3.3: Merge
  - Wait for required approvals
  - Merge to `main`
