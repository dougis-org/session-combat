## GitHub Issues

- #244

## Why

- Problem statement: `app/api/monsters/upload/route.ts` has 0% test coverage. Separately, the frontend partial-success (207) handler reads field names that don't exist on the API response, silently displaying "0 of 0 monsters" to the user on every partial failure.
- Why now: The upload route is the primary way users bulk-populate their monster library from JSON files. Both the untested save path and the broken 207 UX are active correctness gaps.
- Business/user impact: A bug in validation or save logic could silently drop valid monsters with no automated detection. The 207 display bug means users get no useful feedback when a partial upload occurs.

## Problem Space

- Current behavior: The upload route processes `{ monsters: [...] }` payloads with per-monster save via `storage.saveMonsterTemplate`. Validation failures return 400; all-success returns 201; partial success returns 207; all-fail returns 500. The frontend 207 handler reads `result.successCount`, `result.totalCount`, and `result.failures` — none of which the route sends — so the partial-success message always shows "Successfully imported 0 of 0 monsters." with no error detail.
- Desired behavior: The route is covered at ≥85% statement coverage. The frontend correctly reads `result.count`, `result.total`, and `result.errors` (array of `{ index, message }`) and renders an accurate partial-success message.
- Constraints: Unit tests must follow the established pattern (`jest.mock("@/lib/middleware")` + `jest.mock("@/lib/storage")`). Integration tests append to the existing `tests/integration/monsters.integration.test.ts`.
- Assumptions: The route's response shape (`count`, `total`, `imported`, `errors`) is correct; the page is wrong. No change to the route response shape.
- Edge cases considered: empty `monsters` array (→ 400 from validation), all saves fail (→ 500), outer try/catch (→ 500), malformed JSON body (→ 400), missing `monsters` key (→ 400).

## Scope

### In Scope

- New unit test file: `tests/unit/api/monsters/upload.route.test.ts`
- Integration tests appended to `tests/integration/monsters.integration.test.ts`
- Bug fix in `app/monsters/import/page.tsx` — 207 handler field names and error rendering

### Out of Scope

- Changes to `app/api/monsters/upload/route.ts` (route logic is correct)
- Changes to `lib/validation/monsterUpload.ts`
- Deduplication / skipped-count logic (belongs to the Open5E sync path, already tested)
- Admin-only upload restriction (not a requirement for this route)

## What Changes

- **New file**: `tests/unit/api/monsters/upload.route.test.ts` — unit tests covering 401, malformed JSON, all document-validation failure modes, 201 (single + multi), 207 (partial save failure), and 500 (all saves fail).
- **Modified file**: `tests/integration/monsters.integration.test.ts` — new `describe` block for `POST /api/monsters/upload` covering happy path (monsters queryable after upload), 401, and 400.
- **Modified file**: `app/monsters/import/page.tsx` — 207 handler corrected to read `result.count`, `result.total`, and `result.errors`, and render a meaningful error list.

## Risks

- Risk: Integration tests for upload create real monster documents in the shared test DB.
  - Impact: Leaked documents could cause noise in other integration tests that assert exact monster counts.
  - Mitigation: Use a distinct test-user slug (e.g., `"monster-upload-test"`) so monsters are user-scoped and don't pollute other users' assertions.

- Risk: The 207 page fix changes visible user-facing text.
  - Impact: Low — the current message is always wrong; any improvement is correct.
  - Mitigation: Verify the fix manually or via a Playwright test if one exists for the import page.

## Open Questions

No unresolved ambiguity. All design decisions were resolved during exploration:
- Route response shape is authoritative; page is the bug.
- Integration tests go in the existing file, not a new file.
- No admin check exists or is needed for this route.

## Non-Goals

- Adding deduplication / skipped-count to the upload route
- Adding admin-only access control
- Playwright / E2E coverage for the import page
- Changing the route's response shape

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
