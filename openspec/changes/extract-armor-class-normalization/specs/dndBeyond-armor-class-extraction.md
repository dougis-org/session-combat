## DnD Beyond Armor Class Extraction

**Capability**: Extract DnD Beyond-specific armor class normalization into dedicated module

---

## ADDED Requirements

### REQ-AC-DB-001: Extract normalizeArmorClass Function

**Requirement**: `normalizeArmorClass()` is extracted from `dndBeyondCharacterImport.ts` into `lib/import/dndBeyond-armor-class.ts` and remains fully functional

**Acceptance Criteria**:

1. **Given** function exists in new module
   **When** importing `{ normalizeArmorClass }` from `lib/import/dndBeyond-armor-class`
   **Then** import succeeds and function is callable

2. **Given** character with equipped leather armor (AC 11, medium, armorTypeId=2, max dex +2)
   **When** calling `normalizeArmorClass(inventory, { dexterity: 16 }, [])` (dex mod +3, no bonuses)
   **Then** return 11 + min(3, 2) = 14

3. **Given** character with equipped plate armor (AC 18, heavy, armorTypeId=3, max dex 0)
   **When** calling `normalizeArmorClass(inventory, { dexterity: 16 }, [])` (dex mod +3)
   **Then** return 18 + min(3, 0) = 18 (no dex bonus for heavy armor)

4. **Given** character with NO equipped armor (unarmored)
   **When** calling `normalizeArmorClass([], { dexterity: 14 }, [])` (dex mod +2, no bonuses)
   **Then** return 10 + 2 = 12 (unarmored AC = 10 + dex)

5. **Given** character with armor and AC bonus modifier (e.g., +2 from spell)
   **When** calling `normalizeArmorClass(inventory, abilityScores, [{ subType: "armor-class", value: 2, ... }])`
   **Then** bonus is added to calculated AC

6. **Given** character with unarmored AC bonus (e.g., Monk's Unarmored Defense +2)
   **When** calling `normalizeArmorClass([], { dexterity: 12 }, [{ subType: "unarmored-armor-class", value: 2, type: "bonus", ... }])`
   **Then** return 10 + dex + 2 = 10 + 1 + 2 = 13

### REQ-AC-DB-002: Armor Bonus Extraction

**Requirement**: `getArmorBonuses()` correctly filters and sums armor-class modifiers

**Acceptance Criteria**:

1. **Given** modifier list with multiple subtypes
   **When** calling `getArmorBonuses([{ subType: "armor-class", value: 2 }, { subType: "damage-reduction", value: 5 }, { subType: "armor-class", value: 1 }])`
   **Then** return 3 (only armor-class modifiers summed: 2 + 1)

2. **Given** empty modifier list
   **When** calling `getArmorBonuses([])`
   **Then** return 0

3. **Given** modifiers with null/invalid values (handled by getModifierNumericValue)
   **When** calling `getArmorBonuses([{ subType: "armor-class", value: null }])`
   **Then** return 0 (null treated as 0)

### REQ-AC-DB-003: Unarmored Bonus Extraction

**Requirement**: `getUnarmoredAcBonus()` correctly applies max-set and bonus-sum logic

**Acceptance Criteria**:

1. **Given** single bonus modifier (no set)
   **When** calling `getUnarmoredAcBonus([{ subType: "unarmored-armor-class", value: 2, type: "bonus" }])`
   **Then** return 2

2. **Given** single set modifier
   **When** calling `getUnarmoredAcBonus([{ subType: "unarmored-armor-class", value: 14, type: "set" }])`
   **Then** return 14

3. **Given** multiple set modifiers (take max)
   **When** calling `getUnarmoredAcBonus([{ subType: "unarmored-armor-class", value: 14, type: "set" }, { subType: "unarmored-armor-class", value: 16, type: "set" }])`
   **Then** return 16 (max of set values)

4. **Given** set + bonus modifiers combined
   **When** calling `getUnarmoredAcBonus([{ subType: "unarmored-armor-class", value: 14, type: "set" }, { subType: "unarmored-armor-class", value: 2, type: "bonus" }])`
   **Then** return 14 + 2 = 16 (set + bonus)

5. **Given** empty modifier list
   **When** calling `getUnarmoredAcBonus([])`
   **Then** return 0

### REQ-AC-DB-004: Constant Renaming

**Requirement**: `ARMOR_TYPE_MAX_DEX_MODIFIER` renamed to `DNDEBEYOND_ARMOR_TYPE_MAX_DEX_MODIFIER` for clarity

**Acceptance Criteria**:

1. **Given** constant exists in module
   **When** importing `{ DNDEBEYOND_ARMOR_TYPE_MAX_DEX_MODIFIER }` from `lib/import/dndBeyond-armor-class`
   **Then** import succeeds

2. **Given** constant has correct mapping
   **When** accessing `DNDEBEYOND_ARMOR_TYPE_MAX_DEX_MODIFIER[2]` (medium armor)
   **Then** return 2

3. **Given** constant mapping for heavy armor
   **When** accessing `DNDEBEYOND_ARMOR_TYPE_MAX_DEX_MODIFIER[3]`
   **Then** return 0

4. **Given** old constant name
   **When** searching codebase for `ARMOR_TYPE_MAX_DEX_MODIFIER`
   **Then** only found in test files (old tests) or comments, not in active code

### REQ-AC-DB-005: Integration with Main Import File

**Requirement**: `lib/dndBeyondCharacterImport.ts` imports and uses extracted function

**Acceptance Criteria**:

1. **Given** import statement added to main file
   **When** checking `lib/dndBeyondCharacterImport.ts` line 257
   **Then** call is `ac: normalizeArmorClass(data.inventory, abilityScores, modifiers)` (unchanged externally)

2. **Given** call to normalizeArmorClass
   **When** executing normalizeDndBeyondCharacter()
   **Then** AC calculation result is identical to pre-extraction behavior

---

## MODIFIED Requirements

### REQ-AC-DB-M-001: Main Import File Structure

**Requirement**: Remove extracted functions from `lib/dndBeyondCharacterImport.ts`

**Acceptance Criteria**:

1. **Given** main import file
   **When** searching for `function normalizeArmorClass`
   **Then** function not found (removed)

2. **Given** main import file
   **When** searching for `ARMOR_TYPE_MAX_DEX_MODIFIER`
   **Then** only `ALIGNMENT_ID_MAP` and other non-armor constants remain

3. **Given** file size and complexity metrics
   **When** comparing before/after extraction
   **Then** main file is smaller and more focused on orchestration

---

## REMOVED Requirements

### REQ-AC-DB-R-001: Remove Four Functions from Main File

**Requirement**: Following functions are removed from `lib/dndBeyondCharacterImport.ts`:
- `normalizeArmorClass()`
- `getArmorBonuses()`
- `getUnarmoredAcBonus()`
- `getArmorDexterityContribution()` (private helper)

**Acceptance Criteria**:

1. **Given** main import file
   **When** searching for any of the four functions
   **Then** none are found (all removed or moved)

2. **Given** search for removed functions in codebase
   **When** excluding new modules (`lib/import/dndBeyond-armor-class.ts`, `lib/import/armor-class.ts`)
   **Then** no references found outside new modules and test files

### REQ-AC-DB-R-002: Remove Old Constant

**Requirement**: `ARMOR_TYPE_MAX_DEX_MODIFIER` removed from main file

**Acceptance Criteria**:

1. **Given** main import file
   **When** searching for `ARMOR_TYPE_MAX_DEX_MODIFIER` by name
   **Then** not found (renamed and moved)

---

## Non-Functional Acceptance Criteria

### Performance
- **REQ-AC-DB-PERF-001**: AC calculation performance unchanged (extraction is refactor only, no algorithmic changes)

### Reliability
- **REQ-AC-DB-REL-001**: Extraction changes are backward compatible (external interface unchanged)
- **REQ-AC-DB-REL-002**: All character import tests continue to pass

### Maintainability
- **REQ-AC-DB-MAINT-001**: DnD Beyond-specific logic is isolated and independently testable
- **REQ-AC-DB-MAINT-002**: New module structure is consistent with other extracted modules (dndBeyond-abilities, dndBeyond-skills-senses)

### Reusability
- **REQ-AC-DB-REUSE-001**: Generic `capDexterityByArmorType()` is called by provider adapter, enabling reuse by other providers

---

## Traceability

| Design Element | Spec Requirement | Acceptance Scenario |
|---|---|---|
| Extract normalizeArmorClass | REQ-AC-DB-001 | Scenarios 1-6 (various armor + ability combinations) |
| Extract getArmorBonuses | REQ-AC-DB-002 | Scenarios 1-3 (filtering + summation) |
| Extract getUnarmoredAcBonus | REQ-AC-DB-003 | Scenarios 1-5 (set + bonus logic) |
| Rename constant | REQ-AC-DB-004 | Scenarios 1-4 (import + values + old name removed) |
| Update main file imports | REQ-AC-DB-005 | Scenarios 1-2 (import + behavior unchanged) |
| Remove functions | REQ-AC-DB-R-001 | Scenarios 1-2 (functions removed from main file) |
| Remove old constant | REQ-AC-DB-R-002 | Scenarios 1 (constant removed by name) |
