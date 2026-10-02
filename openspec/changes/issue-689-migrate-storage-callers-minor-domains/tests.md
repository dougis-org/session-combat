---
name: tests
description: Tests for the change
---

# Tests

## Overview

Refactor-only change: no new behavior tests. Existing route tests are retargeted from the `storage` facade mock to narrow-repo mocks, and the existing suite is the regression guard. Scenarios referenced are in `specs/storage-callers-narrow-imports-minor-domains/spec.md`.

## Testing Steps

For each task group in `tasks.md` (red → green → refactor):

1. **Baseline (Task 1.1):** `npm run test:unit` is green.
2. **Red:** Apply a route change (Task 2.x). The matching unit tests now fail because they still mock `@/lib/storage` and the route calls the real repo.
3. **Green:** Retarget that test's mocks to the narrow repo (Task 3.x). Run the file, then `npm run test:unit`.
4. **Refactor:** Remove leftover facade mock/aliases; keep assertions unchanged.
5. **Verify:** Task 4.x grep and unmodified-file checks.

## Test Cases

- [ ] `tests/unit/api/campaigns/[id]/characters/[cid]/route.test.ts` — mock `@/lib/storage/shareRepo` (`removeShare`); all existing tests pass (Task 3.1; scenarios "Route handlers directly call narrow repos", "Unit tests mock narrow repos")
- [ ] `tests/unit/api/campaigns/[id]/characters/route.test.ts` — mock `shareRepo` (`addShare`, `listSharesForCampaign`); existing tests pass (Task 3.1)
- [ ] `tests/unit/api/campaigns/[id]/members/[userId]/route.unit.test.ts` — mock `shareRepo` (`listAllSharesForCampaign`); existing tests pass (Task 3.1)
- [ ] `tests/unit/api/campaigns/global.route.test.ts` — mock `campaignTemplateRepo` (`loadGlobalCampaignTemplates`, `saveCampaignTemplate`); existing tests pass (Task 3.2)
- [ ] `tests/unit/api/campaigns/global.id.route.test.ts` — mock `campaignTemplateRepo` (`deleteCampaignTemplate`); existing tests pass (Task 3.2)
- [ ] `tests/unit/api/campaigns/global.id.copy.route.test.ts` — mock `campaignTemplateRepo` (`loadGlobalCampaignTemplateById`) alongside existing `membershipRepo`/`campaignRepo` mocks; existing tests pass (Task 3.2)
- [ ] `tests/integration/api/mePreferences.test.ts` — unchanged; must still pass (Task 2.3; preferences route migration)
- [ ] `tests/unit/lib/storage/facadeShape.test.ts` — unchanged; must still pass (NFAC "Facade shape preserved"; Task 4.2)
- [ ] Grep check — no facade calls for the 10 migrated methods in `app lib` outside `lib/storage.ts` (Task 4.1)
