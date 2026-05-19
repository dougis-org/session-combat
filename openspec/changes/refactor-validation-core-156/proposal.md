## GitHub Issues

- #156

## Why

- Problem statement: Validation helper functions in `lib/validation/monsterUpload.ts` are private and buried in a feature-specific file, making them inaccessible to other parts of the system. As character import, spell import, creation flows, and other features are added, these validators will be duplicated or go unused.
- Why now: A second import feature (character import) is in flight. Establishing shared validation infrastructure before duplication occurs is lower cost than consolidating later.
- Business/user impact: Centralised validators reduce defect surface — a fix to `validateString` in one place propagates to all consumers rather than requiring parallel fixes across files.

## Problem Space

- Current behavior: `lib/validation/monsterUpload.ts` contains 10 private helper functions (lines 84–415) including generic type validators (`validateString`, `validateNumber`, etc.) and D&D-domain validators (`validateAbilityScores`, `validateAbility`). `validateStringNumberRecord` is unused dead code. `validateString` does not trim whitespace before checking `minLength`.
- Desired behavior: Generic validators live in `lib/validation/core.ts` (reusable anywhere). D&D-domain validators live in `lib/validation/dnd.ts` (reusable across monster, character, NPC, spell flows). `monsterUpload.ts` imports from both and contains only monster-specific logic.
- Constraints: No behaviour changes to existing validation logic (except the `validateString` trim fix). All existing monster-upload tests must continue to pass without modification.
- Assumptions: The trim fix (strip leading/trailing whitespace before `minLength` check) is a bug fix, not a breaking change — no existing tests assert that leading/trailing whitespace causes a length failure.
- Edge cases considered: `validateString` trim fix must only strip leading/trailing whitespace, not collapse interior spaces. Cross-field validation (`hp ≤ maxHp`), enum checks (`size`), and integer checks (`legendaryActionCount`) have no generic helper equivalent and remain inline in `validateMonsterData`.

## Scope

### In Scope

- Create `lib/validation/core.ts` — export `ValidationError`, `ValidationResult`, and six generic validators
- Create `lib/validation/dnd.ts` — export three D&D-domain validators
- Fix `validateString` to trim before length check (leading/trailing only)
- Delete `validateStringNumberRecord` (unused)
- Refactor `monsterUpload.ts` to import from new files and use helpers for inline scalar checks where appropriate
- Add `tests/unit/validation/core.test.ts` — unit tests per validator
- Add `tests/unit/validation/dnd.test.ts` — unit tests for D&D validators

### Out of Scope

- Migrating any existing character/spell import code to use the new validators
- Adding new validation logic not already present in `monsterUpload.ts`
- Changing `validateMonsterUploadDocument` or `transformMonsterData`
- Changes to `lib/validation/password.ts`

## What Changes

- `lib/validation/core.ts` created (new file)
- `lib/validation/dnd.ts` created (new file)
- `lib/validation/monsterUpload.ts` trimmed: private helper functions removed, imports added, `validateMonsterData` inline checks refactored to use helpers
- `tests/unit/validation/core.test.ts` created (new file)
- `tests/unit/validation/dnd.test.ts` created (new file)
- `validateStringNumberRecord` deleted

## Risks

- Risk: `validateString` trim fix changes validation behaviour
  - Impact: Strings that previously failed minLength due to whitespace padding would now pass
  - Mitigation: Search existing tests and fixture data for whitespace-padded strings; confirm no test relies on the pre-trim behaviour

- Risk: Re-export path changes break a consumer not yet identified
  - Impact: Compile error in a file importing directly from `monsterUpload.ts` for types that move
  - Mitigation: `ValidationError` and `ValidationResult` are re-exported from `monsterUpload.ts` or TypeScript path aliases catch it at compile time; grep for all import sites before cutting over

## Open Questions

No unresolved ambiguity remains. Scope, naming, and structure were confirmed during explore session on 2026-05-19.

## Non-Goals

- Building a full validation framework (zod, yup, etc.) — these are lightweight hand-rolled helpers
- Validator composition or pipelines
- Runtime schema validation for API responses

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
