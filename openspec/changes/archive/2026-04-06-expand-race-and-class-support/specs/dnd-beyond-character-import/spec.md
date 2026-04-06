## ADDED Requirements

### Requirement: Support for additional official races and subraces
The system SHALL recognize and import a broader range of official D&D races and subraces, including "Mountain Dwarf", "Aasimar", "Goliath", and others.

#### Scenario: Mountain Dwarf is imported successfully
- **WHEN** a character with the race "Mountain Dwarf" is imported from DnD Beyond
- **THEN** the system SHALL recognize it as a valid race
- **THEN** the system SHALL persist the character with the race "Mountain Dwarf"
- **THEN** no normalization warning for the race SHALL be returned

#### Scenario: Aasimar is imported successfully
- **WHEN** a character with the race "Aasimar" is imported from DnD Beyond
- **THEN** the system SHALL recognize it as a valid race
- **THEN** the system SHALL persist the character with the race "Aasimar"
- **THEN** no normalization warning for the race SHALL be returned

### Requirement: Support for Artificer and other classes
The system SHALL recognize and import additional official classes, specifically the "Artificer" and "Blood Hunter" classes.

#### Scenario: Artificer class is imported successfully
- **WHEN** a character with the "Artificer" class is imported from DnD Beyond
- **THEN** the system SHALL recognize it as a valid class
- **THEN** the system SHALL persist the character with the "Artificer" class
- **THEN** no normalization warning for the class SHALL be returned

### Requirement: Resilient race matching logic
The system SHALL use a resilient matching strategy for races that handles case sensitivity, leading/trailing whitespace, and fallback to base races via substring matching.

#### Scenario: Case-insensitive race matching
- **WHEN** a character with the race "dwarf" (lowercase) is imported
- **THEN** the system SHALL recognize it as "Dwarf" (canonical case)

#### Scenario: Substring fallback for unknown subraces
- **WHEN** a character with an unknown subrace like "Custom Elf" is imported
- **THEN** the system SHALL fallback to the base race "Elf" if "Elf" is a substring of the input
- **THEN** the system SHALL return a normalization warning indicating the fallback
