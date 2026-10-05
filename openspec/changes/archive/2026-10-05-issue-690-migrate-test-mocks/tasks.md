Batches are sequential; each is its own branch/PR linked to its sub-issue. Per batch: run the affected tests first, change the routes, watch tests fail on the old mock, re-mock, rerun `npm run test:unit`.

## Phase 1: Saved content (#831)

- [x] Task 1.1: Migrate routes
  - Files: `app/api/content/route.ts`, `app/api/content/[id]/route.ts`
  - Action: replace `storage` import with `import * as savedContentRepo from '@/lib/storage/savedContentRepo'`; `storage.savedContent.X` -> `savedContentRepo.X`.
- [x] Task 1.2: Re-mock tests
  - Files: `tests/unit/api/content/route.test.ts`, `tests/unit/api/content/id.route.test.ts`
  - Action: `jest.mock('@/lib/storage/savedContentRepo')`; update mocked references.
- [x] Task 1.3: Add validation (scope expansion)
  - Use `lib/validation/` in both content routes; reject blank/whitespace `campaignId`; add tests (400 cases).
- [x] Task 1.4: Deliver (review, PR, CI, merge; closes #831)

## Phases 2–3: Shares/members (#832) and campaign templates (#833)

- [x] Already completed on main by #828; issues closed. No work.

## Phase 4: Misc and cleanup (#834)

- [x] Task 4.1: Migrate routes
  - `app/api/conditions/catalog/route.ts` -> `conditionCatalogRepo`
  - `app/api/campaigns/[id]/encounters/[encounterId]/route.ts` -> `encounterRepo`
  - `app/api/me/preferences/route.ts`: already migrated, no work
  - `app/api/campaigns/[id]/route.ts`: delete unused `storage` import
- [x] Task 4.2: Re-mock tests
  - Files: `tests/unit/api/conditions/catalog/route.test.ts`, `tests/unit/api/campaigns/[id]/encounters/[encounterId]/route.test.ts`
  - Action: confirm `tests/integration/api/mePreferences.test.ts` still passes.
- [x] Task 4.3: Final verification
  - `grep` shows no `@/lib/storage'` facade import in `app/` and no `jest.mock('@/lib/storage')` in `tests/unit/api/`.
- [x] Task 4.4: Deliver (closes #834, then #690)

## Review and Delivery (every batch)

- [x] Local AI code review (`openspec-review-code`) before commit; fix findings.
- [x] Open PR with squash auto-merge; wait for CI; address feedback.
- [x] Merge to `main` before starting the next batch.
