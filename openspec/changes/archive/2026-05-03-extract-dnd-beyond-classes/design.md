## Context

- Relevant architecture: `lib/dndBeyondCharacterImport.ts` is the single source of truth for DnD Beyond character import logic. Issue 150 extraction established `lib/import/` as the home for import-related modules with a `dndBeyond-*` prefix convention. This extraction follows the same pattern.
- Dependencies: No new npm packages. No database or API changes. TypeScript path aliases are not used; all imports are relative.
- Interfaces/contracts touched: `lib/dndBeyondCharacterImport.ts` public exports (`parseDndBeyondCharacterUrl`, `normalizeDndBeyondCharacter`) are unchanged. Internal call sites within the file are rerouted to new imports. `lib/server/dndBeyondCharacterImport.ts` requires no changes.

## Goals / Non-Goals

### Goals

- Extract class and race normalization to `lib/import/dndBeyond-classes.ts`
- `normalizeClasses()` — merges multi-class entries by name, validates against `VALID_CLASSES`
- `normalizeClassEntry()` — single class entry normalization, returns `DnDClass | null`
- `normalizeRace()` — exact, case-insensitive, and substring fallback matching against `VALID_RACES`
- Zero behavior change — pure structural refactor

### Non-Goals

- Moving any other normalizer functions (issues 152–159)
- Changing any function signatures
- Modifying tests
- Adding barrel/index files

## Decisions

### Decision 1: One file per domain

- Chosen: All three class/race functions go into a single `lib/import/dndBeyond-classes.ts`
- Alternatives considered: Separate files per function
- Rationale: These three functions are tightly coupled — they share the same domain (character identity: class and race). Splitting them would add import complexity without benefit.

### Decision 2: `createValidationError` location

- Chosen: `createValidationError` already exists in `dndBeyond-utils.ts` (extracted in issue 150). The new `dndBeyond-classes.ts` imports it from there.
- Alternatives considered: Define locally in `dndBeyond-classes.ts` or re-export from original file
- Rationale: DRY — error factory belongs with the utilities that use it.

### Decision 3: Flat file naming in `lib/import/`

- Chosen: `lib/import/dndBeyond-classes.ts` following the established `dndBeyond-*.ts` convention
- Alternatives considered: `dndBeyond-classes-and-race.ts`
- Rationale: Consistent with issue 150 pattern (`dndBeyond-ability-scores.ts`, `dndBeyond-utils.ts`)

## Proposal to Design Mapping

- Proposal element: Create `lib/import/dndBeyond-classes.ts` with three normalizers
  - Design decision: Decision 1 (one file per domain) + Decision 2 (error factory from dndBeyond-utils)
  - Validation approach: `tsc --noEmit` passes; existing character import tests pass unchanged

- Proposal element: Update `lib/dndBeyondCharacterImport.ts` to import from new module
  - Design decision: Decision 3 (flat naming)
  - Validation approach: Original file no longer defines the extracted functions; imports resolve correctly

## Functional Requirements Mapping

- Requirement: `normalizeClasses`, `normalizeClassEntry`, `normalizeRace` exported from `lib/import/dndBeyond-classes.ts`
  - Design element: `lib/import/dndBeyond-classes.ts`
  - Acceptance criteria reference: GitHub issue #151
  - Testability notes: TypeScript compilation; existing unit tests exercise these functions through the original public API

- Requirement: No behavior change — all existing tests pass
  - Design element: All decisions
  - Testability notes: Run `npm test` and `npm run test:integration`; zero new failures

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: TypeScript strict compilation passes with no errors after extraction
  - Design element: All new files use existing TypeScript types from `lib/types.ts`
  - Acceptance criteria reference: GitHub issue #151
  - Testability notes: `tsc --noEmit`

- Requirement category: operability
  - Requirement: No circular imports introduced
  - Design element: Dependency direction is strictly one-way: `dndBeyondCharacterImport.ts` → `dndBeyond-classes.ts` → `dndBeyond-utils.ts` → `utils.ts`. No reverse edges.
  - Testability notes: Manual review of import graph

## Risks / Trade-offs

- Risk/trade-off: `normalizeRace` emits warnings via the `warnings` parameter when substring fallback matching occurs.
  - Impact: Warning accumulation remains delegated to the caller — an intentional design choice.
  - Mitigation: The parameter interface is preserved unchanged. Caller (`normalizeCharacterDetails`) passes its own `warnings` array.

- Risk/trade-off: After all extractions (151–159), the original file should be a thin orchestrator calling one function per domain.
  - Impact: This extraction is a step toward that goal.
  - Mitigation: Each extraction in the series follows the same pattern, making the final state predictable.

## Rollback / Mitigation

- Rollback trigger: CI fails (compilation error, test failure) and the root cause is not immediately fixable.
- Rollback steps: Revert the branch. The original file is unchanged in behavior so no data migration is needed.
- Data migration considerations: None — pure code change.
- Verification after rollback: `npm test` passes on main.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the compilation error or test failure before proceeding.
- If security checks fail: Treat as a blocker.
- If required reviews are blocked/stale: Ping reviewer after 24 hours.
- Escalation path: Maintainer (dougis) has final merge authority. No automated merge.

## Open Questions

- No open questions. Architecture confirmed in exploration session.
