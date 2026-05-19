## Test Specification

**Change**: Extract Armor Class Normalization (Generic + Provider-Specific Split)

---

## Overview

Test organization follows TDD (Test-Driven Development):
1. **Write tests first** (RED phase)
2. **Implement code to pass tests** (GREEN phase)
3. **Refactor for clarity** (REFACTOR phase)

All tests organized in two modules:
- `tests/unit/import/armor-class.test.ts` — Generic D&D armor class logic
- `tests/unit/import/dndBeyond-armor-class.test.ts` — DnD Beyond provider adapter

---

## Generic Armor Class Tests

**File**: `tests/unit/import/armor-class.test.ts`

**Module under test**: `lib/import/armor-class.ts`

**Function**: `capDexterityByArmorType(dexterityModifier: number, maxDexterityModifier?: number | null): number`

### Test Suite 1: Dexterity Capping Logic

#### Test 1.1: Dex Below Max
```typescript
// Task: T-1 / Spec: REQ-AC-GEN-001 Scenario 3
describe('capDexterityByArmorType', () => {
  it('returns dex unchanged when below max modifier', () => {
    const result = capDexterityByArmorType(1, 2);
    expect(result).toBe(1);
  });
});
```
**Given**: dexterity modifier +1, armor max dex +2  
**When**: function called  
**Then**: returns 1 (dex unchanged because 1 < 2)

#### Test 1.2: Dex Above Max (Capped)
```typescript
// Task: T-1 / Spec: REQ-AC-GEN-001 Scenario 1
it('returns capped dex when above max modifier', () => {
  const result = capDexterityByArmorType(3, 2);
  expect(result).toBe(2);
});
```
**Given**: dexterity modifier +3, armor max dex +2  
**When**: function called  
**Then**: returns 2 (capped by max)

#### Test 1.3: No Max Modifier (Uncapped)
```typescript
// Task: T-1 / Spec: REQ-AC-GEN-001 Scenario 2
it('returns dex unchanged when no max modifier', () => {
  expect(capDexterityByArmorType(3, null)).toBe(3);
  expect(capDexterityByArmorType(3, undefined)).toBe(3);
});
```
**Given**: dexterity modifier +3, no armor max (null/undefined)  
**When**: function called  
**Then**: returns 3 (uncapped, full dex applies)

#### Test 1.4: Heavy Armor (Max = 0)
```typescript
// Task: T-1 / Spec: REQ-AC-GEN-001 Scenario 5
it('returns 0 when armor has no dex bonus (heavy armor)', () => {
  const result = capDexterityByArmorType(3, 0);
  expect(result).toBe(0);
});
```
**Given**: dexterity modifier +3, armor max dex 0 (heavy armor)  
**When**: function called  
**Then**: returns 0 (no dex bonus for heavy armor)

#### Test 1.5: Negative Dexterity (Penalty)
```typescript
// Task: T-1 / Spec: REQ-AC-GEN-001 Scenario 4
it('returns negative dex (penalty) when dex is negative', () => {
  const result = capDexterityByArmorType(-1, 2);
  expect(result).toBe(-1);
});
```
**Given**: dexterity modifier -1 (low dex score), armor max dex +2  
**When**: function called  
**Then**: returns -1 (negative penalties not capped by max)

#### Test 1.6: Edge Case - Dex = Max
```typescript
// Task: T-1
it('returns dex when dex equals max modifier', () => {
  const result = capDexterityByArmorType(2, 2);
  expect(result).toBe(2);
});
```

### Test Suite 2: Type & Export Verification

#### Test 2.1: Function Exported
```typescript
// Task: T-1 / Spec: REQ-AC-GEN-002 Scenario 1
it('exports capDexterityByArmorType function', () => {
  expect(typeof capDexterityByArmorType).toBe('function');
});
```

#### Test 2.2: Type Signature
```typescript
// Task: T-1 / Spec: REQ-AC-GEN-002 Scenario 2
it('has correct type signature', () => {
  // TypeScript compile-time check; if this file compiles, signature is correct
  const fn: (dex: number, max?: number | null) => number = capDexterityByArmorType;
  expect(fn).toBeDefined();
});
```

### Test Suite 3: Edge Cases

#### Test 3.1: Very Large Dexterity
```typescript
// Task: T-1
it('handles very large dex modifier', () => {
  const result = capDexterityByArmorType(20, 2);
  expect(result).toBe(2);
});
```

#### Test 3.2: Zero Values
```typescript
// Task: T-1
it('handles zero values correctly', () => {
  expect(capDexterityByArmorType(0, 0)).toBe(0);
  expect(capDexterityByArmorType(0, 5)).toBe(0);
  expect(capDexterityByArmorType(5, 0)).toBe(0);
});
```

---

## DnD Beyond Armor Class Tests

**File**: `tests/unit/import/dndBeyond-armor-class.test.ts`

**Module under test**: `lib/import/dndBeyond-armor-class.ts`

**Functions tested**:
- `normalizeArmorClass(inventory, abilityScores, modifiers): number`
- `getArmorBonuses(modifiers): number`
- `getUnarmoredAcBonus(modifiers): number`
- Constant: `DNDEBEYOND_ARMOR_TYPE_MAX_DEX_MODIFIER`

### Test Suite 1: normalizeArmorClass() - With Armor

#### Test 1.1: Medium Armor with Dex Bonus
```typescript
// Task: T-3 / Spec: REQ-AC-DB-001 Scenario 2
it('calculates AC for medium armor (allows dex)', () => {
  const inventory = [
    {
      equipped: true,
      definition: {
        armorClass: 11,        // leather armor
        armorTypeId: 2,        // medium armor
      }
    }
  ];
  const abilityScores = { dexterity: 16 }; // +3 modifier
  const modifiers = [];
  
  const result = normalizeArmorClass(inventory, abilityScores, modifiers);
  expect(result).toBe(14); // 11 + min(3, 2) = 14
});
```
**Given**: Leather armor (AC 11, medium, max dex +2), dex mod +3  
**When**: `normalizeArmorClass()` called  
**Then**: returns 11 + min(3, 2) = 14

#### Test 1.2: Heavy Armor (No Dex Bonus)
```typescript
// Task: T-3 / Spec: REQ-AC-DB-001 Scenario 3
it('calculates AC for heavy armor (no dex)', () => {
  const inventory = [
    {
      equipped: true,
      definition: {
        armorClass: 18,        // plate armor
        armorTypeId: 3,        // heavy armor
      }
    }
  ];
  const abilityScores = { dexterity: 16 }; // +3 modifier
  const modifiers = [];
  
  const result = normalizeArmorClass(inventory, abilityScores, modifiers);
  expect(result).toBe(18); // 18 + min(3, 0) = 18
});
```
**Given**: Plate armor (AC 18, heavy, max dex 0), dex mod +3  
**When**: `normalizeArmorClass()` called  
**Then**: returns 18 (no dex bonus)

#### Test 1.3: Armor with AC Bonus Modifier
```typescript
// Task: T-3 / Spec: REQ-AC-DB-001 Scenario 5
it('adds armor-class bonus modifiers', () => {
  const inventory = [{ equipped: true, definition: { armorClass: 12, armorTypeId: 2 } }];
  const abilityScores = { dexterity: 14 }; // +2 modifier
  const modifiers = [
    {
      subType: 'armor-class',
      value: 2,
      type: 'bonus',
      // ... other properties
    }
  ];
  
  const result = normalizeArmorClass(inventory, abilityScores, modifiers);
  expect(result).toBe(16); // 12 + min(2, 2) + 2 = 16
});
```

### Test Suite 2: normalizeArmorClass() - Without Armor

#### Test 2.1: Unarmored (No Inventory)
```typescript
// Task: T-3 / Spec: REQ-AC-DB-001 Scenario 4
it('calculates unarmored AC when no armor equipped', () => {
  const inventory = [];
  const abilityScores = { dexterity: 14 }; // +2 modifier
  const modifiers = [];
  
  const result = normalizeArmorClass(inventory, abilityScores, modifiers);
  expect(result).toBe(12); // 10 + 2
});
```
**Given**: No armor, dex mod +2  
**When**: `normalizeArmorClass()` called  
**Then**: returns 10 + 2 = 12

#### Test 2.2: Unarmored with Unarmored Bonus
```typescript
// Task: T-3 / Spec: REQ-AC-DB-001 Scenario 6
it('adds unarmored AC bonus (e.g., Monk)', () => {
  const inventory = [];
  const abilityScores = { dexterity: 12 }; // +1 modifier
  const modifiers = [
    {
      subType: 'unarmored-armor-class',
      value: 2,
      type: 'bonus',
      // ... other properties
    }
  ];
  
  const result = normalizeArmorClass(inventory, abilityScores, modifiers);
  expect(result).toBe(13); // 10 + 1 + 2
});
```

### Test Suite 3: getArmorBonuses()

#### Test 3.1: Filter and Sum Armor-Class Modifiers
```typescript
// Task: T-3 / Spec: REQ-AC-DB-002 Scenario 1
it('filters and sums armor-class modifiers', () => {
  const modifiers = [
    { subType: 'armor-class', value: 2 },
    { subType: 'damage-reduction', value: 5 },
    { subType: 'armor-class', value: 1 },
  ];
  
  const result = getArmorBonuses(modifiers);
  expect(result).toBe(3); // 2 + 1, damage-reduction ignored
});
```

#### Test 3.2: Empty Modifier List
```typescript
// Task: T-3 / Spec: REQ-AC-DB-002 Scenario 2
it('returns 0 for empty modifier list', () => {
  const result = getArmorBonuses([]);
  expect(result).toBe(0);
});
```

#### Test 3.3: Null Values Handled
```typescript
// Task: T-3 / Spec: REQ-AC-DB-002 Scenario 3
it('treats null/invalid values as 0', () => {
  const modifiers = [
    { subType: 'armor-class', value: null },
    { subType: 'armor-class', value: undefined },
    { subType: 'armor-class', value: 2 },
  ];
  
  const result = getArmorBonuses(modifiers);
  expect(result).toBe(2); // null/undefined → 0, 2 → 2
});
```

### Test Suite 4: getUnarmoredAcBonus()

#### Test 4.1: Single Bonus Modifier
```typescript
// Task: T-3 / Spec: REQ-AC-DB-003 Scenario 1
it('returns bonus modifier value', () => {
  const modifiers = [
    {
      subType: 'unarmored-armor-class',
      value: 2,
      type: 'bonus',
    }
  ];
  
  const result = getUnarmoredAcBonus(modifiers);
  expect(result).toBe(2);
});
```

#### Test 4.2: Single Set Modifier
```typescript
// Task: T-3 / Spec: REQ-AC-DB-003 Scenario 2
it('returns set modifier value', () => {
  const modifiers = [
    {
      subType: 'unarmored-armor-class',
      value: 14,
      type: 'set',
    }
  ];
  
  const result = getUnarmoredAcBonus(modifiers);
  expect(result).toBe(14);
});
```

#### Test 4.3: Multiple Set Modifiers (Take Max)
```typescript
// Task: T-3 / Spec: REQ-AC-DB-003 Scenario 3
it('takes max when multiple set modifiers', () => {
  const modifiers = [
    { subType: 'unarmored-armor-class', value: 14, type: 'set' },
    { subType: 'unarmored-armor-class', value: 16, type: 'set' },
  ];
  
  const result = getUnarmoredAcBonus(modifiers);
  expect(result).toBe(16); // max(14, 16)
});
```

#### Test 4.4: Set + Bonus Combined
```typescript
// Task: T-3 / Spec: REQ-AC-DB-003 Scenario 4
it('sums set + bonus modifiers', () => {
  const modifiers = [
    { subType: 'unarmored-armor-class', value: 14, type: 'set' },
    { subType: 'unarmored-armor-class', value: 2, type: 'bonus' },
  ];
  
  const result = getUnarmoredAcBonus(modifiers);
  expect(result).toBe(16); // 14 + 2
});
```

#### Test 4.5: Empty List
```typescript
// Task: T-3 / Spec: REQ-AC-DB-003 Scenario 5
it('returns 0 for empty list', () => {
  const result = getUnarmoredAcBonus([]);
  expect(result).toBe(0);
});
```

### Test Suite 5: Constant Verification

#### Test 5.1: Constant Exists
```typescript
// Task: T-3 / Spec: REQ-AC-DB-004 Scenario 1
it('exports DNDEBEYOND_ARMOR_TYPE_MAX_DEX_MODIFIER', () => {
  expect(DNDEBEYOND_ARMOR_TYPE_MAX_DEX_MODIFIER).toBeDefined();
});
```

#### Test 5.2: Medium Armor Value
```typescript
// Task: T-3 / Spec: REQ-AC-DB-004 Scenario 2
it('maps medium armor (id=2) to max dex +2', () => {
  expect(DNDEBEYOND_ARMOR_TYPE_MAX_DEX_MODIFIER[2]).toBe(2);
});
```

#### Test 5.3: Heavy Armor Value
```typescript
// Task: T-3 / Spec: REQ-AC-DB-004 Scenario 3
it('maps heavy armor (id=3) to max dex 0', () => {
  expect(DNDEBEYOND_ARMOR_TYPE_MAX_DEX_MODIFIER[3]).toBe(0);
});
```

---

## Rules Fix Coverage Tests

**Purpose**: Verify D&D 5e rules fixes are correctly implemented

**Note**: This extraction included intentional rules fixes (not a pure refactor):
1. Heavy armor now correctly ignores ALL dex modifiers (positive, negative, zero)
   - **Test**: Negative DEX with heavy armor (max dex = 0) returns 0, not negative value
2. Shields are excluded from base armor selection (handled via modifiers instead)
   - **Test**: Mixed inventory with shield + actual armor uses correct base AC

**Approach**:
- Add specific unit tests for both rules fixes in existing test files
- Verify edge cases (negative dex, shield exclusion) are covered
- Document rules fixes in code comments and JSDoc

```typescript
// Task: V-2 - Test in armor-class.test.ts
describe('Heavy armor rules fix', () => {
  it('returns 0 for negative dex with heavy armor (max=0)', () => {
    const result = capDexterityByArmorType(-1, 0);
    expect(result).toBe(0); // Ignores negative dex penalty
  });
});

// Task: V-2 - Test in dndBeyond-armor-class.test.ts
describe('Shield exclusion rules fix', () => {
  it('excludes shield from base armor selection', () => {
    const inventory = [
      { equipped: true, definition: { armorTypeId: 4, armorClass: 2 } }, // shield
      { equipped: true, definition: { armorTypeId: 2, armorClass: 11 } }, // leather armor
    ];
    // Should use leather armor (AC 11), not shield
    const result = normalizeArmorClass(inventory, { dexterity: 10 }, []);
    expect(result).toBe(11); // leather armor AC
  });
});
```

---

## Test Coverage Requirements

| Function | Min Coverage | Scenarios |
|---|---|---|
| `capDexterityByArmorType()` | 100% | All branches (capped, uncapped, heavy armor, negative dex) |
| `normalizeArmorClass()` | 100% | Armored + unarmored paths, with/without bonuses |
| `getArmorBonuses()` | 100% | Filtering, summing, empty list, null values |
| `getUnarmoredAcBonus()` | 100% | Bonus-only, set-only, mixed, empty |

**Target**: ≥ 80% coverage for both new modules

---

## Integration Tests

### Test I-1: Character Import with Extracted AC Logic

```typescript
// Task: T-5
it('normalizes character AC using extracted functions', async () => {
  const characterData = {
    // ... full D&D Beyond character JSON
  };
  
  const result = normalizeDndBeyondCharacter(characterData);
  
  // Verify AC calculation unchanged
  expect(result.character.ac).toBe(expectedAcValue);
});
```

**Verifies**: Main import file correctly uses extracted functions

---

## Traceability Matrix

| Test ID | Task | Spec | Scenario | Type |
|---|---|---|---|---|
| 1.1 | T-1 | REQ-AC-GEN-001 | Scenario 3 | Unit |
| 1.2 | T-1 | REQ-AC-GEN-001 | Scenario 1 | Unit |
| 1.3 | T-1 | REQ-AC-GEN-001 | Scenario 2 | Unit |
| 1.4 | T-1 | REQ-AC-GEN-001 | Scenario 5 | Unit |
| 1.5 | T-1 | REQ-AC-GEN-001 | Scenario 4 | Unit |
| 1.6 | T-1 | REQ-AC-GEN-001 | Custom | Unit |
| 2.1 | T-1 | REQ-AC-GEN-002 | Scenario 1 | Unit |
| 2.2 | T-1 | REQ-AC-GEN-002 | Scenario 2 | Unit |
| 3.1 | T-1 | REQ-AC-GEN-001 | Custom | Unit |
| 3.2 | T-1 | REQ-AC-GEN-001 | Custom | Unit |
| D-1.1 | T-3, T-4 | REQ-AC-DB-001 | Scenario 2 | Unit |
| D-1.2 | T-3, T-4 | REQ-AC-DB-001 | Scenario 3 | Unit |
| D-1.3 | T-3, T-4 | REQ-AC-DB-001 | Scenario 5 | Unit |
| D-2.1 | T-3, T-4 | REQ-AC-DB-001 | Scenario 4 | Unit |
| D-2.2 | T-3, T-4 | REQ-AC-DB-001 | Scenario 6 | Unit |
| D-3.1 | T-3, T-4 | REQ-AC-DB-002 | Scenario 1 | Unit |
| D-3.2 | T-3, T-4 | REQ-AC-DB-002 | Scenario 2 | Unit |
| D-3.3 | T-3, T-4 | REQ-AC-DB-002 | Scenario 3 | Unit |
| D-4.1 | T-3, T-4 | REQ-AC-DB-003 | Scenario 1 | Unit |
| D-4.2 | T-3, T-4 | REQ-AC-DB-003 | Scenario 2 | Unit |
| D-4.3 | T-3, T-4 | REQ-AC-DB-003 | Scenario 3 | Unit |
| D-4.4 | T-3, T-4 | REQ-AC-DB-003 | Scenario 4 | Unit |
| D-4.5 | T-3, T-4 | REQ-AC-DB-003 | Scenario 5 | Unit |
| D-5.1 | T-3, T-4 | REQ-AC-DB-004 | Scenario 1 | Unit |
| D-5.2 | T-3, T-4 | REQ-AC-DB-004 | Scenario 2 | Unit |
| D-5.3 | T-3, T-4 | REQ-AC-DB-004 | Scenario 3 | Unit |
| Rules-1 | V-2 | REQ-AC-GEN-001 | Scenario 5 | Unit (Heavy Armor) |
| Rules-2 | V-2 | REQ-AC-DB-001 | Scenario 3 | Unit (Shield Exclusion) |
| I-1 | T-5 | REQ-AC-DB-M-001 | Custom | Integration |

---

## Success Criteria

- ✅ All unit tests pass (armor-class.test.ts, dndBeyond-armor-class.test.ts)
- ✅ Coverage ≥ 80% for both modules
- ✅ Property-based equivalence test passes (100+ cases)
- ✅ Integration test passes (main import file works)
- ✅ No breaking changes (existing import tests still pass)
