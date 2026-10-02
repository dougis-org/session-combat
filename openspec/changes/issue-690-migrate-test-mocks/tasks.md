Batches are sequential; each is its own branch/PR linked to its sub-issue. Per batch: run the affected tests first, change the routes, watch tests fail on the old mock, re-mock, rerun `npm run test:unit`.

## Phase 1: Saved content (#831)

- [ ] Task 1.1: Migrate routes
  - Files: `app/api/content/route.ts`, `app/api/content/[id]/route.ts`
  - Action: replace `storage` import with `import * as savedContentRepo from '@/lib/storage/savedContentRepo'`; `storage.savedContent.X` -> `savedContentRepo.X`.
- [ ] Task 1.2: Re-mock tests
  - Files: `tests/unit/api/content/route.test.ts`, `tests/unit/api/content/id.route.test.ts`
  - Action: `jest.mock('@/lib/storage/savedContentRepo')`; update mocked references.
- [ ] Task 1.3: Deliver (review, PR, CI, merge; closes #831)

## Phase 2: Shares and members (#832)

- [ ] Task 2.1: Migrate routes to `shareRepo`
  - Files: `app/api/campaigns/[id]/characters/route.ts`, `.../characters/[cid]/route.ts`, `.../members/[userId]/route.ts`
- [ ] Task 2.2: Re-mock tests
  - Files: `tests/unit/api/campaigns/[id]/characters/route.test.ts`, `.../characters/[cid]/route.test.ts`, `.../members/[userId]/route.unit.test.ts`
  - Action: split any non-share `storage.*` mocks into their own repo mocks.
- [ ] Task 2.3: Deliver (closes #832)

## Phase 3: Campaign templates (#833)

- [ ] Task 3.1: Migrate routes to `campaignTemplateRepo`
  - Files: `app/api/campaigns/global/route.ts`, `global/[id]/route.ts`, `global/[id]/copy/route.ts`
- [ ] Task 3.2: Re-mock tests
  - Files: `tests/unit/api/campaigns/global.route.test.ts`, `global.id.route.test.ts`, `global.id.copy.route.test.ts`
- [ ] Task 3.3: Deliver (closes #833)

## Phase 4: Misc and cleanup (#834)

- [ ] Task 4.1: Migrate routes
  - `app/api/conditions/catalog/route.ts` -> `conditionCatalogRepo`
  - `app/api/campaigns/[id]/encounters/[encounterId]/route.ts` -> `encounterRepo`
  - `app/api/me/preferences/route.ts` -> `userPreferencesRepo`
  - `app/api/campaigns/[id]/route.ts`: delete unused `storage` import
- [ ] Task 4.2: Re-mock tests
  - Files: `tests/unit/api/conditions/catalog/route.test.ts`, `tests/unit/api/campaigns/[id]/encounters/[encounterId]/route.test.ts`
  - Action: confirm `tests/integration/api/mePreferences.test.ts` still passes.
- [ ] Task 4.3: Final verification
  - `grep` shows no `@/lib/storage'` facade import in `app/` and no `jest.mock('@/lib/storage')` in `tests/unit/api/`.
- [ ] Task 4.4: Deliver (closes #834, then #690)

## Review and Delivery (every batch)

- [ ] Local AI code review (`openspec-review-code`) before commit; fix findings.
- [ ] Open PR with squash auto-merge; wait for CI; address feedback.
- [ ] Merge to `main` before starting the next batch.
