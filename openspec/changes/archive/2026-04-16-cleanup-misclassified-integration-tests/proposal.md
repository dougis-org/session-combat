## GitHub Issues

- #141

## Why

- Problem statement: `tests/integration/` contains files that use `jest.mock()` — they mock the very dependencies that integration tests exist to exercise. Tests pass against mocks while real DB interactions, real middleware, and real route wiring remain untested. Additionally, pure unit tests (validation functions, localStorage wrappers) sit in `tests/integration/` with no external dependencies at all.
- Why now: Issue #134 (adding a real integration test for `isUserAdmin`) requires building on an honest test platform. Proceeding on a foundation of misclassified tests risks repeating the same mistake and undermines confidence in the suite.
- Business/user impact: False security from mocked "integration" tests. Coverage numbers look healthy while real failure modes go untested. The existing `jest.docker.config.js` / `jest.integration.config.js` split only exists because the mocked tests didn't need Docker — removing them collapses that unnecessary complexity.

## Problem Space

- Current behavior: `tests/integration/` mixes three categories — real testcontainer tests, mocked route/storage tests, and pure unit tests with no external dependencies. `jest.integration.config.js` excludes the two real Docker tests via `testPathIgnorePatterns`, creating an inverted config: "integration" runs everything *except* the real integration tests.
- Desired behavior: `tests/integration/` contains only tests exercising real external dependencies (MongoDB via testcontainers, real HTTP server). Mocked tests live in `tests/unit/`. Config split eliminated.
- Constraints: Must not delete tests that cover behavior not already captured in unit tests. Overlap must be verified before any deletion. `monsterUploadRoute.test.ts` is 100% redundant with existing validation tests and can be deleted outright.
- Assumptions: All files in `tests/integration/api/auth/`, `tests/integration/characters/`, and `tests/integration/import/` are correctly classified (verified: none use `jest.mock()`).
- Edge cases considered:
  - `offline/logout-clears-storage.test.ts` is legitimately integration — it wires real `LocalStore`, `SyncQueue`, `clientStorage`, and React DOM together. The only mocks are external boundary mocks (`next/navigation`, `fetch`). It stays in integration with a documentation header.
  - `tests/integration/monsterUpload.test.ts` (513 lines) and `tests/unit/validation/monsterUpload.test.ts` (101 lines) are complementary, not duplicate. The unit file covers damage type filtering added later. Both must be reorganized into a `tests/unit/monster-upload/` folder split by concern.
  - `monsterUploadRoute.test.ts` never tests an HTTP route — every test calls `validateMonsterUploadDocument` directly, fully duplicating the existing validation tests. Delete it.
  - `party-routes.test.ts` covers two behaviors absent from the existing `tests/unit/api/parties/route.test.ts`: (1) POST asserts `_id` is absent and `id` is a UUID, (2) PUT `/api/parties/[id]` has no unit coverage at all. Assertions must be added to the unit file, not discarded.
  - `storage.party.test.ts` covers `saveParty` upsert shape — not tested anywhere in `tests/unit/storage/storage.test.ts`. Must be added as a new describe block before deleting.

## Scope

### In Scope

- Move pure unit tests (no external deps) from `tests/integration/` to `tests/unit/`
- Augment existing unit test files with behavior only covered in integration files before deleting those integration files
- Split `tests/integration/monsterUpload.test.ts` into a `tests/unit/monster-upload/` folder with targeted sub-files by concern
- Delete `tests/integration/monsterUploadRoute.test.ts` (100% redundant)
- Add documentation header to `tests/integration/offline/logout-clears-storage.test.ts` clarifying intentional boundary mocks
- Delete `jest.docker.config.js` and collapse config into `jest.integration.config.js`
- Remove `test:docker` script from `package.json`; update `test:integration` to cover all integration tests via single glob

### Out of Scope

- Adding new real integration tests (that is #134's job)
- Modifying any source code under `app/` or `lib/`
- Changing test logic or assertions (only location + file structure changes)
- Migrating `tests/integration/api/auth/`, `tests/integration/characters/`, or `tests/integration/import/` (already correctly classified)

## What Changes

- `tests/integration/monsterUpload.test.ts` → deleted; content split into `tests/unit/monster-upload/{document-validation,field-validation,transform,pipeline}.test.ts`
- `tests/unit/validation/monsterUpload.test.ts` → deleted; damage type filtering content absorbed into `tests/unit/monster-upload/transform.test.ts`
- `tests/integration/monsterUploadRoute.test.ts` → deleted (redundant)
- `tests/integration/party-routes.test.ts` → deleted; unique assertions merged into `tests/unit/api/parties/route.test.ts` (add PUT block + `_id` absence assertions on POST)
- `tests/integration/storage.party.test.ts` → deleted; `saveParty` describe block added to `tests/unit/storage/storage.test.ts`
- `tests/integration/duplicate-monster.test.ts` → moved to `tests/unit/api/monsters/duplicate.test.ts`
- `tests/integration/clientStorage.test.ts` → moved to `tests/unit/lib/clientStorage.test.ts`
- `tests/integration/validation/password.test.ts` → moved to `tests/unit/validation/password.test.ts`
- `tests/integration/offline/logout-clears-storage.test.ts` → stays; documentation header added
- `jest.docker.config.js` → deleted
- `jest.integration.config.js` → simplified: remove `testPathIgnorePatterns`, single glob covers all integration tests
- `package.json` → remove `test:docker` script

## Risks

- Risk: Deleting `party-routes.test.ts` before fully porting the PUT handler tests
  - Impact: PUT `/api/parties/[id]` goes untested
  - Mitigation: Write the new unit tests first, verify they pass, then delete the integration file
- Risk: Deleting `storage.party.test.ts` before porting `saveParty` tests
  - Impact: saveParty upsert contract goes untested
  - Mitigation: Add describe block to storage unit file first, verify, then delete
- Risk: `monsterUpload.test.ts` split loses coverage
  - Impact: Validation or transform behavior untested
  - Mitigation: All tests from the source file must appear in the new sub-files; run full suite before deleting source

## Open Questions

No unresolved ambiguity. All classification decisions were verified by reading the files and cross-checking against existing unit test coverage during exploration.

## Non-Goals

- Writing new integration tests to replace the mocked ones (scope of #134 and future work)
- Achieving 100% integration test coverage for all routes
- Refactoring the test helpers or shared fixtures beyond what's needed for the moves

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
