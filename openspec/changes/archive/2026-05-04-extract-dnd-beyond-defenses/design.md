## Context

- Relevant architecture: `lib/import/` is the structured extraction layer for `lib/dndBeyondCharacterImport.ts`. Modules in this layer import shared helpers from `lib/import/utils.ts` (generic) and `lib/import/dndBeyond-utils.ts` (Beyond-specific), and define a local `DndBeyondModifier` interface rather than importing from the main file to avoid circular dependencies.
- Dependencies: `lib/import/utils.ts` (exports `dedupeStrings`, `titleize`, `isDamageTypeModifier`)
- Interfaces/contracts touched: `lib/dndBeyondCharacterImport.ts` call sites for `normalizeImmunities`, `normalizeByModifierType`, `normalizeLanguages` — these become imports instead of local calls; signatures are unchanged.

## Goals / Non-Goals

### Goals

- Extract three defenses normalizers into `lib/import/dndBeyond-defenses.ts`
- Maintain identical runtime behavior (pure structural refactor)
- Follow established local-interface pattern for `DndBeyondModifier`
- Keep one-way dependency: new file → `utils.ts`, never → main file

### Non-Goals

- Logic changes to any extracted function
- New test coverage
- Changing the `DndBeyondModifier` type definition strategy across the project

## Decisions

### Decision 1: `DndBeyondModifier` type source

- Chosen: Define a local `interface DndBeyondModifier` in `dndBeyond-defenses.ts` with only the fields the three functions need (`type`, `subType`, `friendlySubtypeName`)
- Alternatives considered: Import the type from `lib/dndBeyondCharacterImport.ts` (as `utils.ts` does)
- Rationale: Importing from the main file creates a coupling that all other domain files in `lib/import/` deliberately avoid. TypeScript structural typing means the local shape is compatible at all call sites.
- Trade-offs: The `DndBeyondModifier` shape is now defined in multiple places. Accepted — this is the established pattern in this codebase, and the fields needed are stable.

### Decision 2: No re-export of `DndBeyondModifier` from the new file

- Chosen: Keep the local interface unexported
- Alternatives considered: Export it for callers to reuse
- Rationale: Consistent with `dndBeyond-utils.ts` and `dndBeyond-ability-scores.ts`. The main file owns the canonical exported type; duplicating the export would cause confusion.
- Trade-offs: None — callers all go through `lib/dndBeyondCharacterImport.ts` which has the canonical definition.

### Decision 3: Import path in the updated main file

- Chosen: `import { normalizeImmunities, normalizeByModifierType, normalizeLanguages } from "./import/dndBeyond-defenses"`
- Alternatives considered: None
- Rationale: Consistent with the existing `import { normalizeClasses, normalizeRace } from "./import/dndBeyond-classes"` pattern already in the main file.
- Trade-offs: None.

## Proposal to Design Mapping

- Proposal element: New file `lib/import/dndBeyond-defenses.ts`
  - Design decision: Decision 1 (local interface), Decision 3 (import path)
  - Validation approach: TypeScript compilation, existing test suite passes

- Proposal element: No import from `lib/dndBeyondCharacterImport.ts`
  - Design decision: Decision 1 (local interface)
  - Validation approach: Code review — grep confirms no `from "../dndBeyondCharacterImport"` in the new file

- Proposal element: Three functions exported, imported back in main file
  - Design decision: Decision 3 (import path)
  - Validation approach: `grep` confirms functions are no longer defined locally; existing behavior tests pass

## Functional Requirements Mapping

- Requirement: `normalizeImmunities` correctly splits immunity modifiers into `damageImmunities` vs `conditionImmunities`
  - Design element: Pure copy-extract of the function body; `isDamageTypeModifier` imported from `utils.ts`
  - Acceptance criteria reference: Tests still pass
  - Testability notes: Covered by existing character import tests

- Requirement: `normalizeByModifierType` returns deduped, titleized strings for a given modifier type
  - Design element: Pure copy-extract; `dedupeStrings` + `titleize` imported from `utils.ts`
  - Acceptance criteria reference: Tests still pass
  - Testability notes: Covered by existing character import tests

- Requirement: `normalizeLanguages` returns deduped, titleized language strings
  - Design element: Pure copy-extract; uses `dedupeStrings` + `titleize` from `utils.ts`
  - Acceptance criteria reference: Tests still pass
  - Testability notes: Covered by existing character import tests

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: No behavior change at runtime
  - Design element: Pure copy-extract with no logic modifications
  - Acceptance criteria reference: All existing tests pass
  - Testability notes: Run `npm test` — zero diff in test results expected

- Requirement category: operability
  - Requirement: No circular dependency introduced
  - Design element: Local `DndBeyondModifier` interface; imports only from `lib/import/utils.ts`
  - Acceptance criteria reference: TypeScript compilation succeeds
  - Testability notes: `tsc --noEmit` passes

## Risks / Trade-offs

- Risk/trade-off: Local `DndBeyondModifier` interface drift if the canonical type gains new required fields
  - Impact: Compile error in `dndBeyond-defenses.ts` if call sites change
  - Mitigation: The three functions use a narrow, stable subset of the modifier shape. The local interface can be updated if the canonical type evolves.

## Rollback / Mitigation

- Rollback trigger: CI failure (type error, test failure, lint error)
- Rollback steps: Revert the new file and the import changes in `dndBeyondCharacterImport.ts`; the functions are still present locally before the change
- Data migration considerations: None — purely structural
- Verification after rollback: `npm test` passes on main branch

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing check before proceeding.
- If security checks fail: Do not merge. Not expected for a structural refactor with no new dependencies.
- If required reviews are blocked/stale: Ping reviewer after 24 hours; escalate to maintainer after 48 hours.
- Escalation path and timeout: Tag @dougis after 48 hours of no review activity.

## Open Questions

No open questions. Design is fully determined by established patterns in the codebase.
