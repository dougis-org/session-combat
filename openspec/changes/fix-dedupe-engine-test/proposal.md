## GitHub Issues

- #164

## Why

- **Problem statement**: The `importMonstersFromOpen5E` unit test at `tests/unit/import/dedupeEngine.test.ts` (lines 80-91) is failing. The mock tells storage to return an existing monster (`findMonsterByNameAndSource.mockResolvedValue({ id: "existing-id" })`), but the assertions expect an insert (`inserted: 1`). This is a logical contradiction—the test cannot pass as written.

- **Why now**: This test was introduced in PR #163 (extract-dnd-ability-scores-foundation) which is currently blocked by this failing test. The bug was caught before merge.

- **Business/user impact**: No direct user impact, but failing CI blocks a feature PR.

## Problem Space

- **Current behavior**:
  - `dedupeEngine.test.ts` contains unit tests that mock both the Open5E API client and the storage layer
  - Tests for "skips when exists" and "inserts when new" exercise the full import pipeline with both dependencies mocked
  - The test at line 80-91 has a mock/assertion mismatch and will never pass

- **Desired behavior**:
  - Unit tests should test isolated logic (transform validation, orchestration without external dependencies)
  - Integration tests should test behavior that requires real persistence (skip-on-duplicate, insert-on-new)
  - All tests should pass with correct assertions

- **Constraints**:
  - Integration tests use MongoDB testcontainers via `tests/integration/helpers/server.ts`
  - The Open5E API client must be mocked in both unit and integration tests (external dependency)

- **Assumptions**:
  - Tests that verify persistence behavior (skip vs insert) belong in the integration layer
  - Tests that verify transform validation errors belong in the unit layer (invalid transforms never reach persistence)

- **Edge cases considered**:
  - Multiple monsters in one import call: covered by existing test "processes multiple monsters"
  - Spell imports use a different code path (`importSpellsFromOpen5E` uses `shouldImport`; `importMonstersFromOpen5E` uses inline duplicate check): handled consistently with deferral to #165

## Scope

### In Scope

- Fix the broken test at `tests/unit/import/dedupeEngine.test.ts` lines 80-91 (assertion mismatch)
- Create `tests/integration/import/dedupeEngine.integration.test.ts` with real MongoDB
- Move "skips when exists" and "inserts when new" tests to integration layer
- Keep "error when transform is invalid" as a unit test (never reaches persistence)
- Ensure unit test directory only contains true unit tests (isolated, fast)

### Out of Scope

- Refactoring `importMonsterSingle` to use `shouldImport` (DRY violation with spells path): deferred to #165
- Centralizing mock helpers to `tests/mocks/`: deferred to #165
- Changes to production code (`lib/import/dedupeEngine.ts`)

## What Changes

1. **Fix `tests/unit/import/dedupeEngine.test.ts`**:
   - Remove the broken test (lines 80-91) - its intent is tested correctly in "skips monster when it already exists" (lines 93-105)
   - Keep unit tests for `shouldImport` (lines 23-62) - these test orchestration logic with mocked storage but are acceptable as-is since they test logic, not persistence
   - Keep unit tests for transform validation errors - these appropriately stay unit-level

2. **Create `tests/integration/import/dedupeEngine.integration.test.ts`**:
   - Test import pipeline with mocked Open5E client (via `open5e.mockHelpers.ts`)
   - Use real MongoDB via testcontainer (via `tests/integration/helpers/server.ts`)
   - Test "inserts when new" - verify monster is actually persisted and retrievable
   - Test "skips when exists" - verify monster is not duplicated on re-import
   - Test "error when transform invalid" - verify invalid transforms are counted as errors

## Risks

- **Risk**: Integration tests are slower than unit tests
  - **Impact**: CI pipeline may take longer
  - **Mitigation**: Integration tests run in parallel with unit tests; only test persistence-relevant behavior at integration layer

## Open Questions

- **Question**: Should the `shouldImport` function tests remain in unit or move to integration?
  - **Needed from**: Team consensus
  - **Blocker for apply**: No - these tests mock storage but test logic; acceptable to leave as unit tests

## Non-Goals

- Fixing the DRY violation where `importMonsterSingle` duplicates `shouldImport` logic (issue #165)
- Centralizing Open5E mock helpers to `tests/mocks/open5e/` (issue #165)
- Any changes to production code behavior
- Modifying the spell import path (`importSpellsFromOpen5E`)

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.