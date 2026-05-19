## Context

This design document translates the proposal into technical decisions and constraints for implementation. It ensures every proposal element (problem, scope, risks) has a corresponding design choice and acceptance criteria.

---

## Architecture

### Module Separation: Generic + Provider-Specific

**Decision**: Split armor class logic into two modules:

1. **Generic D&D 5e utility** (`lib/import/armor-class.ts`)
   - Contains pure D&D 5e rules independent of any provider
   - Single function: `capDexterityByArmorType(dexMod, maxMod)`
   - Zero provider-specific types or constants
   - **Rationale**: Enables code reuse by Open5E, d20srd, and future providers without duplication

2. **Provider adapter** (`lib/import/dndBeyond-armor-class.ts`)
   - Knows DnD Beyond data structures: `DndBeyondInventoryEntry`, `DndBeyondModifier`
   - Maps provider-specific concepts to generic logic
   - Houses all DnD Beyond-specific constants and filters
   - **Rationale**: Isolates provider-specific knowledge; adapters can be replaced or extended without touching generic layer

### Import Dependencies

```
lib/dndBeyondCharacterImport.ts
  └─> lib/import/dndBeyond-armor-class.ts
        └─> lib/import/armor-class.ts (for capDexterityByArmorType)
        └─> lib/import/dndBeyond-utils.ts (for getModifierNumericValue)
        └─> lib/import/utils.ts (for getAbilityModifier)
```

No circular imports. No provider-specific imports in generic armor-class.ts.

---

## Functional Requirements

### FR-1: Extract Armor Class Normalization

**Requirement**: Remove four functions from `dndBeyondCharacterImport.ts` and place in dedicated modules.

**Design Decision**:
- Extraction includes intentional D&D 5e rules fixes during refactoring:
  1. Heavy armor (max dex = 0) now correctly ignores ALL dex modifiers (not just caps them)
  2. Shields (armorTypeId 4) excluded from base armor selection (handled via modifiers)
- Call sites updated to import from new modules
- Function signatures unchanged (backward compatible for call sites)

**Acceptance Criteria**:
- `normalizeArmorClass()` callable from `lib/import/dndBeyond-armor-class.ts`
- `lib/dndBeyondCharacterImport.ts` line 257 uses imported function
- Existing call sites work correctly with D&D 5e rules fixes
- Rules fixes covered by comprehensive unit tests

### FR-2: Generic Armor Class Logic

**Requirement**: Isolate pure D&D 5e armor logic (dexterity capping) from provider-specific data mapping.

**Design Decision**:
- Create `capDexterityByArmorType(dexMod, maxDexMod)` in generic module
- Takes numeric parameters (no provider-specific types)
- Pure function: no side effects, no external dependencies
- Follows D&D 5e rule: "Max dex bonus is capped by armor type"

**Acceptance Criteria**:
- `capDexterityByArmorType()` exported from `lib/import/armor-class.ts`
- Function signature: `(dexMod: number, maxDexMod?: number | null) => number`
- No imports from dndBeyond-utils or dndBeyond-specific modules
- Called by `dndBeyond-armor-class.ts` to apply generic rule

### FR-3: Provider-Specific Constant Naming

**Requirement**: Rename armor type constant to clarify DnD Beyond ownership.

**Design Decision**:
- Rename `ARMOR_TYPE_MAX_DEX_MODIFIER` → `DNDEBEYOND_ARMOR_TYPE_MAX_DEX_MODIFIER`
- Keeps constant in `dndBeyond-armor-class.ts` (provider-specific)
- Prevents confusion when adding other providers with different armor type ID schemes

**Acceptance Criteria**:
- Constant is `DNDEBEYOND_ARMOR_TYPE_MAX_DEX_MODIFIER` (or similar clear prefix)
- Only referenced in `dndBeyond-armor-class.ts`
- No references to old name `ARMOR_TYPE_MAX_DEX_MODIFIER` remain

### FR-4: Test Coverage

**Requirement**: Add comprehensive tests for new modules.

**Design Decision**:
- Generic tests in `tests/unit/import/armor-class.test.ts`
- Provider-specific tests in `tests/unit/import/dndBeyond-armor-class.test.ts`
- Each module tested independently + integration test for combined behavior

**Acceptance Criteria**:
- All four extracted functions have test coverage
- Edge cases documented and tested (null inventory, missing armor, heavy armor with 0 max dex, etc.)
- Tests pass before and after extraction

---

## Non-Functional Requirements

### NFR-1: No Breaking Changes

**Requirement**: Extraction must not alter behavior of `normalizeCharacterDetails()` or its callers.

**Design Decision**:
- Function signatures unchanged
- Return values unchanged
- Callers unaware of refactoring (import path changed, logic identical)

**Acceptance Criteria**:
- All existing dndBeyond character import tests pass
- Character AC calculation identical before/after refactoring (verified by test snapshots or properties)

### NFR-2: Code Organization

**Requirement**: Prevent `lib/import/utils.ts` from becoming a "god class" of utilities.

**Design Decision**:
- Domain-specific utilities live in their own modules (e.g., armor-class.ts, not utils.ts)
- `lib/import/utils.ts` remains for truly generic utilities (ability modifiers, proficiency, string helpers, etc.)
- New modules follow existing pattern: `lib/import/<domain>.ts` for generic, `lib/import/dndBeyond-<domain>.ts` for provider-specific

**Acceptance Criteria**:
- Armor class logic does NOT appear in `lib/import/utils.ts`
- `lib/import/utils.ts` size does not grow (no new armor-related functions added)
- New modules are isolated and independently testable

### NFR-3: Future Provider Reusability

**Requirement**: Generic `capDexterityByArmorType()` must be usable by future providers (Open5E, etc.).

**Design Decision**:
- Generic function takes only numeric parameters (no type dependencies)
- No provider-specific naming in function names or parameters
- Documented as generic with example usage for future providers

**Acceptance Criteria**:
- Type signature contains no provider-specific types
- Function can be called with parameters from any armor source
- Pair with provider's own mapping (armor type IDs → max dex values)

---

## Testability

### Generic Armor Class Tests

**Module**: `tests/unit/import/armor-class.test.ts`

**Test Cases**:
- `capDexterityByArmorType()` with max modifier present → returns min(dex, max)
- `capDexterityByArmorType()` with no max modifier → returns dex unchanged
- `capDexterityByArmorType()` with null/undefined max → returns dex unchanged
- `capDexterityByArmorType()` with max=0 (heavy armor) → returns 0
- `capDexterityByArmorType()` with negative dex (constitutional edge case) → returns negative capped value
- `capDexterityByArmorType()` with fractional inputs (rounding) → handles gracefully

**Approach**: Unit tests, no mocks (pure function).

### DnD Beyond-Specific Tests

**Module**: `tests/unit/import/dndBeyond-armor-class.test.ts`

**Test Cases**:
1. `normalizeArmorClass()` with equipped armor (base + dex + bonus)
2. `normalizeArmorClass()` with heavy armor (0 dex cap)
3. `normalizeArmorClass()` without equipped armor (unarmored 10 + dex + unarmored bonus)
4. `getArmorBonuses()` filters and sums modifiers correctly
5. `getUnarmoredAcBonus()` applies max-set + sum-bonus logic
6. Edge cases:
   - Null inventory → treated as unarmored
   - Missing armor definition → treated as unarmored
   - Modifiers with null/undefined values → handled by `getModifierNumericValue()`
   - Empty modifier list → AC calculation proceeds without bonuses

**Approach**: Unit tests with mock data; integration test validating full character AC calculation.

---

## Risks & Mitigations

### Risk: Type Signature Confusion

**Problem**: Generic `capDexterityByArmorType()` takes a generic `maxDexterityModifier` parameter; future providers might misinterpret it as armor type ID (like DnD Beyond).

**Mitigation**:
- Parameter name is explicit: `maxDexterityModifier`, not `armorTypeId`
- JSDoc comment clarifies: "Maximum dexterity modifier allowed by this armor type (e.g., light armor allows all dex, heavy allows 0)"
- Example usage in JSDoc shows caller's responsibility: map their armor type ID to numeric max, then call function

### Risk: Import Cycles

**Problem**: If `lib/import/armor-class.ts` imports from `lib/import/dndBeyond-utils.ts` by accident, a cycle forms.

**Mitigation**:
- Code review checklist: verify `lib/import/armor-class.ts` imports ONLY from `lib/types.ts` (if needed) or `lib/import/utils.ts`
- CI lint should catch circular imports
- Explicit ban: no imports from any `dndBeyond-*.ts` file in generic armor-class.ts

### Risk: Test Coverage Gap

**Problem**: New functions lack tests; refactoring breaks untested code path.

**Mitigation**:
- All four extracted functions must have test coverage before PR merged
- Snapshot tests on AC calculation output (verify unchanged before/after)
- Test coverage report in CI; block merge if coverage < 80%

### Risk: Behavioral Change

**Problem**: Extraction accidentally changes AC calculation (off-by-one error, capping logic error, etc.).

**Mitigation**:
- Property-based tests: compare old function output to new function output on 100+ generated character inputs
- Manual test: import known characters, verify AC unchanged
- Code review: line-by-line comparison of extracted code vs original

---

## Acceptance Criteria (Map to Specs)

| Proposal Element | Design Decision | Acceptance Criteria (Specs) |
|---|---|---|
| Remove 4 functions from main file | Extract to dndBeyond-armor-class.ts | Function `normalizeArmorClass()` importable and callable |
| Separate generic from provider-specific | Create armor-class.ts (generic) + dndBeyond-armor-class.ts (adapter) | `capDexterityByArmorType()` in generic, no provider-specific types |
| Rename constant for clarity | `ARMOR_TYPE_MAX_DEX_MODIFIER` → `DNDEBEYOND_ARMOR_TYPE_MAX_DEX_MODIFIER` | Constant renamed, only in dndBeyond module, tests updated |
| Add test coverage | Create armor-class.test.ts + dndBeyond-armor-class.test.ts | All functions tested, edge cases covered, tests pass |
| No breaking changes | Extraction is pure refactor | Character AC calculation identical before/after |
| Reusable by future providers | Generic function takes only numeric parameters | `capDexterityByArmorType()` has no provider-specific dependencies |

---

## Rollback & Mitigation Plan

**If PR merge reveals unexpected behavior**:

1. **Revert immediately** (single commit, full rollback)
2. **Root cause investigation**: Run property-based test to identify exact AC calculation difference
3. **Fix in new branch**: Address the discrepancy (e.g., rounding error, logic error)
4. **Regression test**: Add specific test case that would have caught the issue
5. **Re-merge**: Go through review again

**Estimated rollback time**: < 5 minutes (single revert)

---

## Operational Blocking Policies

### CI/Build Failures Block Merge

- **ESLint**: All files must pass linting (no unused imports, etc.)
- **TypeScript**: No type errors; type checking must pass
- **Test Coverage**: Coverage must remain ≥ 80% for changed files
- **Test Execution**: All unit tests in `tests/unit/import/` must pass

### Code Review Requirements

- **Approval**: Minimum 1 approval required before merge
- **Architectural Review**: Verify no provider-specific types in `lib/import/armor-class.ts`
- **Test Coverage**: Confirm all extracted functions have test coverage
- **Circular Imports**: Confirm no import cycles (linter catches this)

### Security & Compliance

- **No secrets in code**: Scan for hardcoded keys, credentials
- **No breaking changes**: Property-based test confirms behavioral equivalence

---

## Implementation Sequence

1. Create `lib/import/armor-class.ts` with `capDexterityByArmorType()`
2. Create `lib/import/dndBeyond-armor-class.ts` with 4 functions + renamed constant
3. Update `lib/dndBeyondCharacterImport.ts` imports
4. Create comprehensive tests
5. Verify all tests pass
6. Review and merge

---

## Success Criteria

After implementation:

- ✅ `lib/import/armor-class.ts` exists with generic function
- ✅ `lib/import/dndBeyond-armor-class.ts` exists with provider-specific functions
- ✅ `lib/dndBeyondCharacterImport.ts` imports from new modules
- ✅ All tests pass (old + new)
- ✅ Character AC calculation unchanged
- ✅ Code is ready for future provider implementations
