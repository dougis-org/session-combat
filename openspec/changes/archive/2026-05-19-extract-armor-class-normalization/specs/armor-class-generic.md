## Generic Armor Class Calculation

**Capability**: Cap dexterity bonus by armor's maximum modifier (pure D&D 5e rule)

---

## ADDED Requirements

### REQ-AC-GEN-001: Dexterity Capping Function

**Requirement**: Provide a generic function that applies D&D 5e rule: "Armor type limits maximum dexterity bonus applied to AC"

**Acceptance Criteria**:

1. **Given** a dexterity modifier of +3 and armor max dex of +2
   **When** `capDexterityByArmorType(3, 2)` is called
   **Then** return 2 (capped by armor's limit)

2. **Given** a dexterity modifier of +3 and no armor max dex (null/undefined)
   **When** `capDexterityByArmorType(3, null)` is called
   **Then** return 3 (uncapped, full dex applies)

3. **Given** a dexterity modifier of +1 and armor max dex of +2
   **When** `capDexterityByArmorType(1, 2)` is called
   **Then** return 1 (dex is already below limit)

4. **Given** a dexterity modifier of -1 (negative from low dex score) and armor max dex of +2
   **When** `capDexterityByArmorType(-1, 2)` is called
   **Then** return -1 (negative dex penalties not capped)

5. **Given** a dexterity modifier of +3 and armor max dex of 0 (heavy armor)
   **When** `capDexterityByArmorType(3, 0)` is called
   **Then** return 0 (heavy armor: no dex bonus)

6. **Given** edge case: max dex = 0
   **When** `capDexterityByArmorType(5, 0)` is called
   **Then** return 0 (correctly clamps to zero)

### REQ-AC-GEN-002: Function Exports

**Requirement**: Function is exported and available for import by provider adapters

**Acceptance Criteria**:

1. **Given** `lib/import/armor-class.ts` exists
   **When** importing `{ capDexterityByArmorType }` from `lib/import/armor-class`
   **Then** import succeeds without errors

2. **Given** function is exported
   **When** TypeScript type-checks the file
   **Then** type signature is `(dexMod: number, maxDexMod?: number | null) => number`

---

## MODIFIED Requirements

None (this is a new capability).

---

## REMOVED Requirements

None (this is a new capability).

---

## Non-Functional Acceptance Criteria

### Performance
- **REQ-AC-GEN-PERF-001**: Function execution time < 1ms (pure arithmetic, no I/O)

### Reliability
- **REQ-AC-GEN-REL-001**: Function returns consistent result for same inputs (pure function, no side effects)
- **REQ-AC-GEN-REL-002**: No thrown exceptions for valid numeric inputs

### Reusability
- **REQ-AC-GEN-REUSE-001**: No imports of provider-specific types (e.g., `DndBeyondModifier`, armor-class logic only depends on numbers)
- **REQ-AC-GEN-REUSE-002**: Function parameters use generic names (`dexMod`, `maxDexMod`, not `armorTypeId`)

---

## Traceability

| Design Element | Spec Requirement | Acceptance Scenario |
|---|---|---|
| Generic D&D 5e logic | REQ-AC-GEN-001 | Scenarios 1-6 (various dex + armor combinations) |
| Function export/signature | REQ-AC-GEN-002 | Scenarios 1-2 (import + type check) |
| No provider-specific deps | REQ-AC-GEN-REUSE-001 | Verified in code review (no dndBeyond imports) |
| Pure function guarantees | REQ-AC-GEN-REL-001, REQ-AC-GEN-REL-002 | Test coverage for all input ranges |
