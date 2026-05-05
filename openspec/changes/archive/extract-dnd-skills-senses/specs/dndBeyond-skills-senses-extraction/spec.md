## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED `collectModifierSubtypeSet` to `dndBeyond-utils.ts`

The system SHALL export `collectModifierSubtypeSet` from `lib/import/dndBeyond-utils.ts`.

#### Scenario: Collects matching modifier subtypes into a Set

- **Given** a list of DnD Beyond modifier objects, a predicate function, and a subtype mapping function
- **When** `collectModifierSubtypeSet(modifiers, predicate, mapSubtype)` is called
- **Then** it returns a `Set<string>` containing only the mapped subtypes for modifiers that satisfy the predicate, with empty strings excluded

### Requirement: ADDED `dndBeyond-skills-senses` module

The system SHALL provide `normalizeSavingThrows`, `normalizeSkills`, and `normalizeSenses` as named exports from `lib/import/dndBeyond-skills-senses.ts`.

#### Scenario: Saving throws include proficiency and flat bonuses

- **Given** ability scores, a list of DnD Beyond modifier objects (including proficiency modifiers with subtypes ending in `-saving-throws` and optional flat bonus modifiers), and a proficiency bonus
- **When** `normalizeSavingThrows(abilityScores, modifiers, proficiencyBonus)` is called
- **Then** the result is a `Partial<Record<keyof AbilityScores, number>>` where each ability's value equals its ability modifier plus the proficiency bonus (if proficient in that saving throw) plus any applicable flat bonus

#### Scenario: Saving throws without proficiency return base ability modifier

- **Given** ability scores and modifiers with no proficiency entries for saving throws
- **When** `normalizeSavingThrows(abilityScores, modifiers, proficiencyBonus)` is called
- **Then** each saving throw value equals the raw ability modifier with no proficiency bonus added

#### Scenario: Skills apply expertise multiplier

- **Given** ability scores, modifiers including an `expertise` modifier for a skill, and a proficiency bonus
- **When** `normalizeSkills(abilityScores, modifiers, proficiencyBonus)` is called
- **Then** the expertise skill's value equals the ability modifier plus `proficiencyBonus × 2`

#### Scenario: Skills apply proficiency multiplier

- **Given** ability scores, modifiers including a `proficiency` modifier for a skill, and a proficiency bonus
- **When** `normalizeSkills(abilityScores, modifiers, proficiencyBonus)` is called
- **Then** the proficient skill's value equals the ability modifier plus `proficiencyBonus × 1`

#### Scenario: Skills without proficiency return base ability modifier

- **Given** ability scores and modifiers with no proficiency or expertise for a skill
- **When** `normalizeSkills(abilityScores, modifiers, proficiencyBonus)` is called
- **Then** the skill's value equals the base ability modifier only

#### Scenario: Skills include all 18 canonical D&D 5e skills

- **Given** any valid input
- **When** `normalizeSkills(abilityScores, modifiers, proficiencyBonus)` is called
- **Then** the result contains exactly the 18 skills defined in `SKILL_ABILITY_MAP`

#### Scenario: Senses include set-base modifier ranges

- **Given** a character data object and modifiers including `type === "set-base"` entries for sense subtypes (e.g., `darkvision`) with numeric values
- **When** `normalizeSenses(data, modifiers, skills, abilityScores)` is called
- **Then** the result contains those sense keys mapped to `"X ft."` strings

#### Scenario: Senses include walk speed from race data

- **Given** character data where `data.race.weightSpeeds.normal.walk` is a positive number
- **When** `normalizeSenses(data, modifiers, skills, abilityScores)` is called
- **Then** the result contains `speed: "X ft."` reflecting the racial walk speed

#### Scenario: Senses include passive skill scores

- **Given** a skills record and ability scores
- **When** `normalizeSenses(data, modifiers, skills, abilityScores)` is called
- **Then** the result contains `"passive perception"`, `"passive investigation"`, and `"passive insight"` as string values equal to `10 + skill_score` (falling back to `10 + ability_modifier` if the skill is absent)

## MODIFIED Requirements

### Requirement: MODIFIED `dndBeyond-utils.ts` gains `collectModifierSubtypeSet`

The system SHALL include `collectModifierSubtypeSet` as a new export in `lib/import/dndBeyond-utils.ts` without changing any existing export.

#### Scenario: Existing exports are unaffected

- **Given** code that imports any existing export from `lib/import/dndBeyond-utils.ts`
- **When** the updated file is compiled
- **Then** all existing imports continue to resolve and compile without errors

### Requirement: MODIFIED `dndBeyondCharacterImport.ts` no longer defines proficiency-score normalizers locally

The system SHALL import `normalizeSavingThrows`, `normalizeSkills`, and `normalizeSenses` from `lib/import/dndBeyond-skills-senses.ts` rather than defining them as local private functions.

#### Scenario: Character import behavior is unchanged

- **Given** a valid DnD Beyond character JSON with ability scores, skills, senses, and saving throw modifiers
- **When** the full character import pipeline runs
- **Then** the resulting `Character` object has identical `savingThrows`, `skills`, and `senses` values as before the refactor

## REMOVED Requirements

### Requirement: REMOVED local definitions in `dndBeyondCharacterImport.ts`

The following functions are no longer defined locally in `lib/dndBeyondCharacterImport.ts`:
- `normalizeSavingThrows`, `normalizeSkills`, `normalizeSenses`
- `collectModifierSubtypeSet`, `collectSenseModifiers`
- `normalizeSkillName`, `denormalizeSkillSubtype`, `normalizeSenseKey`

Reason for removal: Functions are now maintained in `lib/import/dndBeyond-skills-senses.ts` and `lib/import/dndBeyond-utils.ts`.

## Traceability

- Proposal element "`collectModifierSubtypeSet` → `dndBeyond-utils.ts`" → Requirement: ADDED `collectModifierSubtypeSet` to `dndBeyond-utils.ts`
- Proposal element "New file `lib/import/dndBeyond-skills-senses.ts`" → Requirement: ADDED `dndBeyond-skills-senses` module
- Proposal element "No import from main file" → Design decision 2 (local interface) → Requirement: ADDED module
- Design decision 5 (import path) → Requirement: MODIFIED `dndBeyondCharacterImport.ts`
- Requirement ADDED module → Tasks: create file, write exports
- Requirement MODIFIED `dndBeyondCharacterImport.ts` → Tasks: update imports, remove local definitions

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: No behavior change at runtime

- **Given** an existing passing test suite for character import
- **When** the extraction is applied and `npm test` is run
- **Then** all tests pass with zero failures and zero behavior differences

### Requirement: Operability (no circular dependency)

#### Scenario: TypeScript compilation succeeds

- **Given** the new `lib/import/dndBeyond-skills-senses.ts` imports only from `lib/import/utils.ts`, `lib/import/dndBeyond-utils.ts`, and `lib/characterReference.ts`
- **When** `tsc --noEmit` is run
- **Then** compilation succeeds with no errors and no circular dependency warnings
