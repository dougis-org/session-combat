## Context

- Relevant architecture: `lib/import/dndBeyond-*.ts` — 8 extracted domain modules, each with a narrow public API. `lib/dndBeyondCharacterImport.ts` — top-level orchestrator that composes the modules. `tests/unit/import/` — test directory where all unit test files live. `tests/fixtures/dndBeyondCharacter.ts` — shared DnD Beyond API response fixtures used by the monolith and already used by existing extracted test files.
- Dependencies: No source code changes. Only test files are created or modified. The extracted modules are stable and their exports are the contracts under test.
- Interfaces/contracts touched: Each new test file imports from a specific `lib/import/dndBeyond-*.ts` module. The monolith's imports change only by removal (as tests migrate out).

## Goals / Non-Goals

### Goals

- One test file per extracted module, testing that module's exported functions directly
- Monolith reduced to 3 multi-domain orchestration tests
- All existing tests pass throughout; test count does not decrease
- Defenses module gains first-ever isolated test coverage

### Non-Goals

- No source code changes
- No new integration tests
- No fixture restructuring
- No renaming of pre-existing `dndBeyondUtils.test.ts`

## Decisions

### Decision 1: Rewrite migrated tests to call module functions directly

- Chosen: Each migrated test imports and calls the specific module function (e.g., `normalizeClasses`, `normalizeAbilityScores`, `getUnarmoredAcBonus`) rather than calling `normalizeDndBeyondCharacter()` and asserting on one field of the output.
- Alternatives considered: Keep calling `normalizeDndBeyondCharacter()` but move the test to the module's file. This preserves test structure but defeats the purpose — tests remain coupled to the orchestrator.
- Rationale: True unit isolation. A failure in the identity module surfaces in `dndBeyond-identity.test.ts`, not as a cryptic field mismatch in `dndBeyondCharacterImport.test.ts`.
- Trade-offs: Some tests need to be adapted (not just copy-pasted). The module function's input type may differ from the DnDCharacterData shape the monolith constructs with spread operators. Requires reading each module's function signatures before migrating.

### Decision 2: Three orchestration tests stay in the monolith, calling `normalizeDndBeyondCharacter()`

- Chosen: Tests at L96 (full snapshot), L136 (coerces unsupported values), and L315 (languages + senses + defenses + abilities) remain in `dndBeyondCharacterImport.test.ts` and continue to call the top-level function.
- Alternatives considered: Delete them (they'll be indirectly covered by module tests). Split them into per-module tests.
- Rationale: These tests exercise cross-module composition that can't be validated by testing modules in isolation. They serve as smoke tests for the orchestration wiring. L315 explicitly exercises 4 domains interacting.
- Trade-offs: Monolith doesn't shrink to zero — 3 tests and ~100 lines remain. Acceptable.

### Decision 3: Defenses module tests written from scratch

- Chosen: `dndBeyond-defenses.test.ts` is authored directly against the module's 3 exports (`normalizeImmunities`, `normalizeByModifierType`, `normalizeLanguages`) with minimal inline data (no fixture dependency needed).
- Alternatives considered: Extract logic from L315 into separate assertions in a defenses file. This doesn't work cleanly — L315 tests multiple domains simultaneously through the orchestrator.
- Rationale: The defenses module is simple (60 lines, 3 pure functions accepting a modifier array). Direct tests with inline data are straightforward and don't require fixture infrastructure.
- Trade-offs: New tests require careful review to ensure they reflect actual module behavior, not assumptions.

### Decision 4: File naming follows module names exactly

- Chosen: `dndBeyond-identity.test.ts` (not `dndBeyond-character.test.ts`), `dndBeyond-skills-senses.test.ts` (not `dndBeyond-skills.test.ts`). All new files use kebab-case matching the source module filename.
- Alternatives considered: Use the names from the GitHub issue. This creates a permanent mismatch between module and test file names.
- Rationale: 1:1 mapping between `lib/import/dndBeyond-*.ts` and `tests/unit/import/dndBeyond-*.test.ts` makes the relationship obvious and supports future navigation.
- Trade-offs: Diverges from the issue's listed filenames — a deliberate correction.

### Decision 5: `dndBeyond-armor-class.test.ts` and `dndBeyond-abilities.test.ts` extended, not recreated

- Chosen: Append tests to the existing files; check for coverage overlap in abilities before migrating L464.
- Alternatives considered: Delete and rewrite both files from scratch for consistency.
- Rationale: The existing files have valid, passing tests. Deleting them creates unnecessary risk.
- Trade-offs: Migrated tests must be consistent in style with existing tests in those files.

## Proposal to Design Mapping

- Proposal element: Create `dndBeyond-identity.test.ts` (6 tests migrated)
  - Design decision: Decision 1 (direct module function calls)
  - Validation approach: Run `npx jest dndBeyond-identity` — all 6 pass

- Proposal element: Create `dndBeyond-classes.test.ts` (6 tests migrated)
  - Design decision: Decision 1
  - Validation approach: Run `npx jest dndBeyond-classes` — all 6 pass

- Proposal element: Create `dndBeyond-ability-scores.test.ts` (8 tests migrated)
  - Design decision: Decision 1
  - Validation approach: Run `npx jest dndBeyond-ability-scores` — all 8 pass

- Proposal element: Extend `dndBeyond-armor-class.test.ts` (+5 tests)
  - Design decision: Decisions 1 + 5
  - Validation approach: Run `npx jest dndBeyond-armor-class` — all pre-existing + 5 new pass

- Proposal element: Create `dndBeyond-skills-senses.test.ts` (1 test migrated)
  - Design decision: Decision 1 + Decision 4
  - Validation approach: Run `npx jest dndBeyond-skills-senses` — passes

- Proposal element: Create `dndBeyond-defenses.test.ts` (new tests)
  - Design decision: Decision 3
  - Validation approach: Run `npx jest dndBeyond-defenses` — all new tests pass

- Proposal element: Check/extend `dndBeyond-abilities.test.ts`
  - Design decision: Decision 5
  - Validation approach: Verify L464 behavior is covered; add if not

- Proposal element: Shrink monolith to 3 orchestration tests
  - Design decision: Decision 2
  - Validation approach: Count tests in `dndBeyondCharacterImport.test.ts` = 3; all pass

- Proposal element: Fix naming mismatches from issue
  - Design decision: Decision 4
  - Validation approach: File system matches `lib/import/` module names

## Functional Requirements Mapping

- Requirement: Each migrated test must pass when run against the module function directly
  - Design element: Decision 1 — direct module function import
  - Acceptance criteria reference: specs/test-migration.md
  - Testability notes: Run each new test file in isolation (`jest --testPathPattern=<file>`)

- Requirement: All pre-existing tests continue to pass
  - Design element: Decisions 2 + 5 — keep orchestration tests, extend not replace existing files
  - Acceptance criteria reference: specs/test-migration.md
  - Testability notes: Run full test suite before and after; count must not decrease

- Requirement: Defenses module must have isolated unit test coverage
  - Design element: Decision 3 — new tests from scratch
  - Acceptance criteria reference: specs/defenses-coverage.md
  - Testability notes: All 3 exported functions covered: `normalizeImmunities`, `normalizeByModifierType`, `normalizeLanguages`

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Test files must not import from `lib/dndBeyondCharacterImport.ts` (the orchestrator) — only from the specific module under test
  - Design element: Decision 1
  - Acceptance criteria reference: specs/test-migration.md
  - Testability notes: Grep imports in each new test file to verify no orchestrator import

- Requirement category: operability
  - Requirement: New test files follow the existing style in the repo (TypeScript, Jest, no test framework switching)
  - Design element: Match style of `dndBeyond-armor-class.test.ts` and `dndBeyond-abilities.test.ts`
  - Acceptance criteria reference: specs/test-migration.md
  - Testability notes: Visual code review; TypeScript compilation must pass

## Risks / Trade-offs

- Risk/trade-off: A module function's input type is more specific than the orchestrator's `DndBeyondCharacterData` spread — the test may need to construct a narrower input object
  - Impact: Adapting tests takes longer than simple copy-paste; may reveal type gaps in modules
  - Mitigation: Read each module's function signature before migrating. Acceptable to inline a minimal input object.

- Risk/trade-off: The L270 test ("prefers override values for HP and ability scores") exercises both `normalizeAbilityScores` and `normalizeMaxHp` — two functions in the same module, but the test coordinates them through the orchestrator
  - Impact: The test needs to be rewritten as two separate narrower tests, or kept as a module-level integration test calling both functions
  - Mitigation: Keep as a single test calling both functions in sequence from `dndBeyond-ability-scores.ts` — still single-domain (same module), so it qualifies as a unit test.

## Rollback / Mitigation

- Rollback trigger: Any existing test fails after migration
- Rollback steps: `git checkout tests/unit/import/dndBeyondCharacterImport.test.ts` to restore the monolith; delete newly created test files
- Data migration considerations: None — test-only change
- Verification after rollback: Run `npx jest tests/unit/import/` — all tests pass at original count

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing test(s) or restore the monolith test for that case before proceeding.
- If security checks fail: N/A — this change adds no application code, network calls, or auth logic.
- If required reviews are blocked/stale: Wait for review. This is a non-urgent refactor; no bypass warranted.
- Escalation path and timeout: If CI failure cannot be resolved within one session, restore the monolith tests for the affected domain and open a follow-up issue.

## Open Questions

No unresolved questions. All design decisions have been made and rationale documented.
