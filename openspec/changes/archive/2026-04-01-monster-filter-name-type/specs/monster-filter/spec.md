## ADDED Requirements

### Requirement: Filter monsters by name
The monsters screen SHALL provide a text input that filters both the "My Monsters" and "Global
Monster Library" sections to show only templates whose `name` contains the input value as a
case-insensitive substring.

#### Scenario: Name filter shows matching monsters
- **WHEN** the user types "dragon" in the name filter input
- **THEN** only monsters whose name contains "dragon" (case-insensitive) are shown in each section

#### Scenario: Name filter is case-insensitive
- **WHEN** the user types "DRAGON" in the name filter input
- **THEN** monsters named "Dragon Wyrmling" or "dragon" are shown (not excluded by case)

#### Scenario: Name filter with no matches shows empty-state message
- **WHEN** the user types a string that matches no monster names in a section
- **THEN** that section displays "No monsters match your filter." instead of cards

#### Scenario: Clearing name filter restores all monsters
- **WHEN** the user clears the name filter input (sets it to empty string)
- **THEN** all monsters that were visible before filtering are shown again

### Requirement: Filter monsters by type
The monsters screen SHALL provide a dropdown control populated with the distinct `type` values
present across all loaded user and global templates, plus an "All types" default option. Selecting
a type SHALL restrict both sections to monsters whose `type` exactly matches the selected value.

#### Scenario: Type dropdown contains all distinct types from loaded data
- **WHEN** the monsters screen loads with templates of types "dragon", "humanoid", and "undead"
- **THEN** the type dropdown contains options: "All types", "dragon", "humanoid", "undead" (sorted alphabetically)

#### Scenario: Type filter restricts both sections
- **WHEN** the user selects "undead" from the type dropdown
- **THEN** both "My Monsters" and "Global Monster Library" show only monsters with type "undead"

#### Scenario: Selecting "All types" removes type filter
- **WHEN** the user selects "All types" from the type dropdown
- **THEN** no type restriction is applied and all monsters matching the name filter are shown

#### Scenario: Type filter with no matches shows empty-state message
- **WHEN** the user selects a type that has no monsters in a given section
- **THEN** that section displays "No monsters match your filter." instead of cards

### Requirement: Name and type filters compose
The name filter and type filter SHALL apply simultaneously: a monster is shown only if it satisfies
BOTH the name substring condition AND the type condition.

#### Scenario: Combined name + type filter
- **WHEN** the user types "ancient" in the name filter and selects "dragon" in the type dropdown
- **THEN** only monsters whose name contains "ancient" AND whose type is "dragon" are shown

#### Scenario: Combined filters with no matches shows empty-state in affected sections
- **WHEN** the combined name + type filter matches no monsters in a section
- **THEN** that section displays "No monsters match your filter."

### Requirement: Filter controls do not affect edit and add flows
When a monster is being added or edited, the filter controls SHALL remain visible but the
add/edit form display SHALL be unaffected by filter state.

#### Scenario: Filter visible during add/edit
- **WHEN** the user opens the add or edit form for a monster
- **THEN** the filter controls remain visible above the section
- **AND** the form is displayed normally regardless of current filter values
