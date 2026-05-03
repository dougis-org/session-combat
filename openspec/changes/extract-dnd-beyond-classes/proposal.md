## GitHub Issues

- #151

## Why

- Problem statement: `lib/dndBeyondCharacterImport.ts` is 880 lines after issue 150 extraction. Class and race normalization is a self-contained domain (3 tightly-coupled functions) that should live in its own module.
- Why now: This is the second extraction in the series (issues 150–159). Issue 150 established the `lib/import/` foundation; this extraction uses it. Subsequent extractions (152–159) do not depend on this specific extraction.
- Business/user impact: No user-visible change. Improved maintainability — each module has a single responsibility, making future changes easier to reason about.

## Problem Space

- Current behavior: `normalizeClasses()`, `normalizeClassEntry()`, and `normalizeRace()` are defined locally in `lib/dndBeyondCharacterImport.ts` (lines 411–567). They validate and normalize DnD Beyond class and race data against `VALID_CLASSES` and `VALID_RACES` from `lib/types.ts`.
- Desired behavior: These three functions live in `lib/import/dndBeyond-classes.ts`, importing shared helpers from `lib/import/dndBeyond-utils.ts`. The original file imports from the new module.
- Constraints: Must be a pure no-op refactor. No logic may change. All existing tests must pass without modification.
- Assumptions: `normalizeClasses` uses `isPresent` (from `dndBeyond-utils.ts`), `VALID_CLASSES`, `VALID_RACES` (from `lib/types.ts`), and `createValidationError` (local to original file, but could come from `dndBeyond-utils.ts`).

## Scope

### In Scope

- Create `lib/import/dndBeyond-classes.ts` with `normalizeClasses()`, `normalizeClassEntry()`, `normalizeRace()`
- Import `isPresent` from `lib/import/dndBeyond-utils.ts`
- Import `VALID_CLASSES`, `VALID_RACES`, `DnDClass`, `DnDRace`, `CharacterClass` from `lib/types.ts`
- Import `createValidationError` (either from existing `dndBeyond-utils.ts` or define locally)
- Update `lib/dndBeyondCharacterImport.ts` to import from the new module
- Update `lib/server/dndBeyondCharacterImport.ts` if needed (should not be needed — imports public API only)

### Out of Scope

- Extracting any other normalizer functions (issues 152–159)
- Moving `lib/dndBeyondCharacterImport.ts` itself into `lib/import/`
- Modifying test files
- Changing function signatures or behavior

## What Changes

- `lib/import/dndBeyond-classes.ts` — new file; three class/race normalizer functions
- `lib/dndBeyondCharacterImport.ts` — updated imports; internal call sites now use imports from `dndBeyond-classes.ts`

## Risks

- Risk: `createValidationError` is defined locally in the original file and imported into the new module, creating a cross-file dependency.
  - Impact: The new module depends on the original file for this error factory.
  - Mitigation: Check if `createValidationError` already exists in `dndBeyond-utils.ts`. If not, extract it there first as part of this change.
- Risk: `normalizeRace` uses the `warnings` parameter to emit user-facing messages.
  - Impact: The warning accumulation pattern is delegated to the caller.
  - Mitigation: Keep the parameter — it's an intentional interface choice. The caller (`normalizeCharacterDetails`) passes its own `warnings` array.

## Open Questions

- Should `createValidationError` be moved to `dndBeyond-utils.ts` as part of this extraction, or left in the original file?

## Non-Goals

- Reducing the public API surface of `lib/dndBeyondCharacterImport.ts`
- Performance improvements
- Adding new test coverage beyond what already exists
- Establishing an index/barrel file for `lib/import/`

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
