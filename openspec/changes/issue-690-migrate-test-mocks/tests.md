---
name: tests
description: Tests for the change
---

# Tests

## Overview

Refactor-only change: no new behavior tests. Existing tests are re-pointed at narrow repos and must keep passing with unchanged assertions.

## Testing Steps

Per batch:

1. Run the batch's test files (`npm run test:unit -- <path>`) to confirm green baseline.
2. Apply the route import swap.
3. Rerun; tests should fail or hit unmocked functions because they still mock the facade.
4. Re-mock to the narrow repo(s).
5. Run `npm run test:unit`; all green.

## Test Cases

- [ ] `tests/unit/api/content/route.test.ts`, `id.route.test.ts`: mock `savedContentRepo` (Tasks 1.2).
- [ ] `tests/unit/api/campaigns/[id]/characters/route.test.ts`, `[cid]/route.test.ts`, `members/[userId]/route.unit.test.ts`: mock `shareRepo` (Task 2.2).
- [ ] `tests/unit/api/campaigns/global.route.test.ts`, `global.id.route.test.ts`, `global.id.copy.route.test.ts`: mock `campaignTemplateRepo` (Task 3.2).
- [ ] `tests/unit/api/conditions/catalog/route.test.ts`: mock `conditionCatalogRepo` (Task 4.2).
- [ ] `tests/unit/api/campaigns/[id]/encounters/[encounterId]/route.test.ts`: mock `encounterRepo` (Task 4.2).
- [ ] `tests/integration/api/mePreferences.test.ts`: passes unchanged after preferences route migration (Task 4.2).
- [ ] Final grep: no facade import in `app/`, no facade `jest.mock` in `tests/unit/api/` (Task 4.3).
