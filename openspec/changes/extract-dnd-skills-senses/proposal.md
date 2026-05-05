## GitHub Issues

- #153

## Why

- Problem statement: `lib/dndBeyondCharacterImport.ts` contains three proficiency-score normalizers (`normalizeSavingThrows`, `normalizeSkills`, `normalizeSenses`) plus six supporting helpers that belong in the domain-specific `lib/import/` layer alongside the other extracted modules.
- Why now: Issues #150, #173 (and the follow-on fix-import-utility-placement work) are all closed. The shared helpers `dedupeStrings`, `titleize`, `sumModifierBonusesBySubtype`, and `getModifierNumericValue` are already available from `lib/import/utils.ts` and `lib/import/dndBeyond-utils.ts`. The blockers are gone; this is the next step in the 150–159 extraction series.
- Business/user impact: No user-visible behavior change. This is a structural refactor that reduces the size and coupling of `dndBeyondCharacterImport.ts`, making the codebase easier to navigate and future adapters easier to add.

## Problem Space

- Current behavior: `normalizeSavingThrows`, `normalizeSkills`, `normalizeSenses`, and six helpers (`collectModifierSubtypeSet`, `collectSenseModifiers`, `normalizeSkillName`, `denormalizeSkillSubtype`, `normalizeSenseKey`) live as private functions inside `lib/dndBeyondCharacterImport.ts`.
- Desired behavior: These functions are extracted to `lib/import/dndBeyond-skills-senses.ts` and `collectModifierSubtypeSet` is moved to `lib/import/dndBeyond-utils.ts`; the original file imports them back. Behavior is identical.
- Constraints: The new file must not import from `lib/dndBeyondCharacterImport.ts` to avoid circular dependencies. The `DndBeyondModifier` type must be handled via a local interface (consistent with all prior extraction modules).
- Assumptions: Issues #150 and #173 are complete and closed. `lib/import/utils.ts` exports `getAbilityModifier` and `ABILITY_KEYS`. `lib/import/dndBeyond-utils.ts` exports `sumModifierBonusesBySubtype` and `getModifierNumericValue`. (Confirmed.)
- Edge cases considered: `collectModifierSubtypeSet` is called by both `normalizeSkills` and `normalizeSavingThrows`. Moving it to `dndBeyond-utils.ts` ensures both callers can share it without creating a cross-module dependency between the new file and the main file.

## Scope

### In Scope

- Add `collectModifierSubtypeSet` to `lib/import/dndBeyond-utils.ts` as a new export
- Create `lib/import/dndBeyond-skills-senses.ts` exporting `normalizeSavingThrows`, `normalizeSkills`, `normalizeSenses`
- Internal (unexported) helpers in the new file: `collectSenseModifiers`, `normalizeSkillName`, `denormalizeSkillSubtype`, `normalizeSenseKey`
- Import the three public functions and `collectModifierSubtypeSet` in `lib/dndBeyondCharacterImport.ts`; remove all local definitions

### Out of Scope

- Any other extraction from `lib/dndBeyondCharacterImport.ts`
- Moving `lib/dndBeyondCharacterImport.ts` into `lib/import/`
- Changes to `lib/server/dndBeyondCharacterImport.ts`
- Modifying existing test files

## What Changes

- **Modified file**: `lib/import/dndBeyond-utils.ts` — adds `collectModifierSubtypeSet` export
- **New file**: `lib/import/dndBeyond-skills-senses.ts` — exports `normalizeSavingThrows`, `normalizeSkills`, `normalizeSenses`
- **Modified file**: `lib/dndBeyondCharacterImport.ts` — removes nine local function definitions; adds imports from `./import/dndBeyond-utils` (collectModifierSubtypeSet) and `./import/dndBeyond-skills-senses`

## Risks

- Risk: Circular dependency if the new file imports from `lib/dndBeyondCharacterImport.ts`
  - Impact: Build failure
  - Mitigation: Use a local `DndBeyondModifier` interface; import only from `lib/import/utils.ts` and `lib/import/dndBeyond-utils.ts`

- Risk: `collectModifierSubtypeSet` moved to `dndBeyond-utils.ts` causes type mismatch if the local `DndBeyondModifier` shape differs between callers
  - Impact: Compile error
  - Mitigation: The function requires only `type` and `subType` fields — the minimal interface already used by all extraction modules

## Open Questions

No unresolved ambiguity. All helper dependencies are confirmed present in `lib/import/utils.ts` and `lib/import/dndBeyond-utils.ts`, and the local-interface pattern is established by prior extractions.

## Non-Goals

- Improving or changing the logic of the extracted functions
- Adding new test coverage beyond what already exists
- Reorganizing the broader `lib/import/` module structure

## Change Control

If scope changes after approval, update `proposal.md`, `design.md`, `specs/**/*.md`, and `tasks.md` before implementation starts.
