## Why

Imported D&D Beyond characters silently receive incorrect HP and AC values when
they have subclass features or items that use D&D Beyond's `unarmored-armor-class`
and `hit-points-per-level` modifier shapes. Confirmed on a live character
(issue #104): a level 12 Draconic Bloodline Sorcerer imports with at least −5 AC
and −16 HP due to two gaps in the normalization logic.

## What Changes

- **AC normalization** now reads `unarmored-armor-class` modifiers (both `set`
  and `bonus` types) when no armor is equipped, instead of only `armor-class`
  modifiers.
- **HP normalization** now sums `hit-points-per-level` modifiers (multiplied by
  total level) and flat `hit-points` modifiers from all modifier groups.
- The `DndBeyondModifier` interface gains `"set"` as a recognized `type` value
  alongside the existing `"bonus"` and `"set-base"`.
- New test cases cover all affected modifier shapes with realistic fixture data.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dnd-beyond-character-import`: Adding normalization accuracy requirements for
  HP and AC when subclass features or equipped items contribute modifiers via
  `hit-points-per-level`, `hit-points`, and `unarmored-armor-class` subtypes.

## Impact

- **Modified file**: `lib/dndBeyondCharacterImport.ts`
  - `normalizeArmorClass()` and `getArmorBonuses()`
  - `normalizeMaxHp()`
  - `DndBeyondModifier` interface
- **Modified file**: `tests/unit/import/dndBeyondCharacterImport.test.ts` — new
  test cases for the affected modifier shapes
- No API surface changes; no schema changes; no breaking changes.

## Open Questions

None. The modifier shapes and their semantics were confirmed directly from the
D&D Beyond character service API for character 105034644 (Mond Blue). The fix
is fully scoped to `normalizeArmorClass` and `normalizeMaxHp`.
