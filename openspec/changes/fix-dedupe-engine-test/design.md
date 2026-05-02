## Context

- **Relevant architecture**:
  - Import pipeline: Open5E API client → dedupeEngine → MongoDB storage
  - dedupeEngine.ts exports `importMonstersFromOpen5E` and `importSpellsFromOpen5E`
  - Unit tests at `tests/unit/import/dedupeEngine.test.ts`
  - Integration tests at `tests/integration/helpers/server.ts` (MongoDB testcontainer)

- **Dependencies**:
  - `@testcontainers/mongodb` for MongoDB testcontainer
  - `open5e.mockHelpers.ts` for Open5E API mocking
  - `storage` module from `@/lib/storage`

- **Interfaces/contracts touched**:
  - `IOpen5EClient` (getAllMonsters, getAllSpells)
  - `storage.findMonsterByNameAndSource`, `storage.saveMonsterTemplate`
  - `storage.spellExistsByNameAndSource`, `storage.saveSpellTemplate`

## Goals / Non-Goals

### Goals

- Fix the broken test (mock/assertion mismatch) so CI passes
- Correctly layer tests: unit tests for logic, integration tests for persistence
- Ensure all tests pass with correct assertions

### Non-Goals

- Refactoring `importMonsterSingle` to use `shouldImport` (deferred to #165)
- Centralizing mock helpers (deferred to #165)
- Modifying production code behavior

## Decisions

### Decision 1: Fix broken unit test by removing it

- **Chosen**: Remove the test at lines 80-91 from `tests/unit/import/dedupeEngine.test.ts`
- **Alternatives considered**:
  - Fix the assertions to match the mock: rejected because the test name says "skips monster when transform is invalid" but passes a valid creature with an "exists" mock—this test conflates two scenarios
  - Fix the mock to match the assertions: rejected because a test named "when transform is invalid" should not use an "exists" mock
- **Rationale**: The test is fundamentally confused (name, mock, assertions don't align). The scenarios it attempts to test are covered correctly by other tests:
  - "skips when exists" is covered by lines 93-105
  - "inserts when not exists" is covered by lines 65-78
- **Trade-offs**: Removing a test might reduce coverage, but the scenarios it was attempting to test are already covered

### Decision 2: Move persistence behavior tests to integration layer

- **Chosen**: Create `tests/integration/import/dedupeEngine.integration.test.ts`
- **Alternatives considered**:
  - Keep all tests as unit tests with better mocks: rejected because mocked storage can't verify actual skip/insert behavior
  - Test via HTTP API route: rejected because characterImport uses this pattern but dedupeEngine is a library function, not an API route
- **Rationale**: Integration tests with real MongoDB verify:
  - A monster is actually inserted and can be retrieved
  - A monster is actually skipped and not duplicated
- **Trade-offs**: Integration tests are slower but necessary for persistence verification

### Decision 3: Use direct function call pattern (not HTTP)

- **Chosen**: Import and call `importMonstersFromOpen5E` directly in integration tests
- **Alternatives considered**:
  - Spin up full Next.js server and test via HTTP: rejected as unnecessary overhead
  - Use `setupTestServer()` helper that spins up MongoDB + Next.js: rejected as overkill for library testing
- **Rationale**: dedupeEngine is a library function. Integration tests should:
  - Use MongoDB testcontainer directly (not full Next.js stack)
  - Call library functions directly to test behavior
  - Only mock the Open5E API client
- **Trade-offs**: Deviates from `characterImport.integration.test.ts` pattern which uses HTTP, but that pattern is appropriate for API route testing

### Decision 4: Keep "error on invalid transform" at unit level

- **Chosen**: Keep the test "counts error when monster transform is invalid" (lines 107-118) in unit tests
- **Alternatives considered**: Move to integration with valid+invalid data
- **Rationale**: Invalid transforms are rejected before reaching persistence. Testing at unit level:
  - Is faster (no MongoDB needed)
  - Clearly verifies transform validation logic
  - Doesn't require persistence setup for error case
- **Trade-offs**: If transform logic changes to allow partial persistence, this test would need to move

## Proposal to Design Mapping

| Proposal Element | Design Decision | Validation |
|-----------------|-----------------|------------|
| Fix broken test | Remove confusing test, rely on existing correct tests | Tests pass |
| Move skip/insert to integration | Create integration test with real MongoDB | Integration tests verify actual persistence |
| Keep error-on-invalid as unit test | Keep lines 107-118 in unit test | Unit tests verify transform validation |
| Ensure unit tests stay isolated | Keep shouldImport tests at unit level | Unit tests run fast without MongoDB |

## Functional Requirements Mapping

- **Requirement**: Skip duplicates when importing monsters with same name+source
  - **Design element**: Integration test "skips when exists"
  - **Acceptance criteria**: `result.skipped === 1, result.inserted === 0`
  - **Testability notes**: Must use real MongoDB to verify no duplicate created

- **Requirement**: Insert new monsters when not duplicate
  - **Design element**: Integration test "inserts when new"
  - **Acceptance criteria**: `result.inserted === 1` and monster retrievable from MongoDB
  - **Testability notes**: Query MongoDB after import to verify persistence

- **Requirement**: Count error when transform is invalid
  - **Design element**: Unit test with empty name creature
  - **Acceptance criteria**: `result.errors === 1, result.inserted === 0`
  - **Testability notes**: Unit test with mocked storage sufficient

- **Requirement**: Process multiple monsters in one call
  - **Design element**: Unit test "processes multiple monsters"
  - **Acceptance criteria**: `result.inserted === 2`
  - **Testability notes**: Unit test appropriate (no persistence verification needed)

## Non-Functional Requirements Mapping

- **Requirement category**: performance
  - **Requirement**: Unit tests run fast (<100ms each)
  - **Design element**: Keep logic/transform tests at unit level, no MongoDB
  - **Acceptance criteria**: Unit test suite completes in <5s
  - **Testability notes**: CI pipeline measures and enforces

- **Requirement category**: reliability
  - **Requirement**: Deduplication works correctly under all scenarios
  - **Design element**: Integration tests verify actual MongoDB behavior
  - **Acceptance criteria**: No duplicates created on re-import
  - **Testability notes**: Integration tests cover this

## Risks / Trade-offs

- **Risk**: Test removal might leave coverage gap
  - **Impact**: Low—the removed test's scenarios are covered by existing tests
  - **Mitigation**: Verify coverage with `jest --coverage` before/after

- **Risk**: Integration tests increase CI time
  - **Impact**: Medium—integration tests are slower than unit tests
  - **Mitigation**: Only move persistence-critical tests to integration; keep transform validation at unit

- **Risk**: Integration test pattern differs from characterImport.integration.test.ts
  - **Impact**: Low—inconsistency in test patterns could confuse future developers
  - **Mitigation**: Document that library functions use direct-call integration pattern, API routes use HTTP integration pattern

## Rollback / Mitigation

- **Rollback trigger**: CI fails after merge, or coverage decreases by >5%
- **Rollback steps**:
  1. Revert changes to `tests/unit/import/dedupeEngine.test.ts`
  2. Delete `tests/integration/import/dedupeEngine.integration.test.ts`
- **Data migration considerations**: No data migration needed—test file changes only
- **Verification after rollback**: Run `npm test` to verify all tests pass

## Operational Blocking Policy

- **If CI checks fail**: Block merge until tests pass. Do not skip or bypass.
- **If security checks fail**: Not applicable—test-only changes
- **If required reviews are blocked/stale**: Escalate to team lead after 48 hours of inactivity
- **Escalation path**: Author → Reviewer → Team Lead

## Open Questions

- **Question**: Should `shouldImport` function tests move to integration?
  - **Answer**: No, they test orchestration logic with mocked storage. Acceptable at unit level.
  - **Status**: Resolved