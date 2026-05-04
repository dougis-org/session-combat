## Context

- **Relevant architecture:** `lib/import/` contains two utility layers — `utils.ts` (provider-agnostic D&D/JS helpers) and `dndBeyond-utils.ts` (DnD Beyond API-specific helpers). Domain extraction modules (`dndBeyond-ability-scores.ts`, `dndBeyond-classes.ts`, `dndBeyond-defenses.ts`, and upcoming 153–159 extractions) import from both layers. The boundary between them must be clean for future provider reuse.
- **Dependencies:** `lib/dndBeyondCharacterImport.ts` (main orchestrator, 670 lines), `lib/import/utils.ts`, `lib/import/dndBeyond-utils.ts`, `lib/types.ts` (for `AbilityScores` type). Test files under `tests/unit/import/`.
- **Interfaces/contracts touched:** Exported symbols from `utils.ts` and `dndBeyond-utils.ts`. No public API routes or UI surfaces are affected.

## Goals / Non-Goals

### Goals

- `utils.ts` has zero imports from any `dndBeyond-*` file or from `lib/dndBeyondCharacterImport.ts`
- `dndBeyond-utils.ts` exports only DnD Beyond-specific code
- `flattenModifiers` is accessible to all extraction modules via `dndBeyond-utils.ts`
- TypeScript compiles cleanly with `tsc --noEmit`; all existing tests pass without behavior change

### Non-Goals

- No new runtime behavior, no renamed functions, no abstraction layers
- No changes to domain normalization logic (issues 153–159 remain separate)

## Decisions

### Decision 1: Introduce `ModifierLike` interface in `utils.ts`

- **Chosen:** Define a minimal structural interface `ModifierLike { subType?: string | null; friendlySubtypeName?: string | null }` in `utils.ts`. Change `isDamageTypeModifier`'s parameter type from `DndBeyondModifier` to `ModifierLike`. Remove the `import type { DndBeyondModifier }` line from `utils.ts`.
- **Alternatives considered:** (a) Move `isDamageTypeModifier` wholesale to `dndBeyond-utils.ts`; (b) inline the type as an anonymous shape.
- **Rationale:** The function body only uses `subType` and `friendlySubtypeName` — both present on any modifier-like object from any provider. Defining `ModifierLike` keeps the function in `utils.ts` (correct layer) and makes it usable by future Open5E or other adapters without importing DnD Beyond types. Option (a) would bury a reusable function in a provider-specific file. Option (b) is harder to reference from specs and tests.
- **Trade-offs:** Adds one new exported interface. Call sites that currently pass `DndBeyondModifier` require no changes because `DndBeyondModifier` structurally satisfies `ModifierLike`.

### Decision 2: Move `isPresent`, `escapeRegExp`, `ABILITY_KEYS` to `utils.ts`

- **Chosen:** Add all three to `utils.ts`. Define `ABILITY_KEYS` as an independent `ReadonlyArray<keyof AbilityScores>` constant (not derived from `ABILITY_ID_MAP`). Remove them from `dndBeyond-utils.ts`.
- **Alternatives considered:** Leave them in `dndBeyond-utils.ts` and re-export from `utils.ts`.
- **Rationale:** Re-exporting would keep the DnD Beyond file as the source of truth for generic utilities — defeating the architectural goal. Independent definition in `utils.ts` is the clean cut. TypeScript's structural type system means `ABILITY_KEYS` typed as `ReadonlyArray<keyof AbilityScores>` will catch any misspelling at compile time.
- **Trade-offs:** Any import path that read `isPresent` or `escapeRegExp` from `dndBeyond-utils.ts` must be updated. TypeScript will surface these as compile errors — no silent breakage.

### Decision 3: Move `flattenModifiers` to `dndBeyond-utils.ts`

- **Chosen:** Extract `flattenModifiers()` from `lib/dndBeyondCharacterImport.ts` into `lib/import/dndBeyond-utils.ts` and export it. Update `dndBeyondCharacterImport.ts` to import it from there.
- **Alternatives considered:** Leave in `dndBeyondCharacterImport.ts` and have each module import from the root file.
- **Rationale:** `dndBeyondCharacterImport.ts` is the monolith being decomposed. Having extracted modules depend back on it creates a circular coupling risk. `dndBeyond-utils.ts` is the correct shared utility layer for all DnD Beyond modules.
- **Trade-offs:** None — `flattenModifiers` has no domain logic; it only collects modifier arrays from a DnD Beyond character payload.

## Proposal to Design Mapping

- Proposal element: Remove `DndBeyondModifier` import from `utils.ts`
  - Design decision: Decision 1 — introduce `ModifierLike`
  - Validation approach: `tsc --noEmit` confirms no import of `dndBeyond*` symbols in `utils.ts`

- Proposal element: Move `isPresent`, `escapeRegExp`, `ABILITY_KEYS` to `utils.ts`
  - Design decision: Decision 2
  - Validation approach: Grep confirms these symbols are not exported from `dndBeyond-utils.ts`; full test suite passes

- Proposal element: Move `flattenModifiers` to `dndBeyond-utils.ts`
  - Design decision: Decision 3
  - Validation approach: `flattenModifiers` is importable from `lib/import/dndBeyond-utils`; `dndBeyondCharacterImport.ts` no longer defines it locally

## Functional Requirements Mapping

- Requirement: `utils.ts` has no provider-specific imports
  - Design element: Decision 1 (`ModifierLike`) + Decision 2 (move generics)
  - Acceptance criteria reference: spec `import-utils` — no import of `DndBeyondModifier` or any `dndBeyond-*` symbol
  - Testability notes: Static — verified by `tsc --noEmit` and grep

- Requirement: `isPresent`, `escapeRegExp`, `ABILITY_KEYS` importable from `utils.ts`
  - Design element: Decision 2
  - Acceptance criteria reference: spec `import-utils`
  - Testability notes: Import statements in affected files compile without error

- Requirement: `isDamageTypeModifier` accepts any `ModifierLike` value
  - Design element: Decision 1
  - Acceptance criteria reference: spec `import-utils`
  - Testability notes: Existing call sites continue to compile; no cast needed

- Requirement: `flattenModifiers` exported from `dndBeyond-utils.ts`
  - Design element: Decision 3
  - Acceptance criteria reference: spec `dndBeyond-utils`
  - Testability notes: Import `{ flattenModifiers }` from `lib/import/dndBeyond-utils` compiles cleanly

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Zero behavior change — all existing tests pass
  - Design element: Decisions 1–3 are all type/location changes; no logic is modified
  - Acceptance criteria reference: All specs — "existing tests still pass"
  - Testability notes: Run `npm test` before and after; output must be identical

- Requirement category: operability
  - Requirement: TypeScript strict mode continues to pass
  - Design element: `ABILITY_KEYS` typed as `ReadonlyArray<keyof AbilityScores>`; `ModifierLike` is a minimal structural interface
  - Acceptance criteria reference: `tsc --noEmit` exits 0
  - Testability notes: Part of CI build

## Risks / Trade-offs

- Risk/trade-off: An undiscovered import of `isPresent`/`escapeRegExp` from `dndBeyond-utils.ts` in a test file is missed.
  - Impact: TypeScript compile error in CI.
  - Mitigation: After moving symbols, run `grep -r "from.*dndBeyond-utils" --include="*.ts"` across the repo and audit every result.

- Risk/trade-off: `ABILITY_KEYS` order defined independently does not match the `Object.values(ABILITY_ID_MAP)` derivation order.
  - Impact: Subtle iteration bugs in ability score loops.
  - Mitigation: Type as `ReadonlyArray<keyof AbilityScores>` and verify order matches `ABILITY_ID_MAP` (1=strength … 6=charisma).

## Rollback / Mitigation

- **Rollback trigger:** TypeScript compile failure or any test regression after the PR is merged.
- **Rollback steps:** Revert the PR. All changes are in utility files with no database or API contract implications.
- **Data migration considerations:** None — purely code.
- **Verification after rollback:** `tsc --noEmit` passes; `npm test` passes.

## Operational Blocking Policy

- **If CI checks fail:** Do not merge. Fix the compile error or test failure before re-requesting review.
- **If security checks fail:** Not applicable — no auth, secrets, or external service changes in this PR.
- **If required reviews are blocked/stale:** Re-request after 24 hours; escalate to repo owner after 48 hours.
- **Escalation path and timeout:** Repo owner (dougis-org) resolves any stale review within 48 hours.

## Open Questions

No open questions. All decisions are fully specified and derivable from the current code.
