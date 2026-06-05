## Context

- Relevant architecture: Next.js App Router API route (`app/api/monsters/upload/route.ts`) using `withAuth` middleware. Validation via `lib/validation/monsterUpload.ts`. Persistence via `lib/storage` (`saveMonsterTemplate`). Frontend at `app/monsters/import/page.tsx`.
- Dependencies: `@/lib/middleware` (withAuth/requireAuth), `@/lib/storage` (saveMonsterTemplate), `@/lib/validation/monsterUpload` (validateMonsterUploadDocument, transformMonsterData). Test helpers: `tests/unit/helpers/route.test.helpers.ts`.
- Interfaces/contracts touched: POST `/api/monsters/upload` response shape (`{ success, count, total, imported, errors? }`). `app/monsters/import/page.tsx` 207 handler reading from that shape.

## Goals / Non-Goals

### Goals

- Unit test `app/api/monsters/upload/route.ts` to ≥85% statement coverage
- Integration test the upload happy path end-to-end
- Fix the 207 field-name mismatch in `app/monsters/import/page.tsx`

### Non-Goals

- Changing the route's response shape or logic
- Adding deduplication to the upload route
- E2E / Playwright coverage for the import page
- Changing validation rules

## Decisions

### Decision 1: Unit test file location and mocking strategy

- Chosen: New file `tests/unit/api/monsters/upload.route.test.ts`. Mock `@/lib/middleware` and `@/lib/storage` exactly as `tests/unit/api/content/route.test.ts` does. Use `MOCK_AUTH`, `makeRouteRequest`, `itReturns401`, `itReturns500` from `tests/unit/helpers/route.test.helpers.ts`.
- Alternatives considered: Mocking `withAuth` directly (wraps requireAuth internally — mocking requireAuth is the established pattern and sufficient).
- Rationale: Consistency with existing unit test patterns; no new infrastructure needed.
- Trade-offs: Mocking `requireAuth` rather than `withAuth` means we don't test the `withAuth` wrapper itself, but that wrapper has its own coverage elsewhere.

### Decision 2: 207 partial-success scenario in unit tests

- Chosen: Mock `storage.saveMonsterTemplate` to succeed on first call and throw on second call (using `mockResolvedValueOnce` + `mockRejectedValueOnce`). Assert status 207, `body.count > 0`, and `body.errors` is a non-empty array.
- Alternatives considered: Testing via the validation path (document-level failures return 400 before saves, so they can't exercise 207). Must use save-level errors.
- Rationale: 207 is only reachable when at least one save succeeds and at least one throws; per-item try/catch handles it.
- Trade-offs: None — this is the only path to 207.

### Decision 3: Integration test placement and user isolation

- Chosen: Append a new `describe("POST /api/monsters/upload", ...)` block to `tests/integration/monsters.integration.test.ts`. Register a separate test user (`"upload-test"` slug) in a nested `beforeAll` to keep uploaded monsters user-scoped.
- Alternatives considered: New integration test file — rejected to avoid duplication of the shared server/DB setup.
- Rationale: User-scoping via distinct slug prevents uploaded documents from appearing in other users' GET responses.
- Trade-offs: Slightly larger existing file; acceptable given the file already covers multiple describe blocks.

### Decision 4: Fix side — 207 field names in page.tsx

- Chosen: Fix `app/monsters/import/page.tsx` to read `result.count`, `result.total`, and `result.errors`. Render `result.errors` as a formatted list (join `{ index, message }` entries into a readable string).
- Alternatives considered: Change the route's response field names to `successCount`/`totalCount`/`failures` — rejected; `count`/`total`/`errors` is the correct shape used across other routes.
- Rationale: The route shape is consistent and correct; the page was written against a stale or assumed API shape.
- Trade-offs: Changes visible user-facing text in the partial-success message, but current message is always wrong so any improvement is strictly better.

## Proposal to Design Mapping

- Proposal element: 0% coverage on upload route
  - Design decision: Decision 1 (unit test file + mocking strategy)
  - Validation approach: Jest coverage report ≥85% statements after tests pass

- Proposal element: 207 path is dead UX (field name mismatch)
  - Design decision: Decision 4 (fix page.tsx reads)
  - Validation approach: Manual verification that partial upload shows correct count; unit test for 207 response shape confirms route side is correct

- Proposal element: Integration test for upload happy path
  - Design decision: Decision 3 (append to existing file, isolated user)
  - Validation approach: Integration test asserts POST 201, then GET returns the uploaded monster

- Proposal element: 207 unit test coverage
  - Design decision: Decision 2 (mockResolvedValueOnce + mockRejectedValueOnce)
  - Validation approach: Assert status 207, count, errors array in unit test

## Functional Requirements Mapping

- Requirement: 401 on unauthenticated request
  - Design element: `itReturns401` helper with mocked `requireAuth` returning Unauthorized
  - Acceptance criteria reference: issue #244 AC — auth guard tested
  - Testability notes: Covered by `itReturns401` factory; no special setup needed

- Requirement: 400 on malformed JSON body
  - Design element: `makeRouteRequest` with a body that isn't parseable JSON (pass raw string via custom NextRequest)
  - Acceptance criteria reference: issue #244 AC — malformed JSON → 400
  - Testability notes: Route's inner try/catch on `request.json()` returns 400

- Requirement: 400 on document validation failures (missing key, empty array, invalid monster)
  - Design element: Multiple `it` blocks with various invalid payloads; `validateMonsterUploadDocument` is not mocked — runs real validation
  - Acceptance criteria reference: issue #244 AC — invalid monster payload → 400
  - Testability notes: No mock needed for validation; only storage needs mocking

- Requirement: 201 on valid upload (single + multi)
  - Design element: `storage.saveMonsterTemplate` mocked to resolve; assert `count`, `imported` length
  - Acceptance criteria reference: issue #244 AC — valid upload, count matches payload
  - Testability notes: Straightforward happy path

- Requirement: 207 on partial save failure
  - Design element: Decision 2 — mixed mock resolve/reject; assert 207 + both `count` and `errors`
  - Acceptance criteria reference: issue #244 AC — partial failure → 207
  - Testability notes: Must use two-monster payload with `mockResolvedValueOnce` + `mockRejectedValueOnce`

- Requirement: 500 on all saves failing
  - Design element: `itReturns500` or manual `it` block with all saves rejecting
  - Acceptance criteria reference: issue #244 AC — all saves fail → 500
  - Testability notes: `mockRejectedValue` for all calls

- Requirement: 207 page field names correct
  - Design element: Decision 4 — update page.tsx reads
  - Acceptance criteria reference: issue #244 AC — frontend reads count/total/errors
  - Testability notes: Visual verification; or assert against route response shape in unit test

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Test DB isolation — uploaded monsters don't leak into other users' assertions
  - Design element: Decision 3 — distinct `"upload-test"` user slug
  - Acceptance criteria reference: No cross-user data bleed in integration suite
  - Testability notes: Confirmed by user-scoped storage queries in GET /api/monsters

- Requirement category: operability
  - Requirement: Tests runnable with existing `npm run test:unit` and integration commands without new config
  - Design element: Existing Jest config covers `tests/unit/**` and `tests/integration/**`
  - Acceptance criteria reference: CI passes
  - Testability notes: Verified by running existing test commands after adding files

## Risks / Trade-offs

- Risk/trade-off: `mockResolvedValueOnce` / `mockRejectedValueOnce` ordering is fragile if `Promise.all` reorders calls
  - Impact: Flaky 207 test
  - Mitigation: `Promise.all` preserves input order; two-element payload guarantees first resolves, second rejects

- Risk/trade-off: Page fix changes error message format
  - Impact: Low UX impact; message is currently always wrong
  - Mitigation: Review rendered message in dev before PR

## Rollback / Mitigation

- Rollback trigger: Tests break CI or page.tsx fix introduces a regression in the import UI
- Rollback steps: Revert `app/monsters/import/page.tsx` to prior field names; remove new test files
- Data migration considerations: None — test-only and UI-only changes
- Verification after rollback: Run `npm run test:unit`; smoke-test the import page

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing tests before requesting review.
- If security checks fail: Do not merge. Investigate and resolve before proceeding.
- If required reviews are blocked/stale: Re-request review after 24h; escalate to repo maintainer after 48h.
- Escalation path and timeout: Tag `@dougis` in the PR if blocked >48h.

## Open Questions

No open questions. All decisions resolved during exploration.
