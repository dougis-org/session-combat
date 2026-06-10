## GitHub Issues

- #378

## Why

- Problem statement: `app/monsters/page.tsx` (651 lines) bundles three components in a single file — `MonstersContent`, `MonsterTemplateCard`, and `MonsterTemplateEditor`. The latter two are private and untested, making the file hard to navigate and the editor component impossible to unit-test in isolation.
- Why now: Issue #378 is an explicit prerequisite for the consolidation work in #379 (merging `MonsterEditor` and `MonsterTemplateEditor`). The extraction must land first.
- Business/user impact: No user-visible change. Improves developer velocity on #379 and reduces the risk of regressions in the monster catalog editor.

## Problem Space

- Current behavior: `MonsterTemplateEditor` (~200 lines) and `MonsterTemplateCard` (~85 lines) live as private functions inside `app/monsters/page.tsx`. Neither has a dedicated test file. The `monstersPage.test.tsx` test lives in `tests/unit/` rather than `tests/unit/components/` (out of convention).
- Desired behavior: Each component has its own file under `app/monsters/`. `MonsterTemplateEditor` has a unit test. The existing page test is co-located with other component tests.
- Constraints: Extraction is pure refactor — no logic changes. The inline `normalizeSpeed` helper inside `MonsterTemplateEditor` must be renamed to `formatSpeedValue` to avoid confusion with the identically-named (but differently-typed) `normalizeSpeed` in `lib/import/transformMonster.ts`.
- Assumptions: `MonsterTemplateCard` is only used by `MonstersContent` inside `page.tsx` (not imported elsewhere). `MonsterTemplateEditor` is likewise only used in `page.tsx`.
- Edge cases considered: The two `normalizeSpeed` functions are NOT equivalent and cannot be merged — the import pipeline version is typed to `Open5ECreature["speed"]`; the editor version accepts `unknown` to handle already-stored strings and legacy object-shaped data.

## Scope

### In Scope

- Extract `MonsterTemplateEditor` → `app/monsters/MonsterTemplateEditor.tsx` (named export)
- Extract `MonsterTemplateCard` → `app/monsters/MonsterTemplateCard.tsx` (named export)
- Rename inline `normalizeSpeed` helper to `formatSpeedValue` inside `MonsterTemplateEditor.tsx`
- Add `tests/unit/components/MonsterTemplateEditor.test.tsx`
- Move `tests/unit/monstersPage.test.tsx` → `tests/unit/components/MonstersPage.test.tsx`

### Out of Scope

- Any logic changes to `MonsterTemplateEditor` or `MonsterTemplateCard`
- Consolidation of `MonsterEditor` and `MonsterTemplateEditor` (that is #379)
- Changes to `lib/import/transformMonster.ts`
- Deduplication of the two `normalizeSpeed` / `formatSpeedValue` implementations

## What Changes

- New file: `app/monsters/MonsterTemplateEditor.tsx` — extracted from `page.tsx`, inline helper renamed
- New file: `app/monsters/MonsterTemplateCard.tsx` — extracted from `page.tsx`
- Modified: `app/monsters/page.tsx` — imports two new components, private definitions removed (~285 lines removed)
- New file: `tests/unit/components/MonsterTemplateEditor.test.tsx`
- Moved: `tests/unit/monstersPage.test.tsx` → `tests/unit/components/MonstersPage.test.tsx`

## Risks

- Risk: Import update in `page.tsx` misses a usage site
  - Impact: Build failure (TypeScript will catch it)
  - Mitigation: Run `tsc --noEmit` and full test suite after extraction
- Risk: Test move breaks Jest path resolution
  - Impact: `monstersPage` tests stop running
  - Mitigation: Verify test count before/after; check `jest.config.js` `testMatch` patterns

## Open Questions

No unresolved ambiguity. Decisions confirmed during exploration:
- Both `MonsterTemplateCard` and `MonsterTemplateEditor` extract to their own files (repo convention, and `MonsterTemplateCard` is used by the page, not by the editor).
- The inline `normalizeSpeed` is renamed to `formatSpeedValue` — the two functions are not equivalent and will not be merged.
- Test is added for `MonsterTemplateEditor`; page test is moved to `tests/unit/components/`.

## Non-Goals

- Improving the UX or logic of the monster catalog editor
- Addressing #379 consolidation work
- Adding tests for `MonsterTemplateCard` (it is pure display with no async/validation logic; covered indirectly by page tests)

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
