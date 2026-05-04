## GitHub Issues

- #173

## Why

- Problem statement: `lib/dndBeyondCharacterImport.ts` contains 5 generic helper functions (`dedupeStrings`, `titleize`, `DAMAGE_TYPE_NAMES`, `isDamageTypeModifier`, `normalizeModifierCategory`) that should live in `lib/import/utils.ts` alongside the generic math helpers established in issue 150. Future domain extractions (issues 152–155, 159) depend on these helpers.
- Why now: The defenses extraction (issue 152) and subsequent domain extractions cannot proceed cleanly without these helpers accessible from `utils.ts`. Moving them prevents two-way coupling between the original file and new extraction modules.
- Business/user impact: No user-visible change. Pure structural refactor enabling subsequent extractions.

## Problem Space

- Current behavior: `dedupeStrings`, `titleize`, `DAMAGE_TYPE_NAMES`, `isDamageTypeModifier`, and `normalizeModifierCategory` are defined locally in `lib/dndBeyondCharacterImport.ts` (lines 52–66, 606–614, 756–764). They are used by 5+ normalization functions within the same file.
- Desired behavior: These 5 helpers live in `lib/import/utils.ts` alongside `getAbilityModifier` and `getProficiencyBonus`. `lib/dndBeyondCharacterImport.ts` imports them from `utils.ts`. Future modules (e.g., `dndBeyond-defenses.ts`) can import them without coupling to the original file.
- Constraints: This is a pure no-op refactor. No logic changes. All existing tests must pass unchanged. No new test files.
- Assumptions: `DAMAGE_TYPE_NAMES` contains canonical D&D damage types (acid, bludgeoning, cold, fire, force, lightning, necrotic, piercing, poison, psychic, radiant, slashing, thunder) that are provider-agnostic. Any future API provider (Open5E, etc.) will return the same damage type names.
- Edge cases considered: `isDamageTypeModifier` checks both `subType` and `friendlySubtypeName` fields. `dedupeStrings` filters falsy values. `titleize` handles hyphenated strings like "half-elf" → "Half Elf". All edge cases are preserved exactly.

## Scope

### In Scope

Move to `lib/import/utils.ts`:
- `dedupeStrings(values: string[]): string[]` — deduplicates string array, filters falsy
- `titleize(value: string): string` — formats hyphenated/underscored strings to Title Case
- `DAMAGE_TYPE_NAMES: readonly Set<string>` — canonical D&D damage type names
- `isDamageTypeModifier(modifier: DndBeyondModifier): boolean` — checks if modifier is a damage type
- `normalizeModifierCategory(value: string): string` — normalizes modifier strings to lowercase, hyphens to spaces

Update `lib/dndBeyondCharacterImport.ts` to import these from `./import/utils`.

### Out of Scope

- Any domain extraction (defenses, skills, armor class, actions, traits, alignment/identity)
- Moving `lib/dndBeyondCharacterImport.ts` into `lib/import/`
- Any changes to `lib/server/dndBeyondCharacterImport.ts`
- Modifying test files
- Changing function signatures or behavior

## What Changes

- `lib/import/utils.ts` — add 5 helper functions/constants; grows from 2 to 7 exports
- `lib/dndBeyondCharacterImport.ts` — removes local definitions; imports from `./import/utils`

## Risks

- Risk: Import path errors break `lib/server/dndBeyondCharacterImport.ts` or other consumers.
  - Impact: Build failure or runtime error in server-side character import.
  - Mitigation: TypeScript compilation (`tsc --noEmit`) catches missing imports. Run before commit.
- Risk: `DAMAGE_TYPE_NAMES` is duplicated rather than moved, leaving stale copy in original.
  - Impact: Future edits to wrong copy cause silent divergence.
  - Mitigation: After move, original file must NOT define these — only import them.
- Risk: Circular import introduced via `utils.ts` → `types.ts` or similar.
  - Impact: Build failure.
  - Mitigation: `utils.ts` has no imports currently; dependency direction is strictly one-way.

## Open Questions

- No unresolved ambiguity. The 5 helpers to move are clearly identified, their usage is traceable, and the target location (`lib/import/utils.ts`) is confirmed appropriate for generic import utilities.

## Non-Goals

- Reducing the public API surface of `lib/dndBeyondCharacterImport.ts`
- Moving any domain normalizers (defenses, skills, etc.)
- Performance improvements
- Adding new test coverage

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.