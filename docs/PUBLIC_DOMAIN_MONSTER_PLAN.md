# D&D 5e Public Domain Monster Library Implementation Plan

## Overview
This document outlines the strategy for populating the session-combat monster library with all 334 public domain D&D 5e SRD monsters using the official D&D 5e API.

**Data Source:** [D&D 5e API](https://www.dnd5eapi.co/api/2014/monsters)
- **Total monsters available:** 334
- **API endpoint:** `https://www.dnd5eapi.co/api/2014/monsters`
- **Detail endpoint:** `https://www.dnd5eapi.co/api/2014/monsters/{index}`

## Implementation Approach: One-Time Extraction & File-Based Population

The strategy leverages existing infrastructure to perform a **one-time extraction** of all 334 monsters:

1. **Extract from D&D 5e API** - Fetch all 334 monsters from the official API
2. **Organize by Type** - Group monsters into category files (`aberrations.ts`, `beasts.ts`, etc.) in `lib/data/monsters/`
3. **Ingest via POST Endpoint** - Use the existing `POST /api/monsters` endpoint to seed the global library
4. **Dynamic Index** - Update `lib/data/monsters/index.ts` to dynamically ingest all category files

This approach provides:
- **Accuracy**: Data comes directly from official SRD API
- **Completeness**: All 334 monsters organized and available
- **Leverage Existing Infrastructure**: Uses validated database schema and API endpoints
- **One-Time Operation**: Extract once, then populate via existing ingestion pipeline
- **Agent-Friendly**: Individual monster type files can be populated by agents in parallel

## Current Status: IN PROGRESS

**Completed Foundation:**
- ✅ **Project setup** - Monster library UI and API infrastructure ready
- ✅ **Data model** - `MonsterTemplate` interface defined and functional
- ✅ **Database layer** - Persistence layer configured
- ✅ **API endpoint** - `POST /api/monsters` working for ingestion
- ✅ **File structure** - Monster category files already in place at `lib/data/monsters/`

**Current Monster Count in Library:**
- Aberrations: 2
- Beasts: 2
- Dragons: 0
- Elementals: 0
- Fiends: 0
- Giants: 1
- Humanoids: 0
- Monstrosities: 5
- Undead: 6
- **Total: 16 monsters** (manually created)

**Target Monster Count After Implementation:**
- **Total: 334 monsters** (API-sourced, organized by type, ingested via endpoint)

## Implementation Tasks

### Task 1: Dynamic Index Implementation (PRIORITY CRITICAL)
**Status:** ✅ COMPLETED  
**Description:** Update `lib/data/monsters/index.ts` to dynamically ingest all category files instead of manual imports.

**Why:** This allows new category files to be automatically included without code changes.

**Implementation:** ✅ COMPLETED
- ✅ Modified `lib/data/monsters/index.ts` to use dynamic requires with error handling
- ✅ Automatically discovers all `{type}.ts` files in the `lib/data/monsters/` directory
- ✅ Exports a unified `ALL_SRD_MONSTERS` array combining all discovered categories
- ✅ Maintains backward compatibility with existing imports

**Acceptance Criteria:** ✅ ALL MET
- ✅ All `.ts` files in `lib/data/monsters/` are automatically included
- ✅ `ALL_SRD_MONSTERS` array combines all monsters from all files
- ✅ No manual import/export statements needed for new category files
- ✅ Existing code that imports from index.ts continues to work

---

### Task 2: One-Time Monster Extraction & Population (PRIORITY CRITICAL)
**Status:** Not Started  
**Description:** Extract all 334 monsters from D&D 5e API and populate category files in `lib/data/monsters/`.

**Implementation Workflow:**

#### Phase 2a: Create Extraction Script
- Create `lib/scripts/extractAndPopulateMonstersFromAPI.ts`
- Fetch all monsters from D&D 5e API (`https://www.dnd5eapi.co/api/2014/monsters`)
- For each monster:
  - Fetch detailed monster data
  - Transform API response to `MonsterTemplate` format using existing schema
  - Map D&D 5e API fields to our interface (see Field Mapping Reference below)
  - Group by creature `type` field (aberration, beast, dragon, etc.)

#### Phase 2b: Populate Category Files
- Organize extracted monsters by type:
  - `aberrations.ts` - all aberrations
  - `beasts.ts` - all beasts  
  - `dragons.ts` - all dragons
  - `elementals.ts` - all elementals
  - `fiends.ts` - all fiends
  - `giants.ts` - all giants
  - `humanoids.ts` - all humanoids
  - `monstrosities.ts` - all monstrosities
  - `undead.ts` - all undead
- Each file exports a const array following the existing format (see `lib/data/monsters/aberrations.ts` for example)
- Keep existing manually-created monsters and add API monsters alongside them

#### Phase 2c: Ingest via Existing Endpoint
- After Task 1 is complete, run the `POST /api/monsters` endpoint for each monster in `ALL_SRD_MONSTERS`
- This seeds the global library using the existing ingestion infrastructure
- All monsters will have `isGlobal: true` and `source: 'SRD'`

**Field Mapping Reference:**
```
D&D 5e API → MonsterTemplate
- index → stored as reference (used for deduplication/updates)
- name → name
- size → size (converted to lowercase)
- type → type
- alignment → alignment
- armor_class[0].value → ac
- armor_class[0] notes (if present) → acNote
- hit_points → hp & maxHp
- hit_dice → (informational only, not stored in template)
- speed → speed (as string)
- strength → abilityScores.strength
- dexterity → abilityScores.dexterity
- constitution → abilityScores.constitution
- intelligence → abilityScores.intelligence
- wisdom → abilityScores.wisdom
- charisma → abilityScores.charisma
- proficiencies → skills & savingThrows (extract modifiers)
- damage_immunities → damageImmunities
- damage_resistances → damageResistances
- damage_vulnerabilities → damageVulnerabilities
- condition_immunities → conditionImmunities
- senses → senses (as object)
- languages → languages
- challenge_rating → challengeRating
- xp → experiencePoints (derived from CR or provided value)
- special_abilities → traits (CreatureAbility[])
- actions → actions (CreatureAbility[])
- bonus_actions → bonusActions (CreatureAbility[])
- reactions → reactions (CreatureAbility[])
- legendary_actions → legendaryActions (CreatureAbility[])
```

**Acceptance Criteria:**
- All 334 monsters extracted from API
- Organized into appropriate type category files
- All monsters successfully ingested via POST endpoint
- Database contains all 334 monsters with correct schema
- Each monster has proper `isGlobal: true` and source attribution
- No data loss or corruption during transformation
- Existing manually-created monsters preserved

---

### Task 3: Data Validation & Testing (PRIORITY HIGH)
**Status:** Not Started  
**Description:** Verify ingested data quality and completeness.

**Subtasks:**
- Verify all 334 monsters are ingested successfully
- Spot-check data accuracy on sample monsters (e.g., Aboleth, Adult Red Dragon, Lich)
- Validate stat block calculations (ability modifiers, etc.)
- Ensure no duplicates
- Check for missing critical fields

**Acceptance Criteria:**
- All 334 monsters present in database
- 100% accuracy verification on sample set
- No data loss or corruption
- Clear documentation of any omissions or transformations

---

### Task 4: Documentation & Examples (PRIORITY MEDIUM)
**Status:** Not Started  
**Description:** Document the extraction and ingestion process.

**Subtasks:**
- Document all field mappings from API to schema
- Explain any special case handling
- Create step-by-step guide for running extraction and ingestion
- Provide examples of transformed monster data
- Update CONTRIBUTING.md with monster library management guidelines

**Acceptance Criteria:**
- Clear instructions for re-running extraction if needed
- Field mapping fully documented
- Troubleshooting guide for common issues

## Implementation Workflow

### Phase 1: Setup (Day 1)
1. ✅ COMPLETED: Update `lib/data/monsters/index.ts` to be dynamic
2. ⏳ TODO: Create one-time extraction script
3. ⏳ TODO: Test extraction with sample of 5 monsters

### Phase 2: Extraction & Population (Days 1-2)
1. ⏳ TODO: Run extraction script to fetch all 334 monsters
2. ⏳ TODO: Populate category files in `lib/data/monsters/`
3. ⏳ TODO: Validate extracted data

### Phase 3: Ingestion (Day 2)
1. ⏳ TODO: Ingest all monsters via `POST /api/monsters` endpoint
2. ⏳ TODO: Verify all 334 monsters in database
3. ⏳ TODO: Spot-check accuracy on sample monsters

### Phase 4: Testing & Documentation (Day 3)
1. ⏳ TODO: Run validation tests
2. ⏳ TODO: Document field mappings and process
3. ⏳ TODO: Mark tasks complete

## Priority Order for Execution
1. **CRITICAL:** Task 1 - Dynamic Index Implementation
2. **CRITICAL:** Task 2 - One-Time Monster Extraction & Population
3. **HIGH:** Task 3 - Data Validation & Testing
4. **MEDIUM:** Task 4 - Documentation & Examples

---

## Agent-Driven Population Strategy

After Task 1 and Task 2 are complete, the framework is in place for agents to work in parallel:

**Each Agent Task:**
- ✅ Populate a single `{type}.ts` file with all monsters of that type
- Transform API response data to `MonsterTemplate` format
- Add monsters to the appropriate category file
- Monsters automatically included via dynamic index

**Example Agent Task:**
```
Task: Populate Dragons
Description: Extract all dragons from D&D 5e API and populate lib/data/monsters/dragons.ts
Status: Ready for agent assignment
Expected outcome: All dragon-type monsters from API in dragons.ts file
```

This allows parallel work on multiple creature types without conflicts.
