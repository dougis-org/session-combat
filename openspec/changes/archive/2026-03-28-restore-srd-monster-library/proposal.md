## Why

The "Import SRD Monsters" admin action imports 0 monsters and the Global Monster Library is empty for all users (GitHub issue #102). This is caused by `lib/data/monsters/index.ts` exporting an empty array — the 14 category files containing 334 SRD monsters were deleted in commit `064c546` as a workaround for TypeScript type errors, and that workaround was never resolved.

## What Changes

- **Restore 14 monster category files** recovered from git history (`1743fd4`), transformed to match the current `MonsterTemplate` type
- **Re-enable imports** in `lib/data/monsters/index.ts` so `ALL_SRD_MONSTERS` exports all 334 monsters
- **Add regression test** (`tests/unit/monsterLibrary.test.ts`) that validates the library is non-empty and every monster conforms to `MonsterTemplate` shape
- **Delete one-time transformation script** after use

## Capabilities

### New Capabilities
- `srd-monster-library-integrity`: Validates that the SRD monster library is non-empty and all entries conform to the `MonsterTemplate` type contract (shape, required fields, no forbidden extra fields)

### Modified Capabilities
- None — existing monster library spec behavior is unchanged; the feature was always meant to return 334 monsters

## Impact

- **`lib/data/monsters/index.ts`**: Re-enabled, exports `ALL_SRD_MONSTERS` with 334 entries
- **`lib/data/monsters/aberrations.ts` through `undead.ts`** (14 files): Restored and transformed
- **`app/api/monsters/global/route.ts`** (PUT handler): Now seeds real data; no code changes needed
- **`tests/unit/monsterLibrary.test.ts`**: New test file
- **No API contract changes**, no DB schema changes, no breaking changes

## Problem Space

### In Scope
- Restoring the 14 deleted category files with correct types
- Writing and running a one-time transformation script to fix field mismatches
- Adding a unit test to guard against the empty-array regression

### Out of Scope
- Adding more than the 334 SRD monsters already in git history
- Changing the MonsterTemplate type or the seeding API endpoint
- Fixing the monsters page display or any UI issues beyond what the data fix resolves

## Risks

- **Transformation correctness**: The senses and speed transformations parse string/object formats; edge cases (e.g. `"blindsight 30 ft. (blind beyond this radius)"`) must be handled without truncation
- **TypeScript strict mode**: Restored files must compile cleanly with no `any` casts or type suppressions
- **Test suite impact**: Existing tests must continue to pass; the new test file must not conflict with existing test infrastructure

## Open Questions

No unresolved ambiguity. All transformation rules are fully defined from the git history analysis:
- Speed keys: `walk`, `swim`, `fly`, `climb`, `burrow`, `speed` (6 variants, all confirmed)
- Sense types: `blindsight`, `darkvision`, `passive_perception`, `tremorsense`, `truesight` (5 types, exhaustive)
- Saving throw abbreviations: `str`, `dex`, `con`, `int`, `wis`, `cha` (all 6 confirmed)

## Non-Goals

- Sourcing additional SRD monsters beyond the 334 already in git history
- Modifying the admin UI for the import action
- Changing how global monsters are displayed to non-admin users

---
*If scope changes after approval, proposal, design, specs, and tasks must be updated before apply proceeds.*
