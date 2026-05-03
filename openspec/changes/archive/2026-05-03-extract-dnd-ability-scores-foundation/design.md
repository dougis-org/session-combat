## Context

- Relevant architecture: `lib/dndBeyondCharacterImport.ts` is the single source of truth for DnD Beyond character import logic. `lib/import/` already exists as the home for import-related modules (`open5eAdapter.ts`, `transformMonster.ts`, etc.). No `lib/import/dndBeyond/` subfolder will be created — files are flat in `lib/import/` with a `dndBeyond-` prefix convention.
- Dependencies: No new npm packages. No database or API changes. TypeScript path aliases are not used; all imports are relative.
- Interfaces/contracts touched: `lib/dndBeyondCharacterImport.ts` public exports (`parseDndBeyondCharacterUrl`, `normalizeDndBeyondCharacter`) are unchanged. Internal call sites within the file are rerouted to new imports.

## Goals / Non-Goals

### Goals

- Establish `lib/import/utils.ts` as the home for generic D&D math helpers reusable across providers
- Establish `lib/import/dndBeyond-utils.ts` as the home for DnD Beyond-specific shared helpers used across all dndBeyond-* extraction files (issues 150–159)
- Move ability score and HP normalizers to `lib/import/dndBeyond-ability-scores.ts`
- Zero behavior change — pure structural refactor

### Non-Goals

- Moving `lib/dndBeyondCharacterImport.ts` itself into `lib/import/`
- Changing any function signatures
- Adding barrel/index files
- Modifying tests

## Decisions

### Decision 1: Two-tier utility split

- Chosen: `lib/import/utils.ts` for generic D&D math (`getAbilityModifier`, `getProficiencyBonus`); `lib/import/dndBeyond-utils.ts` for DnD Beyond-specific helpers (`ABILITY_ID_MAP`, `ABILITY_KEYS`, `indexStatValues`, `resolveAbilityScore`, `sumModifierBonusesBySubtype`)
- Alternatives considered: (A) Single `dndBeyond-utils.ts` for everything. (B) Keep all helpers in the original file and only move the three normalizer functions.
- Rationale: `getAbilityModifier` and `getProficiencyBonus` are pure D&D math with no DnD Beyond types in their signatures — they will be needed by future Open5E extractions. Mixing them with DnD Beyond-typed helpers would force cross-provider imports from a provider-specific file.
- Trade-offs: Two files to maintain instead of one. Justified because it prevents import coupling between providers.

### Decision 2: Flat file naming in `lib/import/`

- Chosen: `lib/import/dndBeyond-*.ts` naming convention; no `dndBeyond/` subfolder
- Alternatives considered: Subfolder `lib/import/dndBeyond/normalize-ability-scores.ts` (original issue proposal)
- Rationale: User explicitly chose flat layout. Avoids deep nesting and keeps the import directory browsable at a glance.
- Trade-offs: As the series grows to 7+ dndBeyond files the directory will become wide. Acceptable given the bounded scope of the series.

### Decision 3: Original file retains all public exports; internal calls redirect

- Chosen: `lib/dndBeyondCharacterImport.ts` keeps `parseDndBeyondCharacterUrl` and `normalizeDndBeyondCharacter` as its public surface. Extracted functions are imported into the original file so all existing call sites (including `lib/server/dndBeyondCharacterImport.ts`) require no changes.
- Alternatives considered: Re-exporting everything from the new files and removing from original. Updating all call sites to import directly from new modules.
- Rationale: No-op refactor principle — zero downstream impact. Call-site migration can happen in issue 159 when the original file is slimmed to a thin orchestrator.
- Trade-offs: The original file temporarily re-imports functions it used to own. Accepted as a transitional state.

## Proposal to Design Mapping

- Proposal element: Create `lib/import/utils.ts` with generic math helpers
  - Design decision: Decision 1 (two-tier utility split)
  - Validation approach: `tsc --noEmit` passes; existing tests pass; no duplicate definitions remain in original

- Proposal element: Create `lib/import/dndBeyond-utils.ts` with DnD Beyond shared helpers
  - Design decision: Decision 1 (two-tier utility split)
  - Validation approach: `tsc --noEmit` passes; functions importable from new path; no duplicate definitions remain in original

- Proposal element: Create `lib/import/dndBeyond-ability-scores.ts` with three normalizers
  - Design decision: Decision 2 (flat naming) + Decision 3 (original retains public exports)
  - Validation approach: `tsc --noEmit` passes; existing character import tests pass unchanged

- Proposal element: Update `lib/dndBeyondCharacterImport.ts` to import from new modules
  - Design decision: Decision 3
  - Validation approach: Original file no longer defines the extracted functions; imports resolve correctly

## Functional Requirements Mapping

- Requirement: `normalizeAbilityScores`, `normalizeMaxHp`, `normalizeCurrentHp` exported from `lib/import/dndBeyond-ability-scores.ts`
  - Design element: `lib/import/dndBeyond-ability-scores.ts`
  - Acceptance criteria reference: specs/dndBeyond-ability-scores-extraction/spec.md
  - Testability notes: Verify named exports exist via TypeScript compilation; existing unit tests exercise these functions through the original public API

- Requirement: `getAbilityModifier`, `getProficiencyBonus` exported from `lib/import/utils.ts`
  - Design element: `lib/import/utils.ts`
  - Acceptance criteria reference: specs/import-utils/spec.md
  - Testability notes: TypeScript compilation; downstream consumers (`dndBeyond-ability-scores.ts`, `dndBeyond-armor-class.ts` in future issues) import from this path

- Requirement: DnD Beyond shared helpers exported from `lib/import/dndBeyond-utils.ts`
  - Design element: `lib/import/dndBeyond-utils.ts`
  - Acceptance criteria reference: specs/dndBeyond-utils/spec.md
  - Testability notes: TypeScript compilation; `normalizeAbilityScores` in `dndBeyond-ability-scores.ts` imports `sumModifierBonusesBySubtype` and `ABILITY_ID_MAP` from this path

- Requirement: No behavior change — all existing tests pass
  - Design element: Decision 3 (original retains public exports; internal calls redirect)
  - Acceptance criteria reference: All specs
  - Testability notes: Run `npm test` and `npm run test:integration`; zero new failures

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: TypeScript strict compilation passes with no errors after extraction
  - Design element: All new files use existing TypeScript types from `lib/types.ts` and DnD Beyond internal types already in scope
  - Acceptance criteria reference: All specs
  - Testability notes: `tsc --noEmit`

- Requirement category: operability
  - Requirement: No circular imports introduced
  - Design element: Dependency direction is strictly one-way: `dndBeyondCharacterImport.ts` → `dndBeyond-ability-scores.ts` → `dndBeyond-utils.ts` → `utils.ts`. No reverse edges.
  - Acceptance criteria reference: All specs
  - Testability notes: Manual review of import graph; `madge --circular` if available

## Risks / Trade-offs

- Risk/trade-off: `lib/server/dndBeyondCharacterImport.ts` imports from the original file. If that server file directly imports extracted functions by name, its imports would break.
  - Impact: Server-side import fails at build time (caught by CI).
  - Mitigation: Decision 3 ensures the original file re-exports or re-imports everything. Server file requires no changes.

- Risk/trade-off: `sumModifierBonusesBySubtype` is used both in `dndBeyond-ability-scores.ts` (via `normalizeAbilityScores`) and in functions not yet extracted (`normalizeArmorClass`, `normalizeSkills`). Two import sources for the same helper within the original file.
  - Impact: None — both imports resolve to the same function from `dndBeyond-utils.ts`.
  - Mitigation: After extraction, all call sites in the original file import from `dndBeyond-utils.ts`.

## Rollback / Mitigation

- Rollback trigger: CI fails (compilation error, test failure) and the root cause is not immediately fixable.
- Rollback steps: Revert the branch. The original file is unchanged in behavior so no data migration is needed.
- Data migration considerations: None — pure code change.
- Verification after rollback: `npm test` passes on main.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the compilation error or test failure before proceeding. This is a no-op refactor — any CI failure indicates a genuine mistake.
- If security checks fail: Treat as a blocker. A structural refactor should introduce no security surface changes.
- If required reviews are blocked/stale: Ping reviewer after 24 hours. Escalate to maintainer after 48 hours.
- Escalation path and timeout: Maintainer (dougis) has final merge authority. No automated merge.

## Open Questions

No open questions. Architecture confirmed in exploration session prior to this proposal.
