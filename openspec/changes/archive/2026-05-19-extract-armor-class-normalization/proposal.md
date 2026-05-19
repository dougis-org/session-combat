## GitHub Issues

- #155
- Part of series: #150–159

## Why

- **Problem statement**: `lib/dndBeyondCharacterImport.ts` has armor class normalization mixed with other normalizers. This makes it hard to isolate, test, and reuse when adding support for new providers (Open5E, etc.).

- **Why now**: The refactor series (issues 150–159) is systematically extracting normalizers into focused modules, separating generic D&D 5e logic from provider-specific data mapping. Issue 155 completes the armor class domain extraction, clearing the path for additional providers to plug in their own adapters without duplicating generic AC logic.

- **Business/user impact**: Multi-provider support is blocked until normalizers are extracted. Enables future integrations (Open5E, d20srd, etc.) with zero duplication of generic D&D rules and clearer architecture for each provider's data mapping.

## Problem Space

- **Current behavior**: Four functions tightly coupled in `dndBeyondCharacterImport.ts`:
  - `normalizeArmorClass()` — orchestrator (knows DnD Beyond inventory structure)
  - `getArmorBonuses()` — filters DnD Beyond modifier.subType values
  - `getUnarmoredAcBonus()` — filters DnD Beyond "unarmored-armor-class" modifiers
  - `getArmorDexterityContribution()` — generic D&D rule (capping dex by armor type) mixed with provider-specific armor type ID mapping
  
  Plus constant: `ARMOR_TYPE_MAX_DEX_MODIFIER` (DnD Beyond-specific armor type IDs).

- **Desired behavior**: 
  - Generic D&D 5e logic in `lib/import/armor-class.ts` (reusable by all providers): "cap dexterity bonus by armor's max modifier"
  - DnD Beyond-specific adapter in `lib/import/dndBeyond-armor-class.ts`: knows how to map DnD Beyond data structures to generic AC calculation
  - Each future provider (Open5E, etc.) implements its own adapter using the same generic foundation

- **Constraints**:
  - All existing tests must continue to pass
  - DnD Beyond-specific knowledge (modifier subtypes, armor type ID mappings) must not leak into generic utilities
  - Generic utilities should be domain-specific (armor-class utilities separate from general utils to prevent "god class" in lib/import/utils.ts)

- **Assumptions**:
  - Multi-provider architecture is the intended design for the refactor series
  - Future providers will have different data structures and modifier naming schemes
  - Generic armor class logic is a pure D&D 5e rule with no provider variation

- **Edge cases considered**:
  - Null/undefined inventory — handled gracefully as unarmored AC calculation
  - Missing armor definition or armorClass property — falls back to unarmored calculation
  - Modifiers with invalid/missing values — `getModifierNumericValue()` returns null/0
  - No equipped armor — uses unarmored AC formula (10 + dex + unarmored bonus + modifiers)
  - Heavy armor with 0 max dex modifier (armorTypeId=3) — dex contribution correctly capped to 0

## Scope

### In Scope

- Create `lib/import/armor-class.ts` with:
  - `capDexterityByArmorType(dexMod, maxDexMod): number` — generic D&D rule, reusable by all providers
  
- Create `lib/import/dndBeyond-armor-class.ts` with:
  - `normalizeArmorClass()` — orchestrator, takes DnD Beyond-specific inputs
  - `getArmorBonuses()` — filters DnD Beyond modifier.subType="armor-class"
  - `getUnarmoredAcBonus()` — filters DnD Beyond modifier.subType="unarmored-armor-class"
  - Private `getArmorDexterityContribution()` — maps armor type IDs to max dex, calls generic function
  - Constant: `DNDEBEYOND_ARMOR_TYPE_MAX_DEX_MODIFIER` (renamed from ARMOR_TYPE_MAX_DEX_MODIFIER for clarity)

- Update `lib/dndBeyondCharacterImport.ts`:
  - Remove four extracted functions and constant
  - Import `normalizeArmorClass` from `./import/dndBeyond-armor-class`
  - Update call site (line 257) to use imported function

- Create comprehensive tests:
  - `tests/unit/import/armor-class.test.ts` — generic armor class logic
  - `tests/unit/import/dndBeyond-armor-class.test.ts` — DnD Beyond-specific integration tests

### Out of Scope

- Changes to other normalizers (skills, senses, defenses, ability scores)
- Moving `lib/dndBeyondCharacterImport.ts` into `lib/import/`
- Changes to server-side `lib/server/dndBeyondCharacterImport.ts`
- Open5E or other provider adapters (those come after this foundation)
- Test file reorganization beyond armor class tests

## What Changes

1. **`lib/import/armor-class.ts`** (new file):
   - Export `capDexterityByArmorType(dexterityModifier: number, maxDexterityModifier?: number | null): number`
   - Pure D&D 5e rule: returns `Math.min(dexterityModifier, maxDexterityModifier)` or dex if no max
   - Zero dependencies on provider-specific types

2. **`lib/import/dndBeyond-armor-class.ts`** (new file):
   - Export `normalizeArmorClass(inventory, abilityScores, modifiers): number`
   - Export `getArmorBonuses(modifiers): number`
   - Export `getUnarmoredAcBonus(modifiers): number`
   - Private `getArmorDexterityContribution(dexMod, armorTypeId): number`
   - Export constant: `DNDEBEYOND_ARMOR_TYPE_MAX_DEX_MODIFIER` (maps DnD Beyond armor type IDs to max dex)
   - Imports: `capDexterityByArmorType` from `./armor-class`, types and utils from existing modules

3. **`lib/dndBeyondCharacterImport.ts`**:
   - Remove: `normalizeArmorClass()`, `getArmorBonuses()`, `getUnarmoredAcBonus()`, `getArmorDexterityContribution()`
   - Remove: `ARMOR_TYPE_MAX_DEX_MODIFIER` constant
   - Add import: `import { normalizeArmorClass } from "./import/dndBeyond-armor-class"`
   - Call site unchanged (line 257): `ac: normalizeArmorClass(data.inventory, abilityScores, modifiers)`

4. **`tests/unit/import/armor-class.test.ts`** (new file):
   - Test `capDexterityByArmorType()` with various dex/max combinations
   - Edge cases: no max modifier, max=0, negative dex, etc.

5. **`tests/unit/import/dndBeyond-armor-class.test.ts`** (new file):
   - Test `normalizeArmorClass()` with equipped armor, unarmored, with/without bonuses
   - Test `getArmorBonuses()` filtering and summation
   - Test `getUnarmoredAcBonus()` set vs bonus logic
   - Edge cases: null inventory, missing armor definition, invalid modifiers

## Risks

- **Risk**: Tests fail due to import path changes or missing test coverage
  - **Impact**: Refactor halts; existing functionality broken
  - **Mitigation**: Run full test suite after extraction; verify all dndBeyond import tests pass

- **Risk**: Generic `capDexterityByArmorType()` logic is incorrect or incomplete
  - **Impact**: Open5E adapter discovers incompatibilities; refactoring required
  - **Mitigation**: Comprehensive test coverage for generic function; code review verifying pure D&D logic

- **Risk**: DnD Beyond-specific knowledge leaks into generic utility
  - **Impact**: Future providers can't reuse generic function without DnD Beyond assumptions
  - **Mitigation**: Code review focusing on type signatures and parameter names (no DnD Beyond type names in generic module)

- **Risk**: Import cycles if generic armor-class.ts imports from dndBeyond-utils
  - **Impact**: Build failure or unexpected runtime behavior
  - **Mitigation**: Verify armor-class.ts has zero provider-specific dependencies before merging

## Open Questions

- None. Architectural split, scope, constraints, and implementation sequence are fully defined.

## Non-Goals

- Performance optimization of AC calculation
- Expanding armor coverage beyond D&D 5e definitions
- Supporting non-D&D game systems

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
