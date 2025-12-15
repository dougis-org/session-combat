# D&D 5e Public Domain Monster Library Implementation Plan

## Overview
This document outlines the strategy for populating the session-combat monster library with all 334 public domain D&D 5e SRD monsters from the official D&D 5e API.

**Data Source:** [D&D 5e API](https://www.dnd5eapi.co/api/2014/monsters)
- **Total monsters available:** 334
- **API endpoint:** `https://www.dnd5eapi.co/api/2014/monsters`
- **Detail endpoint:** `https://www.dnd5eapi.co/api/2014/monsters/{index}`

## Implementation Approach: API-Driven Ingestion

Rather than manually creating each monster stat block, we will:
1. Build an API client/ingestion utility
2. Fetch all 334 monsters from the D&D 5e API
3. Transform API data to match our `MonsterTemplate` interface
4. Seed the global monster library with transformed data
5. Support dynamic updates by re-running the ingestion

This approach provides:
- **Accuracy**: Data comes directly from official SRD API
- **Completeness**: All 334 monsters automatically included
- **Maintainability**: Easy to update as API changes
- **Flexibility**: Can refresh library without manual work
- **Scalability**: No limit on monster count

## Current Status: IN PROGRESS

**Completed Foundation:**
- ✅ **Project setup** - Monster library UI and API infrastructure ready
- ✅ **Data model** - `MonsterTemplate` interface defined and functional
- ✅ **Database layer** - Persistence layer configured
- ✅ **API verification** - D&D 5e API confirmed available with 334 monsters

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

**Planned Monster Count After Implementation:**
- **Total: 334+ monsters** (API-sourced)

## Implementation Tasks

### Task Group 1: API Integration Layer (PRIORITY CRITICAL)
**Status:** Not Started  
**Description:** Build the infrastructure to fetch and transform D&D 5e API data.

**Subtasks:**
- [ ] Create API client utility (`lib/api/dnd5eApiClient.ts`)
  - Fetch single monster endpoint with retry logic
  - Fetch all monsters list endpoint
  - Handle rate limiting and errors
  
- [ ] Create data transformation service (`lib/scripts/transformMonsters.ts`)
  - Map D&D 5e API fields to `MonsterTemplate` interface
  - Handle special cases (multiattack, legendary actions, etc.)
  - Normalize damage dice notation
  - Extract proper ability scores, modifiers, and skills
  
- [ ] Create seeding script (`lib/scripts/seedMonstersFromAPI.ts`)
  - Fetch all 334 monsters from API
  - Transform each monster's data
  - Handle pagination/bulk operations efficiently
  - Log progress and errors
  - Support dry-run mode for verification

**Acceptance Criteria:**
- API client successfully fetches monster data
- Transformation preserves all critical stat block information
- Script can seed 334 monsters in < 5 minutes
- All monsters have proper `source: 'SRD'` and `isGlobal: true`
- Error handling for missing/malformed data
- Can be run on demand to refresh library

**Field Mapping Reference:**
```
D&D 5e API → MonsterTemplate
- index → id (lowercase slug)
- name → name
- size → size (converted to lowercase)
- type → type
- alignment → alignment
- armor_class[0].value → ac
- hit_points → hp & maxHp
- strength/dexterity/etc → abilityScores
- proficiencies → skills & savingThrows
- damage_immunities/resistances/vulnerabilities → damage properties
- condition_immunities → conditionImmunities
- senses → senses
- languages → languages
- challenge_rating → challengeRating
- xp → experiencePoints
- special_abilities → traits
- actions → actions
- bonus_actions → bonusActions
- reactions → reactions
- legendary_actions → legendaryActions
```

---

### Task Group 2: Data Validation & Testing (PRIORITY HIGH)
**Status:** Not Started  
**Description:** Verify ingested data quality and completeness.

**Subtasks:**
- [ ] Create validation suite (`tests/integration/monsterIngestion.test.ts`)
  - Verify all 334 monsters are ingested
  - Spot-check data accuracy (e.g., Aboleth, Adult Red Dragon, Lich)
  - Validate stat block calculations
  - Ensure no duplicates
  - Check for missing critical fields
  
- [ ] Create comparison utility
  - Compare API data vs ingested data
  - Generate diff report of any transformations
  
- [ ] Performance testing
  - Measure ingestion time
  - Verify database query performance with 334 monsters
  - Load test encounter creation with library

**Acceptance Criteria:**
- All 334 monsters successfully ingested
- 100% accuracy verification on sample set
- Ingestion completes in < 5 minutes
- No data loss or corruption
- Clear error reporting for any issues

---

### Task Group 3: Library UI Enhancements (PRIORITY MEDIUM)
**Status:** Not Started  
**Description:** Update UI to handle large monster library effectively.

**Subtasks:**
- [ ] Implement pagination/virtual scrolling for monster list
  - Current UI loads all at once - may be slow with 334 monsters
  - Add pagination (50 monsters per page)
  - Or implement virtual scrolling for performance
  
- [ ] Add search/filter functionality
  - Search by name
  - Filter by creature type (aberration, beast, etc.)
  - Filter by challenge rating
  - Filter by alignment
  
- [ ] Add sorting options
  - By name (A-Z)
  - By challenge rating (ascending/descending)
  - By type
  
- [ ] Display monster preview
  - Quick stats on hover (CR, AC, HP)
  - Full stat block on click

**Acceptance Criteria:**
- Library loads smoothly with 334 monsters
- Search finds monsters < 100ms
- Filtering works correctly across multiple criteria
- UI responsive on mobile devices

---

### Task Group 4: Documentation & Examples (PRIORITY MEDIUM)
**Status:** Not Started  
**Description:** Document the ingestion process and provide examples.

**Subtasks:**
- [ ] API client documentation
  - Usage examples
  - Error handling
  - Rate limiting strategy
  
- [ ] Transformation guide
  - Document all field mappings
  - Explain special case handling
  - Provide troubleshooting guide
  
- [ ] Seeding script instructions
  - How to run the ingestion
  - Parameters and options
  - Expected output
  
- [ ] Update CONTRIBUTING.md
  - Add section on monster library management
  - Document how to update monsters

**Acceptance Criteria:**
- Clear step-by-step instructions for seeding
- Example output shown
- Troubleshooting guide for common issues

---

### Task Group 5: Post-Ingestion Cleanup (PRIORITY MEDIUM)
**Status:** Not Started  
**Description:** Remove old manual monster definitions after API ingestion works.

**Subtasks:**
- [ ] Backup existing manual monsters (if any custom ones exist)
  
- [ ] Clear/replace files with API-sourced data:
  - `lib/data/monsters/aberrations.ts`
  - `lib/data/monsters/beasts.ts`
  - `lib/data/monsters/dragons.ts`
  - `lib/data/monsters/elementals.ts`
  - `lib/data/monsters/fiends.ts`
  - `lib/data/monsters/giants.ts`
  - `lib/data/monsters/humanoids.ts`
  - `lib/data/monsters/monstrosities.ts`
  - `lib/data/monsters/undead.ts`
  
- [ ] Update index files to reflect new structure
  
- [ ] Delete seedMonsters.ts (no longer needed)

**Acceptance Criteria:**
- All 334 monsters available in library
- No orphaned or duplicate data
- Clean database state

---

## Implementation Workflow

### Phase 1: API Integration (Weeks 1-2)
1. Create D&D 5e API client with proper error handling
2. Build data transformation service with field mapping
3. Create seeding script with progress tracking
4. Test with sample monsters (5-10)
5. Verify data accuracy and completeness

### Phase 2: Full Ingestion & Testing (Week 2-3)
1. Run full ingestion of all 334 monsters
2. Validate complete dataset
3. Performance testing and optimization
4. Integration testing with existing features

### Phase 3: UI Enhancement (Week 3-4)
1. Implement pagination/virtual scrolling
2. Add search and filter functionality
3. Polish user experience
4. User acceptance testing

### Phase 4: Documentation & Cleanup (Week 4)
1. Document all processes
2. Update contributing guidelines
3. Remove old manual monster files
4. Final verification and testing

## Priority Order for Execution
1. **CRITICAL:** Task Group 1 - API Integration Layer
2. **HIGH:** Task Group 2 - Data Validation & Testing
3. **MEDIUM:** Task Group 3 - Library UI Enhancements
4. **MEDIUM:** Task Group 4 - Documentation & Examples
5. **MEDIUM:** Task Group 5 - Post-Ingestion Cleanup

## Benefits of API-Driven Approach

### Immediate Benefits
- ✨ **Complete Coverage**: 334 monsters vs 80+ planned
- 🚀 **Faster Implementation**: Weeks instead of months
- 🔄 **Automatic Updates**: Easy to refresh as API updates
- 🎯 **Official Source**: Data directly from D&D 5e API

### Long-Term Benefits
- 📈 **Scalability**: Easy to add more sources
- 🔧 **Maintainability**: Source of truth is API, not manual files
- 🤝 **Community**: Can contribute improvements to official API
- 📊 **Analytics**: Can track which monsters are used most

## API Data Structure Reference

Example: [Aboleth](https://www.dnd5eapi.co/api/2014/monsters/aboleth)

```json
{
  "index": "aboleth",
  "name": "Aboleth",
  "size": "Large",
  "type": "aberration",
  "alignment": "lawful evil",
  "armor_class": [{"type": "natural", "value": 17}],
  "hit_points": 135,
  "hit_dice": "18d10",
  "speed": {"walk": "10 ft.", "swim": "40 ft."},
  "strength": 21,
  "dexterity": 9,
  "constitution": 15,
  "intelligence": 18,
  "wisdom": 15,
  "charisma": 18,
  "proficiencies": [...],
  "damage_immunities": [...],
  "senses": {"darkvision": "120 ft.", "passive_perception": 20},
  "languages": "Deep Speech, telepathy 120 ft.",
  "challenge_rating": 10,
  "xp": 5900,
  "special_abilities": [...],
  "actions": [...],
  "legendary_actions": [...]
}
```

## Notes
- Each task should be completed independently (can be worked on by different agents)
- Update this file with completion status as tasks progress
- Mark tasks with ✅ when complete
- The API provides high-quality official data - trust it completely
- Focus on transformation accuracy rather than manual creation
