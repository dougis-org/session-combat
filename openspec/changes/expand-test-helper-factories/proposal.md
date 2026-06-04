## GitHub Issues

- #171

## Why

- Problem statement: Test helper files are misnamed and misaligned — `importTestHelpers.ts` is entirely Open5E-specific despite its generic name, `testFactories.ts` is 5 lines of re-exports with no utility, and raw DnD Beyond API shapes are duplicated inline across 7+ test files with no shared factories.
- Why now: Issue #171 is open and the import test suite is growing. Adding more import sources (Roll20, etc.) without this structure will compound the duplication.
- Business/user impact: Developer velocity — every new import test file currently requires manually duplicating ability score objects and modifier arrays. The rename also prevents future contributors from adding Open5E-specific code to what they reasonably believe is a generic helper.

## Problem Space

- Current behavior: `importTestHelpers.ts` exports only Open5E shapes (`Open5ECreature`, `Open5ESpell`, mock fetch). `dndBeyondImport.ts` exports normalized 5e character factories but lives next to the wrong abstraction. `dndBeyond-armor-class.test.ts` defines `MockDndBeyondModifier[]` inline 7+ times. Six test files independently define inline `baseAbilityScores` objects.
- Desired behavior: Each helper file has a clear, scoped purpose. Generic 5e character shapes live in one central file reusable by any future importer. Source-specific raw shapes (DnD Beyond modifier format) live in a source-specific file.
- Constraints: All existing tests must continue to pass. Import paths in test files must be updated to reflect renames.
- Assumptions: Roll20 and future importers will normalize to the same `AbilityScores` / `CharacterClass` / `ImportedCharacterDraft` shapes already defined in `lib/types.ts`.
- Edge cases considered: `createImportedCharacterDraft` in `dndBeyondImport.ts` creates the normalized output shape (not raw DnD Beyond shape) — it belongs in the central character helper, not the DnD Beyond-specific one.

## Scope

### In Scope

- Rename `tests/helpers/importTestHelpers.ts` → `tests/helpers/open5eTestHelpers.ts`
- Create `tests/helpers/characterTestHelpers.ts` with generic 5e factories: `createAbilityScores`, `createClassEntry`, `createCharacterData` (moved from `dndBeyondImport.ts`)
- Create `tests/helpers/dndBeyondTestHelpers.ts` with raw DnD Beyond API factories: `createModifier`, `createModifierList`
- Update `tests/unit/import/testFactories.ts` to re-export from all three helpers
- Update all import paths in test files affected by the rename
- Replace inline `baseAbilityScores` and `MockDndBeyondModifier[]` duplications with factory calls
- Add scope-defining header comments to each helper file
- Write an ADR documenting the test helper layering decision

### Out of Scope

- Changes to production (`lib/`) code
- Changes to integration or e2e tests (unless they import from renamed helpers)
- Adding factories for shapes not currently duplicated
- Migrating fixture files (`tests/fixtures/`)

## What Changes

- `tests/helpers/importTestHelpers.ts` → renamed to `tests/helpers/open5eTestHelpers.ts` (content unchanged)
- `tests/helpers/characterTestHelpers.ts` → new file, generic 5e character shape factories
- `tests/helpers/dndBeyondTestHelpers.ts` → new file, raw DnD Beyond API shape factories
- `tests/unit/import/testFactories.ts` → updated to re-export from all three helpers
- `tests/helpers/dndBeyondImport.ts` → `createImportedCharacterDraft` moved out; remaining exports stay
- ~6 unit test files → import paths updated, inline duplications replaced with factory calls
- `openspec/specs/adr-test-helper-layers.md` → new ADR documenting the decision

## Risks

- Risk: Import path updates miss a file
  - Impact: Compile error or broken test suite
  - Mitigation: Run `tsc --noEmit` and full unit test suite after each rename step

- Risk: `createCharacterData` (moved from `createImportedCharacterDraft`) behaves differently if defaults drift
  - Impact: Tests relying on specific default values silently change behavior
  - Mitigation: Move the function body verbatim; no logic changes during this refactor

## Open Questions

No unresolved ambiguity. Architectural direction was confirmed during exploration: DnD Beyond-specific raw shapes go in `dndBeyondTestHelpers.ts`; generic normalized 5e shapes go in `characterTestHelpers.ts`; Open5E-specific helpers go in `open5eTestHelpers.ts`.

## Non-Goals

- Introducing test factories for every possible shape — only the duplicated patterns
- Abstracting the fixture files (`tests/fixtures/dndBeyondCharacter.ts`)
- Changing any production code or import logic

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
