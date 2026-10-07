---
name: tests
description: Tests for fix-campaign-route-validation-auth
---

# Tests

## Overview

Tests for the `fix-campaign-route-validation-auth` change. All work follows strict TDD: write failing test, make it pass, refactor. Tests live in `tests/unit/api/campaigns/`.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** and confirm it fails for the expected reason.
2. **Write the simplest code to pass.**
3. **Refactor** while keeping tests green.

## Test Cases

Invalid-id cases use: empty string, 201-character string, whitespace-only string. Each asserts status `400` and that the relevant storage/membership mocks were **not called**.

- [ ] T1 (task 2.1, spec: authenticated list) `global.route.test.ts`: GET without auth → 401, `loadGlobalCampaignTemplates` not called
- [ ] T2 (task 2.1/3.1, spec: authenticated list) `global.route.test.ts`: GET with auth → 200 array; empty catalog → `[]`
- [ ] T3 (task 2.2, spec: invalid template id) `global.id.route.test.ts`: admin DELETE with invalid id → 400, `deleteCampaignTemplate` not called
- [ ] T4 (task 2.2, spec: admin precedence) `global.id.route.test.ts`: non-admin DELETE with invalid id → 403 (not 400); unauthenticated → 401
- [ ] T5 (task 2.2, regression) `global.id.route.test.ts`: valid id → 200 / 404 unchanged
- [ ] T6 (task 4.1, spec: invalid campaign id) new `characters/route.validation.test.ts` or existing characters route test: POST and GET with invalid campaign id → 400, `getMember` not called
- [ ] T7 (task 4.2, spec: invalid ids on unshare) `[id]/characters/[cid]` route test: invalid `id` or invalid `cid` → 400, `getMember`/`removeShare` not called
- [ ] T8 (task 4.1/4.2, regression) valid ids → existing 201/200/204/403/404 behavior unchanged
- [ ] T9 (task 5.1, spec: over-long template id) `global.id.copy.route.test.ts`: 201-char id → 400, `loadGlobalCampaignTemplateById` not called
- [ ] T10 (task 6.1) E2E/page test: logged-in `/campaigns` still renders the template catalog
