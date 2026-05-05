## Context

- Relevant architecture: `lib/import/` is the structured extraction layer for `lib/dndBeyondCharacterImport.ts`. Modules in this layer import shared helpers from `lib/import/utils.ts` (generic) and `lib/import/dndBeyond-utils.ts` (Beyond-specific), and define a local `DndBeyondModifier` interface rather than importing from the main file to avoid circular dependencies.
- Dependencies: `lib/import/utils.ts` (exports `getAbilityModifier`, `ABILITY_KEYS`); `lib/import/dndBeyond-utils.ts` (exports `sumModifierBonusesBySubtype`, `getModifierNumericValue`); `lib/characterReference.ts` (exports `SKILL_ABILITY_MAP`, `PASSIVE_SENSE_SKILLS`).
- Interfaces/contracts touched: call sites in `lib/dndBeyondCharacterImport.ts` for `normalizeSavingThrows` (line 438), `normalizeSkills` (line 462), and `normalizeSenses` (line 493) — these become imports; signatures unchanged.

## Goals / Non-Goals

### Goals

- Extract three proficiency-score normalizers into `lib/import/dndBeyond-skills-senses.ts`
- Move `collectModifierSubtypeSet` into `lib/import/dndBeyond-utils.ts` (shared layer)
- Maintain identical runtime behavior (pure structural refactor)
- Follow established local-interface pattern for `DndBeyondModifier`
- Keep one-way dependency: new file → `utils.ts` / `dndBeyond-utils.ts` / `characterReference.ts`, never → main file

### Non-Goals

- Logic changes to any extracted function
- New test coverage
- Changing the `DndBeyondModifier` type definition strategy across the project

## Decisions

### Decision 1: `collectModifierSubtypeSet` placement

- Chosen: Add to `lib/import/dndBeyond-utils.ts` as a new export
- Alternatives considered: Keep it in `dndBeyond-skills-senses.ts` (module-private)
- Rationale: `collectModifierSubtypeSet` is called by both `normalizeSkills` and `normalizeSavingThrows`. Both functions move to the new module, so the function could be private to it. However, placing it in `dndBeyond-utils.ts` is consistent with how shared helpers are handled across the series (e.g., `flattenModifiers` in issue #159 is explicitly planned for `dndBeyond-utils.ts`), and avoids a future cross-module import if the pattern is needed elsewhere.
- Trade-offs: `dndBeyond-utils.ts` grows by one function; accepted since it's the correct layer for shared Beyond-specific helpers.

### Decision 2: `DndBeyondModifier` type source

- Chosen: Define a local `interface DndBeyondModifier` in `dndBeyond-skills-senses.ts` with only the fields the three functions need (`type`, `subType`)
- Alternatives considered: Import the type from `lib/dndBeyondCharacterImport.ts`
- Rationale: Importing from the main file creates a coupling that all domain files in `lib/import/` deliberately avoid. TypeScript structural typing means the local shape is compatible at all call sites.
- Trade-offs: The `DndBeyondModifier` shape is defined in multiple places. Accepted — this is the established pattern; the fields needed are stable.

### Decision 3: `collectModifierSubtypeSet` local interface

- Chosen: The `collectModifierSubtypeSet` function in `dndBeyond-utils.ts` uses the same minimal local `DndBeyondModifier` interface already present in that file (fields: `type`, `subType`)
- Rationale: Consistent with the existing `dndBeyond-utils.ts` interface pattern; `collectModifierSubtypeSet` only reads `type` and `subType`.

### Decision 4: Public vs. private API of the new module

- Chosen: Export `normalizeSavingThrows`, `normalizeSkills`, `normalizeSenses`; keep `collectSenseModifiers`, `normalizeSkillName`, `denormalizeSkillSubtype`, `normalizeSenseKey` unexported
- Rationale: Only the three normalizers are called from `dndBeyondCharacterImport.ts`. The helpers are implementation details of those functions.
- Trade-offs: None — narrowing the public API reduces coupling.

### Decision 5: Import path in the updated main file

- Chosen: `import { normalizeSavingThrows, normalizeSkills, normalizeSenses } from "./import/dndBeyond-skills-senses"`
- Rationale: Consistent with existing patterns: `import { normalizeClasses, normalizeRace } from "./import/dndBeyond-classes"` and `import { normalizeImmunities, normalizeByModifierType, normalizeLanguages } from "./import/dndBeyond-defenses"`.

## Proposal to Design Mapping

| Proposal element | Design decision |
|-----------------|----------------|
| `collectModifierSubtypeSet` → `dndBeyond-utils.ts` | Decision 1 |
| New file `lib/import/dndBeyond-skills-senses.ts` | Decisions 2, 4, 5 |
| No import from `lib/dndBeyondCharacterImport.ts` | Decision 2 (local interface) |
| Three functions exported, imported back | Decision 5 |
| Six helpers: four private, one to utils, one private | Decisions 1, 4 |

## Functional Requirements Mapping

- Requirement: `normalizeSavingThrows` returns a `Partial<Record<keyof AbilityScores, number>>` with each ability's saving throw modifier, including proficiency bonus for proficient saves and any flat bonuses
  - Design element: Pure copy-extract; `collectModifierSubtypeSet` imported from `dndBeyond-utils.ts`, `sumModifierBonusesBySubtype` imported from `dndBeyond-utils.ts`, `getAbilityModifier` from `utils.ts`, `ABILITY_KEYS` from `utils.ts`
  - Acceptance criteria reference: Existing character import tests pass
  - Testability notes: Covered by existing tests

- Requirement: `normalizeSkills` returns a `Record<string, number>` for all 18 skills, applying expertise (×2 proficiency), proficiency (×1), and flat bonuses
  - Design element: Pure copy-extract; `collectModifierSubtypeSet` from `dndBeyond-utils.ts`, `sumModifierBonusesBySubtype` from `dndBeyond-utils.ts`, `SKILL_ABILITY_MAP` from `characterReference.ts`
  - Acceptance criteria reference: Existing character import tests pass
  - Testability notes: Covered by existing tests

- Requirement: `normalizeSenses` returns a `Record<string, string>` with sense ranges and passive scores
  - Design element: Pure copy-extract; `collectSenseModifiers` (module-private), `PASSIVE_SENSE_SKILLS` from `characterReference.ts`, `getAbilityModifier` from `utils.ts`
  - Acceptance criteria reference: Existing character import tests pass
  - Testability notes: Covered by existing tests

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: No behavior change at runtime
  - Design element: Pure copy-extract with no logic modifications
  - Acceptance criteria reference: All existing tests pass
  - Testability notes: Run `npm test` — zero diff in test results expected

- Requirement category: operability
  - Requirement: No circular dependency introduced
  - Design element: Local `DndBeyondModifier` interface; imports only from `lib/import/utils.ts`, `lib/import/dndBeyond-utils.ts`, and `lib/characterReference.ts`
  - Acceptance criteria reference: TypeScript compilation succeeds
  - Testability notes: `tsc --noEmit` passes

## Risks / Trade-offs

- Risk: Local `DndBeyondModifier` interface drift if the canonical type gains new required fields
  - Impact: Compile error in `dndBeyond-skills-senses.ts` if call sites change
  - Mitigation: The three functions use only `type` and `subType` — a narrow, stable subset. The local interface can be updated if the canonical type evolves.

## Rollback / Mitigation

- Rollback trigger: CI failure (type error, test failure, lint error)
- Rollback steps: Revert the new file, revert additions to `dndBeyond-utils.ts`, and revert the import changes in `dndBeyondCharacterImport.ts`
- Data migration considerations: None — purely structural
- Verification after rollback: `npm test` passes on main branch

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing check before proceeding.
- If security checks fail: Do not merge. Not expected for a structural refactor with no new dependencies.
- If required reviews are blocked/stale: Ping reviewer after 24 hours; escalate to maintainer after 48 hours.
- Escalation path and timeout: Tag @dougis after 48 hours of no review activity.

## Open Questions

No open questions. Design is fully determined by established patterns in the codebase.
