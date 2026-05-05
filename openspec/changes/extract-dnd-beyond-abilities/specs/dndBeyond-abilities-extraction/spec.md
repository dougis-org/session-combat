## ADDED Requirements

### Requirement: ADDED dndBeyond-abilities.ts module with normalizeAbilities export

The system SHALL provide `normalizeAbilities(actions, traits, notes)` function that converts D&D Beyond character API data into a structured CreatureAbility object with separate arrays for traits, actions, bonusActions, and reactions.

#### Scenario: Successfully normalize all ability categories

- **Given** a DnD Beyond character with actions in multiple categories (action, bonus action, reaction), traits, and notes
- **When** `normalizeAbilities()` is called with the character's actions, traits, and notes objects
- **Then** the returned object contains:
  - `.actions`: array of CreatureAbility for standard actions (activationType 1, undefined)
  - `.bonusActions`: array of CreatureAbility for bonus actions (activationType 3)
  - `.reactions`: array of CreatureAbility for reactions (activationType 4)
  - `.traits`: array combining mapped traits and notes with humanized titles
  - `.warnings`: empty array (no validation errors)

#### Scenario: Handle null/undefined inputs gracefully

- **Given** any combination of null or undefined for actions, traits, or notes
- **When** `normalizeAbilities()` is called with those inputs
- **Then** the function returns a valid result object with empty arrays for all categories and no errors

#### Scenario: Fail batch on multiple invalid entries

- **Given** actions with 2 or more entries missing required fields (name, snippet/description)
- **When** `normalizeAbilities()` is called
- **Then** the function throws `DndBeyondImportError` with message indicating the count of invalid entries

#### Scenario: Tolerate single invalid entry with warning

- **Given** actions with exactly 1 entry missing description
- **When** `normalizeAbilities()` is called
- **Then** the function returns successfully with the invalid entry filtered out, no error thrown

---

### Requirement: ADDED generic sanitizeHtmlSnippet() export in lib/import/utils.ts

The system SHALL provide `sanitizeHtmlSnippet(snippet: string): string` function that removes HTML tags and normalizes whitespace from action/ability descriptions.

#### Scenario: Strip HTML tags from action snippet

- **Given** an action snippet containing HTML: `"<p>Use your <strong>bonus action</strong> to activate.</p>"`
- **When** `sanitizeHtmlSnippet()` is called
- **Then** the result is: `"Use your bonus action to activate."` (HTML removed, content preserved)

#### Scenario: Normalize whitespace

- **Given** a snippet with multiple consecutive spaces or newlines: `"Use   your\n\nreaction"`
- **When** `sanitizeHtmlSnippet()` is called
- **Then** the result is: `"Use your reaction"` (excess whitespace collapsed)

#### Scenario: Empty or whitespace-only input

- **Given** an empty string or string containing only whitespace
- **When** `sanitizeHtmlSnippet()` is called
- **Then** the result is an empty string

---

### Requirement: ADDED generic mapNarrativeEntries() export in lib/import/utils.ts

The system SHALL provide `mapNarrativeEntries(entries: Record<string, string | null>, titleMap: Record<string, string>): CreatureAbility[]` function that converts a record of narrative fields (e.g., traits, notes) to an array of CreatureAbility objects with humanized titles.

#### Scenario: Map traits with title mapping

- **Given** traits object: `{ personalityTraits: "I like gold", ideals: "Charity", bonds: null }`
  - and title map: `{ personalityTraits: "Personality Traits", ideals: "Ideals", bonds: "Bonds" }`
- **When** `mapNarrativeEntries()` is called
- **Then** the result is an array with 2 CreatureAbility objects:
  - `{ name: "Personality Traits", description: "I like gold" }`
  - `{ name: "Ideals", description: "Charity" }`
  (null and empty values are filtered out)

#### Scenario: Handle missing title map entries

- **Given** a traits object with key `"appearance"` that is not in the provided title map
- **When** `mapNarrativeEntries()` is called
- **Then** the system falls back to `titleize("appearance")` → `"Appearance"`

#### Scenario: Filter empty strings

- **Given** a traits object: `{ personalityTraits: "", ideals: "  " }`
- **When** `mapNarrativeEntries()` is called
- **Then** the result is an empty array (both values are filtered out)

---

### Requirement: ADDED normalizeActionEntry() function in dndBeyond-abilities.ts

The system SHALL provide an internal `normalizeActionEntry(entry: DndBeyondActionEntry): CreatureAbility | null` function that converts a single D&D Beyond action entry to a normalized CreatureAbility, with validation and sanitization.

#### Scenario: Convert valid action entry

- **Given** a DndBeyondActionEntry with name `"Fireball"` and snippet `"<p>Damage: 8d6</p>"`
- **When** `normalizeActionEntry()` is called (internally by normalizeAbilities)
- **Then** the result is: `{ name: "Fireball", description: "Damage: 8d6" }`

#### Scenario: Return null for missing name

- **Given** a DndBeyondActionEntry with name `null` or empty string
- **When** normalizeAbilities processes it
- **Then** this entry is filtered out as invalid; a warning is collected

#### Scenario: Return null for missing description and snippet

- **Given** a DndBeyondActionEntry with both snippet and description `null`
- **When** normalizeAbilities processes it
- **Then** this entry is filtered out as invalid; a warning is collected

#### Scenario: Return null if sanitized description is empty

- **Given** a DndBeyondActionEntry with snippet `"<p></p>"` (only HTML, no text)
- **When** normalizeActionEntry is called
- **Then** the result is `null` (after sanitization, no content remains)

---

### Requirement: ADDED pushAbilityByActivation() function in dndBeyond-abilities.ts

The system SHALL provide an internal `pushAbilityByActivation()` function that categorizes a CreatureAbility into the correct action category (actions, bonusActions, or reactions) based on D&D Beyond activationType.

#### Scenario: Categorize bonus action by activationType

- **Given** a CreatureAbility and a DndBeyondActionEntry with `activation.activationType = 3`
- **When** normalizeAbilities calls this function
- **Then** the ability is added to the `bonusActions` array

#### Scenario: Categorize reaction by activationType

- **Given** a CreatureAbility and activationType `= 4`
- **When** normalizeAbilities calls this function
- **Then** the ability is added to the `reactions` array

#### Scenario: Default to actions for unknown activationType

- **Given** a CreatureAbility with activationType `1` or `null` or unknown value
- **When** normalizeAbilities calls this function
- **Then** the ability is added to the `actions` array

---

### Requirement: ADDED DnD Beyond provider-specific constants

The system SHALL provide the following constants in dndBeyond-abilities.ts:
- `ACTIONS_BY_ACTIVATION_TYPE`: Record mapping D&D Beyond activationType IDs to category names
- `TRAIT_TITLE_MAP`: Record mapping trait field names to human-readable titles
- `NOTE_TITLE_MAP`: Record mapping note field names to human-readable titles

#### Scenario: Use ACTIONS_BY_ACTIVATION_TYPE mapping

- **Given** the constant `ACTIONS_BY_ACTIVATION_TYPE = { 3: "bonusActions", 4: "reactions" }`
- **When** normalizeAbilities processes an action with activationType `3`
- **Then** the action is categorized as a bonus action (no default fallback needed for known IDs)

#### Scenario: Trait title mappings preserve D&D 5e naming

- **Given** trait field names from D&D Beyond API: `personalityTraits`, `ideals`, `bonds`, `flaws`, `appearance`
- **When** mapNarrativeEntries is called with TRAIT_TITLE_MAP
- **Then** the titles are: `"Personality Traits"`, `"Ideals"`, `"Bonds"`, `"Flaws"`, `"Appearance"`

---

## MODIFIED Requirements

### Requirement: MODIFIED dndBeyondCharacterImport.ts to use extracted normalizeAbilities

The system SHALL import and call `normalizeAbilities()` from the new `lib/import/dndBeyond-abilities.ts` module instead of calling inline normalization.

#### Scenario: normalizeDndBeyondCharacter still produces same output

- **Given** a raw DnD Beyond character API response
- **When** `normalizeDndBeyondCharacter()` processes it (using the extracted normalizeAbilities)
- **Then** the returned NormalizedDndBeyondCharacter has the same structure and ability values as before the refactor
  - All existing tests pass without modification

#### Scenario: Import statement is updated

- **Given** dndBeyondCharacterImport.ts before refactor importing inline functions
- **When** the file is refactored to import normalizeAbilities from lib/import/dndBeyond-abilities
- **Then** the import line reads: `import { normalizeAbilities } from "./import/dndBeyond-abilities";`

---

## REMOVED Requirements

None. This refactor does not remove any functionality; it reorganizes existing code.

---

## Traceability

| Proposal Element | Requirement | Task(s) |
|---|---|---|
| Extract generic helpers | ADDED sanitizeHtmlSnippet() in utils.ts | Task 1: Create dndBeyond-abilities.ts and lib/import/utils.ts updates |
| Move mapNarrativeEntries to utils | ADDED mapNarrativeEntries() in utils.ts | Task 1 |
| Create dndBeyond-abilities module | ADDED normalizeAbilities export | Task 1 |
| Provider-specific constants | ADDED constants (ACTIONS_BY_ACTIVATION_TYPE, maps) | Task 1 |
| One-warning threshold | ADDED failure behavior on 2+ warnings | Task 2: Add error handling tests |
| Update dndBeyondCharacterImport.ts | MODIFIED to import and call extracted function | Task 3: Update call site |
| All existing tests pass | MODIFIED requirement (no change, validation) | Task 4: Run test suite |

| Design Decision | Requirement | Task(s) |
|---|---|---|
| Decision 1: Extract generic to utils | ADDED sanitizeHtmlSnippet, mapNarrativeEntries | Task 1 |
| Decision 2: Constants in dndBeyond-abilities | ADDED constants in new module | Task 1 |
| Decision 3: Error threshold | ADDED failure on 2+ warnings | Task 2 |
| Decision 4: normalizeActionEntry internal | Validated through normalizeAbilities tests | Task 2 |
| Decision 5: Separate module | ADDED dndBeyond-abilities.ts | Task 1 |

---

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Normalization latency unchanged

- **Given** a DnD Beyond character with 20 actions, 5 traits, 3 notes
- **When** `normalizeAbilities()` is called
- **Then** execution time is within ±5% of the original inline normalization (no regression)

#### Scenario: No additional memory allocation

- **Given** the refactored code using new module imports
- **When** normalizeAbilities is called 1000 times in sequence
- **Then** memory footprint remains constant; no memory leaks detected

### Requirement: Reliability

#### Scenario: Error messages are clear

- **Given** normalizeAbilities throws due to 2+ invalid entries
- **When** the error is caught and logged
- **Then** the error message includes the count of invalid entries and field names where applicable

#### Scenario: Graceful handling of malformed DnD Beyond responses

- **Given** a DnD Beyond response with unexpected null/undefined values in actions, traits, notes
- **When** normalizeAbilities processes it
- **Then** the function returns successfully (no crash) with valid but partial data

### Requirement: Maintainability

#### Scenario: Code is readable and testable

- **Given** the new dndBeyond-abilities.ts and utils.ts updates
- **When** code is reviewed
- **Then** each function is <50 lines, has clear input/output, and is independently testable

#### Scenario: Generic functions are provider-agnostic

- **Given** sanitizeHtmlSnippet and mapNarrativeEntries in utils.ts
- **When** reviewed for provider-specific coupling
- **Then** no imports of DnDBeyond types are present; code is reusable by Open5E and other adapters
