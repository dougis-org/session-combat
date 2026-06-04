## Context

- Relevant architecture: `tests/helpers/` contains shared test utilities; `tests/unit/import/` contains per-module unit tests and the current `testFactories.ts` re-export shim. Production types live in `lib/types.ts` (`AbilityScores`, `CharacterClass`, `ImportedCharacterDraft`).
- Dependencies: No production code changes. All changes are within `tests/`.
- Interfaces/contracts touched: Import paths in ~6 unit test files. The public exports of `testFactories.ts` (re-export hub) must remain backward-compatible for any test file importing from it.

## Goals / Non-Goals

### Goals

- Each test helper file has a single, clearly scoped purpose enforced by a header comment
- Generic 5e character shapes are centralized so future import sources share them
- Raw DnD Beyond API shapes are isolated to a DnD Beyond-specific helper
- Inline duplication of ability score objects and modifier arrays is eliminated
- All existing tests pass without behavioral changes

### Non-Goals

- Changing production code
- Factoring every possible test shape — only currently-duplicated patterns
- Abstracting fixture files

## Decisions

### Decision 1: Three-layer helper hierarchy

- Chosen: `open5eTestHelpers.ts` (Open5E-specific) + `characterTestHelpers.ts` (generic 5e) + `dndBeyondTestHelpers.ts` (DnD Beyond raw shapes), all re-exported from `testFactories.ts`
- Alternatives considered: Single flat `importTestHelpers.ts` with everything; two files (source-specific vs generic)
- Rationale: Mirrors the production architecture — each import source transforms its raw shape into a generic 5e shape. Test helpers should reflect the same boundary. Future Roll20/etc. importers know exactly which file to extend.
- Trade-offs: More files to maintain; mitigated by header comments defining each file's scope

### Decision 2: Move `createImportedCharacterDraft` verbatim to `characterTestHelpers.ts`, rename to `createCharacterData`

- Chosen: Move function body unchanged; rename to `createCharacterData` to reflect generic purpose; re-export from `dndBeyondImport.ts` for backward compatibility during transition
- Alternatives considered: Leave in `dndBeyondImport.ts` and re-export; duplicate into new file
- Rationale: The function creates the normalized `ImportedCharacterDraft` shape defined in `lib/types.ts` — it has no DnD Beyond-specific logic. Its home should reflect that. Verbatim move ensures zero behavioral drift.
- Trade-offs: Callers need import path update; mitigated by `tsc --noEmit` catching all misses

### Decision 3: `createModifier` and `createModifierList` in `dndBeyondTestHelpers.ts`

- Chosen: Two factory functions for the `DndBeyondModifier` shape (type, subType, fixedValue, value) which is specific to the DnD Beyond raw API response
- Alternatives considered: Inline the type locally in each test file (status quo)
- Rationale: `dndBeyond-armor-class.test.ts` alone has 7+ inline arrays. The shape is DnD Beyond-specific and should be isolated there.
- Trade-offs: Tests must import from a new path; straightforward update

### Decision 4: Header comments define scope, not just describe contents

- Chosen: Each helper opens with a multi-line comment stating what belongs in the file and what does not, with explicit mention of Roll20/future importers for `characterTestHelpers.ts`
- Alternatives considered: README in `tests/helpers/`; inline JSDoc only
- Rationale: Header comments are read by anyone opening the file — they're the lowest-friction guardrail against scope creep
- Trade-offs: Comments can rot; mitigated by keeping them prescriptive ("put X here, not Y") rather than descriptive

### Decision 5: ADR in `openspec/specs/`

- Chosen: `openspec/specs/adr-test-helper-layers.md` documents the layering decision as an Architecture Decision Record
- Alternatives considered: Inline comment in `testFactories.ts`; wiki page; nothing
- Rationale: The layering decision (source-specific vs generic 5e) is non-obvious and will be revisited when adding new import sources. An ADR gives future contributors the "why" without requiring git archaeology.
- Trade-offs: One more file to maintain; low cost given the decision's longevity

## Proposal to Design Mapping

- Proposal element: Rename `importTestHelpers.ts` → `open5eTestHelpers.ts`
  - Design decision: Decision 1 (three-layer hierarchy)
  - Validation approach: `grep -r "importTestHelpers"` returns zero results after rename

- Proposal element: Create `characterTestHelpers.ts` with generic 5e factories
  - Design decision: Decision 1 + Decision 2
  - Validation approach: `createAbilityScores`, `createClassEntry`, `createCharacterData` exported and callable; `createImportedCharacterDraft` removed from `dndBeyondImport.ts`

- Proposal element: Create `dndBeyondTestHelpers.ts` with modifier factories
  - Design decision: Decision 3
  - Validation approach: `dndBeyond-armor-class.test.ts` inline modifier arrays replaced with factory calls; `grep "MockDndBeyondModifier\[\]"` returns zero results

- Proposal element: Header comments defining scope
  - Design decision: Decision 4
  - Validation approach: Each helper file opens with a header comment block on first read

- Proposal element: ADR
  - Design decision: Decision 5
  - Validation approach: `openspec/specs/adr-test-helper-layers.md` exists and is parseable

## Functional Requirements Mapping

- Requirement: `createAbilityScores(partial)` — build full 6-stat object with all-10 defaults, override any field
  - Design element: `characterTestHelpers.ts`
  - Acceptance criteria reference: specs/character-test-helpers.md
  - Testability notes: Call with empty partial → all stats 10; call with `{dexterity: 17}` → dex 17, rest 10

- Requirement: `createClassEntry(className, level)` — create a `CharacterClass` object
  - Design element: `characterTestHelpers.ts`
  - Acceptance criteria reference: specs/character-test-helpers.md
  - Testability notes: Returns `{class: className, level}` matching `CharacterClass` type

- Requirement: `createCharacterData(partial)` — full `ImportedCharacterDraft` with sensible defaults
  - Design element: `characterTestHelpers.ts` (moved from `dndBeyondImport.ts`)
  - Acceptance criteria reference: specs/character-test-helpers.md
  - Testability notes: Defaults produce a valid character; partial overrides are merged correctly

- Requirement: `createModifier(type, subType, value)` — single `DndBeyondModifier`
  - Design element: `dndBeyondTestHelpers.ts`
  - Acceptance criteria reference: specs/dndbeyond-test-helpers.md
  - Testability notes: Returned object matches `DndBeyondModifier` interface used in armor-class tests

- Requirement: `createModifierList(...modifiers)` — array wrapper
  - Design element: `dndBeyondTestHelpers.ts`
  - Acceptance criteria reference: specs/dndbeyond-test-helpers.md
  - Testability notes: Returns array of passed modifier objects; variadic

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: All existing tests pass after restructure
  - Design element: Verbatim function moves; no logic changes; backward-compatible re-exports during transition
  - Acceptance criteria reference: `npm test` exits 0
  - Testability notes: Run full unit suite after each rename/move step

- Requirement category: operability
  - Requirement: Future contributors understand which file to extend
  - Design element: Header comments (Decision 4) + ADR (Decision 5)
  - Acceptance criteria reference: Each helper has a header comment; ADR exists
  - Testability notes: Manual review

## Risks / Trade-offs

- Risk/trade-off: Import path update misses a file
  - Impact: TypeScript compile error — caught before merge
  - Mitigation: `tsc --noEmit` after each rename step; grep for old path

- Risk/trade-off: `createCharacterData` default values drift from `createImportedCharacterDraft`
  - Impact: Tests relying on specific defaults could silently change behavior
  - Mitigation: Verbatim copy of function body; code review diff check

## Rollback / Mitigation

- Rollback trigger: Test suite fails and cause cannot be resolved within the PR
- Rollback steps: Revert all file renames and import path changes; `git revert` the branch or restore from the pre-change commit
- Data migration considerations: None — test-only changes
- Verification after rollback: `npm test` exits 0

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing check (most likely a missed import path update).
- If security checks fail: Not applicable — test-only changes with no production surface.
- If required reviews are blocked/stale: Ping reviewer after 48 hours; escalate to maintainer after 72 hours.
- Escalation path and timeout: Tag `@dougis` in the PR after 72 hours of no review activity.

## Open Questions

No open questions. All architectural decisions were confirmed during exploration prior to proposal creation.
