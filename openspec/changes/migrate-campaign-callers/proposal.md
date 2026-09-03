## GitHub Issues

- dougis-org/session-combat#681

## Why

- Problem statement: Callers currently import `storage` from `@/lib/storage`, which is a god-object. This creates tight coupling and makes the storage module unwieldy.
- Why now: This is part of Epic #499 to refactor the storage god-object into per-domain repos.
- Business/user impact: Purely mechanical refactor that improves code maintainability and testing boundaries. No user-facing behavior changes.

## Problem Space

- Current behavior: API routes, scripts, and tests import the `storage` god-object to access campaign methods (e.g., `storage.loadCampaigns`).
- Desired behavior: Callers directly import the narrow `campaignRepo` module from `@/lib/storage/campaignRepo` and call its methods directly.
- Constraints: Must not change any business logic or data access behavior.
- Assumptions: Test files currently mock `storage`; these mocks will need to be updated to mock `campaignRepo`.
- Edge cases considered: Files that call BOTH campaign methods and other domain methods (e.g., `saveParty`). These files must import both `storage` and `campaignRepo` and selectively use each.

## Scope

### In Scope

- Migrating 9 specific methods to `campaignRepo` imports:
  - `loadCampaigns`
  - `loadCampaignById`
  - `saveCampaign`
  - `deleteCampaign`
  - `setActiveCampaignSession`
  - `claimActiveCampaignSession`
  - `loadCampaignByIdAny`
  - `listCampaignsForMember`
  - `getCampaignsByIds`
- Updating all application callers (API routes, lib, scripts).
- Updating all affected test files and their mocks.

### Out of Scope

- Removing the campaign methods from `lib/storage.ts` (this will be handled separately in Epic #499).
- Migrating non-campaign methods to narrow repos.
- Any behavioral changes to the application.

## What Changes

- Replace `import { storage } from '@/lib/storage'` with `import * as campaignRepo from '@/lib/storage/campaignRepo'` in files that only use campaign methods.
- Add `import * as campaignRepo from '@/lib/storage/campaignRepo'` and update references in files that use multiple storage domains.
- Update `jest.mock("@/lib/storage")` blocks in test files to include/mock `@/lib/storage/campaignRepo`.

## Risks

- Risk: Missing a mocked method in a test file.
  - Impact: Test failures.
  - Mitigation: The test suite and TypeScript compiler will quickly flag missing mocks.
- Risk: Breaking a route that inadvertently relied on the god object for something subtle.
  - Impact: Runtime error.
  - Mitigation: Rely on existing comprehensive tests to ensure no regressions.

## Open Questions

- None.

## Non-Goals

- Changing any underlying MongoDB queries, business logic, or behavioral features.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
