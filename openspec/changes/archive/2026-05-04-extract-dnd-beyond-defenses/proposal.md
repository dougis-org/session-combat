## GitHub Issues

- #152

## Why

- Problem statement: `lib/dndBeyondCharacterImport.ts` contains defenses-related normalizers (`normalizeImmunities`, `normalizeByModifierType`, `normalizeLanguages`) that belong in the domain-specific `lib/import/` layer alongside the other extracted modules.
- Why now: Issue 173 (PR #174) has been merged, placing the shared helpers (`dedupeStrings`, `titleize`, `isDamageTypeModifier`) in `lib/import/utils.ts`. The blocker is gone; this is the next logical step in the 150–159 extraction series.
- Business/user impact: No user-visible behavior change. This is a structural refactor that reduces the size and coupling of `dndBeyondCharacterImport.ts`, making the codebase easier to navigate and future adapters easier to add.

## Problem Space

- Current behavior: `normalizeImmunities`, `normalizeByModifierType`, and `normalizeLanguages` live as private functions inside `lib/dndBeyondCharacterImport.ts`.
- Desired behavior: These functions are extracted to `lib/import/dndBeyond-defenses.ts` and imported back into the original file; behavior is identical.
- Constraints: The new file must not import from `lib/dndBeyondCharacterImport.ts` to avoid circular dependencies. The `DndBeyondModifier` type must be handled via a local interface (consistent with `dndBeyond-ability-scores.ts` and `dndBeyond-utils.ts`).
- Assumptions: Issue 173 is complete and `lib/import/utils.ts` exports `dedupeStrings`, `titleize`, and `isDamageTypeModifier`. (Confirmed.)
- Edge cases considered: `normalizeImmunities` splits immunity modifiers into `damageImmunities` vs `conditionImmunities` using `isDamageTypeModifier` — this logic must be preserved exactly.

## Scope

### In Scope

- Create `lib/import/dndBeyond-defenses.ts` exporting `normalizeImmunities`, `normalizeByModifierType`, `normalizeLanguages`
- Import those three functions in `lib/dndBeyondCharacterImport.ts` and remove the local definitions
- Add a local `DndBeyondModifier` interface to the new file (minimal shape: `type`, `subType`, `friendlySubtypeName`)

### Out of Scope

- Any other extraction from `lib/dndBeyondCharacterImport.ts`
- Moving `lib/dndBeyondCharacterImport.ts` into `lib/import/`
- Changes to `lib/server/dndBeyondCharacterImport.ts`
- Modifying existing test files

## What Changes

- **New file**: `lib/import/dndBeyond-defenses.ts` — exports `normalizeImmunities`, `normalizeByModifierType`, `normalizeLanguages`
- **Modified file**: `lib/dndBeyondCharacterImport.ts` — removes the three function definitions, adds an import from `./import/dndBeyond-defenses`

## Risks

- Risk: Circular dependency if the new file imports from `lib/dndBeyondCharacterImport.ts`
  - Impact: Build failure
  - Mitigation: Use a local `DndBeyondModifier` interface; import only from `lib/import/utils.ts`

- Risk: Behavior divergence if `normalizeImmunities` split logic is subtly altered
  - Impact: Incorrect immunities/conditions on imported characters
  - Mitigation: Pure copy-extract with no logic changes; existing tests verify output

## Open Questions

No unresolved ambiguity. All helper dependencies are confirmed present in `lib/import/utils.ts` post-issue-173, and the `DndBeyondModifier` local-interface pattern is established by prior extractions.

## Non-Goals

- Improving or changing the logic of the extracted functions
- Adding new test coverage beyond what already exists
- Reorganizing the broader `lib/import/` module structure

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
