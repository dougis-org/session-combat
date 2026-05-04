## Context

- Relevant architecture: `lib/import/utils.ts` already exists with two generic D&D math helpers (`getAbilityModifier`, `getProficiencyBonus`). `lib/dndBeyondCharacterImport.ts` is the single source of truth for Beyond character import, and domain-specific modules have been extracted into `lib/import/dndBeyond-*.ts` files per the issue 150 series.
- Dependencies: No new npm packages. No database or API changes. All imports are relative.
- Interfaces/contracts touched: `lib/dndBeyondCharacterImport.ts` public exports (`parseDndBeyondCharacterUrl`, `normalizeDndBeyondCharacter`) are unchanged. Internal helper functions are moved, not changed.

## Goals / Non-Goals

### Goals

- Add 5 generic import helpers to `lib/import/utils.ts`: `dedupeStrings`, `titleize`, `DAMAGE_TYPE_NAMES`, `isDamageTypeModifier`, `normalizeModifierCategory`
- Preserve exact behavior — pure structural refactor
- Enable future domain extractions (issues 152–155, 159) to import these helpers from `utils.ts`

### Non-Goals

- Moving domain normalizers
- Adding barrel/index files
- Modifying tests
- Changing any function signatures or behavior

## Decisions

### Decision 1: Target file is `lib/import/utils.ts`, not `dndBeyond-utils.ts`

- Chosen: All 5 helpers go to `lib/import/utils.ts`
- Alternatives considered: Putting some helpers (especially `DAMAGE_TYPE_NAMES`, `isDamageTypeModifier`, `normalizeModifierCategory`) in `dndBeyond-utils.ts`
- Rationale: `dedupeStrings` and `titleize` are clearly generic string utilities. `DAMAGE_TYPE_NAMES` contains canonical D&D types usable by any provider (Open5E, etc.), not just Beyond. Putting DAMAGE_TYPE_NAMES in a Beyond-specific file would force future Open5E adapters to import from Beyond-specific code — wrong direction.
- Trade-offs: `utils.ts` grows from 2 to 7 exports, making it a broader utility file. Acceptable since all exports are genuinely reusable across providers.

### Decision 2: Original file imports helpers, does not re-export

- Chosen: `lib/dndBeyondCharacterImport.ts` imports from `./import/utils` and uses the helpers internally
- Alternatives considered: Re-exporting from original so call sites don't change
- Rationale: This is consistent with how the original file already handles `getAbilityModifier` and `getProficiencyBonus` — it imports them from `utils.ts` and uses them. The same pattern applies here.
- Trade-offs: Callers of `lib/dndBeyondCharacterImport.ts` (like `lib/server/dndBeyondCharacterImport.ts`) don't need to change because the original file's public API is unchanged.

### Decision 3: Interfaces stay in original file

- Chosen: `DndBeyondModifier` and related interfaces remain in `lib/dndBeyondCharacterImport.ts`
- Alternatives considered: Moving interfaces to `dndBeyond-utils.ts` alongside helper functions
- Rationale: `isDamageTypeModifier` takes `DndBeyondModifier` which is defined in the original. For this extraction, we keep the interface local and just move the function implementations. Future work (issue 152 and beyond) can consolidate interfaces if needed.
- Trade-offs: Interface and implementation are in different files. Acceptable for this incremental step.

## Proposal to Design Mapping

- Proposal element: Move `dedupeStrings` to `utils.ts`
  - Design decision: Decision 1
  - Validation approach: TypeScript compilation; original file imports from `./import/utils`

- Proposal element: Move `titleize` to `utils.ts`
  - Design decision: Decision 1
  - Validation approach: TypeScript compilation; exact behavior preserved

- Proposal element: Move `DAMAGE_TYPE_NAMES` to `utils.ts`
  - Design decision: Decision 1
  - Validation approach: TypeScript compilation; readonly Set type preserved

- Proposal element: Move `isDamageTypeModifier` to `utils.ts`
  - Design decision: Decision 1 + Decision 3
  - Validation approach: `tsc --noEmit`; existing immune/resistance normalization produces same output

- Proposal element: Move `normalizeModifierCategory` to `utils.ts`
  - Design decision: Decision 1
  - Validation approach: TypeScript compilation; called only by `isDamageTypeModifier`

- Proposal element: Update `lib/dndBeyondCharacterImport.ts` imports
  - Design decision: Decision 2
  - Validation approach: Original file no longer defines helpers; only imports them

## Functional Requirements Mapping

- Requirement: `dedupeStrings` exported from `utils.ts`
  - Design element: `lib/import/utils.ts`
  - Acceptance criteria reference: `specs/import-utils/spec.md`
  - Testability notes: Named export exists; TypeScript compilation passes

- Requirement: `titleize` exported from `utils.ts`
  - Design element: `lib/import/utils.ts`
  - Acceptance criteria reference: `specs/import-utils/spec.md`
  - Testability notes: Named export exists; behavior (hyphen handling, Title Case) unchanged

- Requirement: `DAMAGE_TYPE_NAMES` exported from `utils.ts` as readonly Set
  - Design element: `lib/import/utils.ts`
  - Acceptance criteria reference: `specs/import-utils/spec.md`
  - Testability notes: TypeScript compilation; contains all 13 canonical D&D damage types

- Requirement: `isDamageTypeModifier` exported from `utils.ts`
  - Design element: `lib/import/utils.ts`
  - Acceptance criteria reference: `specs/import-utils/spec.md`
  - Testability notes: Function takes `DndBeyondModifier`; behavior unchanged

- Requirement: `normalizeModifierCategory` exported from `utils.ts`
  - Design element: `lib/import/utils.ts`
  - Acceptance criteria reference: `specs/import-utils/spec.md`
  - Testability notes: Named export exists; lowercase + hyphen-to-space normalization preserved

- Requirement: No behavior change — all existing tests pass
  - Design element: Decision 2
  - Acceptance criteria reference: All specs
  - Testability notes: `npm test` passes; `npm run test:integration` passes

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: TypeScript strict compilation passes after extraction
  - Design element: All helpers use existing types; no new type declarations needed
  - Acceptance criteria reference: All specs
  - Testability notes: `tsc --noEmit`

- Requirement category: operability
  - Requirement: No circular imports introduced
  - Design element: `utils.ts` has no imports; dependency direction is strictly one-way
  - Acceptance criteria reference: All specs
  - Testability notes: Manual review of import graph; no new import edges added to `utils.ts`

## Risks / Trade-offs

- Risk/trade-off: Moving `isDamageTypeModifier` requires `DndBeyondModifier` interface in scope
  - Impact: `utils.ts` must import `DndBeyondModifier` from `dndBeyondCharacterImport.ts` or the type must be duplicated
  - Mitigation: Keep `DndBeyondModifier` interface in original file; function takes the interface type but implementation lives in `utils.ts`
  - Alternative considered: Move interface to `dndBeyond-utils.ts` — deferred to future work

- Risk/trade-off: `utils.ts` becomes a broader utility file (7 exports vs 2)
  - Impact: Less focused than originally intended
  - Mitigation: All 7 exports are genuinely generic import utilities; no mission creep
  - Alternative considered: Splitting into `string-utils.ts` and `modifier-utils.ts` — over-engineered for 7 functions

## Rollback / Mitigation

- Rollback trigger: CI fails (compilation error, test failure) and root cause is not immediately fixable
- Rollback steps: Revert the branch. Original file unchanged in behavior — no data migration needed.
- Data migration considerations: None — pure code structure change
- Verification after rollback: `npm test` passes on main

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix compilation error or test failure before proceeding. This is a no-op refactor — any CI failure indicates a genuine mistake.
- If security checks fail: Treat as blocker. Structural refactor should introduce no security surface changes.
- If required reviews are blocked/stale: Ping reviewer after 24 hours. Escalate to maintainer after 48 hours.
- Escalation path and timeout: Maintainer (dougis) has final merge authority. No automated merge.

## Open Questions

No open questions. Architecture is straightforward — simple function/constant relocation with no ambiguous decisions.