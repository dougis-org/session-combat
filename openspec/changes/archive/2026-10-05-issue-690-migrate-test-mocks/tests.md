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

- [ ] `tests/unit/api/content/route.test.ts`, `id.route.test.ts`: mock `savedContentRepo` (Task 1.2); add 400-path tests for blank/whitespace `campaignId` and invalid bodies (Task 1.3).
- [ ] `tests/unit/api/conditions/catalog/route.test.ts`: mock `conditionCatalogRepo` (Task 4.2).
- [ ] `tests/unit/api/campaigns/[id]/encounters/[encounterId]/route.test.ts`: mock `encounterRepo` (Task 4.2).
- [ ] Final grep: no facade import in `app/`, no facade `jest.mock` in `tests/unit/api/` (Task 4.3).
